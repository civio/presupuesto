Este repositorio contiene el código de [¿Dónde van mis impuestos?][1], la aplicación de [Civio][4] para visualizar presupuestos públicos. Es un _fork_ de la aplicación desarrollada originalmente para el [Presupuesto Abierto de Aragón][3], que ha evolucionado mucho desde entonces y que usan hoy los Presupuestos Generales del Estado y varios ayuntamientos y comunidades autónomas.

### Introducción
El objetivo del proyecto consiste en ofrecer una visualización de los presupuestos suficientemente intuitiva como para ser comprendida por personas sin experiencia previa en política presupuestaria, pero a la vez suficientemente detallada para permitir a aquellas personas interesadas y expertas en este asunto profundizar más de una manera ágil y efectiva. Así, se muestra la realidad del presupuesto en su conjunto, cubriendo tanto el lado de los ingresos como el de los gastos, y tanto las cantidades presupuestadas como las finalmente ejecutadas (cuando la información esté disponible).

Las principales funcionalidades de la aplicación son:

 * Visualización de gastos e ingresos presupuestados, de forma jerárquica y según las tres clasificaciones usadas en los presupuestos: funcional (para qué se gasta), económica (en qué se gasta, o cómo se ingresa) y orgánica/institucional (quién gasta/ingresa).

 * Mostrar la información de los programas presupuestarios al máximo nivel de desglose existente, el nivel de partida.

 * Mostrar la evolución de los presupuestos a lo largo del tiempo.

 * Permitir la búsqueda de texto libre en el conjunto de los presupuestos para encontrar cualquier dato de forma sencilla.

 * Opcionalmente, mostrar pagos a proveedores, inversiones por distritos y otras secciones que cada instalación activa en su configuración.

Cada instalación tiene su propio tema, con sus datos, plantillas y estilos. Las instrucciones de instalación están en el fichero [`INSTALL.md`](INSTALL.md), y los cambios de cada versión en el [`CHANGELOG.md`](CHANGELOG.md).

[1]: https://dondevanmisimpuestos.es
[3]: https://presupuesto.aragon.es
[4]: https://civio.es

### Licencia

El Gobierno de Aragón a través de Aragón Open Data pone a disposición de usuarios, desarrolladores y comunidad en general la aplicación denominada “Presupuesto Abierto de Aragón - Aragón Open Budget” bajo la Licencia Pública de la Unión Europea “European Union Public Licence – EUPL”. Esta licencia, desarrollada en el seno de la Unión Europea, nació con la intención de ser la licencia bajo la cuál se liberasen los programas y aplicaciones desarrolladas por la Administración Pública y con la característica específica de ser compatible con otras licencias denominadas libres, como la GNU General Public License (GNU/GPL). Estas características dotan, a las aplicaciones así liberadas, de mayor seguridad jurídica y fomentan la interoperabilidad de los servicios de la Administración Electrónica.

Que el código de esta aplicación esté publicado bajo la licencia abierta [EUPL 1.1][2] (European Union Public License 1.1), significa que puedes reutilizarlo, modificarlo y adaptarlo a tus necesidades de forma totalmente libre. Si utilizas el código, a modo de reconocimiento a Aragón Open Data incluye en tu proyecto nuestro logo en el cabecero o en el pie de página, te lo agradeceremos!

<img src="https://presupuesto.aragon.es/static/assets/logo-gobierno-aragon.png" height="28px" /><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>![Logo Aragón Open Data](budget_app/static/assets/logoAragonOpenData.png)

[2]: https://joinup.ec.europa.eu/software/page/eupl

### Agradecimientos

Gracias a <a href="https://www.browserstack.com">BrowserStack</a> por facilitarnos una cuenta Live gratuita para poder mejorar la compatibilidad con Internet Explorer.
