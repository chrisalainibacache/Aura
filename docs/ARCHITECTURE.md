# Arquitectura (Fase 1)

```
Navegador (public/)  ──POST /api/chat──►  Worker (src/index.js)  ──env.AI.run──►  Workers AI
   historial en memoria                    valida, arma el prompt                  modelo = MODEL_ID
                                           no guarda nada
```

## Componentes

| Archivo | Responsabilidad |
|---|---|
| `public/index.html`, `styles.css`, `app.js` | Interfaz. Sin frameworks ni recursos externos. Los mensajes se muestran con `textContent` (no `innerHTML`) para evitar inyección de HTML. |
| `public/_headers` | Cabeceras de seguridad para archivos estáticos (CSP restrictiva, `nosniff`, etc.). |
| `src/index.js` | Enrutamiento, validación de entrada, llamada a Workers AI y errores amables. Las rutas `/api/*` pasan primero por el Worker (`run_worker_first`); el resto se sirve como archivo estático. |
| `src/systemPrompt.js` | Identidad, estilo y límites de AURA. Único lugar donde se edita el comportamiento. |
| `wrangler.jsonc` | Binding `AI`, assets y variables de configuración. |
| `test/worker.test.js` | Pruebas del Worker con una IA simulada. |

## Decisiones

- **Un solo Worker con Assets** en lugar de Pages + Worker separados: menos piezas y un único despliegue.
- **Sin dependencias en runtime.** `wrangler` es solo herramienta de desarrollo.
- **Historial en el cliente.** El servidor no tiene estado: no hay datos personales que proteger ni retener en esta fase.
- **Modelo intercambiable** mediante `MODEL_ID`. La llamada usa el formato `messages` de Workers AI; si otro modelo usa un formato distinto, solo cambia la función `handleChat`.
- **Privacidad en logs:** el Worker solo registra el tipo de error, nunca el contenido de los mensajes. `observability` está desactivado.

## Flujo de datos

1. La persona escribe; el navegador envía los últimos `HISTORY_LIMIT` mensajes.
2. El Worker valida (JSON, roles, tamaño) y antepone el prompt de sistema.
3. Workers AI responde; el Worker devuelve `{ "reply": "..." }`.
4. Ante un error se devuelve `{ "error": { "code", "message" } }` con un mensaje apto para mostrar.

Cloudflare procesa los mensajes para ejecutar el modelo. Esto debe quedar documentado en la política de privacidad antes de cualquier uso real.

## Qué viene después (no implementado)

Perfil y preferencias (Fase 2), memoria con consentimiento (Fase 3) y siguientes. Requerirán autenticación,
almacenamiento (D1 o Supabase), permisos por edad y supervisión adulta antes de guardar cualquier dato real.
