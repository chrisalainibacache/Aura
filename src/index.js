// AURA - Worker de la Fase 1 (MVP conversacional).
// - Sirve la interfaz estática (binding ASSETS) y expone POST /api/chat.
// - No guarda nada y NO registra el contenido de los mensajes.

import { SYSTEM_PROMPT } from "./systemPrompt.js";

const DEFAULTS = {
  MODEL_ID: "@cf/meta/llama-3.1-8b-instruct",
  HISTORY_LIMIT: 10,
  MAX_MESSAGE_CHARS: 1500,
  MAX_TOKENS: 350,
};
const MAX_BODY_BYTES = 32 * 1024;

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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
function fail(status, code, message) {
  return json({ error: { code, message } }, status);
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

  try {
    const result = await env.AI.run(env.MODEL_ID || DEFAULTS.MODEL_ID, {
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...parsed.messages],
      max_tokens: num(env.MAX_TOKENS, DEFAULTS.MAX_TOKENS),
      temperature: 0.5,
    });
    const reply = typeof result === "string" ? result : result?.response;
    if (typeof reply !== "string" || !reply.trim()) {
      return fail(502, "empty_reply", "No pude armar una respuesta. ¿Puedes intentarlo otra vez?");
    }
    return json({ reply: reply.trim() });
  } catch (err) {
    // Solo se registra el tipo de error, nunca el contenido de la conversación.
    console.error("ai_error", err?.name || "Error");
    return fail(502, "ai_error", "Tuve un problema para responder. Puedes intentarlo de nuevo en un momento.");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") return handleChat(request, env);
    if (url.pathname.startsWith("/api/")) return fail(404, "not_found", "No encontré lo que buscas.");
    // Resto de rutas: archivos estáticos (cabeceras definidas en public/_headers).
    return env.ASSETS.fetch(request);
  },
};
