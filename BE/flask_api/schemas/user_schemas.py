import re
from marshmallow import Schema, fields, validates, ValidationError


class UserSchema(Schema):
    ID_user = fields.Int(dump_only=True)  # chỉ đọc, không cho client nhập
    Name_user = fields.Str(required=True)
    Email = fields.Email(required=True)   # validate email sẵn có trong marshmallow
    Password = fields.Str(required=True, load_only=True)  # load_only: không trả ra client
    Skills_set = fields.Str(required=False, allow_none=True)

    @validates("Name_user")
    def validate_name(self, value):
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("Tên chỉ được chứa chữ và khoảng trắng (không số, không ký tự đặc biệt).")

    @validates("Password")
    def validate_password(self, value):
        if len(value) < 6:
            raise ValidationError("Mật khẩu phải có ít nhất 6 ký tự.")
