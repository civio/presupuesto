# -*- coding: UTF-8 -*-

import csv
import re

from django.http import Http404, HttpResponse
from django.utils.translation import gettext as _
from functools import reduce
from openpyxl import Workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from tempfile import NamedTemporaryFile

from budget_app.models import Entity, Payment
from budget_app.views import *
from .helpers import get_context, requires_setting


# Note that in these exports we include not only the items at the lowest level of detail
# (i.e. the leaves), but also the mid-level subtotals. There's a reason for this:
# initially there was a clean and consistent budget (Aragon), where all policies and
# articles were broken down to the same level of detail. And it was good. And we could
# output just the leaves knowing all the information was there. Then came the counties
# and towns, with variable level of detail each year, and it got harder to know when
# to output chapters and when articles, although theoretically it was still possible.
# Last came the national budget, where the level of detail depends on the entity publishing
# the data: so we have expense articles broken down to heading and subheading level for
# some parts [1], while the Social Security stops right at the article level [2]. So
# if you globally add the headings (12x) for a particular article (12) it doesn't add up.
# On the screen breakdowns we ensure the subtotal shown for article 12 is correct, and
# we need to make sure that happens on exported data files also. Hence the need for
# including the subtotals in the CSV/XLS files.
#
# [1]: https://www.sepg.pap.minhap.gob.es/Presup/PGE2013Ley/MaestroDocumentos/PGE-ROM/doc/HTM/N_13_E_V_1_101_1_1_2_2_112_1_2.HTM
# [2]: https://www.sepg.pap.minhap.gob.es/Presup/PGE2013Ley/MaestroDocumentos/PGE-ROM/doc/HTM/N_13_E_R_31_2_1_G_1_1_1312C_P.HTM

#
# ENTITY BREAKDOWNS
#
def write_entity_functional_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Política', u'Nombre Política', 'Id Programa', 'Nombre Programa', 'Presupuesto Gasto', 'Gasto Real'])
    for year in sorted(_unique(c['breakdowns']['functional'].years.values())):
        for policy_id, policy in c['breakdowns']['functional'].subtotals.items():
            write_breakdown_item(writer, year, policy, 'expense', [policy_id, None], c['descriptions']['functional'])
            for programme_id, programme in policy.subtotals.items():
                write_breakdown_item(writer, year, programme, 'expense', [policy_id, programme_id], c['descriptions']['functional'])

def write_entity_institutional_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Institución', u'Nombre Institución', u'Id Sección', u'Nombre Sección', 'Presupuesto Gasto', 'Gasto Real'])
    for year in sorted(_unique(c['breakdowns']['institutional'].years.values())):
        for institution_id, institution in c['breakdowns']['institutional'].subtotals.items():
            write_breakdown_item(writer, year, institution, 'expense', [institution_id, None], c['descriptions']['institutional'])
            for section_id, section in institution.subtotals.items():
                write_breakdown_item(writer, year, section, 'expense', [institution_id, section_id], c['descriptions']['institutional'])

def write_entity_economic_breakdown(c, field, writer):
    field_username = 'Gastos' if field == 'expense' else 'Ingresos'
    write_header(writer, [u'Año.csv', u'Id Artículo', u'Nombre Artículo', 'Id Concepto', 'Nombre Concepto', 'Presupuesto '+field_username, field_username+' Reales'])
    for year in sorted(_unique(c['breakdowns']['economic'].years.values())):
        for article_id, article in c['breakdowns']['economic'].subtotals.items():
            write_breakdown_item(writer, year, article, field, [article_id, None], c['descriptions'][field])
            for heading_id, heading in article.subtotals.items():
                write_breakdown_item(writer, year, heading, field, [article_id, heading_id], c['descriptions'][field])

def write_entity_economic_expense_breakdown(c, writer):
    return write_entity_economic_breakdown(c, 'expense', writer)

def write_entity_income_breakdown(c, writer):
    return write_entity_economic_breakdown(c, 'income', writer)

def entity_expenses(request, level, slug, format):
    c = get_context(request)
    entity = Entity.objects.get(level=level, slug=slug, language=c['LANGUAGE_CODE'])
    return entities_show_helper(request, c, entity, _generator('gastos-%s-%s' % (level, slug), format, write_entity_economic_expense_breakdown))

def entity_functional(request, level, slug, format):
    c = get_context(request)
    entity = Entity.objects.get(level=level, slug=slug, language=c['LANGUAGE_CODE'])
    return entities_show_helper(request, c, entity, _generator('gastosf-%s-%s' % (level, slug), format, write_entity_functional_breakdown))

def entity_institutional(request, level, slug, format):
    c = get_context(request)
    entity = Entity.objects.get(level=level, slug=slug, language=c['LANGUAGE_CODE'])
    return entities_show_helper(request, c, entity, _generator('gastosi-%s-%s' % (level, slug), format, write_entity_institutional_breakdown))

def entity_income(request, level, slug, format):
    c = get_context(request)
    entity = Entity.objects.get(level=level, slug=slug, language=c['LANGUAGE_CODE'])
    return entities_show_helper(request, c, entity, _generator('ingresos-%s-%s' % (level, slug), format, write_entity_income_breakdown))


#
# PAYMENTS BREAKDOWN
#
def write_entity_payment_breakdown(c, writer):
    write_header(writer, [u'Año.csv', 'Fecha.csv', u'Área/Política', 'Beneficiario', 'Concepto', 'Cantidad'])
    for payment in c['payments']:
        writer.writerow([
            payment.year,
            payment.date,
            payment.area,
            payment.payee,
            payment.description,
            payment.amount / 100.0
        ])

def entity_payments(request, slug, format):
    c = get_context(request)
    c['payments'] = Payment.objects.all().prefetch_related('budget').order_by("-budget__year")
    return payment_search(request, _generator('pagos-%s' % (slug), format, write_entity_payment_breakdown))


#
# INVESTMENTS BREAKDOWN
#
def write_entity_investments_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Área', u'Nombre Área', 'Presupuesto Gasto', 'Gasto Real'])
    for year in sorted(_unique(c['area_breakdown'].years.values())):
        for area_id, area in c['area_breakdown'].subtotals.items():
            write_breakdown_item(writer, year, area, 'expense', [area_id], c['descriptions']['geographic'])
        for area_id, area in c['no_area_breakdown'].subtotals.items():
            write_breakdown_item(writer, year, area, 'expense', [area_id], c['descriptions']['geographic'])

def write_entity_investment_line_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Línea', u'Nombre Línea', u'Inversión', u'Inversión', 'Presupuesto Gasto', 'Gasto Real'])
    for year in sorted(_unique(c['area_breakdown'].years.values())):
        for line_id, line in c['area_breakdown'].subtotals.items():
            write_breakdown_item(writer, year, line, 'expense', [line_id, None], c['descriptions']['functional'])
            for investment_id, investment in line.subtotals.items():
                write_breakdown_item(writer, year, investment, 'expense', [line_id, investment_id], c['descriptions']['functional'])

def entity_investments_breakdown(request, slug, format):
    return investments(request, _generator('inversiones-%s' % (slug), format, write_entity_investments_breakdown))

def entity_investment_line_breakdown(request, slug, id, format):
    return investments_show(request, id, '', _generator('inversiones-%s-%s' % (slug, id), format, write_entity_investment_line_breakdown))


#
# MAIN INVESTMENTS BREAKDOWN
#
def write_entity_main_investments_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Nombre Área', u'Inversión', u'Presupuesto año en curso', 'Presupuesto total'])
    for year in sorted(_unique(c['area_breakdown'].years.values())):
        for area_id, area in c['area_breakdown'].subtotals.items():
            write_breakdown_item(writer, year, area, 'expense', [area_id, None], None)
            for investment_id, investment in area.subtotals.items():
                write_breakdown_item(writer, year, investment, 'expense', [area_id, investment_id], None)

def entity_main_investments_breakdown(request, slug, format):
    return main_investments(request, _generator('inversiones-principales-%s' % (slug), format, write_entity_main_investments_breakdown))


#
# MONITORING BREAKDOWN
#
def format_progress(score):
    return format(score*100.0, ".2f")

def write_policy_monitoring_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Programa', u'Nombre Programa', u'Cumplimiento %'])

    # Write policy-level results
    for year, score in sorted(c['monitoring_totals'].items()):
        if score != '':
            writer.writerow([
                year,
                '',
                '',
                format_progress(score)
            ])

    # Write programme-level results
    for year, programme_id, programme_number, programme_description in sorted(c['monitoring_programmes']):
        if c['monitoring_totals'].get(year, '') != '':
            if programme_id in c['monitoring_totals_per_programme']:
                programme_data = c['monitoring_totals_per_programme'][programme_id]
                score = programme_data[3]/programme_data[4]
                writer.writerow([
                    year,
                    programme_number,
                    programme_description,
                    format_progress(score)
                ])

@requires_setting('SHOW_MONITORING')
def policy_monitoring_breakdown(request, id, format):
    return policies_show(request, id, '', _generator("%s_objetivos" % id, format, write_policy_monitoring_breakdown))

def write_programme_monitoring_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Sección', u'Cumplimiento %'])

    # Write programme-level results
    for year, score in sorted(c['monitoring_totals'].items()):
        if score != '':
            writer.writerow([
                year,
                '',
                format_progress(score)
            ])

    # Write section-level results
    for year, section_id, section_description in sorted(c['monitoring_sections']):
        if c['monitoring_totals'].get(year, '') != '':
            if section_id in c['monitoring_totals_per_section']:
                section_data = c['monitoring_totals_per_section'][section_id]
                score = section_data[1]/section_data[2]
                writer.writerow([
                    year,
                    section_description,
                    format_progress(score)
                ])

@requires_setting('SHOW_MONITORING')
def programme_monitoring_breakdown(request, id, format):
    return programmes_show(request, id, '', _generator("%s_objetivos" % id, format, write_programme_monitoring_breakdown))


#
# FUNCTIONAL BREAKDOWN
#
def write_functional_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Política', u'Nombre Política', 'Id Programa', 'Nombre Programa', 'Presupuesto Gastos', 'Gastos Reales'])
    for year in sorted(_unique(c['breakdowns']['functional'].years.values())):
        for programme_id, programme in c['breakdowns']['functional'].subtotals.items():
            write_breakdown_item(writer, year, programme, 'expense', [c['policy_uid'], programme_id], c['descriptions']['functional'])

def functional_policy_breakdown(request, id, format):
    return policies_show(request, id, '', _generator("%s.funcional" % id, format, write_functional_breakdown))

def write_functional_programme_breakdown(c, writer):
    write_header(writer, [u'Año.csv', 'Id Programa', 'Nombre Programa', 'Id Subprograma', 'Nombre Subprograma', 'Presupuesto Gastos', 'Gastos Reales'])
    for year in sorted(_unique(c['breakdowns']['functional'].years.values())):
        for subprogramme_id, subprogramme in c['breakdowns']['functional'].subtotals.items():
            write_breakdown_item(writer, year, subprogramme, 'expense', [c['programme_id'], subprogramme_id], c['descriptions']['functional'])

def functional_programme_breakdown(request, id, format):
    return programmes_show(request, id, '', _generator("%s.funcional" % id, format, write_functional_programme_breakdown))

def functional_article_expenditures_breakdown(request, id, format):
    return expense_articles_show(request, id, format, _generator("%s.funcional" % id, format, write_entity_functional_breakdown))

def functional_section_breakdown(request, id, format):
    return sections_show(request, id, format, _generator("%s.funcional" % id, format, write_entity_functional_breakdown))

#
# ECONOMIC BREAKDOWN
#
def write_economic_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Capítulo', u'Nombre Capítulo', u'Id Artículo', u'Nombre Artículo', 'Id Concepto', 'Nombre Concepto', 'Presupuesto Gastos', 'Gastos Reales'])
    for year in sorted(_unique(c['breakdowns']['economic'].years.values())):
        for chapter_id, chapter in c['breakdowns']['economic'].subtotals.items():
            write_breakdown_item(writer, year, chapter, 'expense', [chapter_id, None, None], c['descriptions']['economic'])
            for article_id, article in chapter.subtotals.items():
                write_breakdown_item(writer, year, article, 'expense', [chapter_id, article_id, None], c['descriptions']['economic'])
                for heading_id, heading in article.subtotals.items():
                    write_breakdown_item(writer, year, heading, 'expense', [chapter_id, article_id, heading_id], c['descriptions']['economic'])

def economic_policy_breakdown(request, id, format):
    return policies_show(request, id, '', _generator("%s.economica" % id, format, write_economic_breakdown))

# Item keys are internal ids, `year/code/item_number` with the department in front when
# grouping by uid (see BREAKDOWN_BY_UID). The code is the subheading or the heading, and
# may contain slashes in the PGE (`420/07001`).
ITEM_KEY = re.compile(r'^(?:([^/]*)/)?(\d{4})/(.+)/([^/]*)$')

# Split an item key into department, year, economic code and item number,
# e.g. `000/2015/120/04` into `000`, `2015`, `120`, `04`
def _split_item_key(key):
    match = ITEM_KEY.match(key)
    return match.groups() if match else (None, None, key, '')

# The columns describing an item: its department, if items are kept apart by department, and its code
def _item_columns(c, key):
    department, year, code, number = _split_item_key(key)
    institutional = c['descriptions'].get('institutional', {})
    department_name = institutional.get('%s/%s' % (department, year), institutional.get(department, '')) if department else ''
    return [department, department_name, code, number, c['descriptions']['economic'].get(key, '')]

def write_detailed_economic_breakdown(c, writer):
    write_header(writer, [u'Año.csv', u'Id Capítulo', u'Nombre Capítulo', u'Id Artículo', u'Nombre Artículo', 'Id Concepto', 'Nombre Concepto', 'Id Organismo', 'Nombre Organismo', 'Código Partida', 'Número Partida', 'Nombre Partida', 'Presupuesto Gastos', 'Gastos Reales'])
    descriptions = c['descriptions']['economic']
    for year in sorted(_unique(c['breakdowns']['economic'].years.values())):
        for chapter_id, chapter in c['breakdowns']['economic'].subtotals.items():
            write_breakdown_item(writer, year, chapter, 'expense', [chapter_id, None, None], descriptions, padding=5)
            for article_id, article in chapter.subtotals.items():
                write_breakdown_item(writer, year, article, 'expense', [chapter_id, article_id, None], descriptions, padding=5)
                for heading_id, heading in article.subtotals.items():
                    write_breakdown_item(writer, year, heading, 'expense', [chapter_id, article_id, heading_id], descriptions, padding=5)
                    for item_key, item in heading.subtotals.items():
                        names = [chapter_id, descriptions.get(chapter_id, ''),
                                 article_id, descriptions.get(article_id, ''),
                                 heading_id, descriptions.get(heading_id, '')] + _item_columns(c, item_key)
                        write_breakdown_item(writer, year, item, 'expense', names)

def economic_programme_breakdown(request, id, format):
    return programmes_show(request, id, '', _generator("%s.economica" % id, format, write_detailed_economic_breakdown))

def economic_subprogramme_breakdown(request, id, format):
    return subprogrammes_show(request, id, '', _generator("%s.economica" % id, format, write_detailed_economic_breakdown))

def economic_section_breakdown(request, id, format):
    return sections_show(request, id, '', _generator("%s.economica" % id, format, write_detailed_economic_breakdown))


#
# ECONOMIC ARTICLE BREAKDOWN
#
def write_economic_article_breakdown(c, field, writer):
    field_username = 'Gastos' if field == 'expense' else 'Ingresos'
    write_header(writer, [u'Año.csv', u'Id Artículo', u'Nombre Artículo', 'Id Concepto', 'Nombre Concepto', 'Id Organismo', 'Nombre Organismo', 'Código Partida', 'Número Partida', 'Nombre Partida', 'Presupuesto '+field_username, field_username+' Reales'])
    descriptions = c['descriptions']['economic']
    article_id = c['article_id']
    for year in sorted(_unique(c['breakdowns']['economic'].years.values())):
        write_breakdown_item(writer, year, c['breakdowns']['economic'], field, [article_id, None], descriptions, padding=5)
        for heading_id, heading in c['breakdowns']['economic'].subtotals.items():
            write_breakdown_item(writer, year, heading, field, [article_id, heading_id], descriptions, padding=5)
            for item_key, item in heading.subtotals.items():
                names = [article_id, descriptions.get(article_id, ''),
                         heading_id, descriptions.get(heading_id, '')] + _item_columns(c, item_key)
                write_breakdown_item(writer, year, item, field, names)

def write_economic_article_expense_breakdown(c, writer):
    return write_economic_article_breakdown(c, 'expense', writer)

def write_economic_article_income_breakdown(c, writer):
    return write_economic_article_breakdown(c, 'income', writer)

def economic_article_revenues_breakdown(request, id, format):
    return income_articles_show(request, id, format, _generator("%s.ingresos.economica" % id, format, write_economic_article_income_breakdown))

def economic_article_expenditures_breakdown(request, id, format):
    return expense_articles_show(request, id, format, _generator("%s.gastos.economica" % id, format, write_economic_article_expense_breakdown))

#
# INSTITUTIONAL BREAKDOWN
#
def write_institutional_breakdown(c, writer):
    # Themes without an institutional breakdown hide these downloads, but crawlers still find them
    if c['breakdowns']['institutional'] is None:
        raise Http404
    field_username = 'Gastos' if c['show_side'] == 'expense' else 'Ingresos'
    write_header(writer, [u'Año.csv', 'Id Organismo', 'Nombre Organismo', 'Id Departamento', 'Nombre Departamento', 'Presupuesto '+field_username, field_username+' Reales'])
    for year in sorted(_unique(c['breakdowns']['institutional'].years.values())):
        for institution_id, institution in c['breakdowns']['institutional'].subtotals.items():
            write_breakdown_item(writer, year, institution, c['show_side'], [institution_id, None], c['descriptions']['institutional'])
            for department_id, department in institution.subtotals.items():
                write_breakdown_item(writer, year, department, c['show_side'], [institution_id, department_id], c['descriptions']['institutional'])

def institutional_policy_breakdown(request, id, format):
    return policies_show(request, id, '', _generator("%s.organica" % id, format, write_institutional_breakdown))

def institutional_programme_breakdown(request, id, format):
    return programmes_show(request, id, '', _generator("%s.organica" % id, format, write_institutional_breakdown))

def institutional_subprogramme_breakdown(request, id, format):
    return subprogrammes_show(request, id, '', _generator("%s.organica" % id, format, write_institutional_breakdown))

def institutional_article_revenues_breakdown(request, id, format):
    return income_articles_show(request, id, '', _generator("%s.ingresos.organica" % id, format, write_institutional_breakdown))

def institutional_article_expenditures_breakdown(request, id, format):
    return expense_articles_show(request, id, '', _generator("%s.gastos.organica" % id, format, write_institutional_breakdown))


#
# Helper code to output any CSV/Excel line
#
def write_header(writer, columns):
    writer.writerow(map(lambda column: _(column), columns))

# Padding adds empty columns after the ids, for rows above the deepest level of a breakdown
def write_breakdown_item(writer, year, item, field, ids, descriptions=None, padding=0):
    budget_column_name = str(year)
    actual_column_name = 'actual_'+str(year)
    totals = item.total_expense if field == 'expense' else item.total_income

    if not totals.get(budget_column_name) and not totals.get(actual_column_name):
        return

    values = [year]

    for id in ids:
        values.append(id)
        if descriptions!=None:
            values.append( descriptions.get(id, '') )

    values.extend([None] * padding)

    # The original amounts are in cents:
    values.append( totals[budget_column_name] / 100.0 if budget_column_name in totals else None )
    values.append( totals[actual_column_name] / 100.0 if actual_column_name in totals else None )

    writer.writerow(values)


#
# Helper classes to reuse CSV/Excel generation code
#
class CSVGenerator:
    def __init__(self, filename, content_generator):
        self.filename = filename
        self.content_generator = content_generator

    def generate_response(self, c):
        # Create the HttpResponse object with the appropriate CSV header
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="%s"' % self.filename

        writer = csv.writer(response)
        self.content_generator(c, writer)
        return response

class worksheetWrapper:
    def __init__(self, worksheet):
        self.worksheet = worksheet
        self.current_row = 1

    def writerow(self, values):
        column = 1
        for value in values:
            # Excel doesn't accept control characters, and some source data has them
            if isinstance(value, str):
                value = ILLEGAL_CHARACTERS_RE.sub('', value)
            self.worksheet.cell(column=column, row=self.current_row, value=value)
            column += 1
        self.current_row += 1

class XLSXGenerator:
    def __init__(self, filename, content_generator):
        self.filename = filename
        self.content_generator = content_generator

    def generate_response(self, c):
        workbook = Workbook()
        worksheet = workbook.worksheets[0]
        self.content_generator(c, worksheetWrapper(worksheet))

        # See https://stackoverflow.com/a/58351964
        with NamedTemporaryFile() as tmp:
            workbook.save(tmp.name)
            tmp.seek(0)

            response = HttpResponse(tmp.read(), content_type='application/ms-excel; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="%s"' % self.filename
            return response

def _generator(filename, format, content_generator):
    try:
        return GENERATORS[format]('%s.%s' % (filename, format), content_generator)
    except KeyError:
        raise ValueError("Provided format is not valid: {}. valid values are [csv, xlsx]".format(format))

# Remove duplicates from list, maintaining order
# See https://stackoverflow.com/a/37163210
def _unique(list):
    return reduce(lambda result, x: result.append(x) or result if x not in result else result, list, [])


GENERATORS = {
    'csv': CSVGenerator,
    'xlsx': XLSXGenerator
}
