import test from "node:test";
import assert from "node:assert/strict";
import worker, { parseMessages, riskContext } from "../src/index.js";

const mkEnv = (run) => ({
  AI: { run },
  ASSETS: { fetch: async () => new Response("static") },
  MODEL_ID: "@cf/test/model",
});
const post = (body, headers = { "Content-Type": "application/json" }) =>
  new Request("https://x/api/chat", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("responde y envía el prompt de sistema + modelo configurable", async () => {
  let call;
  const env = mkEnv(async (model, input) => { call = { model, input }; return { response: " Hola " }; });
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola" }] }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.reply, "Hola");
  assert.equal(body.model, "@cf/test/model");
  assert.equal(body.usage.estimated, true);
  assert.equal(body.usage.total, body.usage.input + body.usage.output);
  assert.equal(call.model, "@cf/test/model");
  assert.equal(call.input.messages[0].role, "system");
  assert.equal(call.input.messages.at(-1).content, "hola");
});

test("limita el historial", async () => {
  let n;
  const env = mkEnv(async (_m, i) => { n = i.messages.length; return { response: "ok" }; });
  const messages = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "m" + i }));
  messages.push({ role: "user", content: "último" });
  await worker.fetch(post({ messages }), env);
  assert.equal(n, 11); // sistema + 10
});

test("rechaza entradas inválidas con mensajes claros", async () => {
  const env = mkEnv(async () => ({ response: "x" }));
  for (const body of [{}, { messages: [] }, { messages: [{ role: "system", content: "x" }] },
    { messages: [{ role: "assistant", content: "x" }] }, { messages: [{ role: "user", content: "a".repeat(5000) }] }]) {
    const res = await worker.fetch(post(body), env);
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error.message.length > 0);
  }
  assert.equal((await worker.fetch(post("{no json"), env)).status, 400);
  assert.equal((await worker.fetch(post("{}", { "Content-Type": "text/plain" }), env)).status, 415);
  assert.equal((await worker.fetch(new Request("https://x/api/chat"), env)).status, 405);
});

test("error del modelo: mensaje amable y sin filtrar detalles ni contenido", async () => {
  const logged = [];
  const orig = console.error; console.error = (...a) => logged.push(a.join(" "));
  const env = mkEnv(async () => { throw new Error("secreto interno mensaje-privado"); });
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "mensaje-privado" }] }), env);
  console.error = orig;
  assert.equal(res.status, 502);
  const text = JSON.stringify(await res.json());
  assert.ok(!text.includes("secreto"));
  assert.ok(!logged.join().includes("mensaje-privado"));
});

test("respuesta vacía del modelo y AI ausente", async () => {
  assert.equal((await worker.fetch(post({ messages: [{ role: "user", content: "hi" }] }), mkEnv(async () => ({ response: "  " })))).status, 502);
  const noAi = { ASSETS: { fetch: async () => new Response("s") } };
  assert.equal((await worker.fetch(post({ messages: [{ role: "user", content: "hi" }] }), noAi)).status, 503);
});

test("rutas: /api/otro da 404 y el resto va a los archivos estáticos", async () => {
  const env = mkEnv(async () => ({}));
  assert.equal((await worker.fetch(new Request("https://x/api/otro"), env)).status, 404);
  assert.equal(await (await worker.fetch(new Request("https://x/"), env)).text(), "static");
});

test("parseMessages ignora mensajes vacíos", () => {
  const r = parseMessages({ messages: [{ role: "user", content: "  " }, { role: "user", content: "hola" }] }, { historyLimit: 10, maxChars: 100 });
  assert.equal(r.messages.length, 1);
});

test("error del modelo incluye solo el código numérico de referencia", async () => {
  const orig = console.error; console.error = () => {};
  const env = mkEnv(async () => { throw new Error("5007: No such model hola-privado"); });
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola-privado" }] }), env);
  console.error = orig;
  const body = await res.json();
  assert.equal(res.status, 502);
  assert.equal(body.error.ref, "5007");
  assert.ok(!JSON.stringify(body).includes("hola-privado"));
});

test("si el modelo principal falla usa uno de respaldo", async () => {
  const calls = [];
  const orig = console.error; console.error = () => {};
  const env = { ...mkEnv(async (model, input) => {
    calls.push([model, Object.keys(input).join()]);
    if (model === "@cf/test/model") throw new Error("5028: boom");
    return { choices: [{ message: { content: "respuesta de respaldo" } }] };
  }), FALLBACK_MODEL_IDS: "@cf/test/backup" };
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola" }] }), env);
  console.error = orig;
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.reply, "respuesta de respaldo");
  assert.equal(body.model, "@cf/test/backup");
  assert.deepEqual(calls.map((c) => c[0]), ["@cf/test/model", "@cf/test/model", "@cf/test/backup"]);
});

test("si todos fallan devuelve 502 con los códigos de referencia", async () => {
  const orig = console.error; console.error = () => {};
  const env = { ...mkEnv(async (m) => { throw new Error(m.endsWith("backup") ? "5007: x" : "5028: y"); }), FALLBACK_MODEL_IDS: "@cf/test/backup" };
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola" }] }), env);
  console.error = orig;
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error.ref, "5028/5007");
});

test("usa los tokens que informa el modelo cuando existen", async () => {
  const env = mkEnv(async () => ({ response: "ok", usage: { prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 } }));
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola" }] }), env);
  assert.deepEqual((await res.json()).usage, { input: 120, output: 30, total: 150, estimated: false });
});

test("cupo diario agotado: 429 con mensaje claro y sin probar respaldos", async () => {
  const calls = [];
  const orig = console.error; console.error = () => {};
  const env = { ...mkEnv(async (model) => {
    calls.push(model);
    throw new Error("4006: you have used up your daily free allocation of 10,000 neurons, please upgrade");
  }), FALLBACK_MODEL_IDS: "@cf/test/backup" };
  const res = await worker.fetch(post({ messages: [{ role: "user", content: "hola" }] }), env);
  console.error = orig;
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.equal(body.error.code, "quota_exhausted");
  assert.match(body.error.message, /133/);
  assert.equal(calls.length, 1);
});

test("el prompt de crisis prioriza contener y no solo derivar", async () => {
  const { SYSTEM_PROMPT } = await import("../src/systemPrompt.js");
  assert.match(SYSTEM_PROMPT, /CONTENER/);
  assert.match(SYSTEM_PROMPT, /No respondas solo con teléfonos/);
  assert.match(SYSTEM_PROMPT, /BORRADOR/);
  assert.match(SYSTEM_PROMPT, /133/);
});

test("el prompt cubre señales indirectas, no fingir sentimientos y capacidades", async () => {
  const { SYSTEM_PROMPT } = await import("../src/systemPrompt.js");
  assert.match(SYSTEM_PROMPT, /SEÑALES INDIRECTAS/);
  assert.match(SYSTEM_PROMPT, /no debería estar acá/);
  assert.match(SYSTEM_PROMPT, /no finjas sentimientos/);
  assert.match(SYSTEM_PROMPT, /Nunca respondas solo "no puedo"/);
});

test("GET /api/models devuelve la lista permitida", async () => {
  const env = { ...mkEnv(async () => ({})), FALLBACK_MODEL_IDS: "@cf/test/a, @cf/test/b" };
  const res = await worker.fetch(new Request("https://x/api/models"), env);
  assert.deepEqual(await res.json(), { models: ["@cf/test/model", "@cf/test/a", "@cf/test/b"], default: "@cf/test/model" });
  assert.equal((await worker.fetch(new Request("https://x/api/models", { method: "POST" }), env)).status, 405);
});

test("modelo elegido: se usa solo ese; uno fuera de la lista se rechaza", async () => {
  const calls = [];
  const env = { ...mkEnv(async (model) => { calls.push(model); return { response: "ok " + model }; }), FALLBACK_MODEL_IDS: "@cf/test/a" };
  const ok = await worker.fetch(post({ model: "@cf/test/a", messages: [{ role: "user", content: "hola" }] }), env);
  assert.equal((await ok.json()).model, "@cf/test/a");
  assert.deepEqual(calls, ["@cf/test/a"]);
  const bad = await worker.fetch(post({ model: "@cf/otro/caro", messages: [{ role: "user", content: "hola" }] }), env);
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error.code, "invalid_model");
  assert.equal(calls.length, 1);
});

test("modelo elegido que falla no prueba los demás", async () => {
  const calls = [];
  const orig = console.error; console.error = () => {};
  const env = { ...mkEnv(async (model) => { calls.push(model); throw new Error("5028: x"); }), FALLBACK_MODEL_IDS: "@cf/test/a" };
  const res = await worker.fetch(post({ model: "@cf/test/a", messages: [{ role: "user", content: "hola" }] }), env);
  console.error = orig;
  assert.equal(res.status, 502);
  assert.ok(calls.every((m) => m === "@cf/test/a"));
});

const b64 = (bytes) => Buffer.from(bytes).toString("base64");
const fakeMp3 = new Uint8Array([0x49, 0x44, 0x33, ...Array(200).fill(7)]);
const speak = (body) => new Request("https://x/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("/api/speak devuelve audio desde base64 y usa el modelo de voz configurado", async () => {
  let call;
  const env = { ...mkEnv(async (model, input) => { call = { model, input }; return { audio: b64(fakeMp3) }; }), TTS_MODEL_ID: "@cf/myshell-ai/melotts" };
  const res = await worker.fetch(speak({ text: "Hola, soy AURA." }), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "audio/mpeg");
  assert.equal(res.headers.get("X-Aura-Tts-Model"), "@cf/myshell-ai/melotts");
  assert.equal((await res.arrayBuffer()).byteLength, fakeMp3.length);
  assert.deepEqual(call.input, { prompt: "Hola, soy AURA.", lang: "es" });
});

test("/api/speak acepta audio como flujo y detecta WAV", async () => {
  const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, ...Array(200).fill(1)]);
  const env = mkEnv(async () => new Response(wav).body);
  const res = await worker.fetch(speak({ text: "Hola" }), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "audio/wav");
});

test("/api/speak prueba el respaldo y luego devuelve 502 sin filtrar el texto", async () => {
  const calls = [];
  const logged = [];
  const orig = console.error; console.error = (...a) => logged.push(a.join(" "));
  const env = { ...mkEnv(async (model) => { calls.push(model); if (model.endsWith("backup")) return { audio: b64(fakeMp3) }; throw new Error("5007 secreto-privado"); }), TTS_MODEL_ID: "@cf/test/tts", TTS_FALLBACK_MODEL_IDS: "@cf/test/backup" };
  const ok = await worker.fetch(speak({ text: "texto-privado" }), env);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("X-Aura-Tts-Model"), "@cf/test/backup");
  const bad = { ...mkEnv(async () => { throw new Error("5007 x"); }), TTS_MODEL_ID: "@cf/test/tts" };
  const res = await worker.fetch(speak({ text: "texto-privado" }), bad);
  console.error = orig;
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error.ref, "5007");
  assert.ok(!logged.join().includes("texto-privado"));
});

test("/api/speak valida la entrada y reconoce el cupo agotado", async () => {
  const env = mkEnv(async () => ({ audio: b64(fakeMp3) }));
  assert.equal((await worker.fetch(speak({}), env)).status, 400);
  assert.equal((await worker.fetch(speak({ text: "   " }), env)).status, 400);
  assert.equal((await worker.fetch(new Request("https://x/api/speak"), env)).status, 405);
  const orig = console.error; console.error = () => {};
  const quota = mkEnv(async () => { throw new Error("4006: you have used up your daily free allocation of 10,000 neurons"); });
  const res = await worker.fetch(speak({ text: "hola" }), quota);
  console.error = orig;
  assert.equal(res.status, 429);
});

test("/api/speak recorta textos muy largos", async () => {
  let sent;
  const env = mkEnv(async (_m, input) => { sent = input.prompt; return { audio: b64(fakeMp3) }; });
  await worker.fetch(speak({ text: "palabra ".repeat(1000) }), { ...env, TTS_MODEL_ID: "@cf/myshell-ai/melotts" });
  assert.ok(sent.length <= 1500);
});

test("el prompt no obliga a recitar aclaraciones y pide voz humana sin inventar pasado", async () => {
  const { SYSTEM_PROMPT } = await import("../src/systemPrompt.js");
  assert.match(SYSTEM_PROMPT, /NO lo repites/);
  assert.match(SYSTEM_PROMPT, /Nunca digas por iniciativa propia/);
  assert.match(SYSTEM_PROMPT, /VOZ HUMANA/);
  assert.match(SYSTEM_PROMPT, /No inventes un pasado compartido/);
  assert.match(SYSTEM_PROMPT, /no te voy a decir solo lo que quieres escuchar/);
  assert.doesNotMatch(SYSTEM_PROMPT, /Eres una herramienta de IA\. No eres una persona/);
});

const u = (c) => ({ role: "user", content: c });
const a = (c) => ({ role: "assistant", content: c });

test("riskContext detecta desaparecer/morir aunque no diga 'suicidio' (casos reales de la conversación de prueba)", () => {
  assert.match(riskContext([u("me gustaría desaparecer porque no sirvo para nada")]), /quitarse la vida/);
  assert.match(riskContext([u("Por qué la gente a veces quiere morirse")]), /quitarse la vida/);
  assert.match(riskContext([u("ya no quiero vivir")]), /ATENCIÓN EN ESTE TURNO/);
  assert.match(riskContext([u("quiero hacerme daño")]), /quitarse la vida/);
});

test("riskContext: desvalorización, riesgo pendiente y sin falsos avisos", () => {
  assert.match(riskContext([u("soy un fracaso")]), /se desvaloriza/);
  assert.match(riskContext([u("me gustaría desaparecer"), a("..."), u("Por qué brillan las lucecitas")]), /hace poco/);
  assert.equal(riskContext([u("hola"), a("hola"), u("me quedaba todo mal recortado")]), "");
  assert.equal(riskContext([u("me muero de risa con mi amigo")]), "");
  // el riesgo antiguo deja de recordarse tras varios mensajes
  const old = [u("quiero morirme"), a("x"), u("a"), a("x"), u("b"), a("x"), u("c"), a("x"), u("d"), a("x"), u("e")];
  assert.equal(riskContext(old), "");
});

test("el refuerzo de riesgo va al final del prompt de sistema solo cuando hace falta", async () => {
  const systems = [];
  const env = mkEnv(async (_m, input) => { systems.push(input.messages[0].content); return { response: "ok" }; });
  await worker.fetch(post({ messages: [u("me gustaría desaparecer")] }), env);
  await worker.fetch(post({ messages: [u("hola")] }), env);
  assert.match(systems[0], /ATENCIÓN EN ESTE TURNO/);
  assert.ok(systems[0].startsWith("Eres AURA"));
  assert.doesNotMatch(systems[1], /ATENCIÓN EN ESTE TURNO/);
});

test("el prompt prohíbe copiar ejemplos, dos preguntas y hablar de sí misma, y pide preguntar directo por desaparecer", async () => {
  const { SYSTEM_PROMPT } = await import("../src/systemPrompt.js");
  assert.match(SYSTEM_PROMPT, /UNA sola pregunta como máximo/);
  assert.match(SYSTEM_PROMPT, /No copies frases de estas instrucciones/);
  assert.match(SYSTEM_PROMPT, /no pidas que confíen en ti/);
  assert.match(SYSTEM_PROMPT, /pregunta directo si piensa en quitarse la vida/);
  assert.match(SYSTEM_PROMPT, /Nunca digas que eres "solo un programa de texto"/);
});

test("riskContext detecta la desvalorización contada como cita ('me dijo que no servía para nada')", () => {
  assert.match(riskContext([u("mi profesor me dijo que no servía para nada")]), /se desvaloriza/);
});

test("el prompt enseña las etiquetas de luz y prohíbe cambiarla sin permiso", async () => {
  const { SYSTEM_PROMPT } = await import("../src/systemPrompt.js");
  assert.match(SYSTEM_PROMPT, /\[\[luz: color=azul\]\]/);
  assert.match(SYSTEM_PROMPT, /Nunca cambies la luz por tu cuenta/);
  assert.match(SYSTEM_PROMPT, /ambar, violeta/);
  assert.match(SYSTEM_PROMPT, /Nunca digas que eres "solo un programa de texto"/);
});
