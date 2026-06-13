from app import db
from datetime import datetime


class GroceryItem(db.Model):
    __tablename__ = 'GroceryItems'
    __table_args__ = (
        db.Index('ix_grocery_items_email_plan_id', 'email', 'plan_id'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50), default='Produce')
    quantity = db.Column(db.Float, default=1)
    unit = db.Column(db.String(50), default='item')
    purchased = db.Column(db.Boolean, default=False)
    plan_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'quantity': self.quantity,
            'unit': self.unit,
            'purchased': self.purchased,
            'plan_id': self.plan_id,
        }
