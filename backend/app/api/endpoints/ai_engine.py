import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.llm_assistant import (
    LLMNotConfiguredError,
    LLMServiceError,
    generate_allocation_analysis,
)
from app.services.spreadsheet_data import (
    SpreadsheetDataError,
    get_spreadsheet_data,
)

router = APIRouter()


class AllocationRequest(BaseModel):
    tournament_id: str = Field(min_length=1, max_length=40)
    action: Literal["analyze", "recalculate"] = "analyze"
    selected_slot_id: str | None = None


@router.post("/allocate")
async def run_allocation(request: AllocationRequest):
    try:
        data = await get_spreadsheet_data()
    except SpreadsheetDataError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    tournament = next(
        (
            item
            for item in data["tournaments"]
            if item["id"] == request.tournament_id
        ),
        None,
    )
    if tournament is None:
        raise HTTPException(status_code=404, detail="Турнир не найден в таблице.")

    matrix = [
        {
            "slot_id": slot["id"],
            "time": slot["time"],
            "phase": slot["phase"],
            "match_count": slot["match_count"],
            "assigned_judge_count": slot["assigned_judge_count"],
        }
        for slot in tournament["schedule"]
    ]
    game_slots = [slot for slot in matrix if slot["match_count"] > 0]
    summary = {
        "tournament": tournament["title"],
        "format": tournament["format"],
        "dates": tournament["dates"],
        "schedule_block_count": len(matrix),
        "game_slot_count": len(game_slots),
        "slots_with_assignments": sum(
            slot["assigned_judge_count"] > 0 for slot in game_slots
        ),
        "slots_without_assignments": sum(
            slot["assigned_judge_count"] == 0 for slot in game_slots
        ),
        "assigned_judges_total": sum(
            slot["assigned_judge_count"] for slot in matrix
        ),
        "judge_application_count": len(tournament["applications"]),
        "problematic_slots_recorded": bool(tournament["problematic_slots"]),
    }
    selected_slot = None
    if request.selected_slot_id:
        selected_slot = next(
            (slot for slot in matrix if slot["slot_id"] == request.selected_slot_id),
            None,
        )
        if selected_slot is None:
            raise HTTPException(status_code=404, detail="Слот не найден в таблице.")

    try:
        analysis = await generate_allocation_analysis(
            matrix,
            summary,
            request.action,
            ratings_summary=data["ratings_summary"],
            selected_slot=selected_slot,
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "analysis_id": str(uuid.uuid4()),
        "matrix": matrix,
        "summary": summary,
        "justification": analysis,
    }
