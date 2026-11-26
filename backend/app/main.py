from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import ai_engine, registrations, spreadsheet

app = FastAPI(title="USN Organizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registrations.router, prefix="/api/v1/registration", tags=["Регистрация"])
app.include_router(ai_engine.router, prefix="/api/v1", tags=["ИИ-распределение"])
app.include_router(spreadsheet.router, prefix="/api/v1", tags=["Таблица турниров"])

@app.get("/health")
def health_check():
    return {"status": "ok"}