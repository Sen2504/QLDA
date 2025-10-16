from flask_api.extensions import db

class IssueResolve(db.Model):
    __tablename__ = "issue_resolve"

    id = db.Column("ID_RESOLVE", db.Integer, primary_key=True, autoincrement=True)

    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.ID_ISSUE", ondelete="CASCADE"),
        nullable=False
    )

    team_id = db.Column(
        db.Integer,
        db.ForeignKey("team.ID_TEAM", ondelete="SET NULL"),  # SET NULL khi xóa team
        nullable=True  # <-- GIỮ NGUYÊN để cho phép tạo issue chưa phân công
    )

    team = db.relationship("Team", back_populates="issues_resolved")
    issue = db.relationship("Issue", back_populates="issues_resolved")

    def __repr__(self):
        return f"<IssueResolve id={self.id} issue_id={self.issue_id} team_id={self.team_id}>"
