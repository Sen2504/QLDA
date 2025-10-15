# file: schemas/action_schemas.py
import re
from marshmallow import Schema, fields, validates, ValidationError

class ActionSchema(Schema):
    ID_act = fields.Int(dump_only=True)
    Name_act = fields.Str(required=True)

    @validates("Name_act")
    def validate_name_act(self, value):
        if not value or not value.strip():
            raise ValidationError("Action name is required.")
        # Regex: chỉ chữ và khoảng trắng
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Action names must contain only letters and spaces (no numbers, no special characters).")