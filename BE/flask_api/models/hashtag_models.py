from flask_api.extensions import db

class Hashtag(db.Model):
    __tablename__ = "hashtag"
    id = db.Column("ID_HASTAG", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME", db.String(100), nullable=False)

    tasks = db.relationship("TaskHashtag", back_populates="hashtag")
    user_stories = db.relationship("UserStoryHashtag", back_populates="hashtag")

    def __repr__(self):
        return f"<Hashtag id={self.id} name={self.name}>"