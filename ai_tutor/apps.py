from django.apps import AppConfig


class AiTutorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_tutor'
    
    def ready(self):
        """Import signals when app is ready"""
        import ai_tutor.signals