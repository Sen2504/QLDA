import os
from datetime import date
from werkzeug.utils import secure_filename
from flask_api.extensions import db
from flask_api.models.issue_models import Issue, IssueStatus, Severity, Priority
from flask_api.models.issue_resolve_models import IssueResolve
from flask_api.models.issue_type_models import IssueType

# ================== Cấu hình upload ==================
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "uploads", "issues")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


class IssueService:
    # ================== INTERNAL HELPERS ==================
    @staticmethod
    def _issue_folder(issue_id: int) -> str:
        """Trả về thư mục lưu file cho issue"""
        return os.path.join(UPLOAD_FOLDER, str(issue_id))

    @staticmethod
    def _save_file(file, issue_id: int):
        """Lưu file vào uploads/issues/<issue_id>/"""
        if not file:
            return None, None

        filename = secure_filename(file.filename)
        issue_folder = IssueService._issue_folder(issue_id)
        os.makedirs(issue_folder, exist_ok=True)

        file_path = os.path.join(issue_folder, filename)

        # Check dung lượng
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return None, "File vượt quá 500MB."

        file.save(file_path)
        return file_path, None

    @staticmethod
    def _list_files(issue_id: int):
        issue_folder = IssueService._issue_folder(issue_id)
        if not os.path.exists(issue_folder):
            return []
        return os.listdir(issue_folder)
    
    # ================== ENUMS ==================
    @staticmethod
    def get_enums():
        return {
            "status": [s.value for s in IssueStatus],
            "severity": [s.value for s in Severity],
            "priority": [p.value for p in Priority],
        }

    # ================== CRUD ==================
    @staticmethod
    def get_all():
        return Issue.query.all()

    @staticmethod
    def get_by_id(issue_id):
        issue = Issue.query.get(issue_id)
        if not issue:
            return None

        return {
            "id": issue.id,
            "name": issue.name,
            "description": issue.description,
            "status": issue.status.value if issue.status else None,
            "severity": issue.severity.value if issue.severity else None,
            "priority": issue.priority.value if issue.priority else None,
            "expire_date": issue.expire_date,
            "evidence_files": IssueService._list_files(issue.id)
        }

    @staticmethod
    def create(data, files=None):
        issue_type = IssueType.query.get(data.get("type_id"))
        if not issue_type:
            return None, "Loại issue không tồn tại."

        name = (data.get("name") or "").strip()
        if not name:
            return None, "Tên issue là bắt buộc."

        expire_date = data.get("expire_date")
        if not expire_date or expire_date < str(date.today()):
            return None, "Ngày hết hạn không hợp lệ."

        # Tạo issue
        new_issue = Issue(
            project_id=data.get("project_id"),
            type_id=data.get("type_id"),
            name=data.get("name"),
            description=data.get("description"),
            hashtag=data.get("hashtag"),
            status=data.get("status"),
            severity=data.get("severity"),
            priority=data.get("priority"),
            expire_date=data.get("expire_date"),
            evidence_file=None
        )
        db.session.add(new_issue)
        db.session.flush()  # để có ID

        # Tạo thư mục lưu file
        issue_folder = IssueService._issue_folder(new_issue.id)
        os.makedirs(issue_folder, exist_ok=True)
        new_issue.evidence_file = issue_folder

        # Lưu file nếu có
        if files:
            for file in files:
                _, error = IssueService._save_file(file, new_issue.id)
                if error:
                    db.session.rollback()
                    return None, error

        # Thêm record IssueResolve mặc định
        db.session.add(IssueResolve(issue_id=new_issue.id, team_id=None))

        db.session.commit()
        return new_issue, None

    @staticmethod
    def update(issue_id, data, new_files=None, keep_files=None):
        issue = Issue.query.get(issue_id)
        if not issue:
            return None, "Không tìm thấy Issue."

        # Cập nhật field cơ bản
        for field in [
            "name", "description", "hashtag", "status",
            "severity", "priority", "expire_date", "type_id"
        ]:
            if field in data and data[field] is not None:
                setattr(issue, field, data[field])

        # Cập nhật team_id (nếu có)
        team_id = data.get("team_id")
        if team_id is not None:
            resolve = IssueResolve.query.filter_by(issue_id=issue_id).first()
            if not resolve:
                db.session.add(IssueResolve(issue_id=issue_id, team_id=team_id))
            else:
                resolve.team_id = team_id

        # Quản lý file upload
        issue_folder = IssueService._issue_folder(issue.id)
        os.makedirs(issue_folder, exist_ok=True)
        issue.evidence_file = issue_folder

        existing_files = set(os.listdir(issue_folder)) if os.path.exists(issue_folder) else set()
        keep_files = set(keep_files or [])

        # Xóa file cũ không giữ lại
        for f in existing_files - keep_files:
            os.remove(os.path.join(issue_folder, f))

        # Lưu file mới
        if new_files:
            for file in new_files:
                _, error = IssueService._save_file(file, issue.id)
                if error:
                    db.session.rollback()
                    return None, error

        db.session.commit()
        return issue, None
