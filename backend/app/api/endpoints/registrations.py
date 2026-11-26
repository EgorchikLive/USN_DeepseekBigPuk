from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.models.registration import UserRegistration
from app.schemas.registration import (
    RegistrationCreate, RegistrationResponse,
    EmailCheckRequest, EmailCheckResponse
)
from app.services.validation import validate_registration
from app.services.django_sync import sync_with_django
from app.services.spreadsheet_data import SpreadsheetDataError, get_spreadsheet_data

router = APIRouter()

@router.post("/check-email", response_model=EmailCheckResponse)
def check_email(data: EmailCheckRequest, db: dict = Depends(get_db)):
    key = (data.email, data.competition_id)
    existing = db.get(key)
    if existing:
        return EmailCheckResponse(exists=True, registration=existing.to_dict())
    return EmailCheckResponse(exists=False)

@router.post("/", response_model=RegistrationResponse)
async def create_registration(data: RegistrationCreate, db: dict = Depends(get_db)):
    key = (data.email, data.competition_id)
    existing = db.get(key)

    if existing:
        # Повторный вход — обновляем данные
        existing.full_name = data.full_name or existing.full_name
        existing.phone = data.phone or existing.phone
        existing.current_role = data.current_role
        existing.linked_participant_id = data.linked_participant_id
        return existing.to_dict()

    try:
        spreadsheet_data = await get_spreadsheet_data()
    except SpreadsheetDataError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    competition = next(
        (
            item
            for item in spreadsheet_data["tournaments"]
            if item["id"] == data.competition_id
        ),
        None,
    )
    if competition is None:
        raise HTTPException(status_code=404, detail="Турнир не найден в таблице.")
    validate_registration(data, competition, db)

    new_reg = UserRegistration(
        competition_id=data.competition_id,
        email=data.email,
        phone=data.phone,
        full_name=data.full_name,
        company=data.company,
        experience_years=data.experience_years,
        current_role=data.current_role,
        linked_participant_id=data.linked_participant_id,
        status="pending"
    )
    db[key] = new_reg

    await sync_with_django({
        "email": data.email,
        "full_name": data.full_name,
        "role": data.current_role,
        "competition_id": str(data.competition_id)
    })

    return new_reg.to_dict()

@router.get("/{registration_id}", response_model=RegistrationResponse)
def get_registration(registration_id: str, db: dict = Depends(get_db)):
    for reg in db.values():
        if reg.id == registration_id:
            return reg.to_dict()
    raise HTTPException(status_code=404, detail="Заявка не найдена")