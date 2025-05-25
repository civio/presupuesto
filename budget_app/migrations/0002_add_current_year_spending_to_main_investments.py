# -*- coding: utf-8 -*-

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('budget_app', '0001_initial'),
    ]

    operations = [
        # Rename the existing column
        migrations.RenameField(
            model_name='maininvestment',
            old_name='current_year_amount',
            new_name='current_year_expected_amount',
        ),

        # Add the new column
        migrations.AddField(
            model_name='maininvestment',
            name='current_year_spent_amount',
            field=models.BigIntegerField(null=True),
        ),
    ]
