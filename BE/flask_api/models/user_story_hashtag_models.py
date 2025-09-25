from flask_api.extensions import db

class UserStoryHashtag(db.Model):
    __tablename__ = "user_stories_hashtag"
    user_story_id = db.Column("ID_USER_STORIES", db.Integer, db.ForeignKey("user_stories.ID_USER_STORIES"), primary_key=True)
    hashtag_id = db.Column("ID_HASTAG", db.Integer, db.ForeignKey("hashtag.ID_HASTAG"), primary_key=True)

    user_story = db.relationship("UserStory", back_populates="hashtags")
    hashtag = db.relationship("Hashtag", back_populates="user_stories")

    def __repr__(self):
        return f"<UserStoryHashtag user_story_id={self.user_story_id} hashtag_id={self.hashtag_id}>"