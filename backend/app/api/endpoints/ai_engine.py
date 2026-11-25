import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, NonNegativeInt, PositiveInt

from app.services.ai_allocator import allocate_judges
from app.services.llm_assistant import (
    LLMNotConfiguredError,
    LLMServiceError,
    generate_allocation_analysis,
)

router = APIRouter()


class SlotAvailability(BaseModel):
    committee: str = Field(min_length=1, max_length=100)
    date: str = Field(min_length=1, max_length=40)
    round: str = Field(min_length=1, max_length=80)
    required_judges: PositiveInt
    confirmed_judges: NonNegativeInt


class AllocationRequest(BaseModel):
    competition_id: uuid.UUID
    slots: list[SlotAvailability] = Field(min_length=1, max_length=200)
    action: Literal["analyze", "recalculate"] = "analyze"
    selected_slot: SlotAvailability | None = None


@router.post("/allocate")
async def run_allocation(request: AllocationRequest):
    matrix, summary = allocate_judges(
        [slot.model_dump() for slot in request.slots]
    )
    try:
        analysis = await generate_allocation_analysis(
            matrix,
            summary,
            request.action,
            selected_slot=(
                request.selected_slot.model_dump()
                if request.selected_slot
                else None
            ),
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
