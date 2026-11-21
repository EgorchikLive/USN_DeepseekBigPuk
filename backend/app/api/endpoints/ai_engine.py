from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_allocator import allocate_judges
from pydantic import BaseModel
import uuid

router = APIRouter()

class AllocationRequest(BaseModel):
    competition_id: uuid.UUID

@router.post("/allocate")
def run_allocation(request: AllocationRequest, db: Session = Depends(get_db)):
    try:
        result = allocate_judges(str(request.competition_id), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))