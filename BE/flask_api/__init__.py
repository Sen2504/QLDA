# flask_api/__init__.py
import os
from pathlib import Path
from flask import Flask
from flask_api.config import Config
from flask_api.extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from flask_api.routes.task_status_routes import task_status_bp
    from flask_api.routes.user_routes import user_bp
    app.register_blueprint(task_status_bp)
    app.register_blueprint(user_bp)

    # Import models để Flask-Migrate nhận diện
    from flask_api.models.task_status_models import TaskStatus
    from flask_api.models.user_models import User

    return app
