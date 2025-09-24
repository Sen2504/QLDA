# flask_api/config.py

class Config:
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost/qlda"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # (Tùy chọn) Mail server – dùng nếu bạn cần gửi email xác nhận
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")  # tài khoản gmail
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")  # app password (không phải mật khẩu thường)
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", MAIL_USERNAME)