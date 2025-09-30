from flask_api.extensions import db
from flask_api.schemas.project_schemas import ProjectSchema

class Project(db.Model):
    __tablename__ = "project"
    id = db.Column("ID_PROJECT", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME_PROJECT", db.String(200), nullable=False)
    description = db.Column("DESCRIPTION", db.Text, nullable=False)
    status = db.Column("STATUS", db.String(50), default="active", nullable=False)

    sprints = db.relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    issues = db.relationship("Issue", back_populates="project", cascade="all, delete-orphan")
    user_stories = db.relationship("UserStory", back_populates="project", cascade="all, delete-orphan")
    project_roles = db.relationship("ProjectRole", back_populates="project", cascade="all, delete-orphan")
    invites = db.relationship("TeamInvite", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project id={self.id} name={self.name}>"