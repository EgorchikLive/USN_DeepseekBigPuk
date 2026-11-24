from fastapi import HTTPException
from app.schemas.registration import RegistrationCreate
from app.core.database import get_competitions_store, get_db

def validate_registration(data: RegistrationCreate):
    competitions = get_competitions_store()
    registrations = get_db()

    # 1. Проверка формата турнира
    competition = competitions.get(data.competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Турнир не найден")

    # 2. Секундант только в классике
    if data.current_role == "Adviser" and competition["format"] == "экспресс":
        raise HTTPException(
            status_code=422,
            detail="Выбранная роль недоступна для этого формата"
        )

    # 3. Если секундант — обязателен игрок
    if data.current_role == "Adviser" and not data.linked_participant_id:
        raise HTTPException(
            status_code=422,
            detail="Для роли Секундант необходимо указать игрока"
        )

    # 4. Проверка, что игрок существует в этом турнире
    if data.linked_participant_id:
        player_found = any(
            reg.linked_participant_id == data.linked_participant_id
            and reg.current_role == "Player"
            for reg in registrations.values()
        )
        if not player_found:
            raise HTTPException(
                status_code=422,
                detail="Указанный игрок не найден в этом турнире"
            )
    return True