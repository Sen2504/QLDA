from flask_api.models.hashtag_models import Hashtag
from flask_api.extensions import db
from sqlalchemy import func

class HashtagService:
    @staticmethod
    def search(q: str, limit: int = 10):
        return (
            Hashtag.query.filter(Hashtag.name.ilike(f"%{q}%"))
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(name: str):
        name = name.strip()
        if not name:
            return None, "Invalid hashtag name."
        if Hashtag.query.filter_by(name=name).first():
            return None, "Hashtags already exist."
        hashtag = Hashtag(name=name)
        db.session.add(hashtag)
        db.session.commit()
        return hashtag, None

    @staticmethod
    def get_or_create(name: str):
        """Nếu hashtag tồn tại thì trả về, nếu không thì tạo mới."""
        name = (name or "").strip()
        if not name:
            return None, "Invalid hashtag name."

        hashtag = Hashtag.query.filter(func.lower(Hashtag.name) == name.lower()).first()
        if hashtag:
            return hashtag, None

        hashtag = Hashtag(name=name)
        db.session.add(hashtag)
        db.session.flush()  # để có id nhưng chưa commit (tránh commit sớm)
        return hashtag, None
