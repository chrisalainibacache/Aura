// Interfaz de AURA (Fase 1). El historial vive solo en memoria del navegador.
(() => {
  "use strict";

  const WELCOME = "Hola. Estoy aquí si necesitas conversar, organizar algo o simplemente ordenar tus ideas. Podemos ir a tu ritmo.";
  const HISTORY_LIMIT = 10;
  const FRIENDLY_NETWORK = "No pude conectarme. Revisa tu internet e inténtalo de nuevo cuando quieras.";
  const HELP = "Comandos de voz: «nueva conversación», «menos estímulos», «más estímulos», «activar voz», «desactivar voz», «repetir», «detener» y «ayuda». Cualquier otra cosa que digas se envía como mensaje.";

  const $ = (id) => document.getElementById(id);
  const orb = $("orb"), log = $("log"), reply = $("reply"), you = $("you"), status = $("status");
  const form = $("form"), input = $("message"), send = $("send");
  const calm = $("calm"), voice = $("voice"), mic = $("mic"), reset = $("reset");
  const tokensEl = $("tokens"), voiceSel = $("voiceSelect"), rateSel = $("rate"), voiceTest = $("voiceTest");

  let history = [];
  let busy = false;
  let stateTimer = null;
  let lastReply = "";
  const tok = { input: 0, output: 0, last: null, estimated: false };

  // --- Preferencias opcionales (si no hay almacenamiento, todo sigue funcionando)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  function setCalm(on) {
    document.documentElement.dataset.calm = on ? "true" : "false";
    calm.setAttribute("aria-pressed", String(on));
    store.set("aura-calm", on ? "1" : "0");
  }
  setCalm(store.get("aura-calm") === "1");
  calm.addEventListener("click", () => setCalm(calm.getAttribute("aria-pressed") !== "true"));

  // --- Medidor de tokens (laboratorio)
  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n));
  function renderTokens() {
    if (!tok.last) { tokensEl.textContent = "Tokens · sin mensajes aún"; return; }
    const m = tok.estimated ? "~" : "";
    tokensEl.textContent = `Tokens · último ${m}${fmt(tok.last.input)} entrada / ${m}${fmt(tok.last.output)} salida · conversación ${m}${fmt(tok.input + tok.output)}`;
  }
  function addUsage(u) {
    if (!u || !Number.isFinite(u.input) || !Number.isFinite(u.output)) return;
    tok.input += u.input; tok.output += u.output; tok.last = u;
    tok.estimated = tok.estimated || Boolean(u.estimated);
    renderTokens();
  }
  function resetTokens() { tok.input = 0; tok.output = 0; tok.last = null; tok.estimated = false; renderTokens(); }

  // --- Voz de salida (opcional, apagada por defecto; usa las voces del propio dispositivo)
  const synth = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null;
  let voiceOn = false;

  function setVoice(on) {
    voiceOn = on && Boolean(synth);
    voice.setAttribute("aria-pressed", String(voiceOn));
    voice.textContent = voiceOn ? "Voz: sí" : "Voz: no";
    store.set("aura-voice", voiceOn ? "1" : "0");
    if (!voiceOn) stopSpeaking();
  }

  function spanishVoices() { return synth ? synth.getVoices().filter((v) => /^es/i.test(v.lang)) : []; }
  function populateVoices() {
    const list = spanishVoices();
    const saved = store.get("aura-voice-uri") || "";
    voiceSel.replaceChildren();
    const auto = document.createElement("option");
    auto.value = ""; auto.textContent = list.length ? "Automática (es-CL si existe)" : "No hay voces en español";
    voiceSel.appendChild(auto);
    list.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.voiceURI; o.textContent = `${v.name} · ${v.lang}`;
      voiceSel.appendChild(o);
    });
    voiceSel.value = list.some((v) => v.voiceURI === saved) ? saved : "";
  }
  function pickVoice() {
    const list = spanishVoices();
    return list.find((v) => v.voiceURI === voiceSel.value)
      || list.find((v) => /^es[-_]CL/i.test(v.lang)) || list[0] || null;
  }

  if (synth) {
    voice.hidden = false;
    populateVoices();
    if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", populateVoices);
    rateSel.value = ["0.8", "0.95", "1.1"].includes(store.get("aura-rate")) ? store.get("aura-rate") : "0.95";
    setVoice(store.get("aura-voice") === "1");
    voice.addEventListener("click", () => setVoice(!voiceOn));
    voiceSel.addEventListener("change", () => store.set("aura-voice-uri", voiceSel.value));
    rateSel.addEventListener("change", () => store.set("aura-rate", rateSel.value));
    voiceTest.addEventListener("click", () => speak("Hola, soy AURA. Podemos ir a tu ritmo.", () => {}));
  } else {
    $("voiceControls").hidden = true;
  }

  function speak(text, onEnd) {
    if (!synth) { onEnd(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-CL";
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = Number(rateSel.value) || 0.95;
    u.onend = onEnd; u.onerror = onEnd;
    synth.cancel();
    synth.speak(u);
  }
  function stopSpeaking() {
    if (synth) synth.cancel();
    clearTimeout(stateTimer);
    if (orb.dataset.state === "speaking") setState("idle");
  }

  // --- Estado del átomo: idle | listening | thinking | speaking
  function setState(state) {
    clearTimeout(stateTimer);
    orb.dataset.state = state;
  }

  function startSpeaking(text, force) {
    setState("speaking");
    const back = () => { if (orb.dataset.state === "speaking") setState("idle"); };
    if (synth && (voiceOn || force)) {
      speak(text, back);
    } else {
      // Sin voz: la luz acompaña mientras se lee (entre 1,5 y 7 segundos).
      stateTimer = setTimeout(back, Math.min(7000, Math.max(1500, text.length * 45)));
    }
  }

  // --- Render seguro: siempre textContent, nunca innerHTML
  function paragraphs(container, text) {
    text.split(/\n{2,}/).forEach((part) => {
      const p = document.createElement("p");
      p.textContent = part;
      container.appendChild(p);
    });
  }
  function showReply(text, isError) {
    reply.replaceChildren();
    reply.className = isError ? "reply error" : "reply";
    paragraphs(reply, text);
  }
  function addToLog(role, text) {
    const box = document.createElement("div");
    box.className = `msg ${role}`;
    paragraphs(box, text);
    log.appendChild(box);
    return box;
  }
  function setBusy(on) {
    busy = on;
    send.disabled = on;
    status.textContent = on ? "AURA está escribiendo…" : "";
  }

  async function submit(text) {
    history.push({ role: "user", content: text });
    const logged = addToLog("user", text);
    you.textContent = text;
    you.hidden = false;
    showReply("");
    setBusy(true);
    setState("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT) }),
      });
      let data = null;
      try { data = await res.json(); } catch { /* respuesta no JSON */ }
      if (!res.ok || !data || typeof data.reply !== "string") {
        history.pop(); // no se procesó; se puede reintentar
        logged.remove();
        you.hidden = true;
        input.value = text;
        let msg = data && data.error && data.error.message ? data.error.message : "Algo no salió bien. Inténtalo de nuevo.";
        if (data && data.error && data.error.ref) msg += ` (referencia ${data.error.ref})`;
        showReply(msg, true);
        setState("idle");
      } else {
        if (typeof data.model === "string") { const mi = $("modelInfo"); mi.textContent = `Modelo en uso: ${data.model}`; mi.hidden = false; }
        addUsage(data.usage);
        history.push({ role: "assistant", content: data.reply });
        addToLog("aura", data.reply);
        lastReply = data.reply;
        showReply(data.reply);
        startSpeaking(data.reply, false);
      }
    } catch {
      history.pop();
      logged.remove();
      you.hidden = true;
      input.value = text;
      showReply(FRIENDLY_NETWORK, true);
      setState("idle");
    } finally {
      setBusy(false);
      if (!listening) input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    stopSpeaking();
    submit(text);
  });

  // Enter envía; Shift+Enter hace salto de línea
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  function welcome() {
    history = [];
    lastReply = "";
    log.replaceChildren();
    you.hidden = true;
    resetTokens();
    showReply(WELCOME);
    setState("idle");
  }
  function resetConversation() {
    stopSpeaking();
    welcome();
    input.value = "";
  }
  reset.addEventListener("click", () => { resetConversation(); input.focus(); });

  // --- Comandos de voz y dictado (opcional; solo escucha mientras se pulsa Mic)
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const COMMANDS = [
    { label: "nueva conversación", re: /\b(nueva conversacion|empezar de nuevo|borrar todo)\b/, run: resetConversation },
    { label: "menos estímulos", re: /\b(menos estimulos|modo calma|modo tranquilo)\b/, run: () => setCalm(true) },
    { label: "más estímulos", re: /\b(mas estimulos|quitar modo calma)\b/, run: () => setCalm(false) },
    { label: "desactivar voz", re: /\b(desactivar|apagar) (la )?voz\b|\bsilencio\b/, run: () => setVoice(false) },
    { label: "activar voz", re: /\b(activar|encender|prender) (la )?voz\b/, run: () => setVoice(true) },
    { label: "repetir", re: /\b(repetir|repite)\b/, run: () => { if (lastReply) startSpeaking(lastReply, true); } },
    { label: "detener", re: /\b(detener|parar|basta)\b/, run: stopSpeaking },
    { label: "ayuda", re: /\b(ayuda|comandos)\b/, run: () => { showReply(HELP); setState("idle"); } },
  ];
  function matchCommand(text) {
    const n = norm(text);
    if (!n || n.split(" ").length > 6) return null; // frases largas son mensajes, no comandos
    return COMMANDS.find((c) => c.re.test(n)) || null;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false;

  function handleSpoken(text) {
    const cmd = matchCommand(text);
    if (cmd) { status.textContent = `Comando: ${cmd.label}`; cmd.run(); return; }
    if (busy) { status.textContent = "Espera un momento, AURA todavía está respondiendo."; return; }
    input.value = "";
    submit(text);
  }

  function stopListening() { if (rec) { try { rec.stop(); } catch { /* ya detenido */ } } }
  function startListening() {
    if (!SR || busy) return;
    stopSpeaking();
    rec = new SR();
    rec.lang = "es-CL";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      listening = true;
      mic.setAttribute("aria-pressed", "true");
      mic.textContent = "Escuchando…";
      setState("listening");
      status.textContent = "Te escucho…";
    };
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last && last[0] ? String(last[0].transcript).trim() : "";
      if (text) handleSpoken(text);
    };
    rec.onerror = (e) => {
      status.textContent = e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "No tengo permiso para usar el micrófono."
        : e.error === "no-speech" ? "No te escuché. Puedes intentarlo de nuevo." : "No pude escucharte.";
    };
    rec.onend = () => {
      listening = false;
      mic.setAttribute("aria-pressed", "false");
      mic.textContent = "Mic";
      if (orb.dataset.state === "listening") setState("idle");
      if (status.textContent === "Te escucho…") status.textContent = "";
    };
    try { rec.start(); } catch { /* ya estaba escuchando */ }
  }
  if (SR) {
    mic.hidden = false;
    mic.addEventListener("click", () => (listening ? stopListening() : startListening()));
  }

  // --- Copiar la conversación (solo en este dispositivo; para revisarla con quien ayuda a mejorar AURA)
  $("copyLog").addEventListener("click", async () => {
    if (!history.length) { status.textContent = "Aún no hay conversación para copiar."; return; }
    const lines = history.map((m) => `${m.role === "user" ? "Persona" : "AURA"}: ${m.content}`);
    const mi = $("modelInfo");
    const text = `${lines.join("\n\n")}\n\n---\n${mi.hidden ? "" : mi.textContent + "\n"}${tokensEl.textContent}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.className = "sr";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* sin portapapeles */ }
      ta.remove();
    }
    status.textContent = "Conversación copiada. Puedes pegarla donde quieras revisarla.";
  });

  welcome();
})();
