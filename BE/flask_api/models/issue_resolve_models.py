from flask_api.extensions import db

class IssueResolve(db.Model):
    __tablename__ = "issue_resolve"

    id = db.Column("ID_RESOLVE", db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(
        db.Integer,
        db.ForeignKey("team.ID_TEAM", ondelete="SET NULL"),
        nullable=True
    )
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.ID_ISSUE", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    team = db.relationship("Team", back_populates="issues_resolved")
    issue = db.relationship("Issue", back_populates="issues_resolved")

    def __repr__(self):
        return f"<IssueResolve id={self.id} team_id={self.team_id} issue_id={self.issue_id}>"
