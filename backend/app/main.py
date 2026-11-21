from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import ai_engine # Импортируем наш роутер

app = FastAPI(title="USN Organizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Порт вашего Vite фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_engine.router, prefix="/api/v1", tags=["AI Engine"])

@app.get("/")
def read_root():
    return {"status": "ok"}