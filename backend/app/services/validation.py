from fastapi import HTTPException
from app.schemas.registration import RegistrationCreate


def validate_registration(
    data: RegistrationCreate,
    competition: dict,
    registrations: dict,
):
    if (
        data.current_role == "Adviser"
        and competition["format"].casefold() != "классика"
    ):
        raise HTTPException(
            status_code=422,
            detail="Выбранная роль недоступна для этого формата"
        )

    if data.current_role == "Adviser" and not data.linked_participant_id:
        raise HTTPException(
            status_code=422,
            detail="Для роли Секундант необходимо указать игрока"
        )

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