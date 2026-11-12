-- The accent-insensitive Spanish search the sites use (SEARCH_CONFIG = 'unaccent_spa'), see INSTALL.md
CREATE EXTENSION IF NOT EXISTS unaccent;
DROP TEXT SEARCH CONFIGURATION IF EXISTS unaccent_spa;
CREATE TEXT SEARCH CONFIGURATION unaccent_spa ( COPY = pg_catalog.spanish );
ALTER TEXT SEARCH CONFIGURATION unaccent_spa
    ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;
