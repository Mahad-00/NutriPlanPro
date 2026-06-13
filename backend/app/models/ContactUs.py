from sqlalchemy import text
from app import db
from datetime import datetime


class ContactUs(db.Model):
    __tablename__ = 'ContactUs'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, server_default=text('false'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'is_read': bool(self.is_read) if self.is_read is not None else False,
            'created_at': self.created_at.isoformat(),
        }
