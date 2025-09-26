# file: services/team_service.py
from flask_api.extensions import db
from flask_api.models.team_models import Team
from flask_api.models.user_models import User
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.role_models import Role

class TeamService:
    @staticmethod
    def invite_user(project_id, email, role_id):
        """
        Mời user vào project bằng email + role.
        """
        user = User.query.filter_by(email=email.strip().lower()).first()
        if not user:
            return None, "Email này chưa đăng ký tài khoản trong hệ thống."

        proj_role = ProjectRole.query.filter_by(project_id=project_id, role_id=role_id).first()
        if not proj_role:
            return None, "Vai trò này chưa được khởi tạo trong project."

        exists = Team.query.filter_by(user_id=user.id, projrole_id=proj_role.id).first()
        if exists:
            return None, "User đã tham gia project với vai trò này."

        new_team_member = Team(
            user_id=user.id,
            projrole_id=proj_role.id
        )
        db.session.add(new_team_member)
        db.session.commit()
        return new_team_member, None

    @staticmethod
    def get_team_by_project(project_id):
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
    def remove_member(project_id, user_id):
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
