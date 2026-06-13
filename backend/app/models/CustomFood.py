from app import db
from datetime import datetime


class CustomFood(db.Model):
    __tablename__ = 'CustomFoods'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(255), default='')
    barcode = db.Column(db.String(100), default='')
    serving_unit = db.Column(db.String(50), default='serving')
    calories = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    fat = db.Column(db.Float, default=0)
    sugar = db.Column(db.Float, default=0)
    sodium = db.Column(db.Float, default=0)
    fiber = db.Column(db.Float, default=0)
    description = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'barcode': self.barcode,
            'serving_unit': self.serving_unit,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'sugar': self.sugar,
            'sodium': self.sodium,
            'fiber': self.fiber,
            'description': self.description,
        }
