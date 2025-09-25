from flask_api.extensions import db

class Role(db.Model):
    __tablename__ = "role"
    id = db.Column("ID_ROLE", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME_ROLE", db.String(100), nullable=False)

    project_roles = db.relationship("ProjectRole", back_populates="role")

    def __repr__(self):
        return f"<Role id={self.id} name={self.name}>"