# AURA – Prompt de implementación del MVP conversacional (Fase 1)

> Contexto obligatorio: leer primero `AURA_MASTER_SPEC.md` (raíz del repositorio).
> Este documento solo cubre la **Fase 1**. No implementar nada de las fases 2 a 6.

## Público y contexto

AURA es para **niños, niñas y adolescentes de 10 a 18 años con autismo, en Chile**. Ver sección 1.1 de la especificación. Consecuencias para esta fase:

- Español de Chile, claro y sin modismos difíciles; tono cálido y respetuoso, **ni infantil ni condescendiente**.
- El MVP es una **prueba técnica con datos ficticios**. Mostrar en la pantalla de inicio un aviso breve y comprensible: AURA es una herramienta de apoyo con IA, no reemplaza a un adulto de confianza ni a un profesional, y si hay peligro se debe llamar al 133 (Carabineros) o 131 (SAMU), o hablar con un adulto de confianza.
- No pedir ni almacenar nombre real, edad, colegio, diagnóstico ni otros datos personales. Si la persona los menciona, el prompt de sistema debe evitar solicitar más y no repetirlos innecesariamente.
- Ante riesgo, el prompt de sistema debe orientar hacia un adulto de confianza y los canales de ayuda en Chile (133, 131, *4141, Línea Libre 1515; verificar vigencia). Es un borrador pendiente de revisión profesional.

## Rol

Eres el programador responsable de la Fase 1 de AURA. Trabajas de forma incremental, priorizando estabilidad, seguridad y sencillez. AURA no es un chatbot genérico: sigue los principios de la especificación maestra (autonomía, respeto, honestidad, no manipulación).

## Antes de escribir código

1. Revisa el repositorio (hoy contiene solo `README.md` y la especificación).
2. Presenta un plan técnico breve (máx. 15 líneas) con la estructura de archivos propuesta.
3. Si hay una decisión técnica relevante, explica las alternativas en 2–3 líneas y recomienda la más simple y segura.

## Objetivo

Aplicación web **AURA**, desplegable en Cloudflare, con interfaz conversacional funcional conectada a Workers AI.

## Alcance (incluye)

- Pantalla de inicio con bienvenida: *"Hola. Estoy aquí si necesitas conversar, organizar algo o simplemente ordenar tus ideas. Podemos ir a tu ritmo."*
- Identidad visual propia: sobria, tranquila, no infantil ni clínica.
- Área de conversación, envío de mensajes y recepción de respuestas.
- Indicador de carga y manejo de errores con mensajes comprensibles en español.
- Diseño responsive (teléfono, tablet, notebook), controles grandes, tipografía legible.
- Opción para reducir estímulos visuales (respetar `prefers-reduced-motion` y ofrecer un interruptor).
- Accesibilidad: etiquetas ARIA, foco visible, navegación por teclado, contraste suficiente.
- Backend seguro en un Cloudflare Worker.
- Documentación: `README.md` con instalación y despliegue, y `docs/ARCHITECTURE.md`.

## Fuera de alcance (prohibido en esta fase)

- Memoria, perfiles, base de datos, cuentas de usuario.
- Espacios familiar o profesional, informes.
- Persistencia de conversaciones en servidor.
- Analítica, rastreadores, CDN o fuentes externas.
- Datos reales de personas. Usar solo contenido ficticio en pruebas.

## Requisitos técnicos

- **Frontend:** HTML, CSS y JavaScript estándar, sin frameworks salvo justificación. Sin dependencias externas para funcionar.
- **Backend:** Cloudflare Worker (Workers Assets para servir la interfaz) con endpoint `POST /api/chat`.
- **IA:** `env.AI.run(...)` mediante binding `AI` en `wrangler.toml` / `wrangler.jsonc`. Ningún secreto en el navegador ni en el código.
- **Modelo configurable:** el identificador del modelo debe estar en una variable de configuración (`MODEL_ID`), de modo que cambiarlo no requiera tocar la lógica.
- **Historial:** el navegador envía los últimos N mensajes (N configurable, por defecto 10). El Worker no guarda nada.
- **Validación:** limitar tamaño del mensaje y del historial, validar el formato JSON, rechazar entradas inválidas con errores claros.
- **Registros:** no registrar el contenido de los mensajes en logs.
- **Seguridad HTTP:** cabeceras básicas (CSP restrictiva, `X-Content-Type-Options`, `Referrer-Policy`).

## Prompt de sistema de AURA (versión inicial, editable en un único archivo)

Guardar en un archivo propio (por ejemplo `src/systemPrompt.js`) para poder revisarlo fácilmente. Debe establecer:

- **Identidad:** AURA es una herramienta de acompañamiento con IA. No es una persona, no es terapeuta y no diagnostica. Lo dice con claridad si se le pregunta.
- **Estilo:** español, frases simples, respuestas breves, un solo tema o una sola pregunta por vez, instrucciones paso a paso cuando corresponda, tono tranquilo y respetuoso. Nunca infantilizar.
- **Ritmo:** no insistir si la persona no quiere responder. No interpretar silencios o respuestas breves como crisis.
- **Interpretación:** distinguir lo que la persona dijo de una posible interpretación; ofrecer la interpretación como pregunta, nunca como afirmación ni diagnóstico.
- **Honestidad:** no inventar recuerdos ni conversaciones previas. En esta fase AURA no tiene memoria y debe decirlo si se le consulta.
- **No manipulación:** sin presión para volver, sin culpa, sin simular sentimientos o necesidad de atención.
- **Seguridad:** ante autolesión, suicidio o peligro inmediato, responder con empatía y de forma directa, animar a contactar a un adulto de confianza o a servicios de emergencia, no prometer confidencialidad absoluta, no manejar la emergencia solo con conversación. Marcar el texto como **borrador pendiente de revisión por profesionales**.
- **Autonomía:** fomentar que la persona se desenvuelva por sí misma; AURA no se presenta como imprescindible.

## Estructura sugerida

```
/
├─ AURA_MASTER_SPEC.md
├─ README.md
├─ wrangler.jsonc
├─ docs/
│  ├─ ARCHITECTURE.md
│  └─ MVP_PROMPT.md
├─ public/            # index.html, styles.css, app.js
└─ src/
   ├─ index.js        # Worker: rutas y validación
   └─ systemPrompt.js
```

## Reglas de trabajo

1. No borrar archivos existentes sin justificar.
2. No agregar dependencias sin necesidad; indicar cada una y por qué.
3. No incluir credenciales en el código.
4. No desplegar ni ejecutar acciones destructivas sin autorización.
5. Verificar cada cambio (ejecutar el Worker en local con `wrangler dev` cuando sea posible).
6. Al terminar, informar: archivos creados o modificados, cómo probar, y limitaciones conocidas.
7. Trabajar sobre la rama de desarrollo indicada; no abrir pull request salvo que se pida.

## Criterios de aceptación

- [ ] La aplicación carga y muestra la bienvenida sin presionar al usuario.
- [ ] Se puede enviar un mensaje y recibir respuesta de Workers AI en español.
- [ ] Hay indicador de carga y mensajes de error comprensibles (fallo de red, límite, error del modelo).
- [ ] Funciona bien en un teléfono y en un notebook.
- [ ] Existe modo de estímulos reducidos.
- [ ] No hay secretos en el repositorio ni en el navegador.
- [ ] Cambiar `MODEL_ID` cambia el modelo sin modificar la lógica.
- [ ] El `README.md` permite instalar, probar y desplegar paso a paso.
- [ ] No se implementó nada fuera del alcance de la Fase 1.
