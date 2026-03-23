### Instalando en local

Para instalar la aplicación en local es necesario seguir los siguientes pasos:

* Instalar Python. El desarrollo y los despliegues actuales usan Python 3.6, que es la versión recomendada.

* Opcionalmente, crear un entorno separado para la aplicación:

        $ pip install virtualenv
        $ python -m virtualenv env
        $ source env/bin/activate

* Instalar los componentes utilizados por la aplicación. Actualmente, la aplicación se basa en Django 3.2.x:

        $ pip install -r requirements/local.txt

* Borrar base de datos:

        $ dropdb -h localhost presupuestos

* Crear la base de datos:

        $ createdb -h localhost presupuestos

* Copiar `local_settings.py-example` a `local_settings.py` y modificar las credenciales de la base de datos. Elegir la carpeta donde se alojará el THEME o aspecto visual del proyecto.

* Crear el esquema de la base de datos y cargar los datos básicos:

        $ python manage.py migrate

        $ python manage.py load_glossary
        $ python manage.py load_entities
        $ python manage.py load_stats
        $ python manage.py load_budget 2014

### Adaptando el aspecto visual

La aplicación soporta el concepto de 'themes' capaces de modificar el aspecto visual de la web: tanto recursos estáticos (imágenes, hojas de estilo...) como las plantillas que generan el contenido de la web. El repositorio [`presupuesto-pge`](https://github.com/civio/presupuesto-pge) de Civio -una adaptación del software de Aragón Open Data a los Presupuestos Generales del Estado- es un buen ejemplo de cómo puede organizarse el contenido de un theme. Si su proyecto tiene ámbito municipal puede basarse en el repositorio de [`presupuesto-polinya`](https://github.com/civio/presupuesto-polinya)

El theme a usar se configura mediante la variable `THEME` en local_settings.py. Es referenciada en diversos puntos de `settings.py` para instalar los directorios del theme (plantillas y recursos estáticos) justo antes de los de la aplicación principal. (Importante: el nombre de la carpeta donde se despliega el tema no puede incluir guiones, pero sí subrayados: `presupuesto-pge` no, `presupuesto_pge` sí.)

Es necesario compilar todos los recursos estáticos. Para ello, instalamos en el _core_ lo necesario para compilar D3.js:

    $ nvm use
		$ npm install
		$ npm run d3-build

Y en la carpeta del tema lo necesario para compilar SCSS:

		$ cd ./<directorio_del_theme>
		$ npm install
		$ npm run css-build

Podemos dejar el compilador corriendo en segundo plano, y procesará cambios y refrescará el navegador automáticamente:

		$ npm run start

### Configurando el buscador

Por defecto la aplicación usa el método estándar de búsqueda de texto de Postgres. Es posible crear métodos de búsqueda adaptados a un idioma concreto, de forma que -por ejemplo- Postgres ignore los acentos a la hora de buscar resultados. Si deseamos configurar la búsqueda para funcionar en español, creamos primero una nueva configuración de búsqueda, como se explica en la [documentación de Postgres](https://www.postgresql.org/docs/9.1/static/textsearch-configuration.html):

    $ psql presupuestos_dev

    > CREATE EXTENSION unaccent;

    > CREATE TEXT SEARCH CONFIGURATION unaccent_spa ( COPY = pg_catalog.spanish );

    > ALTER TEXT SEARCH CONFIGURATION unaccent_spa
        ALTER MAPPING FOR hword, hword_part, word
        WITH unaccent, spanish_stem;

Mientras hacemos pruebas en `psql` podemos configurar el método de búsqueda por defecto:

    > SET default_text_search_config = 'unaccent_spa';

Pero para usarlo de manera regular debemos configurar la aplicación, vía `local_settings.py`:

    'SEARCH_CONFIG': 'unaccent_spa'

### Arrancando el servidor

* Arrancar el servidor

        $ python manage.py runserver
