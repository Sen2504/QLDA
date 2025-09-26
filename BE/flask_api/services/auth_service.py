# file: flask_api/services/auth_service.py
from datetime import datetime
from typing import Tuple, Optional

from email_validator import validate_email, EmailNotValidError

from flask_api.extensions import db
from flask_api.models.user_models import User
from flask_api.utils.tokens import generate_confirmation_token, confirm_token


class AuthService:
    @staticmethod
    def register(email: str, password: str) -> Tuple[Optional[User], Optional[str], Optional[str]]:
        """
        Tạo tài khoản mới:
        - Validate email format
        - Check trùng email
        - Hash mật khẩu
        - Tạo token xác nhận (trả về cho route tự build URL và gửi mail)

        Returns: (user|None, error|None, token|None)
        """
        email = (email or "").strip().lower()
        if not email or not password:
            return None, "email and password are required", None

        try:
            validate_email(email)  # raise EmailNotValidError nếu sai
        except EmailNotValidError as e:
            return None, str(e), None

        if User.query.filter_by(email=email).first():
            return None, "email already registered", None

        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = generate_confirmation_token(user.email)
        return user, None, token

    @staticmethod
    def confirm_email_by_token(token: str) -> Tuple[bool, Optional[str]]:
        """
        Xác nhận email từ token:
        - Giải mã token -> email
        - Đánh dấu user.confirmed
        """
        if not token:
            return False, "token is required"

        email = confirm_token(token)
        if not email:
            return False, "invalid or expired token"

        user = User.query.filter_by(email=email).first()
        if not user:
            return False, "user not found"

        if user.confirmed:
            # Đã confirm rồi cũng coi như thành công (route có thể trả message riêng)
            return True, None

        user.confirmed = True
        user.confirmed_at = datetime.utcnow()
        db.session.commit()
        return True, None

    @staticmethod
    def generate_resend_token(user: User) -> Tuple[Optional[str], Optional[str]]:
        """
        Sinh token resend cho user chưa xác nhận.
        Returns: (token|None, error|None)
        """
        if not user:
            return None, "user not found"
        if user.confirmed:
            return None, "already confirmed"
        token = generate_confirmation_token(user.email)
        return token, None

    @staticmethod
    def verify_credentials(email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        """
        Kiểm tra đăng nhập:
        - Tìm user theo email
        - Check password hash
        - Check confirmed
        Returns: (user|None, error|None)
        """
        email = (email or "").strip().lower()
        if not email or not password:
            return None, "email and password are required"

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return None, "invalid credentials"

        if not user.confirmed:
            return None, "email not confirmed"

        return user, None
    @staticmethod
    def generate_reset_token(email: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Sinh token reset password từ email
        """
        if not email:
            return None, "email is required"
        user = User.query.filter_by(email=email).first()
        if not user:
            return None, "user not found"

        token = generate_confirmation_token(user.email)
        return token, None

    @staticmethod
    def reset_password(token: str, new_password: str):
        email = confirm_token(token)
        if not email:
            return False, "invalid or expired token"

        user = User.query.filter_by(email=email).first()
        if not user:
            return False, "user not found"

        user.set_password(new_password)
        db.session.commit()
        return True, None