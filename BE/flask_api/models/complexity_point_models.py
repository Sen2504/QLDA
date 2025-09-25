from flask_api.extensions import db

class ComplexityPoint(db.Model):
    __tablename__ = "complexity_point"
    id = db.Column("ID_COMPLEXITY", db.Integer, primary_key=True, autoincrement=True)
    user_story_id = db.Column("ID_USER_STORIES", db.Integer, db.ForeignKey("user_stories.ID_USER_STORIES"), nullable=False)
    name = db.Column("NAME", db.String(100), nullable=False)
    point = db.Column("POINT", db.Float, nullable=False)

    user_story = db.relationship("UserStory", back_populates="complexity_points")

    def __repr__(self):
        return f"<ComplexityPoint id={self.id} user_story_id={self.user_story_id} point={self.point}>"
