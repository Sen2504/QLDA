import os
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_api.extensions import db
from flask_api.models.user_models import User
from flask_login import current_user
from werkzeug.utils import secure_filename
import re

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

class UserService:
    @staticmethod
    def set_password(user, password):
        user.password_hash = generate_password_hash(password)

    @staticmethod
    def check_password(user, password):
        return check_password_hash(user.password_hash, password)
    
    @staticmethod
    def create(payload):
        """
        payload đã được validate bởi UserSchema ở route.
        Yêu cầu tối thiểu: email (unique). password là tùy chọn.
        """
        email = (payload.get("email") or "").strip().lower()

        if not email:
            return None, "Email là bắt buộc."

        if User.query.filter_by(email=email).first():
            return None, "Email đã tồn tại."

        user = User(
            name=payload.get("name"),
            email=email,
            skillset=payload.get("skillset"),
        )
        if payload.get("password"):
            user.set_password(payload["password"])

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
        Update full (PUT): schema đã đảm bảo đủ field hợp lệ.
        """
        user = User.query.get(user_id)
        if not user:
            return None, "Không tìm thấy user."

        email = (payload.get("email") or "").strip().lower()
        if not email:
            return None, "Email là bắt buộc."

        # unique email (trừ chính nó)
        if User.query.filter(User.email == email, User.id != user_id).first():
            return None, "Email đã được sử dụng."

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
            return False, "Không tìm thấy user."
        db.session.delete(user)
        db.session.commit()
        return True, None

    @staticmethod
    def get_profile():
        return current_user

    @staticmethod
    def update_profile(name, skillset):
        if not name or not skillset:
            return None, "Name và skillset là bắt buộc"
        current_user.name = name
        current_user.skillset = skillset
        db.session.commit()
        return current_user, None

    @staticmethod
    def upload_avatar(file):
        if not file or file.filename == "":
            return None, "Không có file"

        if not allowed_file(file.filename):
            return None, "File không hợp lệ"

        # kiểm tra dung lượng file (<= 1GB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        max_size = 1 * 1024 * 1024 * 1024  # 1GB
        if file_size > max_size:
            return None, "File vượt quá giới hạn 1GB"

        # tạo tên file và thư mục
        filename = secure_filename(file.filename)
        folder_name = current_user.email.replace("@", "_at_").replace(".", "_")

        # đường dẫn tuyệt đối: flask_api/uploads/avatars/<email_user>/
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        save_dir = os.path.join(base_dir, "uploads", "avatars", folder_name)
        os.makedirs(save_dir, exist_ok=True)

        # Xóa toàn bộ ảnh cũ trước khi lưu mới
        for old_file in os.listdir(save_dir):
            old_path = os.path.join(save_dir, old_file)
            try:
                if os.path.isfile(old_path):
                    os.remove(old_path)
                    print(f"Đã xóa avatar cũ: {old_path}")
            except Exception as e:
                print(f"Lỗi khi xóa file cũ {old_path}: {e}")

        # lưu file mới
        save_path = os.path.join(save_dir, filename)
        print("Saving avatar to:", save_path)
        file.save(save_path)

        # cập nhật DB
        current_user.avatar = f"/uploads/avatars/{folder_name}/{filename}"
        db.session.commit()

        return current_user, None


    @staticmethod
    def change_password(old_password, new_password, confirm_password):
        if not current_user.check_password(old_password):
            return None, "Mật khẩu cũ không đúng"
        if new_password != confirm_password:
            return None, "Mật khẩu xác nhận không khớp"
        if len(new_password) < 6:
            return None, "Mật khẩu phải có ít nhất 6 ký tự"
        if not re.search(r"[A-Za-z]", new_password):
            return None, "Mật khẩu phải có ít nhất 1 chữ cái"
        current_user.set_password(new_password)
        db.session.commit()
        return current_user, None