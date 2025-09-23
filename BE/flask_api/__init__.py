# flask_api/__init__.py

from flask import Flask
from flask_api.config import Config
from flask_api.extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from flask_api.routes.task_status_routes import task_status_bp
    from flask_api.routes.action_routes import action_bp
    app.register_blueprint(task_status_bp)
    app.register_blueprint(action_bp)

    # Import models để Flask-Migrate nhận diện
    from flask_api.models.task_status_models import TaskStatus
    from flask_api.models.action_models import Action

    return app
