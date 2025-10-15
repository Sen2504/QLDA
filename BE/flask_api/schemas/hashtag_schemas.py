import re
from marshmallow import Schema, fields, validates, ValidationError

class HashtagSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

    # Validate hashtag: chỉ chữ, số, khoảng trắng, ký tự _
    @validates("Name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Hashtag name is required.")
        if not re.match(r"^[A-Za-z0-9_ ]+$", value.strip()):
            raise ValidationError("Hashtag names can only contain letters, numbers, spaces and the character '_'.")
