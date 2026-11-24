class Competition:
    def __init__(self, id, django_competition_id, title, format, status="active", start_date=None):
        self.id = id
        self.django_competition_id = django_competition_id
        self.title = title
        self.format = format
        self.status = status
        self.start_date = start_date