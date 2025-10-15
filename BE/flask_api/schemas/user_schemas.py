import re
from marshmallow import Schema, fields, validates, ValidationError


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    name = fields.String(required=True)
    # client gửi "password" khi tạo/sửa; KHÔNG trả ra cho client
    password = fields.Str(load_only=True)
    skillset = fields.Str()

    active = fields.Bool(dump_only=True)
    confirmed = fields.Bool(dump_only=True)
    confirmed_at = fields.DateTime(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)

    @validates("name")
    def validate_name(self, value, **kwargs):  # nhận **kwargs để compatible v4
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", value.strip(), flags=re.UNICODE):
            raise ValidationError("The name must contain only letters and spaces (no numbers, no special characters).")

    @validates("password")
    def validate_password(self, value, **kwargs):  
        if len(value or "") < 6:
            raise ValidationError("Password must have at least 6 characters.")
        
class UpdateProfileSchema(Schema):
    name = fields.Str(required=True)
    skillset = fields.Str(required=True)

class ChangePasswordSchema(Schema):
    oldPassword = fields.Str(required=True, load_only=True)
    newPassword = fields.Str(required=True, load_only=True)
    confirmPassword = fields.Str(required=True, load_only=True)