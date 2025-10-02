# file: services/team_service.py
from flask_api.extensions import db
from flask_api.models.team_models import Team
from flask_api.models.user_models import User
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.role_models import Role
from flask_api.models.team_invite_models import TeamInvite

class TeamService:
    @staticmethod
    def invite_user(project_id, email, role_id):
        """
        Gửi lời mời user vào project bằng email + role.
        """
        email = email.strip().lower()

        proj_role = ProjectRole.query.filter_by(project_id=project_id, role_id=role_id).first()
        if not proj_role:
            return None, "Vai trò này chưa được khởi tạo trong project."

        # Chặn mọi invite trừ khi status = rejected
        existing_invite = TeamInvite.query.filter_by(
            project_id=project_id, role_id=role_id, email=email
        ).first()
        if existing_invite and existing_invite.status != "rejected":
            return None, "Người dùng này đã được mời hoặc đã tham gia project."

        # Check nếu user đã join project với role này
        user = User.query.filter_by(email=email).first()
        if user:
            exists = Team.query.filter_by(user_id=user.id, projrole_id=proj_role.id).first()
            if exists:
                return None, "User đã tham gia project với vai trò này."

        # Tạo invite mới
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
    def get_team_by_project(project_id):
        """
        Lấy danh sách thành viên chính thức của project (đã accept).
        """
        team_members = (
            db.session.query(
                Team.id,
                Team.user_id,
                User.email.label("user_email"),
                Role.name.label("role_name"),
                Team.projrole_id
            )
            .join(ProjectRole, Team.projrole_id == ProjectRole.id)
            .join(User, Team.user_id == User.id)
            .join(Role, ProjectRole.role_id == Role.id)
            .filter(ProjectRole.project_id == project_id)
            .all()
        )

        results = []
        for row in team_members:
            results.append({
                "id": row.id,
                "user_id": row.user_id,
                "user_email": row.user_email,
                "role_name": row.role_name,
                "projrole_id": row.projrole_id,
            })
        return results

    @staticmethod
    def get_pending_invites_by_project(project_id):
        """
        Lấy danh sách invite chưa được accept trong project.
        """
        invites = (
            db.session.query(
                TeamInvite.id,
                TeamInvite.email,
                Role.name.label("role_name"),
                TeamInvite.status,
                TeamInvite.created_at
            )
            .join(Role, TeamInvite.role_id == Role.id)
            .filter(TeamInvite.project_id == project_id, TeamInvite.status == "pending")
            .all()
        )

        results = []
        for row in invites:
            results.append({
                "id": row.id,
                "email": row.email,
                "role_name": row.role_name,
                "status": row.status,
                "created_at": row.created_at.isoformat()
            })
        return results

    @staticmethod
    def remove_member(project_id, user_id):
        """
        Xóa thành viên chính thức khỏi project.
        """
        team_member = (
            db.session.query(Team)
            .join(ProjectRole, Team.projrole_id == ProjectRole.id)
            .filter(ProjectRole.project_id == project_id, Team.user_id == user_id)
            .first()
        )
        if not team_member:
            return False, "Không tìm thấy thành viên trong project."
        
        db.session.delete(team_member)
        db.session.commit()
        return True, None
