# Changelog
All notable changes to this project will be documented in this file

## [3.1.5] - 2016-06-23
### Changed
- Increased BudgetItem.item_number size to seven characters.

## [3.1.4] - 2016-06-20
### Fixed
- Hide treemap when there's no information to show.

## [3.1.3] - 2016-04-05
### Fixed
- Swap locale order so the theme can override the core.

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
- Version info API on `/version.json`
- Add a default glossary to be loaded if the theme does not contain one
- Add the option to extend the default glossary with the theme file
- Extended options for `load_budget`: supports lists of years and languages
- `load_budget` now can read the budget status from the file `.budget_status`
- Enabled URL localization
- Payment information can now be downloaded in CSV or XLS formats
- Add variables for entity and data sources links in theme settings

### Changed
- Google Analytics ID is now set via `local_settings`
- Added watchers for `.html` and `.js` files

### Fixed
- Fix language filtering when searching any term
- `.less` blob syntax is no longer wrong in `manage.py`

## [3.0] - 2016-02-02
### Added
- Added livereload option to `manage.py`
- Added a watcher to the livereload on `.less` files

### Changed
- Removed `theme-aragon` from the base project

### Forked from [aragonopendata/presupuesto](https://github.com/aragonopendata/presupuesto) - 2016-01-28


[Unreleased]: https://github.com/civio/presupuesto/compare/3.1...HEAD
[3.1]: https://github.com/civio/presupuesto/releases/tag/3.1
[3.0]: https://github.com/civio/presupuesto/releases/tag/3.0
[aragonopendata/presupuesto]: https://github.com/aragonopendata/presupuesto/
