# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Goal'
        db.create_table('goals', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('institutional_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.InstitutionalCategory'], db_column='institutional_category_id')),
            ('functional_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.FunctionalCategory'], db_column='functional_category_id')),
            ('goal_number', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('report', self.gf('django.db.models.fields.TextField')()),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['Goal'])


    def backwards(self, orm):
        # Deleting model 'Goal'
        db.delete_table('goals')


    models = {
        'budget_app.budget': {
            'Meta': {'object_name': 'Budget', 'db_table': "'budgets'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'entity': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Entity']", 'db_column': "'entity_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'})
        },
        'budget_app.budgetitem': {
            'Meta': {'object_name': 'BudgetItem', 'db_table': "'budget_items'"},
            'actual': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'economic_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.EconomicCategory']", 'db_column': "'economic_category_id'"}),
            'expense': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'db_column': "'functional_category_id'"}),
            'funding_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FundingCategory']", 'db_column': "'funding_category_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'institutional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.InstitutionalCategory']", 'db_column': "'institutional_category_id'"}),
            'item_number': ('django.db.models.fields.CharField', [], {'max_length': '7'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.economiccategory': {
            'Meta': {'object_name': 'EconomicCategory', 'db_table': "'economic_categories'"},
            'article': ('django.db.models.fields.CharField', [], {'max_length': '2', 'null': 'True'}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'chapter': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'expense': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'heading': ('django.db.models.fields.CharField', [], {'max_length': '9', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'subheading': ('django.db.models.fields.CharField', [], {'max_length': '9', 'null': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.entity': {
            'Meta': {'object_name': 'Entity', 'db_table': "'entities'"},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '10', 'db_index': 'True'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'level': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '50'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.functionalcategory': {
            'Meta': {'object_name': 'FunctionalCategory', 'db_table': "'functional_categories'"},
            'area': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'function': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'policy': ('django.db.models.fields.CharField', [], {'max_length': '3', 'null': 'True'}),
            'programme': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True'}),
            'subprogramme': ('django.db.models.fields.CharField', [], {'max_length': '7', 'null': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.fundingcategory': {
            'Meta': {'object_name': 'FundingCategory', 'db_table': "'funding_categories'"},
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'expense': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'fund': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True'}),
            'fund_class': ('django.db.models.fields.CharField', [], {'max_length': '2', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'source': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.geographiccategory': {
            'Meta': {'object_name': 'GeographicCategory', 'db_table': "'geographic_categories'"},
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'code': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.glossaryterm': {
            'Meta': {'object_name': 'GlossaryTerm', 'db_table': "'glossary_terms'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '4000'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.goal': {
            'Meta': {'object_name': 'Goal', 'db_table': "'goals'"},
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'db_column': "'functional_category_id'"}),
            'goal_number': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'institutional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.InstitutionalCategory']", 'db_column': "'institutional_category_id'"}),
            'report': ('django.db.models.fields.TextField', [], {}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.inflationstat': {
            'Meta': {'object_name': 'InflationStat', 'db_table': "'inflation_stats'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inflation': ('django.db.models.fields.FloatField', [], {}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {})
        },
        'budget_app.institutionalcategory': {
            'Meta': {'object_name': 'InstitutionalCategory', 'db_table': "'institutional_categories'"},
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'department': ('django.db.models.fields.CharField', [], {'max_length': '11', 'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'institution': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': '8', 'null': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.investment': {
            'Meta': {'object_name': 'Investment', 'db_table': "'investments'"},
            'actual': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'null': 'True', 'db_column': "'functional_category_id'"}),
            'geographic_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.GeographicCategory']", 'null': 'True', 'db_column': "'geographic_category_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'project_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.maininvestment': {
            'Meta': {'object_name': 'MainInvestment', 'db_table': "'main_investments'"},
            'actual_end_year': ('django.db.models.fields.IntegerField', [], {'null': 'True'}),
            'address': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'already_spent_amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'area_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'current_year_amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'entity_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'expected_end_year': ('django.db.models.fields.IntegerField', [], {'null': 'True'}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'db_column': "'functional_category_id'"}),
            'geographic_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.GeographicCategory']", 'null': 'True', 'db_column': "'geographic_category_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image_URL': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True'}),
            'latitude': ('django.db.models.fields.FloatField', [], {}),
            'longitude': ('django.db.models.fields.FloatField', [], {}),
            'project_id': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'section_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'start_year': ('django.db.models.fields.IntegerField', [], {'null': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'total_expected_amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.payment': {
            'Meta': {'object_name': 'Payment', 'db_table': "'payments'"},
            'amount': ('django.db.models.fields.BigIntegerField', [], {'db_index': 'True'}),
            'anonymized': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'area': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'db_index': 'True'}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'date': ('django.db.models.fields.DateField', [], {'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'economic_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.EconomicCategory']", 'null': 'True', 'db_column': "'economic_category_id'"}),
            'expense': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'null': 'True', 'db_column': "'functional_category_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'institutional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.InstitutionalCategory']", 'null': 'True', 'db_column': "'institutional_category_id'"}),
            'payee': ('django.db.models.fields.CharField', [], {'max_length': '200', 'db_index': 'True'}),
            'payee_fiscal_id': ('django.db.models.fields.CharField', [], {'max_length': '15', 'db_index': 'True'}),
            'programme': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'budget_app.populationstat': {
            'Meta': {'object_name': 'PopulationStat', 'db_table': "'population_stats'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'entity': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Entity']", 'db_column': "'entity_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'population': ('django.db.models.fields.IntegerField', [], {}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['budget_app']