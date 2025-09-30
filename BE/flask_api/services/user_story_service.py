from datetime import date
import os
from flask_api.extensions import db
from flask_api.models.user_story_models import UserStory
from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.models.hashtag_models import Hashtag
from flask_api.models.user_story_hashtag_models import UserStoryHashtag
from flask_api.models.workflow_status_models import WorkflowStatus

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


class UserStoryService:
    @staticmethod
    def create(data):
        name = (data.get("Name_story") or "").strip()
        description = data.get("Description")
        expire_date = data.get("Expire_date")
        evidence_file = data.get("Evidence_file")
        status_id = data.get("Status_id")
        project_id = data.get("Project_id")
        sprint_id = data.get("Sprint_id")  # cho phép None

        complexities = data.get("complexities", [])
        hashtags = data.get("hashtags", [])

        # Validate dữ liệu cơ bản
        if not name:
            return None, "Tên User Story là bắt buộc."
        if not project_id:
            return None, "User Story phải thuộc một project."
        if not expire_date or expire_date < str(date.today()):
            return None, "Ngày hết hạn không hợp lệ."

        # Validate file evidence nếu có
        if evidence_file and os.path.exists(evidence_file):
            if os.path.getsize(evidence_file) > MAX_FILE_SIZE:
                return None, "File minh chứng vượt quá 100MB."

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
            evidence_file=evidence_file,
            status_id=status_id,
            project_id=project_id,
            sprint_id=sprint_id  # có thể null
        )
        db.session.add(new_story)
        db.session.flush()  # có ID ngay lập tức

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
        for tag_name in hashtags:
            tag_name = (tag_name or "").strip()
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
    def update(story_id, data):
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
            if "Evidence_file" in data:
                evidence_file = data["Evidence_file"]
                if evidence_file and os.path.exists(evidence_file):
                    if os.path.getsize(evidence_file) > MAX_FILE_SIZE:
                        return None, "File minh chứng vượt quá 100MB."
                story.evidence_file = evidence_file
            if "Status_id" in data:
                story.status_id = data["Status_id"]
            if "Sprint_id" in data:
                story.sprint_id = data["Sprint_id"]

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
