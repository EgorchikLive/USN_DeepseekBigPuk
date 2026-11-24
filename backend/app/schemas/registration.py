from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class RegistrationCreate(BaseModel):
    competition_id: str
    email: EmailStr
    phone: Optional[str] = None
    full_name: Optional[str] = None
    company: Optional[str] = None
    experience_years: Optional[str] = None
    current_role: str = Field(..., pattern="^(Player|Voter|Adviser|Viewer)$")
    linked_participant_id: Optional[str] = None

class RegistrationResponse(BaseModel):
    id: str
    competition_id: str
    email: EmailStr
    full_name: Optional[str]
    current_role: str
    status: str
    updated_at: str

class EmailCheckRequest(BaseModel):
    email: EmailStr
    competition_id: str

class EmailCheckResponse(BaseModel):
    exists: bool
    registration: Optional[RegistrationResponse] = None