from flask_api.extensions import db

class Team(db.Model):
    __tablename__ = "team"
    id = db.Column("ID_TEAM", db.Integer, primary_key=True, autoincrement=True)
    projrole_id = db.Column("ID_PROJROLE", db.Integer, db.ForeignKey("projectrole.ID_PROJROLE", ondelete="CASCADE"), nullable=False)
    user_id = db.Column("ID_USER", db.Integer, db.ForeignKey("users.ID_USER"), nullable=False)

    user = db.relationship("User", back_populates="teams")
    projrole = db.relationship("ProjectRole", back_populates="teams")
    
    phan_cong = db.relationship("PhanCong", back_populates="team")
    issues_resolved = db.relationship("IssueResolve", back_populates="team", cascade="all, delete-orphan")
    task_comments = db.relationship("TaskComment", back_populates="team")
    issue_comments = db.relationship("IssueComment", back_populates="team")

    def __repr__(self):
        return f"<Team id={self.id} user_id={self.user_id} projrole_id={self.projrole_id}>"