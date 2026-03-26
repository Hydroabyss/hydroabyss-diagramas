# hydroabyss-diagramas

Repositorio de diagramas y recursos visuales publicados con GitHub Pages para soporte de formación marítima, STCW, convenios IMO y casos de estudio técnicos de HydroAbyss.

## Publicación

- Repositorio: `https://github.com/Hydroabyss/hydroabyss-diagramas`
- Rama: `main`
- GitHub Pages: `https://hydroabyss.github.io/hydroabyss-diagramas/`

## Estructura canónica actual

```text
hydroabyss-diagramas/
├── index.html
├── assets/
│   └── css/
│       └── hydroabyss-core.css
├── casos/
│   └── costa-concordia/
│       ├── index.html
│       ├── app.js
│       ├── scenario.json
│       └── hydroabyss-sim.css
```

Ruta objetivo publicada:

- `https://hydroabyss.github.io/hydroabyss-diagramas/casos/costa-concordia/`

## Archivos publicados

| Archivo | Descripción | URL |
|---|---|---|
| `index.html` | Portada pública de diagramas | `https://hydroabyss.github.io/hydroabyss-diagramas/` |
| `casos/costa-concordia/index.html` | Caso interactivo canónico de Costa Concordia | `https://hydroabyss.github.io/hydroabyss-diagramas/casos/costa-concordia/` |
| `IMO_Convenios_Codigos.html` | Diagrama interactivo sobre convenios y códigos IMO | `https://hydroabyss.github.io/hydroabyss-diagramas/IMO_Convenios_Codigos.html` |
| `Costa_Concordia_Desastre.html` | Caso de estudio técnico sobre la cadena de errores del Costa Concordia | `https://hydroabyss.github.io/hydroabyss-diagramas/Costa_Concordia_Desastre.html` |

## Objetivo del repositorio

Este repositorio sirve como capa pública ligera para:

- publicar diagramas HTML autónomos
- embeber recursos en el blog principal de HydroAbyss
- apoyar contenidos de formación técnica y marítima
- mantener una distribución simple sin backend ni build step

## Stack

- HTML estático
- CSS inline por página
- Mermaid.js vía CDN
- GitHub Pages

## Dependencia externa

Los diagramas interactivos cargan Mermaid desde CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
```

Configuración base utilizada:

```javascript
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#ebe4ff',
    primaryBorderColor: '#673de6',
    primaryTextColor: '#2f1c6a',
    lineColor: '#5025d1',
    fontSize: '12px',
    darkMode: false
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 25,
    rankSpacing: 50,
    useMaxWidth: true
  }
});
```

## Línea visual

El repositorio sigue una versión simplificada del lenguaje visual HydroAbyss:

- base púrpura técnica para GitHub Pages
- superficies blancas para legibilidad de diagramas
- tipografía `Inter, Segoe UI, Arial, sans-serif`
- tarjetas con sombra suave y bordes redondeados
- navegación superior mínima en los documentos largos

Variables compartidas actualmente:

```css
:root {
  --primary: #673de6;
  --primary-dark: #5025d1;
  --meteorite-dark: #2f1c6a;
  --meteorite: #8c85ff;
  --meteorite-light: #d5dfff;
  --primary-light: #ebe4ff;
  --success: #00b090;
  --danger: #fc5185;
  --warning: #ffcd35;
  --azure: #357df9;
  --dark: #1d1e20;
  --gray: #727586;
  --gray-border: #dadce0;
  --gray-light: #f2f3f6;
}
```

## Integración con el blog de HydroAbyss

### Opción recomendada: `iframe`

Caso interactivo canónico:

```html
<iframe
  src="https://hydroabyss.github.io/hydroabyss-diagramas/casos/costa-concordia/"
  width="100%"
  height="960"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(47,28,106,0.15);"
  title="Costa Concordia — Gemelo Digital"
></iframe>
```

```html
<iframe
  src="https://hydroabyss.github.io/hydroabyss-diagramas/IMO_Convenios_Codigos.html"
  width="100%"
  height="800"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(47,28,106,0.15);"
  title="IMO — Convenios y Códigos"
></iframe>
```

```html
<iframe
  src="https://hydroabyss.github.io/hydroabyss-diagramas/Costa_Concordia_Desastre.html"
  width="100%"
  height="900"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(47,28,106,0.15);"
  title="Costa Concordia — Caso de Estudio"
></iframe>
```

### Opción alternativa: tarjeta con enlace externo

```html
<a class="blog-diagram-card" href="https://hydroabyss.github.io/hydroabyss-diagramas/IMO_Convenios_Codigos.html" target="_blank" rel="noopener noreferrer">
  <h3>IMO — Convenios y Códigos</h3>
  <p>Estructura de la OMI, convenios principales, códigos técnicos y conceptos clave.</p>
</a>
```

## Contenido actual

### `IMO_Convenios_Codigos.html`

Incluye:

- flujograma Mermaid sobre IMO, comités, convenios y códigos
- tarjetas de conceptos para IMO, SOLAS, MARPOL, STCW, COLREG, SAR, ISPS e IMDG
- navegación superior simple

### `Costa_Concordia_Desastre.html`

Incluye:

- flujograma causal Mermaid
- cronología del accidente
- violaciones normativas
- análisis técnico y operativo
- operaciones posteriores al siniestro
- lecciones aprendidas para formación marítima

### `casos/costa-concordia/`

Incluye:

- estructura determinista para GitHub Pages
- `index.html` principal del caso
- `app.js` mínimo funcional
- `scenario.json` baseline
- `hydroabyss-sim.css` alineado con HydroAbyss Core

## Flujo de trabajo recomendado

1. Editar el HTML localmente.
2. Probar en navegador.
3. Comprobar que Mermaid renderiza bien en desktop y mobile.
4. Revisar enlaces internos y externos.
5. Hacer commit descriptivo.
6. Subir a `main` para que GitHub Pages publique.

## Reglas de mantenimiento

- mantener cada documento autocontenido
- evitar dependencias adicionales
- no introducir build tools si no son estrictamente necesarias
- mantener URLs estables para no romper `iframe` o enlaces del blog principal
- conservar títulos claros y técnicos
- verificar que los cambios visuales no degraden la legibilidad del contenido

## Relación con HydroAbyss

Este repositorio complementa el sitio principal:

- Web principal: `https://hydroabyss.com`
- Blog corporativo: contenidos técnicos y de formación marítima
- Uso esperado: recursos embebidos o enlazados desde artículos y páginas formativas
