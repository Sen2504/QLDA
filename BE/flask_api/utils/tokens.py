
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app


def _serializer(salt: str):
    return URLSafeTimedSerializer(
        secret_key=current_app.config["SECRET_KEY"],
        salt=salt
    )

# -------- EMAIL CONFIRMATION TOKEN --------
def generate_confirmation_token(email: str) -> str:
    return _serializer(current_app.config.get("SECURITY_CONFIRM_SALT", "confirm-salt")).dumps(email)

def confirm_token(token: str, max_age: int | None = None) -> str | None:
    expire = max_age or current_app.config.get("CONFIRM_TOKEN_EXPIRE", 300)  # default 5 phút
    try:
        return _serializer(current_app.config.get("SECURITY_CONFIRM_SALT", "confirm-salt")).loads(token, max_age=expire)
    except (BadSignature, SignatureExpired):
        return None


# -------- PASSWORD RESET TOKEN --------
def generate_reset_token(email: str) -> str:
    return _serializer(current_app.config.get("SECURITY_RESET_SALT", "reset-salt")).dumps(email)

def confirm_reset_token(token: str, max_age: int | None = None) -> str | None:
    expire = max_age or current_app.config.get("RESET_TOKEN_EXPIRE", 300)  # default 5 phút
    try:
        return _serializer(current_app.config.get("SECURITY_RESET_SALT", "reset-salt")).loads(token, max_age=expire)
    except (BadSignature, SignatureExpired):
        return None