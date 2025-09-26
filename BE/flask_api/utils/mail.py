# BE/flask_api/utils/email.py
from flask_mail import Message
from flask import current_app
from flask_api.extensions import mail

def send_email(subject: str, recipients: list[str], html: str):
    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER")  
    )
    msg.html = html
    mail.send(msg)
