import json
from pathlib import Path
from typing import Literal

import httpx
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.services.synthetic_ratings import SYNTHETIC_RATING_SUMMARY


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        case_sensitive=False,
        extra="ignore",
    )

    LLM_PROVIDER: Literal["yandex", "openai-compatible"] = "yandex"
    LLM_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices(
            "LLM_API_KEY",
            "DEEPSEEK_API_KEY",
            "OPENAI_API_KEY",
        ),
    )
    LLM_BASE_URL: str = "https://api.deepseek.com"
    LLM_MODEL: str = "deepseek-chat"
    YANDEX_API_KEY: str = ""
    YANDEX_FOLDER_ID: str = ""
    YANDEX_MODEL: str = "yandexgpt-5.1"
    YANDEX_BASE_URL: str = "https://ai.api.cloud.yandex.net/v1"
    LLM_TIMEOUT_SECONDS: float = Field(default=45, gt=0, le=120)


class LLMNotConfiguredError(Exception):
    pass


class LLMServiceError(Exception):
    pass


async def generate_allocation_analysis(
    matrix: list[dict],
    summary: dict[str, int],
    action: str,
    settings: LLMSettings | None = None,
    transport: httpx.AsyncBaseTransport | None = None,
    selected_slot: dict | None = None,
) -> str:
    config = settings or LLMSettings()
    if config.LLM_PROVIDER == "yandex":
        api_key = config.YANDEX_API_KEY.strip()
        folder_id = config.YANDEX_FOLDER_ID.strip()
        if not api_key or not folder_id:
            raise LLMNotConfiguredError(
                "Yandex AI Studio не настроен: задайте YANDEX_API_KEY и "
                "YANDEX_FOLDER_ID в backend/.env и перезапустите FastAPI."
            )
        model = config.YANDEX_MODEL.strip()
        if not model.startswith("gpt://"):
            model = f"gpt://{folder_id}/{model}"
        endpoint = f"{config.YANDEX_BASE_URL.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Api-Key {api_key}"}
        max_token_parameter = "max_completion_tokens"
    else:
        api_key = config.LLM_API_KEY.strip()
        if not api_key:
            raise LLMNotConfiguredError(
                "LLM не настроен: задайте LLM_API_KEY в backend/.env и перезапустите FastAPI."
            )
        endpoint = f"{config.LLM_BASE_URL.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
        model = config.LLM_MODEL
        max_token_parameter = "max_tokens"

    action_label = "перерасчёт" if action == "recalculate" else "первичный анализ"
    context = {
        "action": action_label,
        "availability_matrix": matrix,
        "totals": summary,
        "historical_synthetic_rating_summary": SYNTHETIC_RATING_SUMMARY,
        "selected_slot": selected_slot,
    }
    messages = [
        {
            "role": "system",
            "content": (
                "Ты аналитический помощник организатора турнира. "
                "Проанализируй только переданные агрегированные числовые данные. "
                "Если передан selected_slot, начни с его подробного разбора. "
                "Сначала укажи краткий вывод, затем дай от 1 до 3 конкретных "
                "рекомендаций на русском языке. Не выдумывай имена, кандидатов, "
                "доступность или факты, которых нет во входных данных. "
                "Исторические оценки показывают только распределение баллов "
                "1–3 и не подтверждают доступность конкретных судей. "
                "Если данных недостаточно для решения, явно укажи это."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(context, ensure_ascii=False),
        },
    ]

    try:
        async with httpx.AsyncClient(
            timeout=config.LLM_TIMEOUT_SECONDS,
            transport=transport,
        ) as client:
            response = await client.post(
                endpoint,
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    max_token_parameter: 700,
                },
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise LLMServiceError("Истекло время ожидания ответа LLM.") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403):
            if config.LLM_PROVIDER == "yandex":
                message = (
                    "Yandex AI Studio отклонил ключ или доступ (HTTP {status}). "
                    "Проверьте YANDEX_API_KEY, YANDEX_FOLDER_ID и права сервисного аккаунта."
                )
            else:
                message = "Провайдер отклонил API-ключ или доступ (HTTP {status}). Проверьте LLM_API_KEY и LLM_BASE_URL."
        elif status == 402:
            message = (
                "Провайдер отклонил запрос из-за оплаты или баланса (HTTP 402). "
                "Проверьте биллинг и доступный грант."
            )
        elif status == 404:
            if config.LLM_PROVIDER == "yandex":
                message = (
                    "Yandex AI Studio не нашёл модель или endpoint (HTTP 404). "
                    "Проверьте YANDEX_FOLDER_ID и YANDEX_MODEL."
                )
            else:
                message = "Провайдер не нашел endpoint или модель (HTTP 404). Проверьте LLM_BASE_URL и LLM_MODEL."
        elif status == 429:
            message = "Провайдер ограничил частоту запросов или баланс (HTTP 429)."
        else:
            message = "Провайдер LLM вернул ошибку HTTP {status}."
        raise LLMServiceError(
            message.format(status=status)
        ) from exc
    except httpx.RequestError as exc:
        raise LLMServiceError("Не удалось связаться с провайдером LLM.") from exc

    try:
        payload = response.json()
        analysis = payload["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise LLMServiceError("Провайдер LLM вернул ответ неизвестного формата.") from exc

    if not isinstance(analysis, str) or not analysis.strip():
        raise LLMServiceError("Провайдер LLM вернул пустой анализ.")
    return analysis.strip()
