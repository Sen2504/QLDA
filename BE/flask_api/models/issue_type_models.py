from flask_api.extensions import db

class IssueType(db.Model):
    __tablename__ = "issue_type"
    id = db.Column("ID_TYPE", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME", db.String(100), nullable=False)

    issues = db.relationship("Issue", back_populates="type")

    def __repr__(self):
        return f"<IssueType id={self.id} name={self.name}>"