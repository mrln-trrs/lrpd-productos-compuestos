# Productos Compuestos · Casa Novedades Decor

Portafolio web del proyecto final (LRPD) del curso **Gestión de Proyectos** — UPSJB, semestre 2026-II, Grupo 03 (turno Tarde).

![Estado](https://img.shields.io/badge/estado-estable-2e7d32)
![Versión](https://img.shields.io/badge/versión-1.0.0-a4262c)
![Stack](https://img.shields.io/badge/HTML%20%C2%B7%20CSS%20%C2%B7%20JavaScript-sin%20compilación-555)
[![Sitio](https://img.shields.io/badge/sitio-GitHub%20Pages-222)](https://mrln-trrs.github.io/lrpd-productos-compuestos/)

**Sitio publicado:** <https://mrln-trrs.github.io/lrpd-productos-compuestos/>

## Estado del proyecto

**Estable.** Versión entregada y revisada por el equipo. Solo se esperan ajustes menores hasta la nota final del curso.

## Contenido

- Landing del proyecto: problema, solución, requisitos y gestión con PMBOK 8 (EDT, cronograma, costos, riesgos, interesados, calidad).
- Secciones numeradas: descripción, presentación, equipo, ciclo de vida, planificación, seguimiento y control (valor ganado), demo, documentos y cierre.
- **Demo interactiva** del módulo de productos compuestos: venta de combos con validación de componentes, descuento automático de stock, devoluciones, registro y edición de combos por rol, reporte y Kardex.
- Entregables en PDF: informe, acta de constitución, actas de reunión, EDT, cronograma, costeo, presupuestos y lección aprendida.

## Stack

- HTML5, CSS y JavaScript sin dependencias ni paso de compilación.
- Tipografía Inter desde Google Fonts.
- Publicación con GitHub Pages desde la rama `main` (raíz).

## Requisitos

- Un navegador moderno.
- Para verlo en local: Python 3 (o cualquier servidor de archivos estáticos).

## Uso en local

```bash
git clone https://github.com/mrln-trrs/lrpd-productos-compuestos.git
cd lrpd-productos-compuestos
python3 -m http.server
```

Abrir `http://localhost:8000`.

La demo guarda su estado en `localStorage` del navegador; tiene una opción para restablecer los datos de ejemplo.

## Estructura

```text
index.html        Página única con todas las secciones
site.js           Navegación, presentación, cronograma, EDT y visor de documentos
app.js, data.js   Demo del módulo de productos compuestos (datos de ejemplo)
styles.css        Estilos base
fluent.css, soft.css, mobile.css, sobrio.css   Capas de estilo aplicadas en ese orden
assets/docs/      Entregables (PDF, cronograma de ProjectLibre .pod, EDT .drawio)
assets/img/       Imágenes: EDT, Gantt, Ishikawa, actas y hojas de presupuesto
```

## Limitaciones conocidas

- Los estilos están repartidos en cinco hojas encadenadas; cada rediseño se sumó sobre el anterior, por lo que hay reglas que la última capa anula.
- Las imágenes no están optimizadas (`assets/` pesa unos 8,5 MB).
- La demo es una simulación en el navegador: no tiene servidor ni base de datos.

## Autoría

Grupo 03 (turno Tarde), curso Gestión de Proyectos, Universidad Privada San Juan Bautista, 2026-II. Publicación y mantenimiento del sitio: Marlon Torres Espinoza.

## Licencia

Trabajo académico grupal. No se publica bajo una licencia abierta: el contenido y los documentos pertenecen a sus autores.
