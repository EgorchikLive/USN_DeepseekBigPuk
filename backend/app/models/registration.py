from datetime import datetime
import uuid

class UserRegistration:
    def __init__(self, competition_id, email, phone=None, full_name=None,
                 company=None, experience_years=None, current_role="Player",
                 linked_participant_id=None, status="pending"):
        self.id = str(uuid.uuid4())
        self.competition_id = competition_id
        self.email = email
        self.phone = phone
        self.full_name = full_name
        self.company = company
        self.experience_years = experience_years
        self.current_role = current_role
        self.linked_participant_id = linked_participant_id
        self.status = status
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "competition_id": self.competition_id,
            "email": self.email,
            "phone": self.phone,
            "full_name": self.full_name,
            "company": self.company,
            "experience_years": self.experience_years,
            "current_role": self.current_role,
            "linked_participant_id": self.linked_participant_id,
            "status": self.status,
            "updated_at": self.updated_at.isoformat(),
        }