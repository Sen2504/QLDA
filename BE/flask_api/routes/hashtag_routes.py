from flask import Blueprint, request, jsonify
from flask_api.services.hashtag_service import HashtagService
from flask_api.schemas.hashtag_schemas import HashtagSchema
from flask_login import login_required

hashtag_bp = Blueprint("hashtag_bp", __name__, url_prefix="/api/hashtags")

schema = HashtagSchema()
schemas = HashtagSchema(many=True)

# Search
@hashtag_bp.route("/search", methods=["GET"])
@login_required
def search_hashtags():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([]), 200
    results = HashtagService.search(q)
    return jsonify(schemas.dump(results)), 200

# Create
@hashtag_bp.route("/", methods=["POST"])
@login_required
def create_hashtag():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    hashtag, error = HashtagService.create(name)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(schema.dump(hashtag)), 201
