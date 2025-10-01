import os
import json
from datetime import date
from werkzeug.utils import secure_filename
from flask_api.extensions import db
from flask_api.models.user_story_models import UserStory
from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.models.hashtag_models import Hashtag
from flask_api.models.user_story_hashtag_models import UserStoryHashtag
from flask_api.models.workflow_status_models import WorkflowStatus

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "uploads", "user_story")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


class UserStoryService:
    @staticmethod
    def _save_file(file, story_id):
        """Lưu file vào thư mục uploads/user_story/<story_id>/"""
        if not file:
            return None, None

        filename = secure_filename(file.filename)
        story_folder = os.path.join(UPLOAD_FOLDER, str(story_id))
        os.makedirs(story_folder, exist_ok=True)

        file_path = os.path.join(story_folder, filename)

        # Check dung lượng
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return None, "File vượt quá 500MB."

        file.save(file_path)
        return file_path, None

    @staticmethod
    def _parse_json_field(field_value, default):
        """Parse string JSON thành object Python"""
        if not field_value:
            return default
        if isinstance(field_value, str):
            try:
                return json.loads(field_value)
            except json.JSONDecodeError:
                return default
        return field_value

    @staticmethod
    def create(data, file=None):
        name = (data.get("Name_story") or "").strip()
        description = data.get("Description")
        expire_date = data.get("Expire_date")
        status_id = data.get("Status_id")
        project_id = data.get("Project_id")
        sprint_id = data.get("Sprint_id") or None  # Nếu rỗng -> None

        # Parse complexities & hashtags từ JSON string
        complexities = UserStoryService._parse_json_field(data.get("complexities"), [])
        hashtags = UserStoryService._parse_json_field(data.get("hashtags"), [])

        # Validate cơ bản
        if not name:
            return None, "Tên User Story là bắt buộc."
        if not project_id:
            return None, "User Story phải thuộc một project."
        if not expire_date or expire_date < str(date.today()):
            return None, "Ngày hết hạn không hợp lệ."

        # Nếu không truyền trạng thái -> mặc định "New"
        if not status_id:
            default_status = WorkflowStatus.query.filter_by(name="New").first()
            if not default_status:
                return None, "Không tìm thấy trạng thái mặc định 'New'."
            status_id = default_status.id

        # Tạo user story
        new_story = UserStory(
            name=name,
            description=description,
            expire_date=expire_date,
            status_id=status_id,
            project_id=project_id,
            sprint_id=sprint_id,
            evidence_file=None  # ban đầu chưa có file
        )
        db.session.add(new_story)
        db.session.flush()  # có ID ngay

        # Lưu file nếu có
        if file:
            file_path, error = UserStoryService._save_file(file, new_story.id)
            if error:
                db.session.rollback()
                return None, error
            new_story.evidence_file = file_path

        # Thêm complexity points
        for comp in complexities:
            comp_name = (comp.get("name") or "").strip()
            comp_point = comp.get("point")
            if comp_name and comp_point is not None:
                new_comp = ComplexityPoint(
                    name=comp_name,
                    point=comp_point,
                    user_story_id=new_story.id
                )
                db.session.add(new_comp)

        # Thêm hashtags
        for tag in hashtags:
            tag_name = tag.strip() if isinstance(tag, str) else (tag.get("name") or "").strip()
            if not tag_name:
                continue
            hashtag = Hashtag.query.filter_by(name=tag_name).first()
            if not hashtag:
                hashtag = Hashtag(name=tag_name)
                db.session.add(hashtag)
                db.session.flush()
            link = UserStoryHashtag(user_story_id=new_story.id, hashtag_id=hashtag.id)
            db.session.add(link)

        db.session.commit()
        return new_story, None

    @staticmethod
    def get_all():
        return UserStory.query.all()

    @staticmethod
    def get_by_id(story_id):
        return UserStory.query.get(story_id)

    @staticmethod
    def update(story_id, data, file=None):
        story = UserStory.query.get(story_id)
        if not story:
            return None, "Không tìm thấy User Story."

        try:
            if "Name_story" in data:
                story.name = data["Name_story"].strip()
            if "Description" in data:
                story.description = data["Description"]
            if "Expire_date" in data:
                expire_date = data["Expire_date"]
                if expire_date < str(date.today()):
                    return None, "Ngày hết hạn không hợp lệ."
                story.expire_date = expire_date
            if "Status_id" in data:
                story.status_id = data["Status_id"]
            if "Sprint_id" in data:
                story.sprint_id = data.get("Sprint_id") or None

            # Cập nhật file nếu có
            if file:
                file_path, error = UserStoryService._save_file(file, story.id)
                if error:
                    db.session.rollback()
                    return None, error
                story.evidence_file = file_path

            db.session.commit()
            return story, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def delete(story_id):
        story = UserStory.query.get(story_id)
        if not story:
            return False, "Không tìm thấy User Story."
        try:
            db.session.delete(story)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)
