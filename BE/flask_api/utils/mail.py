# BE/flask_api/utils/email.py
from flask_mail import Message
from flask import current_app
from .. import mail


def send_email(subject: str, recipients: list[str], html: str):
    msg = Message(subject=subject, recipients=recipients)
    msg.html = html
    mail.send(msg)