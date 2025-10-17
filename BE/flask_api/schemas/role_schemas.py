import re
from marshmallow import Schema, fields, validates, ValidationError

class RoleSchema(Schema):
    id = fields.Int(dump_only=True)  # map với Role.id
    name = fields.Str(required=True) # map với Role.name

    @validates("name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Role name is required.")
        # Regex: chỉ chữ và khoảng trắng
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Role names must only contain letters and spaces (no numbers, no special characters).")
