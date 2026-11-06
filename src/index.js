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
  const models = [...new Set([
    env.MODEL_ID || DEFAULTS.MODEL_ID,
    ...String(env.FALLBACK_MODEL_IDS || "").split(",").map((m) => m.trim()).filter(Boolean),
  ])];
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...parsed.messages];
  const inputs = [
    { messages, max_tokens: num(env.MAX_TOKENS, DEFAULTS.MAX_TOKENS), temperature: 0.5 },
    { messages },
  ];
  const refs = [];
  for (const model of models) {
    for (const input of inputs) {
      try {
        const reply = extractReply(await env.AI.run(model, input));
        if (reply) return json({ reply, model });
      } catch (err) {
        // Solo se registra el modelo, el tipo y el código de error, nunca el contenido de la conversación.
        const ref = aiErrorRef(err);
        if (ref && !refs.includes(ref)) refs.push(ref);
        console.error("ai_error", model, err?.name || "Error", ref || "");
      }
    }
  }
  return fail(502, "ai_error", "Tuve un problema para responder. Puedes intentarlo de nuevo en un momento.", refs.join("/") || undefined);
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
