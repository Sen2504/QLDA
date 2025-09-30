# file: flask_api/services/team_invite_service.py
from flask_api.extensions import db
from flask_api.models.team_invite_models import TeamInvite
from flask_api.models.user_models import User
from flask_api.models.team_models import Team
from flask_api.models.project_role_models import ProjectRole

class TeamInviteService:

    @staticmethod
    def create_invite(project_id, role_id, email):
        email = email.strip().lower()

        invite = TeamInvite(
            project_id=project_id,
            role_id=role_id,
            email=email,
            status="pending"
        )
        db.session.add(invite)
        db.session.commit()
        return invite, None

    @staticmethod
    def get_invites_by_project(project_id):
        return TeamInvite.query.filter_by(project_id=project_id).all()

    @staticmethod
    def accept_invite(invite_id, user_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite or invite.status != "pending":
            return None, "Lời mời không hợp lệ."

        # Kiểm tra ProjectRole có tồn tại
        proj_role = ProjectRole.query.filter_by(project_id=invite.project_id, role_id=invite.role_id).first()
        if not proj_role:
            return None, "Vai trò chưa tồn tại trong project."

        # Tạo Team
        new_team = Team(user_id=user_id, projrole_id=proj_role.id)
        db.session.add(new_team)

        # Update invite
        invite.status = "accepted"
        db.session.commit()
        return new_team, None

    @staticmethod
    def reject_invite(invite_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite or invite.status != "pending":
            return False, "Lời mời không hợp lệ."

        invite.status = "rejected"
        db.session.commit()
        return True, None
