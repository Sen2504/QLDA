import re
from datetime import date
from marshmallow import Schema, fields, validates, ValidationError
from flask_api.schemas.complexity_point_schemas import ComplexityPointSchema
from flask_api.schemas.hashtag_schemas import HashtagSchema
from flask_api.schemas.userstory_hashtag_schemas import UserStoryHashtagSchema

class UserStorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    expire_date = fields.Date(required=True)
    evidence_file = fields.Str(allow_none=True)
    status_id = fields.Int()
    project_id = fields.Int()
    sprint_id = fields.Int(allow_none=True)

    # Nested quan hệ
    complexity_points = fields.Nested(ComplexityPointSchema, many=True, dump_only=True)
    hashtags = fields.Nested(UserStoryHashtagSchema, many=True, dump_only=True)

    @validates("name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên User Story là bắt buộc.")
        if not re.match(r"^[A-Za-z0-9_ ]+$", value.strip()):
            raise ValidationError("Tên User Story chỉ được chứa chữ, số, khoảng trắng và ký tự '_'.")

    @validates("expire_date")
    def validate_expire_date(self, value):
        if value < date.today():
            raise ValidationError("Ngày hết hạn không được nhỏ hơn ngày hiện tại.")

    @validates("evidence_file")
    def validate_evidence_file(self, value):
        if value and len(value) > 255:
            raise ValidationError("Tên file quá dài, không hợp lệ.")
