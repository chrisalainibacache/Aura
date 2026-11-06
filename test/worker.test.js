import test from "node:test";
import assert from "node:assert/strict";
import worker, { parseMessages } from "../src/index.js";

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
