from flask_api.extensions import db

class ProjectRole(db.Model):
    __tablename__ = "projectrole"
    id = db.Column("ID_PROJROLE", db.Integer, primary_key=True, autoincrement=True)
    role_id = db.Column("ID_ROLE", db.Integer, db.ForeignKey("role.ID_ROLE"), nullable=False)
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT"), nullable=False)

    role = db.relationship("Role", back_populates="project_roles")
    permissions = db.relationship("Permission", back_populates="projrole")
    teams = db.relationship("Team", back_populates="projrole")
    project = db.relationship("Project", back_populates="project_roles") 
    def __repr__(self):
        return f"<ProjectRole id={self.id} role_id={self.role_id}>"