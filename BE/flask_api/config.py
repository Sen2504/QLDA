# flask_api/config.py
import os

class Config:
    # SECRET_KEY bắt buộc cho session, flask-login
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    
    # Database
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost/qlda"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # (Tùy chọn) Mail server – dùng nếu bạn cần gửi email xác nhận
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = "minhsang5544@gmail.com"  # tài khoản gmail
    MAIL_PASSWORD = "voty sirp gzky qpky"  # app password (không phải mật khẩu thường)
    MAIL_DEFAULT_SENDER = ("QLDA", "minhsang5544@gmail.com")
    SESSION_COOKIE_NAME = "session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax" 