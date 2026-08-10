from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0003_remove_mfa_use_recaptcha_v2"),
    ]

    operations = [
        migrations.AlterField(
            model_name="funcionario",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="funcionario",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
