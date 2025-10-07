from flask import Blueprint, jsonify, request
from flask_api.services.complexity_point_service import ComplexityPointService
from flask_api.schemas.complexity_point_schemas import ComplexityPointSchema
from flask_login import login_required

complexity_point_bp = Blueprint("complexity_point_bp", __name__, url_prefix="/api/complexity_points")

schema = ComplexityPointSchema()
schemas = ComplexityPointSchema(many=True)

# GET all
@complexity_point_bp.route("/", methods=["GET"])
@login_required
def get_all_points():
    points = ComplexityPointService.get_all()
    return jsonify(schemas.dump(points)), 200

# GET options (gom theo name)
@complexity_point_bp.route("/options", methods=["GET"])
@login_required
def get_options():
    project_id = request.args.get("project_id", type=int)
    data = ComplexityPointService.get_options(project_id)
    return jsonify(data), 200


# CREATE (nếu cho admin thêm điểm mới)
@complexity_point_bp.route("/", methods=["POST"])
@login_required
def create_point():
    data = request.get_json() or {}
    try:
        validated = schema.load(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    new_point = ComplexityPointService.create(validated["name"], validated["point"])
    return jsonify(schema.dump(new_point)), 201
