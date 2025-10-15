# file: services/team_service.py
from flask_api.extensions import db
from flask_api.models.team_models import Team
from flask_api.models.user_models import User
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.role_models import Role
from flask_api.models.team_invite_models import TeamInvite
from flask_api.models.task_models import Task
from flask_api.models.phan_cong_models import PhanCong

class TeamService:
    # @staticmethod
    # def invite_user(project_id, email, role_id):
    #     """
    #     Gửi lời mời user vào project bằng email + role.
    #     """
    #     email = email.strip().lower()

    #     proj_role = ProjectRole.query.filter_by(project_id=project_id, role_id=role_id).first()
    #     if not proj_role:
    #         return None, "Vai trò này chưa được khởi tạo trong project."

    #     # Chặn mọi invite trừ khi status = rejected
    #     existing_invite = TeamInvite.query.filter_by(
    #         project_id=project_id, role_id=role_id, email=email
    #     ).first()
    #     if existing_invite and existing_invite.status != "rejected":
    #         return None, "Người dùng này đã được mời hoặc đã tham gia project."

    #     # Check nếu user đã join project với role này
    #     user = User.query.filter_by(email=email).first()
    #     if user:
    #         exists = Team.query.filter_by(user_id=user.id, projrole_id=proj_role.id).first()
    #         if exists:
    #             return None, "User đã tham gia project với vai trò này."

    #     # Tạo invite mới
    #     invite = TeamInvite(
    #         project_id=project_id,
    #         role_id=role_id,
    #         email=email,
    #         status="pending"
    #     )
    #     db.session.add(invite)
    #     db.session.commit()
    #     return invite, None


    @staticmethod
    def get_team_by_project(project_id):
        """
        Lấy danh sách thành viên chính thức của project (đã accept).
        """
        team_members = (
            db.session.query(
                Team.id,
                Team.user_id,
                User.name.label("user_name"),
                User.email.label("user_email"),
                ProjectRole.name.label("role_name"),
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
                "user_name": row.user_name,
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
                ProjectRole.name.label("role_name"),
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
    def remove_member(project_id, user_id, current_user_id, force=False):
        """
        Chỉ Project Owner mới được xóa member khác.
        Owner không thể tự xóa mình hoặc xóa Owner khác.
        Khi xóa thành viên thì đồng thời xóa luôn các invite liên quan.
        
        Args:
            force (bool): Nếu True, bỏ qua cảnh báo task và xóa luôn (bao gồm xóa phân công).
        """
        # Kiểm tra current_user có phải Owner không
        owner_projrole = (
            db.session.query(ProjectRole)
            .join(Role, ProjectRole.role_id == Role.id)
            .join(Team, Team.projrole_id == ProjectRole.id)
            .filter(
                ProjectRole.project_id == project_id,
                Role.name == "Project Owner",
                Team.user_id == current_user_id
            )
            .first()
        )
        if not owner_projrole:
            return False, "You do not have the right to delete members."

        # Nếu user muốn xóa chính mình
        if user_id == current_user_id:
            return False, "Owner cannot delete himself. Use the project archive function."

        # Kiểm tra role của user bị xóa
        team_member = (
            db.session.query(Team, ProjectRole, User)
            .join(ProjectRole, Team.projrole_id == ProjectRole.id)
            .outerjoin(Role, ProjectRole.role_id == Role.id)
            .join(User, Team.user_id == User.id)
            .filter(ProjectRole.project_id == project_id, Team.user_id == user_id)
            .first()
        )
        if not team_member:
            return False, "No members found in the project."

        team, proj_role, user = team_member
        
        # Kiểm tra nếu là Owner (dựa vào global role hoặc project role name)
        global_role = Role.query.get(proj_role.role_id) if proj_role.role_id else None
        role_name = (global_role.name if global_role else None) or proj_role.name
        
        if role_name == "Project Owner":
            return False, "Cannot delete another Owner."

        # Kiểm tra user có task đang phân công không
        assigned_tasks = (
            db.session.query(PhanCong, Task)
            .join(Task, PhanCong.task_id == Task.id)
            .filter(PhanCong.team_id == team.id)
            .all()
        )
        
        if assigned_tasks and not force:
            # Trả về danh sách task để frontend hiển thị cảnh báo
            task_list = [
                {
                    "id": task.id,
                    "name": task.name,
                    "description": task.description
                }
                for _, task in assigned_tasks
            ]
            return False, {
                "message": "This member is assigned to perform the following tasks:",
                "tasks": task_list,
                "require_confirmation": True
            }

        # Xóa các phân công task trước
        if assigned_tasks:
            for phan_cong, _ in assigned_tasks:
                db.session.delete(phan_cong)

        # Xóa team member
        db.session.delete(team)

        # Xóa luôn tất cả invite liên quan đến user trong project này
        invites = TeamInvite.query.filter_by(project_id=project_id, email=user.email).all()
        for inv in invites:
            db.session.delete(inv)

        db.session.commit()
        return True, None
    
    @staticmethod
    def get_team_summary(project_id):
        members = TeamService.get_team_by_project(project_id)
        pending = TeamService.get_pending_invites_by_project(project_id)
        return {
            "members": members,
            "pending_invites": pending
        }
