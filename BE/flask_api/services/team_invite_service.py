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
    def create_invite(project_id, role_id, email):
        """
        Rule:
        - Chỉ mời user đã có trong hệ thống.
        - Không mời nếu user đã ở team (đúng role) hoặc đã có invite pending.
        - Chỉ cho phép mời lại khi invite trước đó là 'rejected'.
        - Nếu email chưa đăng ký: không tạo invite, chỉ gửi email mời đăng ký.
        """
        email = (email or "").strip().lower()

        # 1) Kiểm tra user đã đăng ký chưa
        user = User.query.filter_by(email=email).first()
        if not user:
            # Lấy tên project/role để đưa vào mail
            proj_role = ProjectRole.query.filter_by(project_id=project_id, role_id=role_id).first()
            if not proj_role:
                return None, "Vai trò này chưa được khởi tạo trong project."

            project_name = proj_role.project.name
            role_name = proj_role.role.name

            # Gửi email mời đăng ký
            register_url = f"{current_app.config.get('FRONTEND_URL')}/register?invite_project={project_id}&role={role_id}"
            html = f"""
                <p>Bạn được mời tham gia dự án <b>{project_name}</b>.</p>
                <p>Vai trò được mời: <b>{role_name}</b>.</p>
                <p>Vui lòng <a href="{register_url}">đăng ký tài khoản</a> để tham gia.</p>
            """
            send_email("Mời đăng ký tham gia dự án", [email], html)
            return None, "Email chưa đăng ký. Đã gửi email mời đăng ký tài khoản."

        # 2) Kiểm tra ProjectRole hợp lệ
        proj_role = ProjectRole.query.filter_by(project_id=project_id, role_id=role_id).first()
        if not proj_role:
            return None, "Vai trò này chưa được khởi tạo trong project."

        project_name = proj_role.project.name
        role_name = proj_role.role.name

        # 3) User đã là member chưa?
        already_in_team = Team.query.filter_by(user_id=user.id, projrole_id=proj_role.id).first()
        if already_in_team:
            return None, "User đã là thành viên của project."

        # 4) Kiểm tra các invite trước đó
        existing_invites = TeamInvite.query.filter_by(
            project_id=project_id,
            role_id=role_id,
            email=email
        ).all()

        if any(inv.status == "pending" for inv in existing_invites):
            return None, "Đã tồn tại một lời mời đang chờ xử lý."
        if any(inv.status == "accepted" for inv in existing_invites):
            return None, "User đã chấp nhận lời mời trước đó."

        # 5) Tạo invite mới
        invite = TeamInvite(
            project_id=project_id,
            role_id=role_id,
            email=email,
            status="pending"
        )
        db.session.add(invite)
        db.session.commit()

        # 6) Gửi email Accept/Reject cho user
        accept_url = url_for("team_invite.accept_invite", invite_id=invite.id, _external=True)
        reject_url = url_for("team_invite.reject_invite", invite_id=invite.id, _external=True)
        html = f"""
            <p>Bạn được mời tham gia dự án <b>{project_name}</b> với vai trò <b>{role_name}</b>.</p>
            <p>Chọn một trong hai hành động:</p>
            <ul>
                <li><a href="{accept_url}">Chấp nhận</a></li>
                <li><a href="{reject_url}">Từ chối</a></li>
            </ul>
        """
        send_email("Lời mời tham gia dự án", [email], html)

        return invite, None

    @staticmethod
    def get_invites_by_project(project_id):
        return TeamInvite.query.filter_by(project_id=project_id).all()

    @staticmethod
    def accept_invite(invite_id, user_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite or invite.status != "pending":
            return None, "Lời mời không hợp lệ."

        proj_role = ProjectRole.query.filter_by(
            project_id=invite.project_id, role_id=invite.role_id
        ).first()
        if not proj_role:
            return None, "Vai trò chưa tồn tại trong project."

        # Tạo Team record
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

    @staticmethod
    def revoke_invite(invite_id):
        invite = TeamInvite.query.get(invite_id)
        if not invite:
            return False, "Không tìm thấy lời mời."
        if invite.status != "pending":
            return False, "Chỉ có thể thu hồi lời mời đang ở trạng thái pending."

        db.session.delete(invite)
        db.session.commit()
        return True, None
    @staticmethod
    def get_invites_for_user(email):
        """
        Lấy tất cả lời mời pending gửi tới email của user.
        """
        email = (email or "").strip().lower()
        return TeamInvite.query.filter_by(email=email, status="pending").all()
      

