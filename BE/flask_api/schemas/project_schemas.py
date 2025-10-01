# file: schemas/project_schemas.py
import re
from marshmallow import Schema, fields, validates, ValidationError

class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()

    @validates("name")
    def validate_name_project(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên project là bắt buộc.")

        # Regex: cho phép chữ cái Unicode (cả tiếng Việt), số, khoảng trắng, dấu _
        pattern = r"^[\w\sÀ-ỹ]+$"
        if not re.match(pattern, value.strip(), flags=re.UNICODE):
            raise ValidationError(
                "Tên project chỉ được chứa chữ cái, số, khoảng trắng và ký tự gạch dưới (_)."
            )