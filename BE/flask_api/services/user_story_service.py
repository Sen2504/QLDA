import os
import json
import shutil
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
    # ====================== INTERNAL HELPERS ======================
    @staticmethod
    def _story_folder(story_id: int) -> str:
        return os.path.join(UPLOAD_FOLDER, str(story_id))

    @staticmethod
    def _save_file(file, story_id: int):
        """Lưu file vào thư mục uploads/user_story/<story_id>/"""
        if not file:
            return None, None

        filename = secure_filename(file.filename)
        story_folder = UserStoryService._story_folder(story_id)
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
    def _list_files(story_id: int):
        """Trả về danh sách file trong thư mục user_story/<story_id>"""
        story_folder = UserStoryService._story_folder(story_id)
        if not os.path.exists(story_folder):
            return []
        return os.listdir(story_folder)

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

    # ====================== PUBLIC METHODS ======================
    @staticmethod
    def create(data, files=None):
        name = (data.get("Name_story") or "").strip()
        description = data.get("Description")
        expire_date = data.get("Expire_date")
        status_id = data.get("Status_id")
        project_id = data.get("Project_id")
        sprint_id = data.get("Sprint_id") or None

        complexities = UserStoryService._parse_json_field(data.get("complexities"), [])
        hashtags = UserStoryService._parse_json_field(data.get("hashtags"), [])

        # Validate
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
            evidence_file=None
        )
        db.session.add(new_story)
        db.session.flush()  # để có ID

        # Tạo sẵn folder (dù chưa có file)
        story_folder = UserStoryService._story_folder(new_story.id)
        os.makedirs(story_folder, exist_ok=True)
        new_story.evidence_file = story_folder

        # Lưu file nếu có
        if files:
            for file in files:
                _, error = UserStoryService._save_file(file, new_story.id)
                if error:
                    db.session.rollback()
                    return None, error

        # Thêm complexity points
        for comp in complexities:
            comp_name = (comp.get("name") or "").strip()
            comp_point = comp.get("point")
            if comp_name and comp_point is not None:
                db.session.add(ComplexityPoint(
                    name=comp_name,
                    point=comp_point,
                    user_story_id=new_story.id
                ))

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
            db.session.add(UserStoryHashtag(user_story_id=new_story.id, hashtag_id=hashtag.id))

        db.session.commit()
        return new_story, None

    @staticmethod
    def get_all():
        stories = UserStory.query.all()
        result = []
        for story in stories:
            story_data = {
                "id": story.id,
                "name": story.name,
                "description": story.description,
                "expire_date": story.expire_date,
                "status_id": story.status_id,
                "project_id": story.project_id,
                "sprint_id": story.sprint_id,
                # thay vì lưu path, trả ra list file
                "evidence_file": UserStoryService._list_files(story.id),
                # join relationship
                "complexity_points": [
                    {"id": c.id, "name": c.name, "point": c.point, "user_story_id": c.user_story_id}
                    for c in story.complexity_points
                ],
                "hashtags": [
                    {"hashtag": {"id": h.hashtag.id, "name": h.hashtag.name}}
                    for h in story.hashtags
                ],
            }
            result.append(story_data)
        return result

    @staticmethod
    def get_by_id(story_id):
        story = UserStory.query.get(story_id)
        if not story:
            return None
        story_data = {
            "id": story.id,
            "name": story.name,
            "description": story.description,
            "expire_date": story.expire_date,
            "status_id": story.status_id,
            "project_id": story.project_id,
            "sprint_id": story.sprint_id,
            "evidence_file": UserStoryService._list_files(story.id),  # list file
            "complexity_points": [
                {"id": c.id, "name": c.name, "point": c.point, "user_story_id": c.user_story_id}
                for c in story.complexity_points
            ],
            "hashtags": [
                {"hashtag": {"id": h.hashtag.id, "name": h.hashtag.name}}
                for h in story.hashtags
            ],
        }
        return story_data

    @staticmethod
    def update(story_id, data, new_files=None, keep_files=None):
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

            # Quản lý files
            story_folder = UserStoryService._story_folder(story.id)
            os.makedirs(story_folder, exist_ok=True)
            story.evidence_file = story_folder

            existing_files = set(os.listdir(story_folder)) if os.path.exists(story_folder) else set()
            keep_files = set(keep_files or [])

            # Xóa file không nằm trong keep_files
            for f in existing_files - keep_files:
                os.remove(os.path.join(story_folder, f))

            # Thêm file mới
            if new_files:
                for file in new_files:
                    _, error = UserStoryService._save_file(file, story.id)
                    if error:
                        db.session.rollback()
                        return None, error

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
