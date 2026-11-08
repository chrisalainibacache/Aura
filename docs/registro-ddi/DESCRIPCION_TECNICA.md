# Descripción técnica y manual de funcionamiento de AURA

Versión descrita: `0.1.0`, snapshot `b1de123ba858fde1c6f4cc96a275bb332e3315fc`. Es una **prueba técnica (Fase 1)** con datos
ficticios; no debe usarse con menores reales sin revisión profesional y legal.

## 1. Qué es

Software web con inteligencia artificial que conversa, por texto o por voz, con niños, niñas y adolescentes autistas y
neurodivergentes (10 a 18 años, en Chile) para su contención inicial y acompañamiento. No reemplaza a un adulto de
confianza ni a un profesional.

## 2. Arquitectura

```
Navegador (public/)  ──►  Worker de Cloudflare (src/index.js)  ──►  Workers AI (modelo de chat y modelo de voz)
 historial en memoria       valida, arma el prompt, red de            Llama 3.3 70B (principal) y respaldos;
 átomo, voz, luz            seguridad, no guarda nada                 MeloTTS / Deepgram Aura 2 (voz)
```

- **Despliegue:** un solo Worker con archivos estáticos (Workers Assets); se despliega automáticamente al fusionar a `main`
  (Workers Builds, `npx wrangler deploy`). Sin servidor propio, sin base de datos y sin cuentas.
- **Rutas:** `POST /api/chat` (conversación), `GET /api/models` (lista permitida de modelos), `POST /api/speak` (texto a voz).
- **Configuración** (`wrangler.jsonc`, sin secretos): `MODEL_ID`, `FALLBACK_MODEL_IDS`, `TTS_MODEL_ID`,
  `TTS_FALLBACK_MODEL_IDS`, `HISTORY_LIMIT`, `MAX_MESSAGE_CHARS`, `MAX_TOKENS`.
- Más detalle: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) y [`docs/DEPLOY.md`](../DEPLOY.md).

## 3. Funciones y decisiones de diseño

- **Privacidad:** el historial vive solo en el navegador; el Worker no guarda mensajes ni registra su contenido.
- **Seguridad ante riesgo:** prompt de sistema orientado a contener antes de derivar y una **red de seguridad en el
  servidor** (`riskContext`) que detecta señales de riesgo y agrega al final del prompt una instrucción para ese turno.
  Es un borrador pendiente de revisión por profesionales.
- **Tolerancia a fallos:** modelos de respaldo y reintento con parámetros mínimos; mensaje claro al agotarse el cupo diario;
  la voz del servidor cae a la voz del dispositivo.
- **Interfaz sensorial:** átomo de luz en canvas que respira, escucha, piensa y late con el volumen de la voz; modo
  "Menos estímulos"; 5 colores, 3 intensidades y 3 velocidades de giro (listas cerradas, guardadas solo en el dispositivo);
  AURA solo cambia la luz si la persona lo pide o dice que sí.
- **Voz y accesibilidad:** voz del servidor o del dispositivo, comandos de voz, conversación sin teclado, modo presentación,
  etiquetas ARIA y navegación por teclado.
- **Seguridad web:** política de contenido restrictiva, sin recursos externos ni CDN; textos mostrados con `textContent`.
- **Verificación:** 29 pruebas automáticas (`npm test`) con una IA simulada, y escenarios ficticios de evaluación (`eval/`).

## 4. Manual de funcionamiento (usuario)

1. **Abrir** la dirección de AURA. La pantalla muestra el átomo y un aviso con los números de emergencia (133 y 131).
2. **Conversar por texto:** escribir en el cuadro inferior y pulsar "Enviar" (o Enter).
3. **Conversar por voz, sin teclado:** tocar el átomo. AURA escucha, responde hablando y vuelve a escuchar. Se termina
   tocando el átomo de nuevo o diciendo "terminar conversación".
4. **Cambiar la luz:** escribir o decir "cambia a azul", "más luz", "menos luz", "gira más lento" o "luz normal", o usar el
   Laboratorio. "Menos estímulos" detiene el movimiento.
5. **Modo presentación:** muestra solo el átomo (`/?presentacion=1`). No muestra el aviso de emergencia: solo para
   demostraciones con adultos y mensajes ficticios.
6. **Laboratorio (voz y comandos):** elegir la fuente y la velocidad de la voz, el modelo, copiar la conversación y ver el
   medidor de tokens.
7. **Instalar como aplicación:** menú del navegador → "Instalar aplicación".

Manual técnico de despliegue y pruebas: [`README.md`](../../README.md).
