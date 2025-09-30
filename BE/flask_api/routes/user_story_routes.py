# file: routes/user_story_routes.py
from flask import Blueprint, request, jsonify
from flask_api.schemas.user_story_schemas import UserStorySchema
from flask_api.services.user_story_service import UserStoryService

user_story_bp = Blueprint("user_story_bp", __name__, url_prefix="/api/user_stories")

user_story_schema = UserStorySchema()
user_stories_schema = UserStorySchema(many=True)


@user_story_bp.route("/", methods=["POST"])
def create_user_story():
    data = request.get_json() or {}

    new_user_story, error = UserStoryService.create(data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(user_story_schema.dump(new_user_story)), 201


@user_story_bp.route("/", methods=["GET"])
def get_user_stories():
    stories = UserStoryService.get_all()
    return jsonify(user_stories_schema.dump(stories)), 200


@user_story_bp.route("/<int:story_id>", methods=["GET"])
def get_user_story(story_id):
    story = UserStoryService.get_by_id(story_id)
    if not story:
        return jsonify({"error": "Không tìm thấy User Story."}), 404
    return jsonify(user_story_schema.dump(story)), 200


@user_story_bp.route("/<int:story_id>", methods=["PUT"])
def update_user_story(story_id):
    data = request.get_json() or {}
    updated_story, error = UserStoryService.update(story_id, data)
    if error:
        status_code = 404 if error == "Không tìm thấy User Story." else 400
        return jsonify({"error": error}), status_code
    return jsonify(user_story_schema.dump(updated_story)), 200


@user_story_bp.route("/<int:story_id>", methods=["DELETE"])
def delete_user_story(story_id):
    success, error = UserStoryService.delete(story_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa User Story thành công."}), 200
