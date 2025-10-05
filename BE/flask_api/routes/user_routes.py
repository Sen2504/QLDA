from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_api.schemas.user_schemas import UserSchema, UpdateProfileSchema, ChangePasswordSchema
from flask_api.services.user_service import UserService
from flask_login import login_required

user_bp = Blueprint("user_bp", __name__, url_prefix="/api/users")
user_bp.strict_slashes = False

user_schema = UserSchema()
users_schema = UserSchema(many=True)
update_schema = UpdateProfileSchema()
change_password_schema = ChangePasswordSchema()

# ----------------- CREATE -----------------
@user_bp.route("", methods=["POST"])
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    try:
        payload = user_schema.load(data, partial=("name", "skillset"))
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    user, error = UserService.create(payload)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(user_schema.dump(user)), 201


# ----------------- READ ALL -----------------
@user_bp.route("", methods=["GET"])
@user_bp.route("/", methods=["GET"])
def get_all_users():
    users = UserService.get_all()
    return jsonify(users_schema.dump(users)), 200


# ----------------- READ ONE -----------------
@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = UserService.get_by_id(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404
    return jsonify(user_schema.dump(user)), 200


# ----------------- UPDATE FULL (PUT) -----------------
@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json() or {}
    try:
        payload = user_schema.load(data)  # yêu cầu đủ field theo schema
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    user, error = UserService.update(user_id, payload)
    if error:
        # 404 khi không tìm thấy; 400 cho lỗi business
        status = 404 if "Không tìm thấy" in error else 400
        return jsonify({"error": error}), status

    return jsonify(user_schema.dump(user)), 200


# ----------------- DELETE -----------------
@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    ok, error = UserService.delete(user_id)
    if not ok:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa user thành công."}), 200


# ----------------- PROFILE -----------------
# GET profile
@user_bp.route("/me", methods=["GET"])
@login_required
def get_profile():
    user = UserService.get_profile()
    return jsonify(user_schema.dump(user)), 200


# UPDATE profile
@user_bp.route("/me", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json() or {}
    errors = update_schema.validate(data)
    if errors:
        return jsonify({"error": errors}), 400

    user, error = UserService.update_profile(data["name"], data["skillset"])
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Profile updated"}), 200


# Upload avatar
@user_bp.route("/me/avatar", methods=["POST"])
@login_required
def upload_avatar():
    file = request.files.get("avatar")
    user, error = UserService.upload_avatar(file)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Avatar updated", "avatar": user.avatar}), 200


# Change password
@user_bp.route("/me/change-password", methods=["PUT"])
@login_required
def change_password():
    data = request.get_json() or {}
    errors = change_password_schema.validate(data)
    if errors:
        return jsonify({"error": errors}), 400

    user, error = UserService.change_password(
        data["oldPassword"], data["newPassword"], data["confirmPassword"]
    )
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Đổi mật khẩu thành công"}), 200
