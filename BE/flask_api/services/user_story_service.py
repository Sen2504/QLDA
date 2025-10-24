import os
import json
from datetime import date
from werkzeug.utils import secure_filename
from flask_api.extensions import db
from flask_api.models.user_story_models import UserStory
from flask_api.models.task_models import Task
from flask_api.models.phan_cong_models import PhanCong
from flask_api.models.team_models import Team
from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.models.hashtag_models import Hashtag
from flask_api.models.user_story_hashtag_models import UserStoryHashtag
from flask_api.models.workflow_status_models import WorkflowStatus
from flask_api.models.task_status_models import TaskStatus
from flask_api.services.hashtag_service import HashtagService
from flask import send_from_directory

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
            return None, "File over 500MB."

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
        if not field_value:
            return default
        if isinstance(field_value, str):
            try:
                return json.loads(field_value)
            except json.JSONDecodeError:
                return [x.strip() for x in field_value.split(",") if x.strip()]
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
            return None, "User Story name is required."
        if not project_id:
            return None, "User Story must belong to a project."
        if not expire_date or expire_date < str(date.today()):
            return None, "Invalid expiration date."
        
        # Kiểm tra trùng tên trong cùng project
        existing_story = UserStory.query.filter(
            db.func.lower(UserStory.name) == name.lower(),
            UserStory.project_id == project_id
        ).first()
        if existing_story:
            return None, "The name User Story already exists in this project."

        # Nếu không truyền trạng thái -> mặc định "New"
        if not status_id:
            default_status = WorkflowStatus.query.filter_by(name="New").first()
            if not default_status:
                return None, "Default status 'New' not found."
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
        # new_story.evidence_file = story_folder

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

            hashtag, error = HashtagService.get_or_create(tag_name)
            if error:
                db.session.rollback()
                return None, error

            db.session.add(UserStoryHashtag(user_story_id=new_story.id, hashtag_id=hashtag.id))

        try:
            db.session.commit()
            return new_story, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def get_all():
        stories = UserStory.query.all()
        result = []
        for story in stories:
            complexities = [
                {"id": c.id, "name": c.name, "point": c.point, "user_story_id": c.user_story_id}
                for c in story.complexity_points
            ]

            # Tính tổng
            total_points = sum(c.point or 0 for c in story.complexity_points)

            story_data = {
                "id": story.id,
                "name": story.name,
                "description": story.description,
                "expire_date": story.expire_date,
                "status_id": story.status_id,
                "project_id": story.project_id,
                "sprint_id": story.sprint_id,
                "evidence_file": UserStoryService._list_files(story.id),
                "complexity_points": complexities,
                "total_points": total_points,  # đưa ra FE
                "hashtags": [
                    {"hashtag": {"id": h.hashtag.id, "name": h.hashtag.name}}
                    for h in story.hashtags
                ],
            }
            result.append(story_data)
        return result

    @staticmethod
    def get_by_project_involved(project_id: int, user_id: int):
        """Return user stories in a project where the given user is assigned to any task."""
        q = (
            UserStory.query
            .join(Task, Task.user_story_id == UserStory.id)
            .join(PhanCong, PhanCong.task_id == Task.id)
            .join(Team, Team.id == PhanCong.team_id)
            .filter(UserStory.project_id == project_id, Team.user_id == user_id)
            .distinct(UserStory.id)
        )
        stories = q.all()
        result = []
        for story in stories:
            complexities = [
                {"id": c.id, "name": c.name, "point": c.point, "user_story_id": c.user_story_id}
                for c in story.complexity_points
            ]
            total_points = sum(c["point"] if isinstance(c, dict) else getattr(c, "point", 0) for c in complexities)
            story_data = {
                "id": story.id,
                "name": story.name,
                "description": story.description,
                "expire_date": story.expire_date,
                "status_id": story.status_id,
                "project_id": story.project_id,
                "sprint_id": story.sprint_id,
                "evidence_file": UserStoryService._list_files(story.id),
                "complexity_points": complexities,
                "total_points": total_points,
                "hashtags": [
                    {"hashtag": {"id": h.hashtag.id, "name": h.hashtag.name}}
                    for h in story.hashtags
                ],
            }
            result.append(story_data)
        return result

    @staticmethod
    def get_by_id(story_id):
        from sqlalchemy.orm import joinedload
        
        story = UserStory.query.options(
            joinedload(UserStory.sprint)
        ).get(story_id)
        
        if not story:
            return None

        complexities = [
            {"id": c.id, "name": c.name, "point": c.point, "user_story_id": c.user_story_id}
            for c in story.complexity_points
        ]
        total_points = sum(c["point"] or 0 for c in complexities)

        # --- Parse evidence_file ---
        evidence_files = []
        if story.evidence_file:
            # Nếu DB lưu chuỗi ['a','b'] thì chuyển thành list thật
            if isinstance(story.evidence_file, str):
                try:
                    import ast
                    parsed = ast.literal_eval(story.evidence_file)
                    if isinstance(parsed, list):
                        evidence_files = parsed
                    else:
                        evidence_files = []
                except Exception:
                    evidence_files = []
            elif isinstance(story.evidence_file, list):
                evidence_files = story.evidence_file

        # Nếu DB không có danh sách, đọc trực tiếp trong thư mục
        if not evidence_files:
            evidence_files = UserStoryService._list_files(story.id)

        story_data = {
            "id": story.id,
            "name": story.name,
            "description": story.description,
            "expire_date": story.expire_date,
            "status_id": story.status_id,
            "project_id": story.project_id,
            "sprint_id": story.sprint_id,
            "evidence_file": evidence_files,
            "complexity_points": complexities,
            "total_points": total_points,
            "hashtags": [
                {"hashtag": {"id": h.hashtag.id, "name": h.hashtag.name}}
                for h in story.hashtags
            ],
        }
        return story_data

    @staticmethod
    def update(story_id, data, new_files=None, deleted_files=None):
        story = UserStory.query.get(story_id)
        if not story:
            return None, "User Story not found."

        try:
            # ==== Validate & update name ====
            if "Name_story" in data:
                new_name = (data["Name_story"] or "").strip()
                if not new_name:
                    return None, "User Story name is required."

                existing_story = UserStory.query.filter(
                    db.func.lower(UserStory.name) == new_name.lower(),
                    UserStory.project_id == story.project_id,
                    UserStory.id != story.id
                ).first()
                if existing_story:
                    return None, "The name User Story already exists in this project."

                story.name = new_name

            # ==== Update description ====
            if "Description" in data:
                story.description = data["Description"]

            # ==== Update expire_date ====
            if "Expire_date" in data:
                expire_date = data["Expire_date"]
                if expire_date < str(date.today()):
                    return None, "Invalid expiration date."
                story.expire_date = expire_date

            # ==== Update status ====
            if "Status_id" in data:
                new_status_id = data["Status_id"]
                # Prevent manual set to Done unless all tasks are Done
                try:
                    done_flow = WorkflowStatus.query.filter(db.func.lower(WorkflowStatus.name) == "done").first()
                except Exception:
                    done_flow = None
                if done_flow and int(new_status_id) == int(done_flow.id):
                    # Check all tasks under this story are Done
                    tasks = Task.query.filter_by(user_story_id=story.id).all()
                    if tasks:
                        done_task_status = TaskStatus.query.filter(db.func.lower(TaskStatus.name_status) == "done").first()
                        all_done = done_task_status and all(
                            (t.status_id == done_task_status.id) or (getattr(t, "status", None) and str(t.status).strip().lower() == "done")
                            for t in tasks
                        )
                        if not all_done:
                            return None, "Cannot set User Story to Done manually. All tasks must be Done."
                story.status_id = new_status_id

            # ==== Update sprint ====
            if "Sprint_id" in data:
                story.sprint_id = data.get("Sprint_id") or None

            # ==== Update complexities ====
            if "complexities" in data:
                complexities = UserStoryService._parse_json_field(data["complexities"], [])
                for comp in complexities:
                    comp_name = (comp.get("name") or "").strip()
                    comp_point = comp.get("point")
                    if not comp_name:
                        continue

                    existing = ComplexityPoint.query.filter_by(
                        user_story_id=story.id, name=comp_name
                    ).first()
                    if existing:
                        existing.point = comp_point
                    else:
                        db.session.add(ComplexityPoint(
                            name=comp_name,
                            point=comp_point,
                            user_story_id=story.id
                        ))

            # ==== Update hashtags ====
            if "hashtags" in data:
                hashtags = UserStoryService._parse_json_field(data["hashtags"], [])
                UserStoryHashtag.query.filter_by(user_story_id=story.id).delete()
                for tag in hashtags:
                    tag_name = tag.strip() if isinstance(tag, str) else (tag.get("name") or "").strip()
                    if not tag_name:
                        continue
                    hashtag, error = HashtagService.get_or_create(tag_name)
                    if error:
                        db.session.rollback()
                        return None, error
                    db.session.add(UserStoryHashtag(user_story_id=story.id, hashtag_id=hashtag.id))

            # ==== Quản lý files ====
            story_folder = UserStoryService._story_folder(story.id)
            os.makedirs(story_folder, exist_ok=True)

            # 1️⃣ Xóa file bị đánh dấu xoá (FE gửi deleted_files)
            if deleted_files:
                deleted_list = UserStoryService._parse_json_field(deleted_files, [])
                for filename in deleted_list:
                    path = os.path.join(story_folder, filename)
                    if os.path.exists(path):
                        os.remove(path)

            # 2️⃣ Thêm file mới (FE gửi formData 'files')
            if new_files:
                for file in new_files:
                    if file and file.filename:
                        _, error = UserStoryService._save_file(file, story.id)
                        if error:
                            db.session.rollback()
                            return None, error

            # 3️⃣ Cập nhật danh sách file hiện có vào DB
            current_files = [
                f for f in os.listdir(story_folder)
                if os.path.isfile(os.path.join(story_folder, f))
            ]
            story.evidence_file = json.dumps(current_files)

            # ==== Commit ====
            db.session.commit()
            return story, None

        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def delete(story_id):
        story = UserStory.query.get(story_id)
        if not story:
            return False, "User Story not found."
        try:
            db.session.delete(story)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)
        
    @staticmethod
    def get_by_project(project_id):
        return UserStory.query.filter_by(project_id=project_id).all()

