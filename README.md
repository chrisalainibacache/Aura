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

## Voz, micrófono y medidor de tokens (laboratorio)

- **Voz:** botón "Voz" (apagado por defecto). Usa las voces del dispositivo; en "Laboratorio: voz y comandos"
  se elige la voz en español y la velocidad. En Android, más voces se instalan en
  *Ajustes → Salida de texto a voz*.
- **Átomo vivo en alta resolución:** se dibuja en un canvas (`public/atom.js`) a la resolución nativa de la pantalla
  (hasta ~2.300 px de lienzo, suficiente para 4K) y baja la calidad solo si el dispositivo va justo. Respira en
  reposo, emite ondas hacia adentro al escuchar, gira rápido al pensar y, al hablar, **late con el volumen real de la
  voz de AURA** (Web Audio; con la voz del teléfono usa un latido simulado), con ondas de luz y electrones que se
  aceleran. Los cambios son suaves (sin parpadeos). "Menos estímulos" y el ajuste de movimiento reducido del
  sistema lo dejan quieto. Si el canvas no está disponible, vuelve el átomo CSS.
- **Voz de AURA (servidor):** por defecto la voz sale de Workers AI (`TTS_MODEL_ID`, por defecto
  `@cf/myshell-ai/melotts`, con `TTS_FALLBACK_MODEL_IDS` como respaldo) mediante `POST /api/speak`, y suena igual en
  cualquier dispositivo. Si el servidor no responde (modelo no disponible en la cuenta, cupo agotado o
  bloqueo del navegador), la app usa sola la voz del teléfono. En el Laboratorio, "Fuente de voz" permite elegir
  entre AURA y el teléfono, y "Voz en uso" muestra cuál sonó. Los modelos de voz no se pudieron verificar contra la
  cuenta: si ninguno funciona, ajustar los identificadores según el catálogo de Workers AI. Gasta cupo diario.
- **Mic y comandos de voz:** «nueva conversación», «menos estímulos», «más estímulos», «activar voz»,
  «desactivar voz», «repetir», «detener», «ayuda». Cualquier otra frase se envía como mensaje.
  Solo escucha mientras se pulsa Mic. En Chrome, el reconocimiento de voz puede procesar el audio en
  servidores de Google: dejarlo documentado en la política de privacidad antes de uso real.
- **Conversación por voz (sin teclado):** tocar el átomo. AURA escucha, responde hablando y vuelve a
  escuchar sola. Se termina tocando el átomo, diciendo «terminar conversación», tras 3 silencios seguidos
  o al salir de la pantalla. No abre el teclado y mantiene la pantalla encendida si el navegador lo permite.
  Requiere un navegador con reconocimiento de voz (Chrome en Android); en Chrome el audio puede procesarse
  en servidores de Google, así que debe documentarse y consentirse antes de uso real. Durante la
  conversación el micrófono está activo: el átomo se ilumina y un texto lo indica.
- **Modo presentación:** deja solo el átomo, sin textos ni botones, y AURA siempre responde con voz. Se activa
  desde el Laboratorio ("Modo presentación"), con la voz («modo presentación») o abriendo `/?presentacion=1`.
  Se sale con la "×" tenue de arriba a la derecha, con Esc o saliendo de pantalla completa. Los textos siguen
  disponibles para lectores de pantalla y los errores se muestran. **En este modo no se ve el aviso con el 133 y el
  131**: usarlo solo en demostraciones con mensajes ficticios y adultos presentes, nunca con niños reales.
- **Cambiar de modelo:** en el Laboratorio hay un selector de modelo y el botón "Reintentar con otro modelo"
  (también aparece junto a un mensaje de error). Recorre solo la lista permitida del servidor (`MODEL_ID` y
  `FALLBACK_MODEL_IDS`); el navegador no puede pedir otros modelos. Al elegir uno se usa solo ese, sin respaldos,
  hasta volver a "Automático". Todos comparten el mismo cupo diario.
- **Medidor de tokens:** línea bajo el átomo con tokens del último mensaje y de la conversación
  (`~` = estimación cuando el modelo no informa el uso). No guarda nada.

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
| `MODEL_ID` | Modelo de Workers AI. Cambiarlo no requiere tocar código. | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| `FALLBACK_MODEL_IDS` | Modelos de respaldo, separados por coma | ver `wrangler.jsonc` |
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

## Límite diario de Workers AI

El plan gratuito incluye un cupo diario de "neuronas" (no de tokens), que se reinicia a las 00:00 UTC
(verificar en el panel de Cloudflare). Todos los modelos de Workers AI comparten ese cupo, así que cambiar de
modelo no ayuda cuando se agota. En ese caso AURA muestra un mensaje claro (con el 133 y el 131) y vuelve a
funcionar tras el reinicio. Para no depender del cupo gratuito: plan Workers Paid (pago por uso).
El uso real se ve en el panel de Cloudflare → Workers AI.

## Red de seguridad en el servidor (`riskContext`)

Un prompt largo se olvida a medias, así que el Worker revisa el último mensaje (y los 4 anteriores) buscando
señales: desaparecer, morir, hacerse daño, "no sirvo", etc. Si las hay, agrega al **final** del prompt de sistema
una instrucción corta para ese turno: reconocer el dolor y **preguntar directo** si piensa en quitarse la vida
(o separar lo que le dijeron de lo que vale, o volver con suavidad al tema si quedó pendiente). Prefiere preguntar
de más: una palabra ambigua solo provoca una pregunta amable. No guarda ni registra nada. **No reemplaza** la revisión
de un profesional ni garantiza que el modelo obedezca; las conversaciones de prueba deben revisarse siempre.

## Limitaciones conocidas

- **Sin detección propia de riesgo:** la respuesta ante autolesión o peligro depende del prompt
  de sistema (borrador sin revisión profesional) y del aviso con teléfonos de emergencia visible en pantalla.
- **Sin límite de uso por persona:** cualquiera con la URL consume el cupo gratuito. Antes de publicar
  ampliamente, proteger con Cloudflare Access o agregar *rate limiting*.
- Los teléfonos de ayuda deben verificarse antes de uso real.
- La calidad y seguridad de las respuestas depende del modelo elegido y debe evaluarse con profesionales.
