from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("marketplace", "0002_security_permissions_audit")]

    operations = [
        migrations.RemoveField(model_name="userprofile", name="mfa_secret"),
        migrations.RemoveField(model_name="userprofile", name="mfa_enabled"),
    ]
