import re
from marshmallow import Schema, fields, validates, ValidationError

class TaskStatusSchema(Schema):
    id = fields.Int(dump_only=True)
    name_status = fields.Str(required=True)

    @validates("name_status")
    def validate_name_status(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên trạng thái là bắt buộc.")
        # Regex: chỉ chữ và khoảng trắng
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Tên trạng thái chỉ được chứa chữ và khoảng trắng (không số, không ký tự đặc biệt).")
