// AURA - Worker de la Fase 1 (MVP conversacional).
// - Sirve la interfaz estática (binding ASSETS) y expone POST /api/chat.
// - No guarda nada y NO registra el contenido de los mensajes.

import { SYSTEM_PROMPT } from "./systemPrompt.js";

const DEFAULTS = {
  MODEL_ID: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  HISTORY_LIMIT: 10,
  MAX_MESSAGE_CHARS: 1500,
  MAX_TOKENS: 350,
};
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TTS_CHARS = 1500;
const DEFAULT_TTS_MODEL = "@cf/myshell-ai/melotts";

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

function num(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...extra },
  });
}

// Mensajes de error pensados para ser leídos por la persona usuaria.
function fail(status, code, message, ref) {
  return json({ error: { code, message, ...(ref ? { ref } : {}) } }, status);
}

// Código numérico de Workers AI (p. ej. 5007) extraído del error, sin texto de la conversación.
function aiErrorRef(err) {
  const m = String(err?.message ?? "").match(/\b\d{4}\b/);
  return m ? m[0] : undefined;
}

// Valida y normaliza el historial enviado por el navegador.
export function parseMessages(payload, { historyLimit, maxChars }) {
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return { error: "No recibí ningún mensaje." };
  }
  const messages = [];
  for (const m of payload.messages.slice(-historyLimit)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return { error: "El formato del mensaje no es válido." };
    }
    const content = m.content.trim();
    if (!content) continue;
    if (content.length > maxChars) {
      return { error: `Tu mensaje es muy largo. Prueba con menos de ${maxChars} caracteres.` };
    }
    messages.push({ role: m.role, content });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return { error: "No recibí ningún mensaje." };
  }
  return { messages };
}

// Algunos modelos responden { response }, otros en formato tipo OpenAI ({ choices }).
function extractReply(result) {
  const text = typeof result === "string" ? result : result?.response ?? result?.choices?.[0]?.message?.content;
  return typeof text === "string" && text.trim() ? text.trim() : "";
}

// Uso de tokens: lo informado por el modelo o, si no lo informa, una estimación (~4 caracteres por token).
function tokenUsage(result, messages, reply) {
  const input = Number(result?.usage?.prompt_tokens);
  const output = Number(result?.usage?.completion_tokens);
  if (Number.isFinite(input) && Number.isFinite(output) && input >= 0 && output >= 0) {
    return { input, output, total: input + output, estimated: false };
  }
  const chars = messages.reduce((n, m) => n + m.content.length, 0);
  const i = Math.ceil(chars / 4);
  const o = Math.ceil(reply.length / 4);
  return { input: i, output: o, total: i + o, estimated: true };
}

// ¿El error indica que se agotó el cupo diario de Workers AI? (código 4006 o texto de límite diario)
function isQuotaError(err) {
  const msg = String(err?.message ?? "");
  return /\b4006\b|daily free allocation|used up your daily|neurons/i.test(msg);
}

// Modelos que el navegador puede elegir: solo el principal y los de respaldo configurados.
function allowedModels(env) {
  return [...new Set([
    env.MODEL_ID || DEFAULTS.MODEL_ID,
    ...String(env.FALLBACK_MODEL_IDS || "").split(",").map((m) => m.trim()).filter(Boolean),
  ])];
}

function handleModels(request, env) {
  if (request.method !== "GET") return fail(405, "method_not_allowed", "Este servicio solo acepta consultas desde la aplicación.");
  const models = allowedModels(env);
  return json({ models, default: models[0] });
}

async function handleChat(request, env) {
  if (request.method !== "POST") {
    return fail(405, "method_not_allowed", "Este servicio solo acepta mensajes enviados desde la aplicación.");
  }
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) {
    return fail(415, "unsupported_media_type", "El formato de la solicitud no es válido.");
  }
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return fail(413, "too_large", "El mensaje es demasiado grande.");
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return fail(400, "bad_request", "No pude leer tu mensaje.");
  }
  if (raw.length > MAX_BODY_BYTES) {
    return fail(413, "too_large", "El mensaje es demasiado grande.");
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return fail(400, "bad_json", "No pude leer tu mensaje.");
  }

  const parsed = parseMessages(payload, {
    historyLimit: num(env.HISTORY_LIMIT, DEFAULTS.HISTORY_LIMIT),
    maxChars: num(env.MAX_MESSAGE_CHARS, DEFAULTS.MAX_MESSAGE_CHARS),
  });
  if (parsed.error) return fail(400, "invalid_message", parsed.error);

  if (!env.AI) {
    return fail(503, "ai_unavailable", "AURA no está disponible en este momento. Intenta de nuevo más tarde.");
  }

  // Prueba el modelo principal y luego los de respaldo. Con cada modelo intenta primero con
  // todos los parámetros y después solo con los mensajes, por si alguno rechaza algún parámetro.
  // Si la persona eligió un modelo (botón de laboratorio), se usa solo ese y debe estar en la lista permitida.
  const allowed = allowedModels(env);
  const requested = payload.model;
  if (requested !== undefined && requested !== null && requested !== "") {
    if (typeof requested !== "string" || !allowed.includes(requested)) {
      return fail(400, "invalid_model", "Ese modelo no está disponible.");
    }
  }
  const models = requested ? [requested] : allowed;
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...parsed.messages];
  const inputs = [
    { messages, max_tokens: num(env.MAX_TOKENS, DEFAULTS.MAX_TOKENS), temperature: 0.5 },
    { messages },
  ];
  const refs = [];
  for (const model of models) {
    for (const input of inputs) {
      try {
        const result = await env.AI.run(model, input);
        const reply = extractReply(result);
        if (reply) return json({ reply, model, usage: tokenUsage(result, messages, reply) });
      } catch (err) {
        if (isQuotaError(err)) {
          // Todos los modelos de Workers AI comparten el mismo cupo: no tiene sentido probar los de respaldo.
          console.error("ai_quota_exhausted");
          return fail(429, "quota_exhausted", "AURA llegó a su límite de uso por hoy y volverá a funcionar más tarde. Si necesitas ayuda ahora, llama al 133 (Carabineros) o al 131 (ambulancia), o habla con un adulto de confianza.");
        }
        // Solo se registra el modelo, el tipo y el código de error, nunca el contenido de la conversación.
        const ref = aiErrorRef(err);
        if (ref && !refs.includes(ref)) refs.push(ref);
        console.error("ai_error", model, err?.name || "Error", ref || "");
      }
    }
  }
  return fail(502, "ai_error", "Tuve un problema para responder. Puedes intentarlo de nuevo en un momento.", refs.join("/") || undefined);
}

// ---- Voz de AURA (texto a voz con Workers AI) ----
function ttsInputs(model, text) {
  if (/melotts/i.test(model)) return [{ prompt: text, lang: "es" }, { prompt: text }];
  if (/deepgram/i.test(model)) return [{ text }];
  return [{ text }, { prompt: text }];
}

function decodeBase64(b64) {
  const bin = atob(String(b64).replace(/^data:[^,]*,/, ""));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Los modelos devuelven el audio como base64 en un objeto, como flujo o como bytes.
async function audioBytes(result) {
  if (!result) return null;
  if (typeof result === "string") return decodeBase64(result);
  if (typeof ReadableStream !== "undefined" && result instanceof ReadableStream) return new Uint8Array(await new Response(result).arrayBuffer());
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (ArrayBuffer.isView(result)) return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  if (typeof result.audio === "string") return decodeBase64(result.audio);
  return null;
}

function audioType(bytes) {
  const head = String.fromCharCode(...bytes.slice(0, 4));
  if (head === "RIFF") return "audio/wav";
  if (head === "OggS") return "audio/ogg";
  return "audio/mpeg";
}

async function handleSpeak(request, env) {
  if (request.method !== "POST") return fail(405, "method_not_allowed", "Este servicio solo acepta texto enviado desde la aplicación.");
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
    return fail(415, "unsupported_media_type", "El formato de la solicitud no es válido.");
  }
  let payload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large", "El texto es demasiado grande.");
    payload = JSON.parse(raw);
  } catch {
    return fail(400, "bad_json", "No pude leer el texto.");
  }
  let text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text) return fail(400, "invalid_text", "No recibí texto para leer.");
  if (text.length > MAX_TTS_CHARS) text = text.slice(0, text.lastIndexOf(" ", MAX_TTS_CHARS) > 0 ? text.lastIndexOf(" ", MAX_TTS_CHARS) : MAX_TTS_CHARS);
  if (!env.AI) return fail(503, "ai_unavailable", "La voz de AURA no está disponible en este momento.");

  const models = [...new Set([
    env.TTS_MODEL_ID || DEFAULT_TTS_MODEL,
    ...String(env.TTS_FALLBACK_MODEL_IDS || "").split(",").map((m) => m.trim()).filter(Boolean),
  ])];
  const refs = [];
  for (const model of models) {
    for (const input of ttsInputs(model, text)) {
      try {
        const bytes = await audioBytes(await env.AI.run(model, input));
        if (bytes && bytes.length > 100) {
          return new Response(bytes, {
            status: 200,
            headers: { "Content-Type": audioType(bytes), "X-Aura-Tts-Model": model, ...SECURITY_HEADERS },
          });
        }
      } catch (err) {
        if (isQuotaError(err)) {
          console.error("tts_quota_exhausted");
          return fail(429, "quota_exhausted", "AURA llegó a su límite de uso por hoy.");
        }
        // Solo modelo, tipo y código de error; nunca el texto.
        const ref = aiErrorRef(err);
        if (ref && !refs.includes(ref)) refs.push(ref);
        console.error("tts_error", model, err?.name || "Error", ref || "");
      }
    }
  }
  return fail(502, "tts_error", "No pude generar la voz en este momento.", refs.join("/") || undefined);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") return handleChat(request, env);
    if (url.pathname === "/api/models") return handleModels(request, env);
    if (url.pathname === "/api/speak") return handleSpeak(request, env);
    if (url.pathname.startsWith("/api/")) return fail(404, "not_found", "No encontré lo que buscas.");
    // Resto de rutas: archivos estáticos (cabeceras definidas en public/_headers).
    return env.ASSETS.fetch(request);
  },
};
