from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import get_competitions_store
from app.models.competition import Competition
from app.api.endpoints import registrations

app = FastAPI(title="USN Organizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_test_data():
    store = get_competitions_store()
    store["1"] = {
        "id": "1",
        "django_competition_id": 101,
        "title": "Название 1",
        "format": "классика",
        "status": "active",
    }
    store["2"] = {
        "id": "2",
        "django_competition_id": 102,
        "title": "Название 2",
        "format": "экспресс",
        "status": "active",
    }
    store["3"] = {
        "id": "3",
        "django_competition_id": 103,
        "title": "Название 3",
        "format": "командный",
        "status": "active",
    }

seed_test_data()

app.include_router(registrations.router, prefix="/api/v1/registration", tags=["Регистрация"])

@app.get("/health")
def health_check():
    return {"status": "ok"}