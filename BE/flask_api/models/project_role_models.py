from flask_api.extensions import db

class ProjectRole(db.Model):
    __tablename__ = "projectrole"
    id = db.Column("ID_PROJROLE", db.Integer, primary_key=True, autoincrement=True)
    role_id = db.Column("ID_ROLE", db.Integer, db.ForeignKey("role.ID_ROLE"), nullable=True)  # cho phép NULL nếu là custom
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT", ondelete="CASCADE"), nullable=False)

    name = db.Column("NAME_ROLE", db.String(100), nullable=False)

    # relationships
    role = db.relationship("Role", back_populates="project_roles")
    permissions = db.relationship(
        "Permission",
        back_populates="projrole",
        cascade="all, delete-orphan"
    )
    teams = db.relationship("Team", back_populates="projrole", cascade="all, delete-orphan")
    project = db.relationship("Project", back_populates="project_roles")


