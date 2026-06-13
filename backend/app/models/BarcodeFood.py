from app import db
from datetime import datetime


class BarcodeFood(db.Model):
    __tablename__ = 'BarcodeFoods'
    __table_args__ = (
        db.Index('ix_barcode_foods_email_barcode', 'email', 'barcode'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    barcode = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(255), default='')
    serving_size = db.Column(db.Float, default=1)
    serving_unit = db.Column(db.String(50), default='serving')
    calories = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    fat = db.Column(db.Float, default=0)
    fiber = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'barcode': self.barcode,
            'name': self.name,
            'brand': self.brand,
            'serving_size': self.serving_size,
            'serving_unit': self.serving_unit,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'fiber': self.fiber,
        }
