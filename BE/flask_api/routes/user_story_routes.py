# file: routes/user_story_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_api.schemas.user_story_schemas import UserStorySchema
from flask_api.services.user_story_service import UserStoryService
from flask_login import login_required

user_story_bp = Blueprint("user_story_bp", __name__, url_prefix="/api/user_stories")

user_story_schema = UserStorySchema()
user_stories_schema = UserStorySchema(many=True)

@login_required
@user_story_bp.route("/", methods=["POST"])
def create_user_story():
    data = request.form.to_dict()
    files = request.files.getlist("files")  # lấy list file

    # nếu chỉ có 1 file và getlist trả rỗng, thử lấy trực tiếp
    if not files:
        single_file = request.files.get("files")
        if single_file:
            files = [single_file]
    
    new_user_story, error = UserStoryService.create(data, files=files)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Tạo thành công", "id": new_user_story.id}), 201


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
    data = request.form.to_dict()

    # lấy file mới (có thể nhiều file)
    new_files = request.files.getlist("files")
    if not new_files:
        single_file = request.files.get("files")
        if single_file:
            new_files = [single_file]

    # danh sách file giữ lại (nếu client có gửi)
    keep_files = data.get("keep_files")
    if keep_files:
        try:
            import json
            keep_files = json.loads(keep_files)   # client gửi dạng JSON string: ["a.pdf","b.png"]
        except Exception:
            keep_files = []
    else:
        keep_files = []

    updated_story, error = UserStoryService.update(
        story_id,
        data,
        new_files=new_files,
        keep_files=keep_files
    )

    if error:
        status_code = 404 if error == "Không tìm thấy User Story." else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Cập nhật thành công",
        "id": updated_story.id,
        "files": UserStoryService._list_files(updated_story.id)
    }), 200


@user_story_bp.route("/<int:story_id>", methods=["DELETE"])
def delete_user_story(story_id):
    success, error = UserStoryService.delete(story_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa User Story thành công."}), 200


# Thêm route download file
@user_story_bp.route("/<int:story_id>/download", methods=["GET"])
def download_user_story_file(story_id):
    story = UserStoryService.get_by_id(story_id)
    if not story or not story.evidence_file:
        return jsonify({"error": "Không có file để tải."}), 404
    return send_file(story.evidence_file, as_attachment=True)
