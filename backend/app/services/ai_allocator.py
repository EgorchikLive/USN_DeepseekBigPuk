from sqlalchemy.orm import Session
from app.models import models
import json

def allocate_judges(competition_id: str, db: Session):
    # 1. Получаем данные из БД
    registrations = db.query(models.UserRegistration).filter(
        models.UserRegistration.competition_id == competition_id,
        models.UserRegistration.current_role == "Voter"
    ).all()

    # Собираем доступность судей
    judge_availability = []
    for reg in registrations:
        slots = [slot.django_slot_id for slot in reg.judge_slots if slot.is_available]
        judge_availability.append({
            "judge_id": str(reg.id),
            "name": reg.full_name,
            "available_slots": slots
        })

    # 2. Математический оптимизатор (Простой жадный алгоритм)
    # В реальности здесь нужно учитывать требования коллегий (3/5/9 судей)
    # и рейтинги (таблицы "Оценки ОС" и "Оценки КС").
    
    # Пример: Мы просто группируем судей по слотам, где их достаточно
    slots_needed = {} # Здесь должен быть список слотов из Django
    # Пока делаем заглушку
    allocation_matrix = {
        "slot_1": ["judge_1", "judge_2"],
        "slot_2": ["judge_3"]
    }

    # 3. Генерация обоснования (Заглушка LLM)
    llm_justification = (
        "Иванова А. — рейтинг 2: закрывала дневные слоты 14.03 и 15.03. "
        "Петров Д. — рейтинг 1, но утро 21.03 занято. "
        "Рекомендация: вариант А + 2 приглашения из кадрового резерва."
    )

    # 4. Сохраняем результат в БД
    new_allocation = models.AIAllocation(
        competition_id=competition_id,
        matrix=allocation_matrix,
        justification=llm_justification
    )
    db.add(new_allocation)
    db.commit()
    db.refresh(new_allocation)

    return {
        "allocation_id": str(new_allocation.id),
        "matrix": allocation_matrix,
        "justification": llm_justification
    }