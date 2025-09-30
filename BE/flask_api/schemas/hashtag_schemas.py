import re
from marshmallow import Schema, fields, validates, ValidationError

class HashtagSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

    # Validate hashtag: chỉ chữ, số, khoảng trắng, ký tự _
    @validates("Name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên hashtag là bắt buộc.")
        if not re.match(r"^[A-Za-z0-9_ ]+$", value.strip()):
            raise ValidationError("Tên hashtag chỉ được chứa chữ, số, khoảng trắng và ký tự '_'.")
