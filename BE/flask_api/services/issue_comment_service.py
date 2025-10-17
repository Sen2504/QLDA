from flask_api.extensions import db
from flask_api.models.issue_comment_models import IssueComment
from flask_api.models.issue_models import Issue
from flask_api.models.team_models import Team


class IssueCommentService:
    @staticmethod
    def list_by_issue(issue_id):
        """Lấy danh sách bình luận của issue, sắp theo thời gian tăng dần"""
        return (
            IssueComment.query.filter_by(issue_id=issue_id)
            .order_by(IssueComment.created_at.asc())
            .all()
        )

    @staticmethod
    def create(issue_id, user_id, content, team_id=None):
        """Tạo bình luận mới cho issue"""
        content = (content or "").strip()
        if not content:
            return None, "Comment content is required."

        issue = Issue.query.get(issue_id)
        if not issue:
            return None, "Issue not found."

        team = None
        if team_id is not None:
            team = Team.query.get(team_id)
            if not team:
                return None, "No team members found."
            # kiểm tra team có thuộc cùng project với issue không
            if not team.projrole or team.projrole.project_id != issue.project_id:
                return None, "The member is not part of the issue's project."

        try:
            comment = IssueComment(
                issue_id=issue_id,
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
            return None, "Cannot create comment."

    @staticmethod
    def delete(issue_id, comment_id, user_id):
        """Xóa bình luận nếu user là người tạo"""
        comment = IssueComment.query.get(comment_id)
        if not comment:
            return False, "No comments found."

        if comment.issue_id != issue_id:
            return False, "Comments are not part of this issue."

        if comment.user_id != user_id:
            return False, "You do not have permission to delete this comment."

        try:
            db.session.delete(comment)
            db.session.commit()
            return True, None
        except Exception:
            db.session.rollback()
            return False, "Comments cannot be deleted."
