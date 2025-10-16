# file: routes/user_story_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_api.schemas.user_story_schemas import UserStorySchema
from flask_api.services.user_story_service import UserStoryService
from flask_login import login_required
from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.utils.permissions import (
    require_permission,
    get_project_id_from_user_story,
    is_user_involved_in_user_story,
)
from flask_login import current_user

user_story_bp = Blueprint("user_story_bp", __name__, url_prefix="/api/user_stories")

user_story_schema = UserStorySchema()
user_stories_schema = UserStorySchema(many=True)


@user_story_bp.route("/", methods=["POST"])
@login_required
@require_permission("UserStory", "Create", project_id_getter=lambda: request.form.get("Project_id") or request.form.get("project_id"))
def create_user_story():
    # ép tất cả field text ra dict
    data = request.form.to_dict(flat=True)

    # ép riêng hashtags (để chắc chắn có lấy được chuỗi JSON từ FE)
    if "hashtags" in request.form:
        data["hashtags"] = request.form.get("hashtags")

    if "complexities" in request.form:
        data["complexities"] = request.form.get("complexities")

    # lấy file
    files = request.files.getlist("files")
    if not files:
        single_file = request.files.get("files")
        if single_file:
            files = [single_file]

    new_user_story, error = UserStoryService.create(data, files=files)

    if error:
        return jsonify({"error": error}), 400

    if not new_user_story:   # tránh trường hợp (None, None)
        return jsonify({"error": "Unknown error khi tạo user story"}), 500

    return jsonify({"message": "Tạo thành công", "id": new_user_story.id}), 201



@user_story_bp.route("/", methods=["GET"])
@login_required
@require_permission("UserStory", "View", project_id_getter=lambda: request.args.get("project_id"))
def get_user_stories():
    # If project_id query present we will filter by it in service layer usage on FE.
    # Here we just ensure the caller has view permission in that project context;
    # For safety return empty unless project_id provided to avoid cross-project data leakage via global list.
    project_id = request.args.get("project_id", type=int)
    if project_id:
        stories = UserStoryService.get_by_project(project_id)
        return jsonify(user_stories_schema.dump(stories)), 200
    # No project_id -> return empty list for non-admin flows
    return jsonify([]), 200


@user_story_bp.route("/<int:id>", methods=["GET"])
@login_required
@require_permission(
    "UserStory",
    "View",
    project_id_getter=lambda id: get_project_id_from_user_story(id),
    fallback_allow=lambda user_id, project_id, id=None, **kwargs: is_user_involved_in_user_story(
        user_id, id or kwargs.get("id")
    ),
)
def get_user_story(id):
    story = UserStoryService.get_by_id(id)
    if not story:
        return jsonify({"error": "Not found"}), 404

    data = UserStorySchema().dump(story)

    # comps = ComplexityPoint.query.filter_by(user_story_id=id).all()
    # data["complexities"] = [
    #     {"id": c.id, "role_name": c.name, "point": c.point} for c in comps
    # ]

    return jsonify(data), 200


@user_story_bp.route("/<int:story_id>", methods=["PUT"])
@login_required
@require_permission("UserStory", "Edit", project_id_getter=lambda story_id: get_project_id_from_user_story(story_id))
def update_user_story(story_id):
    data = request.form.to_dict()

    # ---- Lấy file mới (có thể nhiều file) ----
    new_files = request.files.getlist("files")
    if not new_files:
        single_file = request.files.get("files")
        if single_file:
            new_files = [single_file]

    # ---- Lấy danh sách file cần xoá (client gửi dạng JSON string) ----
    deleted_files = data.get("deleted_files")
    if deleted_files:
        try:
            import json
            deleted_files = json.loads(deleted_files)
        except Exception:
            deleted_files = []
    else:
        deleted_files = []

    # ---- Gọi service update ----
    updated_story, error = UserStoryService.update(
        story_id,
        data,
        new_files=new_files,
        deleted_files=deleted_files    # ✅ đổi sang deleted_files
    )

    # ---- Trả về response ----
    if error:
        status_code = 404 if error == "Không tìm thấy User Story." else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Cập nhật thành công",
        "id": updated_story.id,
        "files": UserStoryService._list_files(updated_story.id)
    }), 200


@user_story_bp.route("/<int:story_id>", methods=["DELETE"])
@login_required
@require_permission("UserStory", "Delete", project_id_getter=lambda story_id: get_project_id_from_user_story(story_id))
def delete_user_story(story_id):
    success, error = UserStoryService.delete(story_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa User Story thành công."}), 200


# Thêm route download file
@user_story_bp.route("/<int:story_id>/download", methods=["GET"])
@login_required
@require_permission("UserStory", "View", project_id_getter=lambda story_id: get_project_id_from_user_story(story_id))
def download_user_story_file(story_id):
    story = UserStoryService.get_by_id(story_id)
    if not story or not story.evidence_file:
        return jsonify({"error": "Không có file để tải."}), 404
    return send_file(story.evidence_file, as_attachment=True)

# ----------------- GET BY PROJECT -----------------
@user_story_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
@require_permission("UserStory", "View", project_id_getter=lambda project_id: project_id)
def get_user_stories_by_project(project_id):
    stories = UserStoryService.get_by_project(project_id)
    if not stories:
        return jsonify([]), 200
    return jsonify(user_stories_schema.dump(stories)), 200

# View-own list variant: user stories in project where the current user is involved via tasks
@user_story_bp.route("/project/<int:project_id>/mine", methods=["GET"])
@login_required
def get_user_stories_involved(project_id):
    # Must be project member at least
    from flask_api.services.permission_service import PermissionService
    if PermissionService._projrole_for_user_project(current_user.id, project_id) is None:
        return jsonify({"error": "Bạn không thuộc project này."}), 403
    stories = UserStoryService.get_by_project_involved(project_id, current_user.id)
    return jsonify(user_stories_schema.dump(stories)), 200
