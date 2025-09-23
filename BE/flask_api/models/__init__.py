# BE/flask_api/models/__init__.py
from .. import db

# Import lần lượt TẤT CẢ các model của bạn:
from .user_models import User                 # ví dụ
from .task_status_models import TaskStatus

# ... thêm các model khác của bạn

__all__ = [
    "User",
    "TaskStatus",
     # ...
]
