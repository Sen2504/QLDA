from flask_api.extensions import db

class User(db.Model):
    __tablename__ = "user"

    ID_user = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name_user = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(120), unique=True, nullable=False)
    Password = db.Column(db.String(200), nullable=False)
    Skills_set = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<User {self.Name_user}>"