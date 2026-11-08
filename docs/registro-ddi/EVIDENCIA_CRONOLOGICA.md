# Evidencia cronológica de desarrollo

> Generada el 2026-11-08 a partir del historial real de Git y de la API de GitHub. **No se reescribió ni se alteró el
> historial.** Los campos de autor y fecha de un commit los declara quien lo crea y **no son prueba por sí solos**; las
> fechas de GitHub (creación del repositorio, fusiones) las registra el servidor y son un respaldo más sólido.

## 1. Hechos principales

| Hecho | Valor | Fuente |
|---|---|---|
| Repositorio | https://github.com/chrisalainibacache/Aura (público) | GitHub |
| Creación del repositorio | 2026-11-03T20:20:35Z | API de GitHub (`created_at`) |
| Primer commit | `df16877d60240338574b2ae73ac89a2e3a82d32c`, 2026-11-03T17:28:44-03:00, "Initial commit", cuenta `chrisalainibacache` (solo `README.md`) | Git |
| Commits totales al 2026-11-06 (`b1de123`) | 48 | Git |
| Autores registrados | 26 commits "Claude" (herramienta de IA que redactó el código) y 22 commits `chrisalainibacache` (commit inicial y 21 fusiones) | `git shortlog` |
| Propuestas fusionadas | 21 (#1 a #21), todas abiertas desde `chrisalainibacache` | API de GitHub |
| Última fusión analizada | PR #21, `b1de123ba858fde1c6f4cc96a275bb332e3315fc`, 2026-11-07T00:37:11Z | GitHub |
| Etiquetas (tags) y releases | Ninguna | Git y GitHub |
| Licencia publicada | Ninguna | GitHub |
| Avisos de autoría previos en el repositorio | Ninguno | `git grep` |

Los commits de la herramienta incluyen la línea `Claude-Session: https://claude.ai/code/session_01NQwrW6ZpvLu2LScyZEkEiG`,
que identifica la sesión de desarrollo y sirve de referencia a la conversación completa (instrucciones, decisiones y pruebas).

## 2. Hitos: propuestas fusionadas a `main`

| PR | Fusionado (UTC) | Commit de fusión | Abierto por | Título |
|---|---|---|---|---|
| #1 | 2026-11-03T22:35:32Z | `38ca8c5` | chrisalainibacache | MVP conversacional de AURA (Fase 1) y especificación maestra |
| #2 | 2026-11-06T00:03:06Z | `9f4ec87` | chrisalainibacache | Documentar despliegue en Cloudflare |
| #3 | 2026-11-06T00:06:46Z | `83f9538` | chrisalainibacache | AURA instalable en el teléfono (manifiesto e íconos) |
| #4 | 2026-11-06T00:10:24Z | `53ff5a0` | chrisalainibacache | Diagnóstico: código de referencia en errores del modelo |
| #5 | 2026-11-06T21:41:07Z | `6f5cc0f` | chrisalainibacache | Interfaz de átomo de luz con voz opcional |
| #6 | 2026-11-06T21:42:42Z | `6bbc806` | chrisalainibacache | Respaldo de modelos y parámetros mínimos ante fallo de Workers AI (error 5028) |
| #7 | 2026-11-06T21:53:28Z | `863d345` | chrisalainibacache | Fijar modelo llama-3.1-8b-instruct-fast como principal |
| #8 | 2026-11-06T22:13:18Z | `5ea49b9` | chrisalainibacache | Controles compactos, selector de voz, comandos de voz y medidor de tokens |
| #9 | 2026-11-06T22:17:00Z | `ef65cc1` | chrisalainibacache | Mensaje claro cuando se agota el cupo diario de Workers AI |
| #10 | 2026-11-06T22:26:01Z | `2705e07` | chrisalainibacache | Prompt de crisis que contiene antes de derivar, y botón para copiar la conversación |
| #11 | 2026-11-06T22:34:44Z | `3e83130` | chrisalainibacache | Prompt: señales indirectas de riesgo, sin fingir sentimientos y límites con gracia |
| #12 | 2026-11-06T22:42:49Z | `7aef49d` | chrisalainibacache | Modelo principal para la demo: llama-3.3-70b (8B como respaldo) |
| #13 | 2026-11-06T22:45:44Z | `cd5db65` | chrisalainibacache | Laboratorio: selector de modelo y botón "Reintentar con otro modelo" |
| #14 | 2026-11-06T22:50:46Z | `01c0427` | chrisalainibacache | Conversación por voz sin teclado (tocar el átomo) |
| #15 | 2026-11-06T23:04:08Z | `05ea9e9` | chrisalainibacache | Modo presentación: solo el átomo y AURA siempre responde con voz |
| #16 | 2026-11-06T23:42:21Z | `ea96964` | chrisalainibacache | Voz propia de AURA con texto a voz de Workers AI (con respaldo al teléfono) |
| #17 | 2026-11-06T23:46:31Z | `96e8b28` | chrisalainibacache | Voz más humana: sin aclaraciones de currículum y hablando desde la conversación |
| #18 | 2026-11-06T23:50:53Z | `8681038` | chrisalainibacache | Átomo vivo en alta resolución que late con la voz de AURA |
| #19 | 2026-11-07T00:25:51Z | `80a7550` | chrisalainibacache | Detectar ideación pasiva ("desaparecer"), no copiar ejemplos y reforzar el riesgo desde el servidor |
| #20 | 2026-11-07T00:33:57Z | `29236fe` | chrisalainibacache | Ajustes de luz: 5 colores, intensidad y giro (Laboratorio, órdenes y AURA con permiso) |
| #21 | 2026-11-07T00:37:11Z | `b1de123` | chrisalainibacache | Íconos nuevos: átomo brillante (instalación y pantalla de carga) |

## 3. Inventario completo de commits

| N.º | Commit | Fecha (ISO 8601) | Autor registrado en Git | Descripción |
|---|---|---|---|---|
| 1 | `df16877` | 2026-11-03T17:28:44-03:00 | chrisalainibacache | Initial commit |
| 2 | `408e0f7` | 2026-11-03T20:57:02+00:00 | Claude | docs: add AURA master specification |
| 3 | `29604fa` | 2026-11-03T20:59:13+00:00 | Claude | docs: add MVP implementation prompt (phase 1) |
| 4 | `7e7cac8` | 2026-11-03T21:02:09+00:00 | Claude | docs: define target audience (Chile, ages 10-18) and adapt spec |
| 5 | `43e3927` | 2026-11-03T21:05:26+00:00 | Claude | feat: MVP conversacional (Fase 1) con Worker, Workers AI e interfaz responsive |
| 6 | `3a900db` | 2026-11-03T22:31:37+00:00 | Claude | feat: add model evaluation scenarios, comparison script and docs |
| 7 | `38ca8c5` | 2026-11-03T19:35:32-03:00 | chrisalainibacache | Merge pull request #1 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 8 | `27ea9eb` | 2026-11-06T00:02:53+00:00 | Claude | docs: document Cloudflare deployment setup |
| 9 | `9f4ec87` | 2026-11-05T21:03:06-03:00 | chrisalainibacache | Merge pull request #2 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 10 | `99b81be` | 2026-11-06T00:06:32+00:00 | Claude | feat: make AURA installable on phones (manifest and icons) |
| 11 | `83f9538` | 2026-11-05T21:06:46-03:00 | chrisalainibacache | Merge pull request #3 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 12 | `1716999` | 2026-11-06T00:10:09+00:00 | Claude | fix: include numeric AI error reference to diagnose model failures |
| 13 | `53ff5a0` | 2026-11-05T21:10:23-03:00 | chrisalainibacache | Merge pull request #4 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 14 | `c48a429` | 2026-11-06T21:40:52+00:00 | Claude | feat: atom-of-light interface with optional voice and calm mode |
| 15 | `6f5cc0f` | 2026-11-06T18:41:07-03:00 | chrisalainibacache | Merge pull request #5 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 16 | `93a1f61` | 2026-11-06T21:42:26+00:00 | Claude | fix: try fallback models and minimal params when Workers AI call fails |
| 17 | `6bbc806` | 2026-11-06T18:42:41-03:00 | chrisalainibacache | Merge pull request #6 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 18 | `839e351` | 2026-11-06T21:53:05+00:00 | Claude | chore: pin MODEL_ID to llama-3.1-8b-instruct-fast (original id fails with 5028) |
| 19 | `d9675a4` | 2026-11-06T21:53:17+00:00 | Claude | docs: use working model id in evaluation example |
| 20 | `863d345` | 2026-11-06T18:53:28-03:00 | chrisalainibacache | Merge pull request #7 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 21 | `af496da` | 2026-11-06T22:13:02+00:00 | Claude | feat: compact controls, voice selector, mic voice commands and token meter |
| 22 | `5ea49b9` | 2026-11-06T19:13:17-03:00 | chrisalainibacache | Merge pull request #8 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 23 | `4f7ba89` | 2026-11-06T22:16:48+00:00 | Claude | feat: clear message when Workers AI daily quota is exhausted |
| 24 | `ef65cc1` | 2026-11-06T19:17:00-03:00 | chrisalainibacache | Merge pull request #9 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 25 | `8cc710e` | 2026-11-06T22:25:53+00:00 | Claude | feat: contain-first crisis prompt (draft) and copy-conversation button |
| 26 | `2705e07` | 2026-11-06T19:26:01-03:00 | chrisalainibacache | Merge pull request #10 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 27 | `65f5b8b` | 2026-11-06T22:34:28+00:00 | Claude | fix: indirect risk signals, no faked feelings, graceful limits in system prompt |
| 28 | `3e83130` | 2026-11-06T19:34:43-03:00 | chrisalainibacache | Merge pull request #11 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 29 | `d594ae6` | 2026-11-06T22:42:33+00:00 | Claude | chore: use llama-3.3-70b as primary model for the demo, 8b as fallback |
| 30 | `7aef49d` | 2026-11-06T19:42:48-03:00 | chrisalainibacache | Merge pull request #12 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 31 | `15dba91` | 2026-11-06T22:45:29+00:00 | Claude | feat: lab selector and retry-with-another-model button (allowlisted models) |
| 32 | `cd5db65` | 2026-11-06T19:45:44-03:00 | chrisalainibacache | Merge pull request #13 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 33 | `01c6066` | 2026-11-06T22:50:29+00:00 | Claude | feat: hands-free voice conversation mode (tap the atom) |
| 34 | `01c0427` | 2026-11-06T19:50:46-03:00 | chrisalainibacache | Merge pull request #14 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 35 | `83e12bd` | 2026-11-06T23:03:44+00:00 | Claude | feat: clean presentation mode (atom only, AURA always speaks) |
| 36 | `05ea9e9` | 2026-11-06T20:04:07-03:00 | chrisalainibacache | Merge pull request #15 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 37 | `b8cadf9` | 2026-11-06T23:42:04+00:00 | Claude | feat: AURA voice from Workers AI text-to-speech with device fallback |
| 38 | `ea96964` | 2026-11-06T20:42:20-03:00 | chrisalainibacache | Merge pull request #16 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 39 | `48fd22f` | 2026-11-06T23:44:48+00:00 | Claude | feat: human voice in prompt, stop reciting disclaimers, speak from this conversation |
| 40 | `96e8b28` | 2026-11-06T20:46:31-03:00 | chrisalainibacache | Merge pull request #17 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 41 | `a4acfbd` | 2026-11-06T23:50:36+00:00 | Claude | feat: high-resolution living atom in canvas, audio-reactive while speaking |
| 42 | `8681038` | 2026-11-06T20:50:53-03:00 | chrisalainibacache | Merge pull request #18 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 43 | `b812efb` | 2026-11-07T00:25:33+00:00 | Claude | fix: detect passive suicidal ideation, stop copying examples, one question, server-side risk reinforcement |
| 44 | `80a7550` | 2026-11-06T21:25:50-03:00 | chrisalainibacache | Merge pull request #19 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 45 | `2a3e3da` | 2026-11-07T00:33:40+00:00 | Claude | feat: light settings (5 colors, intensity, rotation) via lab, typed/voice commands and AURA tags |
| 46 | `29236fe` | 2026-11-06T21:33:57-03:00 | chrisalainibacache | Merge pull request #20 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |
| 47 | `ffee2ec` | 2026-11-07T00:36:55+00:00 | Claude | feat: new AURA icons (glowing atom), separate maskable/any/apple icons |
| 48 | `b1de123` | 2026-11-06T21:37:11-03:00 | chrisalainibacache | Merge pull request #21 from chrisalainibacache/ccr-07b2f8e7-nz8x23 |

## 4. Lo que el historial no puede probar, y cómo reforzarlo

- **Fechas anteriores al 2026-11-03.** El repositorio no contiene rastros previos. Si existen borradores, notas, chats o
  archivos anteriores con fecha, deben conservarse aparte (no subirlos si contienen datos personales) y documentarse; no se
  deben inventar ni reconstruir.
- **Quién escribió cada línea.** Git muestra el autor registrado, no el origen creativo (ver `AUTHORSHIP.md`, sección 10).
  La conversación de desarrollo, identificada por el `Claude-Session` de los commits, complementa la evidencia: se
  recomienda **exportar y guardar una copia** (fuera del repositorio público).
- **Fortalecer la fecha cierta.** Se recomienda: (1) crear una etiqueta de versión y un *release* en GitHub tras la
  revisión; (2) conservar la huella de integridad (`MANIFIESTO_INTEGRIDAD.md`); (3) evaluar con un abogado medios
  adicionales de fecha cierta; y (4) guardar una copia local del repositorio completo (`git clone --mirror`).
