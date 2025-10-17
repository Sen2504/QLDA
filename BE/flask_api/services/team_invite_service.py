# file: flask_api/services/team_invite_service.py
from flask_api.extensions import db
from flask_api.models.team_invite_models import TeamInvite
from flask_api.models.user_models import User
from flask_api.models.team_models import Team
from flask_api.models.project_role_models import ProjectRole
from flask_api.utils.mail import send_email
from flask import current_app, url_for
class TeamInviteService:

    @staticmethod
    def create_invite(project_id, projrole_id, email):
        """
        Rule cập nhật:
        - Chỉ chặn khi đã có invite 'pending'.
        - 'accepted' mà user không còn trong Team -> chuyển 'removed' rồi mời lại.
        - 'rejected'/'removed' -> được mời lại (tạo invite mới).
        """
        email = (email or "").strip().lower()

        # 1) Kiểm tra ProjectRole hợp lệ (bằng projrole_id)
        proj_role = ProjectRole.query.filter_by(project_id=project_id, id=projrole_id).first()
        if not proj_role:
            return None, "This role has not been initialized in the project."

        project_name = proj_role.project.name
        role_name = proj_role.name  # lấy trực tiếp NAME_ROLE từ ProjectRole

        # 2) Kiểm tra user đã đăng ký chưa
        user = User.query.filter_by(email=email).first()
        if not user:
            register_url = f"{current_app.config.get('FRONTEND_URL')}/register?invite_project={project_id}&projrole={projrole_id}"
            html = f"""
                <p>You are invited to join the project <b>{project_name}</b>.</p>
                <p>Invited roles: <b>{role_name}</b>.</p>
                <p>Please <a href="{register_url}">register</a> to participate.</p>
            """
            send_email("Please register to participate in the project", [email], html)
            return None, "Email is not registered. Email has been sent inviting you to register an account."

        # 3) Nếu user đã ở trong project (bất kỳ role nào) -> không mời
        # Kiểm tra xem user có Team record nào với projrole thuộc cùng project không
        already_in_project = (
            db.session.query(Team)
            .join(ProjectRole, Team.projrole_id == ProjectRole.id)
            .filter(Team.user_id == user.id, ProjectRole.project_id == project_id)
            .first()
        )
        if already_in_project:
            return None, "User is already a member of the project."

        # 4) Kiểm tra các invite trước đó (theo project_id + email)
        existing_invites = TeamInvite.query.filter_by(
            project_id=project_id,
            email=email
        ).all()

        # 4a) Chặn nếu đang có pending
        if any(inv.status == "pending" for inv in existing_invites):
            return None, "A pending invitation already exists."

        # 4b) Không cần kiểm tra accepted/rejected/removed vì đã xóa khi accept/reject

        # 5) Tạo invite mới (pending)
        invite = TeamInvite(
            project_id=project_id,
            projrole_id=proj_role.id,  # 👈 lưu projrole_id
            email=email,
            status="pending"
        )
        db.session.add(invite)
        db.session.commit()

        # 6) Gửi email Accept/Reject cho user
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        invite_page = f"{frontend_url.rstrip('/')}/my-invites?invite={invite.id}"
        html = f"""
            <p>You are invited to join project <b>{project_name}</b> as a role <b>{role_name}</b>.</p>
            <p>Please visit the <a href="{invite_page}">My Invitations</a> page to accept or decline.</p>
        """
        send_email("Invitation to join the project", [email], html)

        return invite, None
    # ------------------- Lấy danh sách -------------------

    @staticmethod
    def get_invites_by_project(project_id):
        return TeamInvite.query.filter_by(project_id=project_id).all()

    @staticmethod
    def get_invites_for_user(email):
        """
        Lấy tất cả lời mời pending gửi tới email của user.
        """
        email = (email or "").strip().lower()
        return TeamInvite.query.filter_by(email=email, status="pending").all()

    # ------------------- Xử lý trạng thái -------------------

    @staticmethod
    def accept_invite(invite_id, user_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite or invite.status != "pending":
            return None, "Invitation is not valid."

        proj_role = ProjectRole.query.filter_by(
            project_id=invite.project_id, id=invite.projrole_id
        ).first()
        if not proj_role:
            return None, "The role does not exist in the project."

        # Tạo Team record
        new_team = Team(user_id=user_id, projrole_id=proj_role.id)
        db.session.add(new_team)

        # Xóa invite thay vì update status
        db.session.delete(invite)
        db.session.commit()
        return new_team, None

    @staticmethod
    def reject_invite(invite_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite or invite.status != "pending":
            return False, "Invitation is not valid."

        # Xóa invite thay vì update status
        db.session.delete(invite)
        db.session.commit()
        return True, None

    @staticmethod
    def revoke_invite(invite_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite:
            return False, "Invitation not found."
        if invite.status != "pending":
            return False, "Invitations that are in pending status can only be revoked."

        db.session.delete(invite)
        db.session.commit()
        return True, None
