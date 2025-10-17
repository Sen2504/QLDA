from datetime import datetime
from flask_api.extensions import db

class IssueComment(db.Model):
    __tablename__ = "issue_comment"

    id = db.Column("ID_COMMENT", db.Integer, primary_key=True, autoincrement=True)
    issue_id = db.Column("ID_ISSUE", db.Integer, db.ForeignKey("issues.ID_ISSUE", ondelete="CASCADE"), nullable=False)
    user_id = db.Column("ID_USER", db.Integer, db.ForeignKey("users.ID_USER", ondelete="SET NULL"), nullable=True)
    team_id = db.Column("ID_TEAM", db.Integer, db.ForeignKey("team.ID_TEAM", ondelete="SET NULL"), nullable=True)
    content = db.Column("CONTENT", db.Text, nullable=False)
    created_at = db.Column("CREATED_AT", db.DateTime, default=datetime.utcnow)

    # ---- Relationships ----
    issue = db.relationship("Issue", back_populates="comments")
    user = db.relationship("User", back_populates="issue_comments")
    team = db.relationship("Team", back_populates="issue_comments")
    
    def __repr__(self):
        return f"<IssueComment id={self.id} issue_id={self.issue_id} user_id={self.user_id}>"
