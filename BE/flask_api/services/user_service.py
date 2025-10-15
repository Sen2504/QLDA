import os
import re
from flask import current_app
from flask_login import current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_api.extensions import db
from flask_api.models.user_models import User

# ==========================================================
# CONSTANTS
# ==========================================================
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024  # 1GB


def allowed_file(filename: str) -> bool:
    """Kiểm tra định dạng file hợp lệ"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ==========================================================
# SERVICE
# ==========================================================
class UserService:
    # ------------------ PASSWORD ------------------
    @staticmethod
    def set_password(user, password):
        user.password_hash = generate_password_hash(password)

    @staticmethod
    def check_password(user, password):
        return check_password_hash(user.password_hash, password)

    # ------------------ CRUD ------------------
    @staticmethod
    def create(payload):
        """
        Tạo user mới.
        - Validate email unique
        - Password là tùy chọn
        """
        email = (payload.get("email") or "").strip().lower()
        if not email:
            return None, "Email is required."

        if User.query.filter_by(email=email).first():
            return None, "Email has been existed."

        user = User(
            name=payload.get("name"),
            email=email,
            skillset=payload.get("skillset"),
        )

        password = payload.get("password")
        if password:
            user.set_password(password)

        db.session.add(user)
        db.session.commit()
        return user, None

    @staticmethod
    def get_all():
        return User.query.all()

    @staticmethod
    def get_by_id(user_id: int):
        return User.query.get(user_id)

    @staticmethod
    def update(user_id: int, payload):
        """
        Cập nhật thông tin user (PUT).
        Validate email, uniqueness, name, skillset.
        """
        user = User.query.get(user_id)
        if not user:
            return None, "User not found."

        email = (payload.get("email") or "").strip().lower()
        if not email:
            return None, "Email is required."

        # Kiểm tra trùng email (trừ chính user đó)
        exists = User.query.filter(User.email == email, User.id != user_id).first()
        if exists:
            return None, "Email is already in use."

        user.name = payload.get("name")
        user.email = email
        user.skillset = payload.get("skillset")

        if payload.get("password"):
            user.set_password(payload["password"])

        db.session.commit()
        return user, None

    @staticmethod
    def delete(user_id: int):
        user = User.query.get(user_id)
        if not user:
            return False, "User not found."

        db.session.delete(user)
        db.session.commit()
        return True, None

    # ------------------ PROFILE ------------------
    @staticmethod
    def get_profile():
        """Trả về user hiện tại"""
        return current_user

    @staticmethod
    def update_profile(name, skillset):
        """Cập nhật thông tin profile user đang login"""
        if not name or not skillset:
            return None, "Name and skillset are required."

        current_user.name = name
        current_user.skillset = skillset
        db.session.commit()
        return current_user, None

    # ------------------ AVATAR UPLOAD ------------------
    @staticmethod
    def upload_avatar(file):
        """Upload avatar: xóa cũ → lưu mới → cập nhật DB"""

        if not file or file.filename == "":
            return None, "No files selected."

        if not allowed_file(file.filename):
            return None, "Invalid file format. Only png, jpg, jpeg, gif are accepted."

        # Kiểm tra dung lượng
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return None, "File over 1GB."

        # Chuẩn bị thư mục lưu avatar
        filename = secure_filename(file.filename)
        folder_name = current_user.email.replace("@", "_at_").replace(".", "_")

        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        save_dir = os.path.join(base_dir, "uploads", "avatars", folder_name)
        os.makedirs(save_dir, exist_ok=True)

        # Xóa ảnh cũ (nếu có)
        for old_file in os.listdir(save_dir):
            try:
                old_path = os.path.join(save_dir, old_file)
                if os.path.isfile(old_path):
                    os.remove(old_path)
            except Exception as e:
                print(f" Lỗi khi xóa file cũ {old_path}: {e}")

        # Lưu file mới
        save_path = os.path.join(save_dir, filename)
        file.save(save_path)

        # Cập nhật DB (đường dẫn public cho FE)
        current_user.avatar = f"/uploads/avatars/{folder_name}/{filename}"
        db.session.commit()

        return current_user, None

    # ------------------ PASSWORD CHANGE ------------------
    @staticmethod
    def change_password(old_password, new_password, confirm_password):
        """Đổi mật khẩu của user hiện tại"""
        if not current_user.check_password(old_password):
            return None, "The old password is incorrect."
        if new_password != confirm_password:
            return None, "Confirmation password does not match."
        if len(new_password) < 6:
            return None, "Password must have at least 6 characters."
        if not re.search(r"[A-Za-z]", new_password):
            return None, "Password must contain at least 1 letter."

        current_user.set_password(new_password)
        db.session.commit()
        return current_user, None
