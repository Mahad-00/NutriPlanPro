from app import db
from datetime import datetime


class FoodDiaryEntry(db.Model):
    __tablename__ = 'FoodDiaryEntries'
    __table_args__ = (
        db.Index('ix_food_diary_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(50), nullable=False)
    entry_type = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, default=1)
    serving_unit = db.Column(db.String(50), default='serving')
    calories = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    fat = db.Column(db.Float, default=0)
    fiber = db.Column(db.Float, default=0)
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'meal_type': self.meal_type,
            'entry_type': self.entry_type,
            'name': self.name,
            'quantity': self.quantity,
            'serving_unit': self.serving_unit,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'fiber': self.fiber,
            'notes': self.notes,
        }
