import asyncio
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Any
from zipfile import BadZipFile

import httpx
from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SpreadsheetSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        case_sensitive=False,
        extra="ignore",
    )

    USN_SPREADSHEET_ID: str = "1Un-L9XztvhbszdjqNG3Ej4NAcmiBD2ph1ZTtH5n4sEI"
    SPREADSHEET_CACHE_TTL_SECONDS: int = Field(default=300, gt=0, le=3600)
    SPREADSHEET_TIMEOUT_SECONDS: float = Field(default=30, gt=0, le=120)


class SpreadsheetDataError(Exception):
    pass


_TIME_RANGE = re.compile(r"(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})")
_JUDGE_ID = re.compile(r"\bJUDGE_[A-Z0-9_-]+\b", re.IGNORECASE)
_NUMERIC_DATE = re.compile(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b")
_RUSSIAN_DATE = re.compile(
    r"\b(\d{1,2})\s+"
    r"(января|февраля|марта|апреля|мая|июня|июля|августа|"
    r"сентября|октября|ноября|декабря)\s+(\d{4})\b",
    re.IGNORECASE,
)
_MONTHS = {
    "января": "01",
    "февраля": "02",
    "марта": "03",
    "апреля": "04",
    "мая": "05",
    "июня": "06",
    "июля": "07",
    "августа": "08",
    "сентября": "09",
    "октября": "10",
    "ноября": "11",
    "декабря": "12",
}

_cache: tuple[float, dict[str, Any]] | None = None
_cache_lock = asyncio.Lock()


def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _date_labels(value: str) -> list[str]:
    dates = [
        f"{int(day):02d}.{int(month):02d}.{year}"
        for day, month, year in _NUMERIC_DATE.findall(value)
    ]
    dates.extend(
        f"{int(day):02d}.{_MONTHS[month.casefold()]}.{year}"
        for day, month, year in _RUSSIAN_DATE.findall(value)
    )
    return list(dict.fromkeys(dates))


def _tournament_kind(name: str) -> str | None:
    normalized = name.casefold()
    if "стратегии" in normalized:
        return "strategy"
    if "сотруднич" in normalized:
        return "cooperation"
    if "вызова" in normalized and "экспр" in normalized:
        return "challenge-express"
    if "вызова" in normalized and "класс" in normalized:
        return "challenge-classic"
    return None


def _format_label(name: str) -> str:
    normalized = name.casefold()
    if "команд" in normalized or "коман" in normalized:
        return "Командный"
    if "экспресс" in normalized:
        return "Экспресс"
    if "классик" in normalized:
        return "Классика"
    return "Формат не указан"


def _find_header_row(worksheet) -> tuple[int, list[str]] | None:
    for row_number, row in enumerate(worksheet.iter_rows(values_only=True), start=1):
        if _text(row[0] if row else "").casefold() == "время":
            return row_number, [_text(value) for value in row]
    return None


def _judge_ids_in_row(row: tuple[Any, ...]) -> list[str]:
    ids = []
    for value in row[6:]:
        ids.extend(match.group(0).upper() for match in _JUDGE_ID.finditer(_text(value)))
    return ids


def _match_number(value: Any) -> str | None:
    text = _text(value)
    if re.fullmatch(r"\d+(?:\.0+)?", text):
        return str(int(float(text)))
    return None


def _parse_schedule(worksheet, tournament_id: str) -> list[dict[str, Any]]:
    header = _find_header_row(worksheet)
    if header is None:
        return []

    header_row, _ = header
    schedule: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for row_number, row in enumerate(
        worksheet.iter_rows(values_only=True),
        start=1,
    ):
        if row_number <= header_row:
            continue

        first_cell = _text(row[0] if row else "")
        if first_cell.casefold() == "время":
            current = None
            continue

        time_match = _TIME_RANGE.search(first_cell)
        if time_match:
            trailing_text = first_cell[time_match.end():].strip(" \t\r\n-/–—")
            phase = trailing_text or None
            current = {
                "id": f"{tournament_id}-slot-{len(schedule) + 1}",
                "time": f"{time_match.group(1)}–{time_match.group(2)}",
                "phase": phase,
                "judge_ids": [],
                "match_numbers": [],
                "assigned_judge_count": 0,
            }
            schedule.append(current)
        elif current is None and _judge_ids_in_row(row):
            current = {
                "id": f"{tournament_id}-slot-{len(schedule) + 1}",
                "time": "Время не указано",
                "phase": None,
                "judge_ids": [],
                "match_numbers": [],
                "assigned_judge_count": 0,
            }
            schedule.append(current)

        if current is None:
            continue

        match_number = _match_number(row[1] if len(row) > 1 else None)
        if match_number and match_number not in current["match_numbers"]:
            current["match_numbers"].append(match_number)

        for judge_id in _judge_ids_in_row(row):
            if judge_id not in current["judge_ids"]:
                current["judge_ids"].append(judge_id)
        current["assigned_judge_count"] = len(current["judge_ids"])

    for slot in schedule:
        slot["match_count"] = len(slot["match_numbers"])
    return schedule


def _problematic_slots(worksheet) -> str | None:
    rows = list(worksheet.iter_rows(values_only=True))
    for row_index, row in enumerate(rows):
        for column_index, value in enumerate(row):
            label = _text(value)
            if "проблемные слоты" not in label.casefold():
                continue

            note = label.split(":", 1)[1].strip() if ":" in label else ""
            if note:
                return note

            for candidate in row[column_index + 1:]:
                note = _text(candidate)
                if note:
                    return note

            if row_index + 1 < len(rows):
                next_row = rows[row_index + 1]
                for candidate in next_row[column_index:]:
                    note = _text(candidate)
                    if note:
                        return note
    return None


def _parse_applications(worksheet, tournament_id: str) -> list[dict[str, Any]]:
    rows = worksheet.iter_rows(values_only=True)
    headers = next(rows, ())
    header_text = [_text(value).casefold() for value in headers]

    def find_column(fragment: str) -> int | None:
        return next(
            (index for index, value in enumerate(header_text) if fragment in value),
            None,
        )

    city_column = find_column("город")
    club_column = find_column("клуб")
    introduction_column = find_column("как вас представить")
    availability_columns = [
        index
        for index, value in enumerate(header_text)
        if "прошу зарегистрировать" in value
    ]
    applications = []

    for row_number, row in enumerate(rows, start=2):
        judge_id = next(
            (
                match.group(0).upper()
                for value in row
                for match in _JUDGE_ID.finditer(_text(value))
            ),
            None,
        )
        if not judge_id:
            continue

        availability = []
        for column_index in availability_columns:
            answer = _text(row[column_index] if column_index < len(row) else None)
            if answer:
                availability.append({
                    "period": _text(headers[column_index]),
                    "answer": answer,
                })

        applications.append({
            "id": f"{tournament_id}-{row_number}-{judge_id}",
            "judge_id": judge_id,
            "city": _text(row[city_column]) if city_column is not None and city_column < len(row) else "",
            "club": _text(row[club_column]) if club_column is not None and club_column < len(row) else "",
            "introduction": (
                _text(row[introduction_column])
                if introduction_column is not None and introduction_column < len(row)
                else ""
            ),
            "availability": availability,
        })
    return applications


def _application_dates(worksheet) -> list[str]:
    headers = next(worksheet.iter_rows(values_only=True), ())
    dates = []
    for header in headers:
        text = _text(header)
        if "прошу зарегистрировать" in text.casefold():
            dates.extend(_date_labels(text))
    return list(dict.fromkeys(dates))


def _parse_ratings(workbook) -> list[dict[str, Any]]:
    summaries = []
    for worksheet in workbook.worksheets:
        if not worksheet.title.casefold().startswith("оценки"):
            continue

        rows = worksheet.iter_rows(values_only=True)
        headers = next(rows, ())
        scores_by_criterion: list[list[int]] = [
            [] for _ in range(max(len(headers) - 1, 0))
        ]
        rated_judges = set()

        for row in rows:
            judge_id = _text(row[0] if row else "")
            if not judge_id:
                continue
            rated_judges.add(judge_id)
            for index in range(1, min(len(row), len(headers))):
                try:
                    score = int(row[index])
                except (TypeError, ValueError):
                    continue
                if score in (1, 2, 3):
                    scores_by_criterion[index - 1].append(score)

        criteria = []
        for index, scores in enumerate(scores_by_criterion, start=1):
            if not scores:
                continue
            criteria.append({
                "name": _text(headers[index]),
                "response_count": len(scores),
                "average": round(sum(scores) / len(scores), 2),
                "scores": {str(score): scores.count(score) for score in (1, 2, 3)},
            })

        summaries.append({
            "sheet": worksheet.title,
            "rated_judge_count": len(rated_judges),
            "criteria": criteria,
        })
    return summaries


def parse_workbook(content: bytes) -> dict[str, Any]:
    try:
        workbook = load_workbook(
            BytesIO(content),
            read_only=True,
            data_only=True,
        )
    except (BadZipFile, InvalidFileException) as exc:
        raise SpreadsheetDataError("Google Sheets вернул файл неизвестного формата.") from exc

    try:
        response_sheets = [
            worksheet
            for worksheet in workbook.worksheets
            if worksheet.title.casefold().startswith("ответы")
        ]
        if not response_sheets:
            raise SpreadsheetDataError("В таблице не найдены листы ответов судей.")
        response_by_kind = {
            kind: worksheet
            for worksheet in response_sheets
            if (kind := _tournament_kind(worksheet.title))
        }

        tournaments = []
        for worksheet in workbook.worksheets:
            if worksheet.title.casefold().startswith(("ответы", "оценки")):
                continue
            if _find_header_row(worksheet) is None:
                continue

            title = _text(worksheet["A1"].value) or worksheet.title
            tournament_id = f"tournament-{len(tournaments) + 1:02d}"
            metadata = _text(worksheet["A4"].value)
            dates = _date_labels(metadata)
            year_match = re.search(r"\b20\d{2}\b", worksheet.title)
            year = int(year_match.group(0)) if year_match else (
                int(dates[0][-4:]) if dates else None
            )

            application_sheet = None
            kind = _tournament_kind(worksheet.title)
            if year == 2026 and kind:
                application_sheet = response_by_kind.get(kind)
            applications = (
                _parse_applications(application_sheet, tournament_id)
                if application_sheet
                else []
            )
            if application_sheet:
                dates.extend(_application_dates(application_sheet))
            for application in applications:
                for availability in application["availability"]:
                    dates.extend(_date_labels(availability["period"]))
            dates = list(dict.fromkeys(dates))

            tournaments.append({
                "id": tournament_id,
                "title": title,
                "source_sheet": worksheet.title,
                "format": _format_label(worksheet.title),
                "year": year,
                "date": dates[0] if dates else None,
                "dates": dates,
                "problematic_slots": _problematic_slots(worksheet),
                "schedule": _parse_schedule(worksheet, tournament_id),
                "applications": applications,
            })

        if not tournaments:
            raise SpreadsheetDataError("В таблице не найдены листы с расписанием турниров.")

        ratings = _parse_ratings(workbook)
        if len(ratings) < 2:
            raise SpreadsheetDataError(
                "В таблице не найдены обе вкладки оценок судей."
            )
        return {"tournaments": tournaments, "ratings_summary": ratings}
    finally:
        workbook.close()


async def get_spreadsheet_data(
    settings: SpreadsheetSettings | None = None,
    force_refresh: bool = False,
) -> dict[str, Any]:
    global _cache

    config = settings or SpreadsheetSettings()
    now = time.monotonic()
    if (
        not force_refresh
        and _cache is not None
        and now - _cache[0] < config.SPREADSHEET_CACHE_TTL_SECONDS
    ):
        return _cache[1]

    async with _cache_lock:
        now = time.monotonic()
        if (
            not force_refresh
            and _cache is not None
            and now - _cache[0] < config.SPREADSHEET_CACHE_TTL_SECONDS
        ):
            return _cache[1]

        export_url = (
            "https://docs.google.com/spreadsheets/d/"
            f"{config.USN_SPREADSHEET_ID}/export?format=xlsx"
        )
        try:
            async with httpx.AsyncClient(
                timeout=config.SPREADSHEET_TIMEOUT_SECONDS,
                follow_redirects=True,
            ) as client:
                response = await client.get(export_url)
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise SpreadsheetDataError(
                f"Экспорт Google Sheets вернул HTTP {exc.response.status_code}."
            ) from exc
        except httpx.RequestError as exc:
            raise SpreadsheetDataError(
                "Не удалось загрузить таблицу Google Sheets."
            ) from exc

        data = await asyncio.to_thread(parse_workbook, response.content)
        _cache = (time.monotonic(), data)
        return data
