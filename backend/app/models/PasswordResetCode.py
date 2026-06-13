from app import db
from datetime import datetime


class PasswordResetCode(db.Model):
    __tablename__ = 'PasswordResetCodes'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'expires_at': self.expires_at.isoformat(),
            'used': self.used,
        }
