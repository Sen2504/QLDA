# file: flask_api/routes/auth_routes.py
from flask import Blueprint, request, jsonify, url_for
from flask_login import login_user, logout_user, login_required, current_user

from flask_api.services.auth_service import AuthService
from flask_api.utils.mail import send_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    user, error, token = AuthService.register(email, password)
    if error:
        # 409 khi email trùng, còn lại 400
        status = 409 if "already registered" in error else 400
        return jsonify({"error": error}), status

    # route chịu trách nhiệm build URL ngoài và gửi email
    confirm_url = url_for("auth.confirm_email", token=token, _external=True)
    html = f"""
        <p>Xin chào,</p>
        <p>Nhấn vào liên kết sau để xác nhận email của bạn:</p>
        <p><a href="{confirm_url}">{confirm_url}</a></p>
        <p>Liên kết hết hạn sau 24 giờ.</p>
    """
    send_email("Xác nhận email", [user.email], html)
    return jsonify({"message": "Registered successfully. Please check your email to confirm."}), 201


@auth_bp.route("/confirm", methods=["GET"])
def confirm_email():
    token = request.args.get("token", type=str)
    ok, error = AuthService.confirm_email_by_token(token)
    if not ok:
        # Phân loại lỗi hợp lý
        if error == "token is required":
            return jsonify({"error": error}), 400
        if error == "invalid or expired token":
            return jsonify({"error": error}), 400
        if error == "user not found":
            return jsonify({"error": error}), 404
        return jsonify({"error": error}), 400

    # Nếu user đã confirmed trước đó, trả message phù hợp
    if error is None and token:
        # không có error => hoặc vừa xác nhận thành công, hoặc đã xác nhận trước đó (service coi là ok)
        return jsonify({"message": "email confirmed successfully"}), 200

    return jsonify({"message": "email confirmed successfully"}), 200


@auth_bp.route("/resend-confirm", methods=["POST"])
@login_required
def resend_confirm():
    token, error = AuthService.generate_resend_token(current_user)
    if error:
        # đã confirmed rồi
        if error == "already confirmed":
            return jsonify({"message": "already confirmed"}), 200
        return jsonify({"error": error}), 400

    confirm_url = url_for("auth.confirm_email", token=token, _external=True)
    html = f"""
        <p>Liên kết xác nhận email mới của bạn:</p>
        <p><a href="{confirm_url}">{confirm_url}</a></p>
    """
    send_email("Xác nhận email (gửi lại)", [current_user.email], html)
    return jsonify({"message": "confirmation email resent"}), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    remember = bool(data.get("remember", True))

    user, error = AuthService.verify_credentials(email, password)
    if error:
        status = 403 if error == "email not confirmed" else 401 if error == "invalid credentials" else 400
        return jsonify({"error": error}), status

    login_user(user, remember=remember)
    return jsonify({"message": "logged in", "user": {"id": user.id, "email": user.email}}), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    u = current_user
    return jsonify({"id": u.id, "email": u.email, "confirmed": u.confirmed}), 200
