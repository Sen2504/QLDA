import re
from marshmallow import Schema, fields, validates, ValidationError

class WorkflowStatusSchema(Schema):
    ID_status = fields.Int(dump_only=True)
    Name = fields.Str(required=True, error_messages={"required": "Tên trạng thái là bắt buộc."})

    @validates("Name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên trạng thái là bắt buộc.")
        
        # Regex: chỉ chứa chữ cái và khoảng trắng, không số, không ký tự đặc biệt
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Tên trạng thái chỉ được chứa chữ và khoảng trắng (không số, không ký tự đặc biệt).")
