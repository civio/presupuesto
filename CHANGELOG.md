# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [4.7] - 2025-03-18
### Changed
- Loaders now cache secondary objects to improve performance. #1292
- Loaders insert data in bulk to improve performanc. #1342
- Improve accessibility for screen readers. #1322
- Add placeholder for monitoring page intro text. #1347
- Hide special investments (IFS) outside the applicable year range. #1347
- Allow overriding list of budget data files to load from themes. #1348

### Fixed

## [4.6] - 2023-11-24
### Changed
- Updated Django to version 1.11.29, and modify internal code as needed for compatibility. #80
- Update argument handling in management commands to fit new Django style. #80
- Update `psycopg2` version to 2.8.6 to fix `mod_wsgi` compatibility. #80
- Update `django-compressor` to version 2.4.1. #80
- Make base language always "es", but allow forcing it at homepage. #80 #1283
- Prioritize later-year code descriptions when they are not consistent. #1282
- Enable themes to add notes to only one tab in main chart. #1277
- Fill in empty item descriptions in SimpleBudgetLoader, as we do in BudgetLoader. #1256

### Fixed
- Fix links from treemap in section pages. #1285
- Fix expand button alignment on tables. #1256
- Fix year selector alignment on mobile. #1303

### Removed
- Removed South for database migrations, now part of Django. #80
- Removed Coffin for templates, not needed in modern Django. #80
- Removed Jasmine for testing, replacement needed. #80


## [4.5] - 2023-09-08
### Changed
- Refactor URL generation to use URL names instead of dotted paths, for future Django compatibility. #80
- Define URL patterns using callables, not view names, for future Django compatibility. #80
- Split extra URLs in themes into a separate file. #80
- Monitoring: `SHOW_MONITORING_TAB` is now in `settings.py`, like other properties, not in `local_settings.py`. #1216

### Fixed
- Fix accessibility compliance issues. #1278
- Petals in monitoring viz should not clickable when in widget.

### Removed
- Deleted custom loader for Aragon counties and towns.

## [4.4] - 2023-08-23
### Added
- Monitoring: Add new Monitoring section (goals, activities and indicators), controlled via `SHOW_MONITORING_TAB`. #1216 #1213 #1203
- Main investments: Add new Main Investments section, controlled via `SHOW_MAIN_INVESTMENTS`. #1109 #1163 #1176 #1253
- Guided visit: Add new guided visit section. #1085
- Investment: Add support for special investments (IFS). #858
- Add support for Plausible analytics. #1269
- Add TERMS_PAGE_LENGTH settings variable. #846
- Add management command to remove entities budget.

### Changed
- Add BeautifulSoup4 dependency.
- Update Javascript and Python dependencies. #1061 #1182
- Ignore Mailchimp query parameters when caching. #313
- Link to particular year for items in search results. #1268
- Make SimpleBudgetLoader more flexible for institutional categories.
- Share in Facebook without an application ID. Remove `FACEBOOK_ID` setting. #1257
- Google Analytics IDs must refer now to GA4. #1269
- Increase programme description length, to acommodate PGE 2022 data. #1124
- Increase description length in glossary terms. #846
- Remove unused `load_execution` command.
- Remove Google+ sharing button. #1203

### Fixed
- Fix accessibility compliance issues. #834 #1126
- Fix payee names including XHTML-encoded characters in payments page. #871
- Avoid overlapping labels in year axis for stacked charts. #1158
- Improve compatibility of XLSX generation. #1063
- Fix encoding errors on loading error messages. #1203 #1217 #1259
- Fix error in percentage over total in the execution column. #1024
- Fix search results count when no payments are found. #876
- Fix search results link when subprogrammes are active. #597
- Fix population retrieval for missing years. #829

## [4.3.2] - 2018-12-04
### Changed
- Updated Civio logo.
- Improved select elements performance in payments section.

### Fixed
- Removed dangling print sentence.

## [4.3.1] - 2018-09-03
### Added
- Pipenv support.

### Changed
- Updated Javascript dependencies.
- Added additional data on `version.json` API response.

## [4.3] - 2018-07-22
### Added
- Investments: Add new investment section, controlled via `SHOW_INVESTMENTS`. #527 #581
- Payments: Add institutional, fiscal ID and min/max amount filters. #673 #677 #710
- Payments: Add support for a third result tab, by department. #710
- Payments: Add 'clear filters' button. #710 #755
- Add sitemap, referenced from `robots.txt`. #138
- Add format selector and embed support to Overview page. #602
- Add active year as URL parameter, enabling linking into current year. #199
- Add CSV/XLS support for subprogrammes, institutional breakdown and investments. #346 #527
- Add support for `0M` budget status.

### Changed
- Glossary: loader now supports multiple languages as parameter.
- Overview: improved visibility of labels in new Overview chart.
- Payments: keep active filters when clicking on a summary table element. #510
- Payments: don't group search results by active filters. #572
- Payments: Improved legilibility of payment query explanation. #710
- Payments: Remove unused fields from Payment model. #667
- Payments: Update Chosen to 1.8.5 to search correctly even when punctuation exists. #729
- Search: Don't search for payments if the Payments tab is hidden. #700
- Search: Empty searches not allowed anymore. #571
- Summary bar chart now includes all text labels and hides them when the width is too small. #643
- Remove data points that equal zero from stacked charts. #580
- Remove legends with more than 50 elements from stacked charts and improve handling of long names. #450
- Translate column names in CSV/XLS files. #287
- Improve `clean_budgets` functionality to cover economic categories. #495
- Replace elements incompatible with Django 1.5. Impacts how extra theme URLs were defined. #80

### Fixed
- Payments: handle single quotes in payee names correctly. #267 #561
- Payments: sanitize query values to avoid XSS vulnerabilities. #457
- Overview: Fixed IE issues with new Overview chart. #578
- Overview: support HTML entities in old Sankey legend. #744
- Search: Search parameters are preserved when switching languages. #570
- Search: Show only items for the current language when searching across all years. #187
- Search: Avoid duplicated headings and articles when searching across all years. #604
- Search: Links to articles were always linking to the expense side, incorrectly. #671
- Don't crash the app when accessing a programme/article page with no data. #495
- Minor i18n clean-up and fixes. #740 #765

## [4.2.1] - 2017-12-09
### Changed
- Expand support for secondary pages: detail pages now supported. #105
- Payments loader now supports multiple entities, but default behaviour is not changed. #105
- Amend Basque glossary to match Spanish one.
- Overview: Improve label readability in new visualization.

### Fixed
- Payments hero box in homepage was not reacting to clicks.
- Render meta tags in safe mode to display quotes correctly.
- Avoid form submit in tax receipt.
- Fix the appearence of the year slider when only one year is available.
- Fix 'thousands' and 'millions' abbreviations for Basque.
- Accessibility: hide policies treemap for screen readers.
- Accessibility: translate policies table header.
- Accessibility: use list instead table for Glossary terms.
- Payments: starting year now set to last available when year range is disabled.

## [4.2] - 2017-10-17
### Added
- Add support for breadcrumbs, controlled via `SHOW_BREADCRUMBS`.
- Add new Overview visualization, an alternative to existing Sankey. Enable with `OVERVIEW_USE_NEW_VIS`.
- The content of meta fields can now be populated dynamically by themes. #469
- Add pages for secondary entities, a generic version of Aragon's counties and towns. #105
- `PAYMENTS_YEAR_RANGE` setting to configures payment slider as range or single year.
- Add content to the default cookies page.

### Changed
- Improved layout of data visualizations in mobile resolutions.
- Budget loader now supports multiple entities, but default behaviour is not changed. #105
- Add support for year ranges and multiple language parameters to payment loader.

### Fixed
- Accessibility improvements to comply with AENOR N certification.


## [4.1] - 2017-06-20
### Added
- Add support for subprogrammes, including loader, view and templates. #210
- Add support for proposed budget in Stacked Area Chart viz. #330
- Add institutional (section) pages, optional, configurable via `SHOW_SECTION_PAGES`. #347.
- Add new budget status (`PR`) to support proposed budgets. #326
- Add new budget status (`T0`) for budgets where no execution data is available yet. #367
- Add budget status labels for months.
- Add embed button for treemaps.
- Add setting `ADD_ECONOMIC_CATEGORIES_PREFIX` to include codes in items' descriptions. #326
- Add setting `BREAKDOWN_BY_UID` to group budget items per uid or subheading. #326
- Show non-financial totals in detailed policy pages. #364
- Add support for `TREEMAP_LABELS_MIN_SIZE` setting. #349
- Add support for `FACEBOOK_ID` setting. #363
- Create a management command to remove unusued functional categories from DB. #372
- Include articles (and sections, if institutional pages are on) in search results. #370
- Generate a bundle with D3 modules for budget treemap with `npm` & `rollup`.
- Add `TREEMAP_GLOBAL_MAX_VALUE` setting to (optionally) share the same scale across tabs.
- Add total amount/count stats to payment summary searches. #455

### Changed
- Adapt Sankey chart to D3.js v4.
- Ignore lines starting with # on budget loader.
- Randomize order of featured programmes in homepage.
- Load execution data as part of loading a budget, also for the 'not simple' loader.
- Sort data in CSV/XLS files by year, to avoid confusion. #362
- Split `welcome#index` in different partials. #376
- Move `version.json` and `robots.txt` outside the i18n paths. #262
- Make TaxReceipt more flexible using a taxes object to define form taxes.
- Remove treemap position transition in setup & resize.
- Reimplement grid_formatters using `d3.format` instead of `numeral.js`.
- Support payment searches with no parameters.

### Fixed
- Fix typo in the glossary link title in the navigation header.
- Refactor, clean-up and fix code handling (non-)financial totals. #340
- Fix glossary button click. #366
- Fix error when paginating search URLs with Unicode characters. #293
- Remove unnecessary Javascript dependencies in widget code. #377
- Make sure budget summary labels and colors are correct even if order is different on year change. #354
- Clean up and refactor away from templates the code handling the back button.
- Ignore empty descriptions when building in-memory master table of descriptions. #361
- Fix `BudgetTreemap` to avoid childs with negative values.
- Fix gaps in stacked area chart & years slider when one year is missing. #301
- Translate dataTables message when table is empty to Spanish.
- Fix CSV/XLS payment downloads when no filters applied. #455
- Make CSV delimiter configurable for the simple budget loader.
- Avoid issues with single quotes in budget status translations.
- Remove extra spaces from glossary.

## [4.0] - 2016-10-14
### Added
- Nodes in the global view chart can now be customized and combined as needed.
- Nodes in Sankey chart can now be combined and labelled as will.
- Sankey chart layout aggressiveness can be configured from the theme settings.
- Labels in Sankey chart can now be localized.
- Added subtotals list in Overview totals panel.
- Clicking on a functional stacked area chart takes you to the programme page.
- Search layout for payments.
- Make list of biggest payment beneficiaries configurable.
- Redesign initial state of payment page to show area breakdown. #215
- Add `data_sources_extra` partial for custom theme notes.
- Support custom links in complex Sankey charts. #227
- Make Sankey node padding configurable. #246
- Create a Javascript file for themes. #230
- Make number of featured programmes configurable. #246
- Add a new (optional) institutional treemap to the Policy page. #326
- Support overriding `STATIC_URL` setting from local settings. #236
- Make database port and host configurable from local settings. #295
- Make CSV delimiter configurable for the 'non-simple' budget loader.
- Add Catalan, Basque, English and Galician translations.

### Changed
- Major front-end rewrite, now using Bootstrap 3.
- Policy chart now reimplemented using plain D3.js. NVD3 dependency removed.
- Default locale changed from `es_ES` to just `es` for clarity and simplicity.
- Improve year slider changing jslider plugin by [bootstrap-slider](https://seiyria.com/bootstrap-slider/)
- Localised URLs don't have a language prefix if only one language is available.
- Tax receipt is aware of whether financial chapters have to be included or not.
- Update & translate metatags & improve base markup.
- Unify JS files in 2 main files & move the big one to the footer.
- Remove payments year slider if there's only one year.
- Disable SQL console logging when loading data, so we can see the errors.
- Improvements to payment downloads: refactored code, download only filtered data, use XLSX... #215 #223
- Make inflation-adjustment in overview page optional. #229
- Improve footer image links markup in order to allow theme-customization.
- Adapt budget treemap and stacked area chart visualizations to D3.js v4.
- Add `ANALYTICS_CODE` from theme settings instead of `local_settings`.
- Allow theme loaders to return null budget items if needed.
- Increased BudgetItem.item_number size to seven characters. #264
- Avoid hardcoding language for `numeral.js`, and add support for Catalan, Basque and Galician. #274
- Make sure number formatting is not hardcoded across the application. #274
- Remove unused Bootstrap 3 dependencies.
- Go back to the previously active tab from detail pages. #272
- Anonymized payments are not included in list of biggest payees. #246
- Amend budget loader so length of institutional fields is not hardcoded.

### Fixed
- Site cache is now working again, after fixing HTTP headers.
- Root url now works again in production when no locale is specified.
- Friendly URLs were cut at the first single quote. Not anymore.
- Pagination controls fixed to show only a range of pages, not all available.
- 'Back to Sankey' button in policy page didn't work in multi-language setting.
- IE9 & above support.
- Make sure the list of biggest payees includes only data for the current language. #222
- Don't show execution part in Sankey pop-up when no info available.
- Fix crash in Chrome/Windows when acceding to Policies page, merging all the treemaps. #52
- Fixed accesibility issues (e.g. from `b` to `strong`, duplicated ids...) raised by Barcelona.
- Fix page HTML titles, were blank or not i18n. #246
- Hide treemap when there's no information to show. #260
- Fix article data downloads, were showing always income side. #273
- Make sure descriptions for income and expense economic concepts don't get mixed. #277
- Fix pop-up messages in stacked chart after one item is selected. #279
- Improve Sankey layout on edge scenarios (e.g. missing data, tiny values, budget mismatches). #283
- Avoid Javascript error when hovering Sankey's central node. #304
- Fix missing inflation year in tax receipt page footer. #309
- Fix wrong accent marks in messages for embedded charts. #311
- Clicks in a policy treemap, when shown, now leads to the selected programme. #258

## [3.1.5] - 2016-06-23
### Changed
- Convert existing application to South. #194
- Add programme description column to payments. #161
- Increased BudgetItem.item_number size to seven characters. #264

## [3.1.4] - 2016-06-20
### Fixed
- Hide treemap when there's no information to show. #260

## [3.1.3] - 2016-04-05
### Fixed
- Swap locale order so the theme can override the core. #136

## [3.1.2] - 2016-03-06
### Fixed
- Root url now works again in production when no locale is specified.

## [3.1.1] - 2016-03-06
### Changed
- Tax receipt is aware of whether financial chapters have to be included or not.
- Default locale changed from es_ES to just es for clarity and simplicity.

### Fixed
- Friendly URLs were cut at the first single quote. Not anymore.
- 'Back to Sankey' button in policy page didn't work in multi-language setting.
- Update language menu to match new i18n configuration.

## [3.1] - 2016-02-15
### Added
- Version info API on `/version.json`.
- Add a default glossary to be loaded if the theme does not contain one.
- Add the option to extend the default glossary with the theme file.
- Extended options for `load_budget`: supports lists of years and languages.
- `load_budget` now can read the budget status from the file `.budget_status`.
- Enabled URL localization.
- Payment information can now be downloaded in CSV or XLS formats.
- Add variables for entity and data sources links in theme settings.

### Changed
- Google Analytics ID is now set via `local_settings`.
- Added watchers for `.html` and `.js` files.

### Fixed
- Fix language filtering when searching any term.
- `.less` blob syntax is no longer wrong in `manage.py`.

## [3.0] - 2016-02-02
### Added
- Added livereload option to `manage.py`.
- Added a watcher to the livereload on `.less` files.

### Changed
- Removed `theme-aragon` from the base project

### Forked from [aragonopendata/presupuesto](https://github.com/aragonopendata/presupuesto) - 2016-01-28


[Unreleased]: https://github.com/civio/presupuesto/compare/v4.7...HEAD
[4.7]: https://github.com/civio/presupuesto/releases/tag/v4.7
[4.6]: https://github.com/civio/presupuesto/releases/tag/v4.6
[4.5]: https://github.com/civio/presupuesto/releases/tag/v4.5
[4.4]: https://github.com/civio/presupuesto/releases/tag/v4.4
[4.3.2]: https://github.com/civio/presupuesto/releases/tag/v4.3.2
[4.3.1]: https://github.com/civio/presupuesto/releases/tag/v4.3.1
[4.3]: https://github.com/civio/presupuesto/releases/tag/v4.3
[4.2.1]: https://github.com/civio/presupuesto/releases/tag/v4.2.1
[4.2]: https://github.com/civio/presupuesto/releases/tag/v4.2
[4.1]: https://github.com/civio/presupuesto/releases/tag/v4.1
[4.0]: https://github.com/civio/presupuesto/releases/tag/v4.0
[3.1]: https://github.com/civio/presupuesto/releases/tag/v3.1
[3.0]: https://github.com/civio/presupuesto/releases/tag/v3.0
[aragonopendata/presupuesto]: https://github.com/aragonopendata/presupuesto/
