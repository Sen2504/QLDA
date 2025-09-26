# flask_api/__init__.py

from flask import Flask
from flask_api.config import Config
from flask_api.extensions import db, migrate
from .extensions import db, migrate, login_manager, mail
from flask_api.models.user_models import User
from flask_api.config import Config 
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    db.init_app(app)
    migrate.init_app(app, db)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from flask_api.routes.task_status_routes import task_status_bp
    from flask_api.routes.action_routes import action_bp
    from flask_api.routes.user_routes import user_bp
    from flask_api.routes.auth_routes import auth_bp
    from flask_api.routes.role_routes import role_bp
    from flask_api.routes.project_routes import project_bp

    app.register_blueprint(task_status_bp)
    app.register_blueprint(action_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(role_bp)
    app.register_blueprint(project_bp)
    app.config.from_object(Config)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    # Import models để Flask-Migrate nhận diện
    from flask_api.models.task_status_models import TaskStatus
    from flask_api.models.action_models import Action
    from flask_api.models.user_models import User

    return app