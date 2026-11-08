# Inventario de componentes originales de AURA

Snapshot: commit `b1de123ba858fde1c6f4cc96a275bb332e3315fc` (2026-11-07T00:37:11Z). Las líneas son las del snapshot.
**Todos los archivos de código fuente fueron redactados con asistencia de IA siguiendo las instrucciones del creador**
(ver `AUTHORSHIP.md`, sección 10). La especificación maestra v1.0 tiene como base un texto redactado por el creador.

| Archivo | Descripción | Líneas |
|---|---|---|
| `AURA_MASTER_SPEC.md` | Especificación maestra de producto, ética, privacidad y arquitectura (v1.1: público de 10 a 18 años, Chile) | 502 |
| `src/index.js` | Worker de Cloudflare: rutas `/api/chat`, `/api/models`, `/api/speak`; validación; respaldo de modelos; red de seguridad ante riesgo (`riskContext`); manejo de cupo agotado | 299 |
| `src/systemPrompt.js` | Prompt de sistema: identidad, estilo, crisis, señales indirectas, luz | 77 |
| `public/index.html` | Estructura de la interfaz | 117 |
| `public/styles.css` | Estilos, temas de color, modo presentación y "menos estímulos" | 151 |
| `public/app.js` | Lógica de la interfaz: conversación, voz, comandos de voz, ajustes de luz, medidor de tokens, modo presentación | 677 |
| `public/atom.js` | Átomo de luz en canvas, con estados y reacción al volumen de la voz | 250 |
| `public/_headers` | Cabeceras de seguridad de los archivos estáticos | 5 |
| `public/manifest.webmanifest` | Manifiesto de la aplicación instalable | 37 |
| `public/icon.svg`, `icon-maskable.svg`, `aura.svg` | Íconos vectoriales originales | 20 c/u |
| `public/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Íconos de instalación generados a partir de los SVG | binarios |
| `scripts/make-icons.mjs` | Generador de los íconos | 72 |
| `scripts/eval-models.mjs` | Evaluación comparativa de modelos con escenarios ficticios | 87 |
| `eval/scenarios.json` | 20 escenarios ficticios de evaluación | 42 |
| `test/worker.test.js` | Pruebas automáticas del Worker (29 pruebas) | 304 |
| `wrangler.jsonc` | Configuración de despliegue (sin secretos) | 25 |
| `package.json`, `.gitignore` | Configuración del proyecto | 16 y 6 |
| `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOY.md`, `docs/EVALUATION.md`, `docs/MVP_PROMPT.md` | Documentación | 149, 40, 18, 41, 109 |

## Aportes originales por categoría

1. **Concepción y finalidad:** acompañante de IA para niños, niñas y adolescentes autistas y neurodivergentes, con acceso gratuito.
2. **Reglas de producto y ética:** autonomía, no manipulación, privacidad, honestidad, espacios y permisos, informes.
3. **Diseño de la experiencia:** átomo de luz como identidad, voz y comandos de voz, ajustes sensoriales, modo presentación.
4. **Comportamiento conversacional y seguridad:** contención antes de derivar, señales indirectas, red de seguridad.
5. **Verificación:** escenarios de evaluación y pruebas automáticas.

Los componentes externos se listan en `THIRD_PARTY_NOTICES.md` y no forman parte de este inventario.
