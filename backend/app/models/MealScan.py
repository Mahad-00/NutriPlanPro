from app import db
from datetime import datetime, date as date_type


class MealScan(db.Model):
    __tablename__ = 'MealScans'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'date': self.date.isoformat(),
            'meal_type': self.meal_type,
            'notes': self.notes,
        }
