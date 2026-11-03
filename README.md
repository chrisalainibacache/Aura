# AURA

Acompañante con IA para niños, niñas y adolescentes (10 a 18 años) con autismo, en Chile.
Documento rector: [`AURA_MASTER_SPEC.md`](AURA_MASTER_SPEC.md). Prompt de implementación: [`docs/MVP_PROMPT.md`](docs/MVP_PROMPT.md).

> **Estado: Fase 1 (MVP conversacional), solo prueba técnica.**
> Usar únicamente con datos ficticios. **No usar con menores reales** hasta contar con
> revisión profesional del protocolo de seguridad, supervisión adulta y revisión legal
> (ver secciones 9 y 13 de la especificación).

## Qué incluye

- Interfaz de conversación responsive y accesible (`public/`), con modo "menos estímulos".
- Worker de Cloudflare (`src/index.js`) con `POST /api/chat` conectado a Workers AI.
- Prompt de sistema editable en un solo archivo (`src/systemPrompt.js`).
- Sin memoria, sin cuentas, sin base de datos: el historial vive solo en el navegador.

## Requisitos

- Node.js 20 o superior.
- Cuenta de Cloudflare (el plan gratuito de Workers AI tiene un cupo diario).

## Instalación y prueba local

```bash
npm install
npm test          # pruebas del Worker (usan una IA simulada)
npm run dev       # http://localhost:8787
```

`npm run dev` usa el binding de Workers AI, que se ejecuta en Cloudflare: la primera vez
`wrangler` pedirá iniciar sesión (`npx wrangler login`) y el uso cuenta contra tu cupo.

## Despliegue

**Opción A: desde la terminal**

```bash
npx wrangler login
npm run deploy
```

**Opción B: conectado a GitHub (despliegue automático)**

1. Cloudflare → *Workers & Pages* → *Create* → importar el repositorio de GitHub.
2. Build command: vacío. Deploy command: `npx wrangler deploy`.
3. Rama de producción: la que decidas (por ejemplo `main`).

El binding `AI` y las variables están declarados en `wrangler.jsonc`; no se necesitan claves.

## Configuración (`wrangler.jsonc`, sección `vars`)

| Variable | Qué hace | Por defecto |
|---|---|---|
| `MODEL_ID` | Modelo de Workers AI. Cambiarlo no requiere tocar código. | `@cf/meta/llama-3.1-8b-instruct` |
| `HISTORY_LIMIT` | Mensajes recientes enviados al modelo | `10` |
| `MAX_MESSAGE_CHARS` | Largo máximo de cada mensaje | `1500` |
| `MAX_TOKENS` | Largo máximo de la respuesta | `350` |

El modelo inicial es provisional: ver [`docs/EVALUATION.md`](docs/EVALUATION.md) para compararlo con otros
con `scripts/eval-models.mjs` antes de uso real.

## Cómo comprobar que funciona

1. Abre la URL en un teléfono y en un notebook.
2. Escribe un mensaje ficticio ("Estoy cansada de todo"): debe aparecer el indicador y luego la respuesta.
3. Desconecta internet y envía otro: debe aparecer un error comprensible y tu texto debe quedar en el cuadro.
4. Pulsa "Menos estímulos": se quitan animaciones y colores de fondo.
5. Revisa que el repositorio no contenga claves (`git grep -i -E "token|secret|api[_-]?key"`).

## Limitaciones conocidas

- **Sin detección propia de riesgo:** la respuesta ante autolesión o peligro depende del prompt
  de sistema (borrador sin revisión profesional) y del aviso con teléfonos de emergencia visible en pantalla.
- **Sin límite de uso por persona:** cualquiera con la URL consume el cupo gratuito. Antes de publicar
  ampliamente, proteger con Cloudflare Access o agregar *rate limiting*.
- Los teléfonos de ayuda deben verificarse antes de uso real.
- La calidad y seguridad de las respuestas depende del modelo elegido y debe evaluarse con profesionales.
