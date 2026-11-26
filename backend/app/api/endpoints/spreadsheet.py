from typing import Any

from fastapi import APIRouter, HTTPException

from app.services.spreadsheet_data import (
    SpreadsheetDataError,
    get_spreadsheet_data,
)

router = APIRouter()


def _public_tournament(tournament: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": tournament["id"],
        "title": tournament["title"],
        "source_sheet": tournament["source_sheet"],
        "format": tournament["format"],
        "year": tournament["year"],
        "date": tournament["date"],
        "dates": tournament["dates"],
        "problematic_slots": tournament["problematic_slots"],
        "schedule_slot_count": len(tournament["schedule"]),
        "judge_application_count": len(tournament["applications"]),
    }


def _public_application(
    application: dict[str, Any],
    tournament: dict[str, Any],
) -> dict[str, Any]:
    return {
        **application,
        "tournament_id": tournament["id"],
        "tournament_title": tournament["title"],
        "tournament_format": tournament["format"],
        "tournament_date": tournament["date"],
        "tournament_dates": tournament["dates"],
    }


async def _load_data() -> dict[str, Any]:
    try:
        return await get_spreadsheet_data()
    except SpreadsheetDataError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/spreadsheet/tournaments")
async def list_tournaments():
    data = await _load_data()
    return {"tournaments": [_public_tournament(item) for item in data["tournaments"]]}


@router.get("/spreadsheet/applications")
async def list_all_judge_applications():
    data = await _load_data()
    applications = []
    for tournament in data["tournaments"]:
        applications.extend(
            _public_application(application, tournament)
            for application in tournament["applications"]
        )
    return {"applications": applications}


@router.get("/spreadsheet/applications/{application_id}")
async def get_any_judge_application(application_id: str):
    data = await _load_data()
    for tournament in data["tournaments"]:
        application = next(
            (item for item in tournament["applications"] if item["id"] == application_id),
            None,
        )
        if application:
            return _public_application(application, tournament)
    raise HTTPException(status_code=404, detail="Заявка не найдена в таблице.")


@router.get("/spreadsheet/tournaments/{tournament_id}")
async def get_tournament(tournament_id: str):
    data = await _load_data()
    tournament = next(
        (item for item in data["tournaments"] if item["id"] == tournament_id),
        None,
    )
    if tournament is None:
        raise HTTPException(status_code=404, detail="Турнир не найден в таблице.")
    return {
        **_public_tournament(tournament),
        "schedule": tournament["schedule"],
    }


@router.get("/spreadsheet/tournaments/{tournament_id}/applications")
async def list_judge_applications(tournament_id: str):
    data = await _load_data()
    tournament = next(
        (item for item in data["tournaments"] if item["id"] == tournament_id),
        None,
    )
    if tournament is None:
        raise HTTPException(status_code=404, detail="Турнир не найден в таблице.")
    return {
        "applications": [
            _public_application(application, tournament)
            for application in tournament["applications"]
        ]
    }


@router.get(
    "/spreadsheet/tournaments/{tournament_id}/applications/{application_id}"
)
async def get_judge_application(tournament_id: str, application_id: str):
    data = await _load_data()
    tournament = next(
        (item for item in data["tournaments"] if item["id"] == tournament_id),
        None,
    )
    if tournament is None:
        raise HTTPException(status_code=404, detail="Турнир не найден в таблице.")
    application = next(
        (item for item in tournament["applications"] if item["id"] == application_id),
        None,
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена в таблице.")
    return _public_application(application, tournament)
