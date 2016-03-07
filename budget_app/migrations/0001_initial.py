# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Entity'
        db.create_table('entities', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=10, db_index=True)),
            ('level', self.gf('django.db.models.fields.CharField')(max_length=20, db_index=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200, db_index=True)),
            ('slug', self.gf('django.db.models.fields.SlugField')(max_length=50)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['Entity'])

        # Adding model 'EconomicCategory'
        db.create_table('economic_categories', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('expense', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('chapter', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('article', self.gf('django.db.models.fields.CharField')(max_length=2, null=True)),
            ('heading', self.gf('django.db.models.fields.CharField')(max_length=9, null=True)),
            ('subheading', self.gf('django.db.models.fields.CharField')(max_length=9, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['EconomicCategory'])

        # Adding model 'FunctionalCategory'
        db.create_table('functional_categories', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('area', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('policy', self.gf('django.db.models.fields.CharField')(max_length=3, null=True)),
            ('function', self.gf('django.db.models.fields.CharField')(max_length=5, null=True)),
            ('programme', self.gf('django.db.models.fields.CharField')(max_length=5, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['FunctionalCategory'])

        # Adding model 'FundingCategory'
        db.create_table('funding_categories', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('expense', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('source', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('fund_class', self.gf('django.db.models.fields.CharField')(max_length=2, null=True)),
            ('fund', self.gf('django.db.models.fields.CharField')(max_length=5, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['FundingCategory'])

        # Adding model 'InstitutionalCategory'
        db.create_table('institutional_categories', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('institution', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('section', self.gf('django.db.models.fields.CharField')(max_length=8, null=True)),
            ('department', self.gf('django.db.models.fields.CharField')(max_length=11, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['InstitutionalCategory'])

        # Adding model 'Budget'
        db.create_table('budgets', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('entity', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Entity'], db_column='entity_id')),
            ('year', self.gf('django.db.models.fields.IntegerField')(db_index=True)),
            ('status', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['Budget'])

        # Adding model 'BudgetItem'
        db.create_table('budget_items', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('actual', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('expense', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('item_number', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=512)),
            ('amount', self.gf('django.db.models.fields.BigIntegerField')()),
            ('economic_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.EconomicCategory'], db_column='economic_category_id')),
            ('functional_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.FunctionalCategory'], db_column='functional_category_id')),
            ('funding_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.FundingCategory'], db_column='funding_category_id')),
            ('institutional_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.InstitutionalCategory'], db_column='institutional_category_id')),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['BudgetItem'])

        # Adding model 'GlossaryTerm'
        db.create_table('glossary_terms', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=2000)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['GlossaryTerm'])

        # Adding model 'InflationStat'
        db.create_table('inflation_stats', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('year', self.gf('django.db.models.fields.IntegerField')()),
            ('inflation', self.gf('django.db.models.fields.FloatField')()),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['InflationStat'])

        # Adding model 'PopulationStat'
        db.create_table('population_stats', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('entity', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Entity'], db_column='entity_id')),
            ('year', self.gf('django.db.models.fields.IntegerField')()),
            ('population', self.gf('django.db.models.fields.IntegerField')()),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['PopulationStat'])

        # Adding model 'Payment'
        db.create_table('payments', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('budget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.Budget'])),
            ('area', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('functional_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.FunctionalCategory'], null=True, db_column='functional_category_id')),
            ('economic_category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['budget_app.EconomicCategory'], null=True, db_column='economic_category_id')),
            ('economic_concept', self.gf('django.db.models.fields.CharField')(max_length=10, null=True)),
            ('date', self.gf('django.db.models.fields.DateField')(null=True)),
            ('contract_type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('payee', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('expense', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('amount', self.gf('django.db.models.fields.BigIntegerField')()),
            ('updated_at', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('budget_app', ['Payment'])


    def backwards(self, orm):
        # Deleting model 'Entity'
        db.delete_table('entities')

        # Deleting model 'EconomicCategory'
        db.delete_table('economic_categories')

        # Deleting model 'FunctionalCategory'
        db.delete_table('functional_categories')

        # Deleting model 'FundingCategory'
        db.delete_table('funding_categories')

        # Deleting model 'InstitutionalCategory'
        db.delete_table('institutional_categories')

        # Deleting model 'Budget'
        db.delete_table('budgets')

        # Deleting model 'BudgetItem'
        db.delete_table('budget_items')

        # Deleting model 'GlossaryTerm'
        db.delete_table('glossary_terms')

        # Deleting model 'InflationStat'
        db.delete_table('inflation_stats')

        # Deleting model 'PopulationStat'
        db.delete_table('population_stats')

        # Deleting model 'Payment'
        db.delete_table('payments')


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
            'item_number': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
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
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'function': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'policy': ('django.db.models.fields.CharField', [], {'max_length': '3', 'null': 'True'}),
            'programme': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True'}),
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
        'budget_app.glossaryterm': {
            'Meta': {'object_name': 'GlossaryTerm', 'db_table': "'glossary_terms'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
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
        'budget_app.payment': {
            'Meta': {'object_name': 'Payment', 'db_table': "'payments'"},
            'amount': ('django.db.models.fields.BigIntegerField', [], {}),
            'area': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'budget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.Budget']"}),
            'contract_type': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'date': ('django.db.models.fields.DateField', [], {'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'economic_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.EconomicCategory']", 'null': 'True', 'db_column': "'economic_category_id'"}),
            'economic_concept': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'expense': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'functional_category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['budget_app.FunctionalCategory']", 'null': 'True', 'db_column': "'functional_category_id'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'payee': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
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