import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        resend.api_key = settings.RESEND_API_KEY

    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            try:
                params = {
                    "from": message.from_email or settings.DEFAULT_FROM_EMAIL,
                    "to": list(message.to),
                    "subject": message.subject,
                }
                if message.content_subtype == "html":
                    params["html"] = message.body
                else:
                    params["text"] = message.body

                resend.Emails.send(params)
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
