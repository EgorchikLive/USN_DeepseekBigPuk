import json
import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_allocator import allocate_judges
from app.services.llm_assistant import (
    LLMNotConfiguredError,
    LLMServiceError,
    LLMSettings,
    generate_allocation_analysis,
)


class AllocationTests(unittest.TestCase):
    def test_builds_shortage_matrix_and_totals(self):
        matrix, summary = allocate_judges([
            {
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
            },
            {
                "committee": "Авторы",
                "date": "21.03",
                "round": "день",
                "required_judges": 3,
                "confirmed_judges": 3,
            },
        ])

        self.assertEqual(matrix[0]["deficit"], 2)
        self.assertEqual(matrix[0]["status"], "shortage")
        self.assertEqual(matrix[1]["status"], "covered")
        self.assertEqual(summary["unfilled_positions"], 2)
        self.assertEqual(summary["shortage_slots"], 1)


class LLMIntegrationTests(unittest.IsolatedAsyncioTestCase):
    def test_allocate_endpoint_returns_analysis_and_shortage_summary(self):
        payload = {
            "competition_id": "00000000-0000-0000-0000-000000000000",
            "slots": [{
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
            }],
            "selected_slot": {
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
            },
        }
        analysis_mock = AsyncMock(return_value="Вывод: не хватает двух судей.")
        with patch(
            "app.api.endpoints.ai_engine.generate_allocation_analysis",
            new=analysis_mock,
        ):
            response = TestClient(app).post("/api/v1/allocate", json=payload)

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["matrix"][0]["deficit"], 2)
        self.assertEqual(body["summary"]["unfilled_positions"], 2)
        self.assertEqual(body["justification"], "Вывод: не хватает двух судей.")
        self.assertIn("analysis_id", body)
        self.assertEqual(
            analysis_mock.await_args.kwargs["selected_slot"]["committee"],
            "Инвесторы",
        )

    def test_llm_settings_accepts_provider_key_alias(self):
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            settings = LLMSettings(
                _env_file=None,
                LLM_PROVIDER="openai-compatible",
            )

        self.assertEqual(settings.LLM_API_KEY, "test-key")

    async def test_yandex_provider_requires_key_and_folder_id(self):
        with self.assertRaisesRegex(
            LLMNotConfiguredError,
            "YANDEX_API_KEY и YANDEX_FOLDER_ID",
        ):
            await generate_allocation_analysis(
                matrix=[],
                summary={},
                action="analyze",
                settings=LLMSettings(
                    _env_file=None,
                    LLM_PROVIDER="yandex",
                    YANDEX_API_KEY="",
                    YANDEX_FOLDER_ID="",
                ),
            )

    async def test_sends_yandex_chat_completion_request(self):
        captured_request = {}

        async def handler(request):
            captured_request["url"] = str(request.url)
            captured_request["authorization"] = request.headers["Authorization"]
            captured_request["body"] = json.loads(request.content)
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "Вывод: сетка сбалансирована."}}]},
            )

        result = await generate_allocation_analysis(
            matrix=[],
            summary={},
            action="analyze",
            settings=LLMSettings(
                _env_file=None,
                LLM_PROVIDER="yandex",
                YANDEX_API_KEY="test-yandex-key",
                YANDEX_FOLDER_ID="test-folder",
            ),
            transport=httpx.MockTransport(handler),
        )

        self.assertEqual(
            captured_request["url"],
            "https://ai.api.cloud.yandex.net/v1/chat/completions",
        )
        self.assertEqual(captured_request["authorization"], "Api-Key test-yandex-key")
        self.assertEqual(
            captured_request["body"]["model"],
            "gpt://test-folder/yandexgpt-5.1",
        )
        self.assertEqual(captured_request["body"]["max_completion_tokens"], 700)
        self.assertEqual(result, "Вывод: сетка сбалансирована.")

    async def test_sends_only_aggregated_slot_data_to_provider(self):
        request_payload = {}

        async def handler(request):
            nonlocal request_payload
            request_payload = json.loads(request.content)
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "Вывод: дефицит. Рекомендация: резерв."}}]},
            )

        result = await generate_allocation_analysis(
            matrix=[{
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
                "deficit": 2,
                "status": "shortage",
            }],
            summary={
                "slot_count": 1,
                "shortage_slots": 1,
                "required_judges": 9,
                "confirmed_judges": 7,
                "unfilled_positions": 2,
            },
            action="analyze",
            settings=LLMSettings(
                _env_file=None,
                LLM_PROVIDER="openai-compatible",
                LLM_API_KEY="test-key",
                LLM_BASE_URL="https://llm.test",
            ),
            transport=httpx.MockTransport(handler),
            selected_slot={
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
            },
        )

        user_content = request_payload["messages"][1]["content"]
        self.assertIn("historical_synthetic_rating_summary", user_content)
        self.assertIn('"selected_slot": {"committee": "Инвесторы"', user_content)
        self.assertNotIn("@", user_content)
        self.assertNotIn("JUDGE_", user_content)
        self.assertEqual(result, "Вывод: дефицит. Рекомендация: резерв.")

    async def test_reports_provider_errors(self):
        async def handler(_request):
            return httpx.Response(429, json={"error": "rate limited"})

        with self.assertRaisesRegex(LLMServiceError, "HTTP 429"):
            await generate_allocation_analysis(
                matrix=[],
                summary={},
                action="recalculate",
                settings=LLMSettings(
                    _env_file=None,
                    LLM_PROVIDER="openai-compatible",
                    LLM_API_KEY="test-key",
                    LLM_BASE_URL="https://llm.test",
                ),
                transport=httpx.MockTransport(handler),
            )

    def test_allocate_endpoint_is_mounted_and_reports_missing_llm_config(self):
        payload = {
            "competition_id": "00000000-0000-0000-0000-000000000000",
            "slots": [{
                "committee": "Инвесторы",
                "date": "21.03",
                "round": "утро",
                "required_judges": 9,
                "confirmed_judges": 7,
            }],
        }
        with patch(
            "app.api.endpoints.ai_engine.generate_allocation_analysis",
            new=AsyncMock(side_effect=LLMNotConfiguredError("LLM не настроен")),
        ):
            response = TestClient(app).post("/api/v1/allocate", json=payload)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "LLM не настроен")


if __name__ == "__main__":
    unittest.main()
