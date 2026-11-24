async def sync_with_django(registration_data: dict):
    """Заглушка синхронизации с Django (всегда успех для MVP)"""
    print(f"[SYNC] Отправка в Django: {registration_data}")
    return {"status": "ok"}