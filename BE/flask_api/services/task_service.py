from sqlalchemy.orm import joinedload

from flask_api.extensions import db
from flask_api.models.task_models import Task
from flask_api.models.task_status_models import TaskStatus
from flask_api.models.user_story_models import UserStory
from flask_api.models.team_models import Team
from flask_api.models.phan_cong_models import PhanCong
from flask_api.models.task_comment_models import TaskComment


class TaskService:
    @staticmethod
    def get_all():
        return Task.query.all()

    @staticmethod
    def get_by_id(task_id):
        return (
            Task.query.options(
                joinedload(Task.user_story),
                joinedload(Task.status),
                joinedload(Task.phan_cong)
                .joinedload(PhanCong.team)
                .joinedload(Team.user),
                joinedload(Task.phan_cong)
                .joinedload(PhanCong.team)
                .joinedload(Team.projrole),
                joinedload(Task.comments)
                .joinedload(TaskComment.user),
                joinedload(Task.comments)
                .joinedload(TaskComment.team)
                .joinedload(Team.user),
                joinedload(Task.comments)
                .joinedload(TaskComment.team)
                .joinedload(Team.projrole),
            )
            .filter(Task.id == task_id)
            .first()
        )

    @staticmethod
    def get_by_user_story(user_story_id):
        return Task.query.filter_by(user_story_id=user_story_id).all()

    @staticmethod
    def get_by_project(project_id):
        return (
            Task.query.join(UserStory, Task.user_story_id == UserStory.id)
            .filter(UserStory.project_id == project_id)
            .all()
        )

    @staticmethod
    def get_by_user(user_id):
        return (
            Task.query.join(PhanCong, Task.id == PhanCong.task_id)
            .join(Team, PhanCong.team_id == Team.id)
            .filter(Team.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_by_project_and_user(project_id, user_id):
        return (
            Task.query
            .join(UserStory, Task.user_story_id == UserStory.id)
            .join(PhanCong, Task.id == PhanCong.task_id)
            .join(Team, PhanCong.team_id == Team.id)
            .filter(UserStory.project_id == project_id, Team.user_id == user_id)
            .all()
        )

    @staticmethod
    def create(data):
        name = (data.get("name") or "").strip()
        description = (data.get("description") or "").strip()
        user_story_id = data.get("user_story_id")
        status_id = data.get("status_id")
        team_id = data.get("team_id")
        team_ids = data.get("team_ids") or []
        due_date = data.get("due_date")

        if not name:
            return None, "Ten task la bat buoc."
        if not description:
            return None, "Mo ta task la bat buoc."

        user_story = UserStory.query.get(user_story_id)
        if not user_story:
            return None, "Khong tim thay User Story."

        status = TaskStatus.query.get(status_id)
        if not status:
            return None, "Khong tim thay trang thai Task."

        # Nếu có truyền nhiều team_ids thì validate tất cả
        candidate_team_ids = team_ids if team_ids else ([team_id] if team_id else [])
        if not candidate_team_ids:
            return None, "Can chon it nhat 1 thanh vien team."

        teams = Team.query.filter(Team.id.in_(candidate_team_ids)).all()
        found_ids = {t.id for t in teams}
        missing = [tid for tid in candidate_team_ids if tid not in found_ids]
        if missing:
            return None, f"Khong tim thay thanh vien team: {missing}"

        # Validate cùng project
        for t in teams:
            if not t.projrole or t.projrole.project_id != user_story.project_id:
                return None, "Co thanh vien khong thuoc project cua User Story."

        try:
            new_task = Task(
                name=name,
                description=description,
                user_story_id=user_story.id,
                status_id=status.id,
                due_date=due_date,
            )
            db.session.add(new_task)
            db.session.flush()

            for t in teams:
                assignment = PhanCong(team_id=t.id, task_id=new_task.id)
                db.session.add(assignment)
            db.session.commit()
            refreshed = TaskService.get_by_id(new_task.id)
            return refreshed or new_task, None
        except Exception:
            db.session.rollback()
            return None, "Khong the tao task."

    @staticmethod
    def update(task_id, data):
        task = Task.query.get(task_id)
        if not task:
            return None, "Khong tim thay task."

        name = data.get("name")
        description = data.get("description")
        status_id = data.get("status_id")
        user_story_id = data.get("user_story_id")
        team_id = data.get("team_id")
        team_ids = data.get("team_ids") or []
        update_due_date = "due_date" in data
        due_date = data.get("due_date")

        try:
            if name is not None:
                name = name.strip()
                if not name:
                    return None, "Ten task la bat buoc."
                task.name = name

            if description is not None:
                description = description.strip()
                if not description:
                    return None, "Mo ta task la bat buoc."
                task.description = description

            target_story = task.user_story
            if user_story_id is not None and user_story_id != task.user_story_id:
                new_story = UserStory.query.get(user_story_id)
                if not new_story:
                    return None, "Khong tim thay User Story."
                target_story = new_story
                task.user_story_id = new_story.id

            if status_id is not None:
                status = TaskStatus.query.get(status_id)
                if not status:
                    return None, "Khong tim thay trang thai Task."
                task.status_id = status.id

            if update_due_date:
                task.due_date = due_date

            # Cập nhật 1 người cũ (team_id) hoặc nhiều người (team_ids)
            if team_ids:
                teams = Team.query.filter(Team.id.in_(team_ids)).all()
                found = {t.id for t in teams}
                missing = [tid for tid in team_ids if tid not in found]
                if missing:
                    return None, f"Khong tim thay thanh vien team: {missing}"
                for t in teams:
                    if not t.projrole or t.projrole.project_id != target_story.project_id:
                        return None, "Co thanh vien khong thuoc project cua User Story."
                # Xóa assignments cũ rồi tạo lại
                for a in list(task.phan_cong or []):
                    db.session.delete(a)
                for t in teams:
                    db.session.add(PhanCong(team_id=t.id, task_id=task.id))
            elif team_id is not None:
                team = Team.query.get(team_id)
                if not team:
                    return None, "Khong tim thay thanh vien team."
                if not team.projrole or team.projrole.project_id != target_story.project_id:
                    return None, "Thanh vien khong thuoc project cua User Story."
                assignment = PhanCong.query.filter_by(task_id=task.id).first()
                if assignment:
                    assignment.team_id = team.id
                else:
                    db.session.add(PhanCong(team_id=team.id, task_id=task.id))

            db.session.commit()
            refreshed = TaskService.get_by_id(task.id)
            return refreshed or task, None
        except Exception:
            db.session.rollback()
            return None, "Khong the cap nhat task."

    @staticmethod
    def delete(task_id):
        task = Task.query.get(task_id)
        if not task:
            return False, "Khong tim thay task."

        try:
            for assignment in list(task.phan_cong or []):
                db.session.delete(assignment)
            db.session.delete(task)
            db.session.commit()
            return True, None
        except Exception:
            db.session.rollback()
            return False, "Khong the xoa task."