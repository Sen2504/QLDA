from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_api.extensions import db
from flask_api.models.user_models import User
from flask_api.schemas.user_schemas import UserSchema

user_bp = Blueprint("user_bp", __name__, url_prefix="/api/users")
user_bp.strict_slashes = False  # cho phép /api/users và /api/users/

user_schema = UserSchema()
users_schema = UserSchema(many=True)

# ----------------- CREATE -----------------
@user_bp.route("", methods=["POST"])
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json() or {}

    try:
        # validate các field đầu vào; password là load_only trong schema
        payload = user_schema.load(data, partial=("name", "skillset"))
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    email = (payload.get("email") or "").strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email đã tồn tại."}), 400

    user = User(
        name=payload.get("name"),
        email=email,
        skillset=payload.get("skillset"),
    )
    if payload.get("password"):
        user.set_password(payload["password"])

    db.session.add(user)
    db.session.commit()
    return jsonify(user_schema.dump(user)), 201


# ----------------- READ ALL -----------------
@user_bp.route("", methods=["GET"])
@user_bp.route("/", methods=["GET"])
def get_all_users():
    users = User.query.all()
    return jsonify(users_schema.dump(users)), 200


# ----------------- READ ONE -----------------
@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404
    return jsonify(user_schema.dump(user)), 200


# ----------------- UPDATE FULL -----------------
@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    data = request.get_json() or {}
    try:
        payload = user_schema.load(data)  # yêu cầu đủ field theo schema
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    # unique email (trừ chính nó)
    email = (payload.get("email") or "").strip().lower()
    if User.query.filter(User.email == email, User.id != user_id).first():
        return jsonify({"error": "Email đã được sử dụng."}), 400

    user.name = payload.get("name")
    user.email = email
    user.skillset = payload.get("skillset")
    if payload.get("password"):
        user.set_password(payload["password"])

    db.session.commit()
    return jsonify(user_schema.dump(user)), 200


# ----------------- UPDATE PARTIAL -----------------
@user_bp.route("/<int:user_id>", methods=["PATCH"])
def patch_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    data = request.get_json() or {}
    try:
        payload = user_schema.load(data, partial=True)  # chỉ validate field có trong body
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    if "email" in payload:
        email = (payload["email"] or "").strip().lower()
        if User.query.filter(User.email == email, User.id != user_id).first():
            return jsonify({"error": "Email đã được sử dụng."}), 400
        user.email = email

    if "name" in payload:
        user.name = payload["name"]

    if "password" in payload and payload["password"]:
        user.set_password(payload["password"])

    if "skillset" in payload:
        user.skillset = payload["skillset"]

    db.session.commit()
    return jsonify(user_schema.dump(user)), 200


# ----------------- DELETE -----------------
@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Không tìm thấy user."}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Xóa user thành công."}), 200
