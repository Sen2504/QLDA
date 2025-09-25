from flask_api.extensions import db
import enum

# Định nghĩa Enum trong Python
class IssueStatus(enum.Enum):
    NEW = "New"
    IN_PROGRESS = "In Progress"
    READ_FOR_TEST = "Ready for test"
    CLOSED = "Closed"
    NEED_INFO = "Need Info"
    REJECTED = "Rejected"
    POSTPONED = "Postponed"

class Severity(enum.Enum):
    WISHLIST = "Wishlist"
    MINOR = "Minor"
    NORMAL = "NORMAL"
    IMPORTANT = "Important"
    CRITICAL = "Critical"

class Priority(enum.Enum):
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"

class Issue(db.Model):
    __tablename__ = "issues"

    id = db.Column("ID_ISSUE", db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT"), nullable=False)
    type_id = db.Column("ID_TYPE", db.Integer, db.ForeignKey("issue_type.ID_TYPE"), nullable=False)
    name = db.Column("NAME", db.String(200), nullable=False)
    description = db.Column("DESCRIPTION", db.Text, nullable=False)
    hashtag = db.Column("HASTAG", db.String(100), nullable=False)
    status = db.Column("STATUS", db.Enum(IssueStatus), nullable=False)
    severity = db.Column("SERVERITY", db.Enum(Severity), nullable=False)
    priority = db.Column("PRIORITY", db.Enum(Priority), nullable=False)
    expire_date = db.Column("EXPIRE_DATE", db.Date, nullable=False)
    evidence_file = db.Column("EVIDENCE_FILE", db.String(200), nullable=False)

    project = db.relationship("Project", back_populates="issues")
    type = db.relationship("IssueType", back_populates="issues")

    def __repr__(self):
        return f"<Issue id={self.id} name={self.name} status={self.status.value}>"
