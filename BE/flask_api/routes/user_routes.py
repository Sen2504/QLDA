# file: flask_api/routes/user_routes.py
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_api.schemas.user_schemas import UserSchema
from flask_api.services.user_service import UserService

user_bp = Blueprint("user_bp", __name__, url_prefix="/api/users")
user_bp.strict_slashes = False

user_schema = UserSchema()
users_schema = UserSchema(many=True)

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