from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base

class Competition(Base):
    __tablename__ = "competitions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    django_competition_id = Column(Integer, unique=True, index=True)
    title = Column(String)
    format = Column(String) # классика | экспресс | командный
    status = Column(String, default="active")
    start_date = Column(DateTime)

class UserRegistration(Base):
    __tablename__ = "user_registrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competition_id = Column(UUID(as_uuid=True), ForeignKey("competitions.id"))
    email = Column(String, index=True)
    phone = Column(String)
    full_name = Column(String)
    company = Column(String)
    experience_years = Column(String)
    current_role = Column(String) # Player | Voter | Adviser | Viewer
    status = Column(String, default="pending") # pending | confirmed | reserve
    linked_participant_id = Column(UUID(as_uuid=True), ForeignKey("user_registrations.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связь для слотов (если судья)
    judge_slots = relationship("JudgeSlotAvailability", back_populates="registration")

class JudgeSlotAvailability(Base):
    __tablename__ = "judge_slot_availability"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_registration_id = Column(UUID(as_uuid=True), ForeignKey("user_registrations.id"))
    django_slot_id = Column(Integer)
    is_available = Column(Boolean, default=False)

    registration = relationship("UserRegistration", back_populates="judge_slots")

class AIAllocation(Base):
    __tablename__ = "ai_allocations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competition_id = Column(UUID(as_uuid=True), ForeignKey("competitions.id"))
    matrix = Column(JSON)
    justification = Column(Text)
    org_decision = Column(String, default="pending") # accepted | rejected
    created_at = Column(DateTime, default=datetime.utcnow)