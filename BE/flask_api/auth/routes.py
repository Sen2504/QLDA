# BE/flask_api/auth/routes.py
from flask import Blueprint, request, jsonify, url_for
from flask_login import login_user, logout_user, login_required, current_user
from email_validator import validate_email, EmailNotValidError
from datetime import datetime

from .. import db
from ..models import User
from ..utils.tokens import generate_confirmation_token, confirm_token
from ..utils.mail import send_email

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    try:
        validate_email(email)
    except EmailNotValidError as e:
        return jsonify({'error': str(e)}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'email already registered'}), 409

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_confirmation_token(user.email)
    confirm_url = url_for('auth.confirm_email', token=token, _external=True)
    html = f"""
        <p>Xin chào,</p>
        <p>Nhấn vào liên kết sau để xác nhận email của bạn:</p>
        <p><a href="{confirm_url}">{confirm_url}</a></p>
        <p>Liên kết hết hạn sau 24 giờ.</p>
    """
    send_email('Xác nhận email', [user.email], html)

    return jsonify({'message': 'Registered successfully. Please check your email to confirm.'}), 201


@auth_bp.route('/confirm')
def confirm_email():
    token = request.args.get('token', type=str)
    if not token:
        return jsonify({'error': 'token is required'}), 400

    email = confirm_token(token)
    if not email:
        return jsonify({'error': 'invalid or expired token'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'user not found'}), 404

    if user.confirmed:
        return jsonify({'message': 'email already confirmed'}), 200

    user.confirmed = True
    user.confirmed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'email confirmed successfully'}), 200


@auth_bp.route('/resend-confirm', methods=['POST'])
@login_required
def resend_confirm():
    if current_user.confirmed:
        return jsonify({'message': 'already confirmed'}), 200
    token = generate_confirmation_token(current_user.email)
    confirm_url = url_for('auth.confirm_email', token=token, _external=True)
    html = f"""
        <p>Liên kết xác nhận email mới của bạn:</p>
        <p><a href="{confirm_url}">{confirm_url}</a></p>
    """
    send_email('Xác nhận email (gửi lại)', [current_user.email], html)
    return jsonify({'message': 'confirmation email resent'}), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    remember = bool(data.get('remember', True))

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'invalid credentials'}), 401

    if not user.confirmed:
        return jsonify({'error': 'email not confirmed'}), 403

    login_user(user, remember=remember)
    return jsonify({'message': 'logged in', 'user': {'id': user.id, 'email': user.email}}), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'logged out'}), 200


@auth_bp.route('/me')
@login_required
def me():
    u = current_user
    return jsonify({'id': u.id, 'email': u.email, 'confirmed': u.confirmed}), 200