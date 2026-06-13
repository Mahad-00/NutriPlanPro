from app import db
from datetime import datetime


class Recipe(db.Model):
    __tablename__ = 'Recipes'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50), default='')
    diet_type = db.Column(db.String(50), default='balanced')
    servings = db.Column(db.Integer, default=2)
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
            'title': self.title,
            'category': self.category,
            'diet_type': self.diet_type,
            'servings': self.servings,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'sugar': self.sugar,
            'sodium': self.sodium,
            'fiber': self.fiber,
            'description': self.description,
        }
