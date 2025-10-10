
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app


def _serializer():
    return URLSafeTimedSerializer(
        secret_key=current_app.config['SECRET_KEY'],
        salt=current_app.config.get('SECURITY_CONFIRM_SALT', 'confirm-salt')
    )

def generate_confirmation_token(email: str) -> str:
    return _serializer().dumps(email)


def confirm_token(token: str, max_age: int = 300) -> str | None:
    """Trả về email nếu token hợp lệ; ngược lại None. max_age=300 (5 min)."""
    try:
        email = _serializer().loads(token, max_age=max_age)
        return email
    except (BadSignature, SignatureExpired):
        return None
