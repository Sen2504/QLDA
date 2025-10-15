from flask_api.extensions import db
from flask_api.models.task_comment_models import TaskComment
from flask_api.models.task_models import Task
from flask_api.models.team_models import Team


class TaskCommentService:
    @staticmethod
    def list_by_task(task_id):
        return (
            TaskComment.query.filter_by(task_id=task_id)
            .order_by(TaskComment.created_at.asc())
            .all()
        )

    @staticmethod
    def create(task_id, user_id, content, team_id=None):
        content = (content or "").strip()
        if not content:
            return None, "Content is required."

        task = Task.query.get(task_id)
        if not task:
            return None, "Can not found task."

        team = None
        if team_id is not None:
            team = Team.query.get(team_id)
            if not team:
                return None, "Can not found member in team."
            if not team.projrole or team.projrole.project_id != task.user_story.project_id:
                return None, "Member is not belong to this project."

        try:
            comment = TaskComment(
                task_id=task_id,
                user_id=user_id,
                team_id=team_id if team else None,
                content=content,
            )
            db.session.add(comment)
            db.session.commit()
            db.session.refresh(comment)
            return comment, None
        except Exception:
            db.session.rollback()
            return None, "Can not create comment."

    @staticmethod
    def delete(task_id, comment_id, user_id):
        comment = TaskComment.query.get(comment_id)
        if not comment:
            return False, "Can not found comment."

        if comment.task_id != task_id:
            return False, "Comment is not belong to this task."

        if comment.user_id != user_id:
            return False, "You can not delete this comment."

        try:
            db.session.delete(comment)
            db.session.commit()
            return True, None
        except Exception:
            db.session.rollback()
            return False, "Can not delete comment."
