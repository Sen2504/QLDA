# flask_api/__init__.py
import os
from pathlib import Path
from flask import Flask
from dotenv import load_dotenv
from flask_api import models
from flask_cors import CORS
from flask_api.extensions import db, migrate, login_manager, mail  
from flask_api.config import Config
load_dotenv()
def create_app():
    app = Flask(__name__)
    
    # Load .env
    here = Path(__file__).resolve()
    be_dir = here.parents[1]
    root_dir = here.parents[2]
    load_dotenv(root_dir / ".env")
    load_dotenv(be_dir / ".env")

    # DB URI
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_url = (
            f"mysql+pymysql://{os.getenv('DB_USER','root')}:{os.getenv('DB_PASSWORD','')}"
            f"@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','3306')}/{os.getenv('DB_NAME','qlda')}"
        )

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev"),
        SQLALCHEMY_DATABASE_URI=db_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,

        MAIL_SERVER=os.getenv("MAIL_SERVER", os.getenv("MAIL_HOST", "localhost")),
        MAIL_PORT=int(os.getenv("MAIL_PORT", 25)),
        MAIL_USE_TLS=(os.getenv("MAIL_USE_TLS", os.getenv("MAIL_ENCRYPTION","")).lower() in ("true","1","yes","tls")),
        MAIL_USE_SSL=(os.getenv("MAIL_USE_SSL","").lower() in ("true","1","yes","ssl")),
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_DEFAULT_SENDER=os.getenv("MAIL_DEFAULT_SENDER", os.getenv("MAIL_FROM_ADDRESS")),
        PREFERRED_URL_SCHEME=os.getenv("PREFERRED_URL_SCHEME", "http"),
        SERVER_NAME=os.getenv("SERVER_NAME"),
        SECURITY_CONFIRM_SALT=os.getenv("SECURITY_CONFIRM_SALT", "confirm-salt"),
    )

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db, directory="flask_api/migrations")
    mail.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # Import models để SQLAlchemy biết bảng
    from . import models  # noqa: F401
    from .models import User  # noqa: F401

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from flask_api.routes.task_status_routes import task_status_bp
    from flask_api.routes.user_routes import user_bp
    from flask_api.routes.auth_routes import auth_bp
    from flask_api.routes.action_routes import action_bp
    from flask_api.routes.workflow_status_routes import workflow_status_bp
    from flask_api.routes.project_routes import project_bp

    app.register_blueprint(task_status_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(action_bp)
    app.register_blueprint(workflow_status_bp)
    app.register_blueprint(project_bp)

    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
    app.config.from_object(Config)
    return app
