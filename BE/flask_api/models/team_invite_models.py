# file: flask_api/models/team_invite_models.py
from flask_api.extensions import db
from datetime import datetime

class TeamInvite(db.Model):
    __tablename__ = "team_invite"

    id = db.Column("ID_INVITE", db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT"), nullable=False)
    projrole_id = db.Column("ID_PROJROLE", db.Integer, db.ForeignKey("projectrole.ID_PROJROLE"), nullable=False)  # 👈 đổi ở đây
    email = db.Column("EMAIL", db.String(150), nullable=False)
    status = db.Column("STATUS", db.String(20), default="pending")  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Quan hệ
    project = db.relationship("Project", back_populates="invites")
    projrole = db.relationship("ProjectRole")  # thay vì role

    def __repr__(self):
        return f"<TeamInvite id={self.id} email={self.email} status={self.status}>"
