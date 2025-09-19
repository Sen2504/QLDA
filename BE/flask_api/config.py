# flask_api/config.py

class Config:
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost/qlda"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
