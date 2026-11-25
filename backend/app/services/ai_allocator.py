from collections.abc import Mapping, Sequence
from typing import Any


def allocate_judges(slots: Sequence[Mapping[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    matrix = []

    for slot in slots:
        required = slot["required_judges"]
        confirmed = slot["confirmed_judges"]
        deficit = max(required - confirmed, 0)
        matrix.append({
            "committee": slot["committee"],
            "date": slot["date"],
            "round": slot["round"],
            "required_judges": required,
            "confirmed_judges": confirmed,
            "deficit": deficit,
            "status": "shortage" if deficit else "covered",
        })

    summary = {
        "slot_count": len(matrix),
        "shortage_slots": sum(slot["deficit"] > 0 for slot in matrix),
        "required_judges": sum(slot["required_judges"] for slot in matrix),
        "confirmed_judges": sum(slot["confirmed_judges"] for slot in matrix),
        "unfilled_positions": sum(slot["deficit"] for slot in matrix),
    }
    return matrix, summary
