import re
from marshmallow import Schema, fields, validates, ValidationError

class WorkflowStatusSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, error_messages={"required": "Status name is required."})

    @validates("name")
    def validate_name(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Status name is required.")
        
        # Regex: chỉ chứa chữ cái và khoảng trắng, không số, không ký tự đặc biệt
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Status names must contain only letters and spaces (no numbers, no special characters).")
