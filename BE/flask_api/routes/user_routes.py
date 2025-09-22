from flask import Blueprint, request, jsonify
from flask_api.extensions import db
from flask_api.models.user_models import User
from flask_api.schemas.user_schemas import UserSchema

user_bp = Blueprint("user_bp", __name__, url_prefix="/api/users")

user_schema = UserSchema()
users_schema = UserSchema(many=True)


@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404
    return jsonify(user_schema.dump(user)), 200


@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    data = request.get_json() or {}
    try:
        user_data = user_schema.load(data)  # validate full input
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # check trùng email (trừ chính nó)
    if User.query.filter(User.Email == user_data["Email"], User.id != user_id).first():
        return jsonify({"error": "Email đã được sử dụng."}), 400

    # check trùng Name_user (trừ chính nó)
    if User.query.filter(User.Name_user == user_data["Name_user"], User.id != user_id).first():
        return jsonify({"error": "Tên người dùng đã tồn tại."}), 400

    # cập nhật
    user.Name_user = user_data["Name_user"]
    user.Email = user_data["Email"]
    user.Password = user_data["Password"]  # ⚠️ chưa hash
    user.Skills_set = user_data.get("Skills_set")

    db.session.commit()
    return jsonify(user_schema.dump(user)), 200


@user_bp.route("/<int:user_id>", methods=["PATCH"])
def patch_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    data = request.get_json() or {}

    # chỉ update field nào có trong request
    if "Name_user" in data:
        if User.query.filter(User.Name_user == data["Name_user"], User.id != user_id).first():
            return jsonify({"error": "Tên người dùng đã tồn tại."}), 400
        user.Name_user = data["Name_user"]

    if "Email" in data:
        if User.query.filter(User.Email == data["Email"], User.id != user_id).first():
            return jsonify({"error": "Email đã được sử dụng."}), 400
        user.Email = data["Email"]

    if "Password" in data:
        user.Password = data["Password"]

    if "Skills_set" in data:
        user.Skills_set = data["Skills_set"]

    db.session.commit()
    return jsonify(user_schema.dump(user)), 200


@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Xóa user thành công."}), 200
