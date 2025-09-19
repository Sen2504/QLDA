# flask_api/__init__.py

from flask import Flask
from flask_api.config import Config
from flask_api.extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from flask_api.routes.task_routes import task_bp, task_status_bp
    app.register_blueprint(task_bp)
    app.register_blueprint(task_status_bp)

    # Import models để Flask-Migrate nhận diện
    from flask_api.routes.models.task_models import Task, TaskStatus # noqa: F401

    return app
