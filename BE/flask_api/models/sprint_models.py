from flask_api.extensions import db

class Sprint(db.Model):
    __tablename__ = "sprints"
    id = db.Column("ID_SPRINT", db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT"), nullable=False)
    name = db.Column("NAME", db.String(100), nullable=False)
    deadline = db.Column("DEADLINE", db.Date, nullable=False)

    project = db.relationship("Project", back_populates="sprints")
    user_stories = db.relationship("UserStory", back_populates="sprint")

    def __repr__(self):
        return f"<Sprint id={self.id} name={self.name}>"