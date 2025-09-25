from flask_api.extensions import db

class Resource(db.Model):
    __tablename__ = "resource"
    id = db.Column("ID_RES", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME_RES", db.String(100), nullable=False)

    permissions = db.relationship("Permission", back_populates="resource")

    def __repr__(self):
        return f"<Resource id={self.id} name={self.name}>"