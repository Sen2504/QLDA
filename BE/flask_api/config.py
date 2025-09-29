# flask_api/config.py
import os

class Config:
    # SECRET_KEY bắt buộc cho session, flask-login
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    
    # Database
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost/qlda"
    FRONTEND_URL= "http://localhost:5173"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() in ["true", "1", "yes"]
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "false").lower() in ["true", "1", "yes"]
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = False

    FRONTEND_URL=os.getenv("FRONTEND_URL", "http://localhost:5173")
