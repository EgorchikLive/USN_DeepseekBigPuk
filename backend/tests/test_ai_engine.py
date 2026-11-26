import json
import os
import unittest
import uuid
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_assistant import (
    LLMNotConfiguredError,
    LLMServiceError,
    LLMSettings,
    generate_allocation_analysis,
)


SPREADSHEET_DATA = {
    "tournaments": [{
        "id": "tournament-01",
        "title": "Кубок Вызова: экспресс",
        "source_sheet": "КУБОК ВЫЗОВА 2026 экспресс",
        "format": "Экспресс",
        "year": 2026,
        "date": "13.06.2026",
        "dates": ["13.06.2026"],
        "problematic_slots": "резерв на 06:55",
        "applications": [{
            "id": "tournament-01-2-JUDGE_001",
            "judge_id": "JUDGE_001",
        }],
        "schedule": [
            {
                "id": "tournament-01-slot-1",
                "time": "06:20–06:55",
                "phase": "Группа А",
                "match_count": 1,
                "assigned_judge_count": 2,
            },
            {
                "id": "tournament-01-slot-2",
                "time": "06:55–07:30",
                "phase": "Группа B",
                "match_count": 1,
                "assigned_judge_count": 0,
            },
        ],
    }],
    "ratings_summary": [{
        "sheet": "Оценки ОС",
        "rated_judge_count": 2,
        "criteria": [{
            "name": "Критерий",
            "response_count": 2,
            "average": 2.5,
            "scores": {"1": 0, "2": 1, "3": 1},
        }],
    }],
}


class LLMIntegrationTests(unittest.IsolatedAsyncioTestCase):
    def test_allocate_endpoint_uses_schedule_from_spreadsheet(self):
        analysis_mock = AsyncMock(return_value="Данные расписания проанализированы.")
        with (
            patch(
                "app.api.endpoints.ai_engine.get_spreadsheet_data",
                new=AsyncMock(return_value=SPREADSHEET_DATA),
            ),
            patch(
                "app.api.endpoints.ai_engine.generate_allocation_analysis",
                new=analysis_mock,
            ),
        ):
            response = TestClient(app).post(
                "/api/v1/allocate",
                json={
                    "tournament_id": "tournament-01",
                    "selected_slot_id": "tournament-01-slot-2",
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["matrix"][0]["assigned_judge_count"], 2)
        self.assertEqual(body["summary"]["slots_without_assignments"], 1)
        self.assertEqual(body["justification"], "Данные расписания проанализированы.")
        self.assertEqual(
            analysis_mock.await_args.kwargs["selected_slot"]["time"],
            "06:55–07:30",
        )
        self.assertEqual(
            analysis_mock.await_args.kwargs["ratings_summary"],
            SPREADSHEET_DATA["ratings_summary"],
        )

    def test_allocate_endpoint_rejects_unknown_tournament(self):
        with patch(
            "app.api.endpoints.ai_engine.get_spreadsheet_data",
            new=AsyncMock(return_value=SPREADSHEET_DATA),
        ):
            response = TestClient(app).post(
                "/api/v1/allocate",
                json={"tournament_id": "unknown"},
            )

        self.assertEqual(response.status_code, 404)

    def test_allocate_endpoint_reports_missing_llm_config(self):
        with (
            patch(
                "app.api.endpoints.ai_engine.get_spreadsheet_data",
                new=AsyncMock(return_value=SPREADSHEET_DATA),
            ),
            patch(
                "app.api.endpoints.ai_engine.generate_allocation_analysis",
                new=AsyncMock(
                    side_effect=LLMNotConfiguredError("LLM не настроен")
                ),
            ),
        ):
            response = TestClient(app).post(
                "/api/v1/allocate",
                json={"tournament_id": "tournament-01"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "LLM не настроен")

    def test_spreadsheet_endpoints_serve_table_records(self):
        with patch(
            "app.api.endpoints.spreadsheet.get_spreadsheet_data",
            new=AsyncMock(return_value=SPREADSHEET_DATA),
        ):
            client = TestClient(app)
            tournaments = client.get("/api/v1/spreadsheet/tournaments")
            detail = client.get(
                "/api/v1/spreadsheet/tournaments/tournament-01"
            )
            applications = client.get(
                "/api/v1/spreadsheet/tournaments/tournament-01/applications"
            )
            application_detail = client.get(
                "/api/v1/spreadsheet/tournaments/tournament-01/applications/"
                "tournament-01-2-JUDGE_001"
            )
            all_applications = client.get("/api/v1/spreadsheet/applications")

        self.assertEqual(tournaments.status_code, 200)
        self.assertEqual(
            tournaments.json()["tournaments"][0]["schedule_slot_count"],
            2,
        )
        self.assertEqual(detail.json()["schedule"][0]["time"], "06:20–06:55")
        self.assertEqual(
            applications.json()["applications"][0]["judge_id"],
            "JUDGE_001",
        )
        self.assertEqual(
            application_detail.json()["tournament_title"],
            "Кубок Вызова: экспресс",
        )
        self.assertEqual(
            all_applications.json()["applications"][0]["tournament_id"],
            "tournament-01",
        )

    def test_registration_validates_tournament_against_spreadsheet(self):
        with (
            patch(
                "app.api.endpoints.registrations.get_spreadsheet_data",
                new=AsyncMock(return_value=SPREADSHEET_DATA),
            ),
            patch(
                "app.api.endpoints.registrations.sync_with_django",
                new=AsyncMock(),
            ),
        ):
            response = TestClient(app).post(
                "/api/v1/registration/",
                json={
                    "competition_id": "tournament-01",
                    "email": f"{uuid.uuid4()}@example.com",
                    "full_name": "Test Participant",
                    "current_role": "Player",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["competition_id"], "tournament-01")

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
                ratings_summary=[],
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
                json={"choices": [{"message": {"content": "Расписание сбалансировано."}}]},
            )

        result = await generate_allocation_analysis(
            matrix=[],
            summary={},
            action="analyze",
            ratings_summary=[],
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
        self.assertEqual(result, "Расписание сбалансировано.")

    async def test_llm_receives_only_aggregated_spreadsheet_data(self):
        request_payload = {}

        async def handler(request):
            nonlocal request_payload
            request_payload = json.loads(request.content)
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "Вывод готов."}}]},
            )

        await generate_allocation_analysis(
            matrix=[{
                "slot_id": "slot-1",
                "time": "06:20–06:55",
                "phase": "Группа А",
                "assigned_judge_count": 3,
            }],
            summary={"slot_count": 1, "slots_without_assignments": 0},
            action="analyze",
            ratings_summary=[{
                "sheet": "Оценки ОС",
                "rated_judge_count": 2,
                "criteria": [{"name": "Критерий", "average": 2.5}],
            }],
            settings=LLMSettings(
                _env_file=None,
                LLM_PROVIDER="openai-compatible",
                LLM_API_KEY="test-key",
                LLM_BASE_URL="https://llm.test",
            ),
            transport=httpx.MockTransport(handler),
            selected_slot={"time": "06:20–06:55"},
        )

        user_content = request_payload["messages"][1]["content"]
        self.assertIn("rating_summary_from_spreadsheet", user_content)
        self.assertNotIn("JUDGE_", user_content)
        self.assertNotIn("@", user_content)
        self.assertNotIn("PERSON NAME", user_content)

    async def test_reports_provider_errors(self):
        async def handler(_request):
            return httpx.Response(429, json={"error": "rate limited"})

        with self.assertRaisesRegex(LLMServiceError, "HTTP 429"):
            await generate_allocation_analysis(
                matrix=[],
                summary={},
                action="recalculate",
                ratings_summary=[],
                settings=LLMSettings(
                    _env_file=None,
                    LLM_PROVIDER="openai-compatible",
                    LLM_API_KEY="test-key",
                    LLM_BASE_URL="https://llm.test",
                ),
                transport=httpx.MockTransport(handler),
            )


if __name__ == "__main__":
    unittest.main()
