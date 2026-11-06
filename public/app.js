// Interfaz de AURA (Fase 1). El historial vive solo en memoria del navegador.
(() => {
  "use strict";

  const WELCOME = "Hola. Estoy aquí si necesitas conversar, organizar algo o simplemente ordenar tus ideas. Podemos ir a tu ritmo.";
  const HISTORY_LIMIT = 10;
  const FRIENDLY_NETWORK = "No pude conectarme. Revisa tu internet e inténtalo de nuevo cuando quieras.";
  const HELP = "Comandos de voz: «nueva conversación», «menos estímulos», «más estímulos», «activar voz», «desactivar voz», «repetir», «detener», «terminar conversación» y «ayuda». Para conversar sin teclado, toca el átomo. Cualquier otra cosa que digas se envía como mensaje.";

  const $ = (id) => document.getElementById(id);
  const orb = $("orb"), log = $("log"), reply = $("reply"), you = $("you"), status = $("status");
  const form = $("form"), input = $("message"), send = $("send");
  const calm = $("calm"), voice = $("voice"), mic = $("mic"), reset = $("reset");
  const modelSel = $("modelSelect"), retryBtn = $("retryModel");
  const talkHint = $("talkHint");
  const tokensEl = $("tokens"), voiceSel = $("voiceSelect"), rateSel = $("rate"), voiceTest = $("voiceTest");

  let history = [];
  let busy = false;
  let stateTimer = null;
  let lastReply = "";
  let lastFailedText = "";
  let presentation = false, wasFullscreen = false;
  let convo = false, silences = 0, gotResult = false, wakeLock = null, listenTimer = null;
  let lastUsedModel = "";
  let models = [];
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

  // --- Voz de salida (opcional, apagada por defecto). Fuente: voz de AURA (servidor) o voz del dispositivo.
  const synth = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null;
  const voiceSourceSel = $("voiceSource"), voiceInfo = $("voiceInfo");
  let voiceOn = false;
  let voiceSource = store.get("aura-voice-source") === "device" ? "device" : "server";
  let audio = null, audioAbort = null, speakToken = 0;

  function setVoice(on) {
    voiceOn = on;
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

  voice.hidden = false;
  rateSel.value = ["0.8", "0.95", "1.1"].includes(store.get("aura-rate")) ? store.get("aura-rate") : "0.95";
  setVoice(store.get("aura-voice") === "1");
  voice.addEventListener("click", () => setVoice(!voiceOn));
  rateSel.addEventListener("change", () => store.set("aura-rate", rateSel.value));
  voiceSourceSel.value = voiceSource;
  voiceSourceSel.addEventListener("change", () => {
    voiceSource = voiceSourceSel.value === "device" ? "device" : "server";
    store.set("aura-voice-source", voiceSource);
    stopSpeaking();
  });
  voiceTest.addEventListener("click", () => speak("Hola, soy AURA. Podemos ir a tu ritmo.", () => {}));
  if (synth) {
    populateVoices();
    if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", populateVoices);
    voiceSel.addEventListener("change", () => store.set("aura-voice-uri", voiceSel.value));
  } else {
    $("voiceControls").hidden = true;
  }

  function showVoiceInfo(text) { voiceInfo.textContent = text; voiceInfo.hidden = false; }

  function speakDevice(text, onEnd) {
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

  function cancelAudio() {
    if (audioAbort) { audioAbort.abort(); audioAbort = null; }
    if (audio) {
      audio.onended = null; audio.onerror = null;
      audio.pause();
      try { URL.revokeObjectURL(audio.src); } catch { /* ya liberada */ }
      audio = null;
    }
  }

  // Voz de AURA generada por el servidor (Workers AI). Si falla, se usa la voz del dispositivo.
  async function speakServer(text, onEnd, token) {
    const ctrl = new AbortController();
    audioAbort = ctrl;
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("tts");
    const blob = await res.blob();
    if (token !== speakToken) return; // se canceló mientras se generaba
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.playbackRate = (Number(rateSel.value) || 0.95) / 0.95;
    audio = a;
    await a.play(); // si el navegador lo bloquea, lanza y se usa la voz del dispositivo
    showVoiceInfo(`Voz en uso: AURA (${shortName(res.headers.get("X-Aura-Tts-Model") || "servidor")})`);
    const end = () => { if (audio === a) cancelAudio(); onEnd(); };
    a.onended = end;
    a.onerror = end;
  }

  function speak(text, onEnd) {
    const token = ++speakToken;
    cancelAudio();
    if (voiceSource === "server") {
      speakServer(text, onEnd, token).catch((err) => {
        if (token !== speakToken || (err && err.name === "AbortError")) return;
        cancelAudio();
        showVoiceInfo("Voz en uso: teléfono (la voz de AURA no respondió)");
        speakDevice(text, onEnd);
      });
    } else {
      showVoiceInfo("Voz en uso: teléfono");
      speakDevice(text, onEnd);
    }
  }
  function stopSpeaking() {
    speakToken += 1;
    cancelAudio();
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
    const back = () => { if (orb.dataset.state === "speaking") setState("idle"); if (convo) listenSoon(); };
    if ((synth || voiceSource === "server") && (voiceOn || force || convo || presentation)) {
      speak(text, back);
    } else {
      // Sin voz: la luz acompaña mientras se lee (entre 1,5 y 7 segundos).
      stateTimer = setTimeout(back, Math.min(7000, Math.max(1500, text.length * 45)));
    }
  }

  // --- Elección de modelo (laboratorio): solo entre los que publica el servidor
  const shortName = (m) => m.replace(/^@cf\//, "");
  async function loadModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.models)) return;
      models = data.models;
      modelSel.replaceChildren();
      const auto = document.createElement("option");
      auto.value = ""; auto.textContent = "Automático (principal con respaldo)";
      modelSel.appendChild(auto);
      models.forEach((m) => {
        const o = document.createElement("option");
        o.value = m; o.textContent = shortName(m);
        modelSel.appendChild(o);
      });
    } catch { /* sin lista: el modo automático sigue funcionando */ }
  }
  function retryWithNextModel() {
    if (busy) return;
    if (models.length < 2) { status.textContent = "No hay otros modelos disponibles."; return; }
    const current = modelSel.value || lastUsedModel || models[0];
    const next = models[(Math.max(0, models.indexOf(current)) + 1) % models.length];
    modelSel.value = next;
    if (lastFailedText) {
      const text = lastFailedText;
      input.value = "";
      submit(text);
    } else {
      status.textContent = `Los próximos mensajes usarán ${shortName(next)}.`;
    }
  }
  retryBtn.addEventListener("click", retryWithNextModel);
  loadModels();

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

  // Tras un error, deja el botón para reintentar con otro modelo junto al mensaje.
  function offerRetry(text) {
    lastFailedText = text;
    if (models.length < 2) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "retry";
    b.textContent = "Reintentar con otro modelo";
    b.addEventListener("click", retryWithNextModel);
    reply.appendChild(b);
  }

  // Tras un error, si se conversa por voz, se lee el mensaje para que no haga falta mirar la pantalla.
  function afterError(msg) {
    if (convo) startSpeaking(msg, true);
    else setState("idle");
  }

  async function submit(text, viaVoice) {
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
        body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT), ...(modelSel.value ? { model: modelSel.value } : {}) }),
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
        offerRetry(text);
        afterError(msg);
      } else {
        lastFailedText = "";
        lastUsedModel = typeof data.model === "string" ? data.model : lastUsedModel;
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
      offerRetry(text);
      afterError(FRIENDLY_NETWORK);
    } finally {
      setBusy(false);
      if (!listening && !convo && !viaVoice) input.focus(); // no abrir el teclado al hablar
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
    lastFailedText = "";
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
    { label: "modo presentación", re: /\b(modo presentacion|pantalla limpia)\b/, run: () => setPresentation(true) },
    { label: "salir de la presentación", re: /\b(salir|terminar) (de )?(la )?presentacion\b/, run: () => setPresentation(false) },
    { label: "terminar conversación", re: /\b(terminar|finalizar|cerrar) (la )?(conversacion|charla)\b|\bhasta luego\b|\bchao\b|\badios\b/, run: () => endConvo() },
    { label: "nueva conversación", re: /\b(nueva conversacion|empezar de nuevo|borrar todo)\b/, run: resetConversation },
    { label: "menos estímulos", re: /\b(menos estimulos|modo calma|modo tranquilo)\b/, run: () => setCalm(true) },
    { label: "más estímulos", re: /\b(mas estimulos|quitar modo calma)\b/, run: () => setCalm(false) },
    { label: "desactivar voz", re: /\b(desactivar|apagar) (la )?voz\b|\bsilencio\b/, run: () => setVoice(false) },
    { label: "activar voz", re: /\b(activar|encender|prender) (la )?voz\b/, run: () => setVoice(true) },
    { label: "repetir", re: /\b(repetir|repite)\b/, run: () => { if (lastReply) startSpeaking(lastReply, true); } },
    { label: "detener", re: /\b(detener|parar|basta)\b/, run: stopSpeaking },
    { label: "ayuda", re: /\b(ayuda|comandos)\b/, run: () => { showReply(HELP); if (convo) startSpeaking(HELP, true); else setState("idle"); } },
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
    if (cmd) {
      status.textContent = `Comando: ${cmd.label}`;
      cmd.run();
      if (convo && orb.dataset.state !== "speaking") listenSoon();
      return;
    }
    if (busy) { status.textContent = "Espera un momento, AURA todavía está respondiendo."; return; }
    input.value = "";
    submit(text, true);
  }

  function stopListening() { if (rec) { try { rec.stop(); } catch { /* ya detenido */ } } }
  function startListening() {
    if (!SR || busy || listening) return;
    gotResult = false;
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
      if (text) { gotResult = true; silences = 0; handleSpoken(text); }
    };
    rec.onerror = (e) => {
      const denied = e.error === "not-allowed" || e.error === "service-not-allowed";
      status.textContent = denied
        ? "No tengo permiso para usar el micrófono."
        : e.error === "no-speech" ? "No te escuché. Puedes intentarlo de nuevo." : "No pude escucharte.";
      if (denied && convo) endConvo("No tengo permiso para usar el micrófono.");
    };
    rec.onend = () => {
      listening = false;
      mic.setAttribute("aria-pressed", "false");
      mic.textContent = "Mic";
      if (orb.dataset.state === "listening") setState("idle");
      if (status.textContent === "Te escucho…") status.textContent = "";
      // En conversación por voz: si no hubo voz, reintenta; tras 3 silencios seguidos se pausa sola.
      if (convo && !gotResult && !busy && orb.dataset.state !== "speaking") {
        silences += 1;
        if (silences >= 3) endConvo("No te escucho. Pausé la conversación por voz. Toca el átomo para seguir.");
        else listenSoon();
      }
    };
    try { rec.start(); } catch { /* ya estaba escuchando */ }
  }
  // --- Modo presentación: solo el átomo, sin textos ni controles; AURA siempre responde con voz
  function setPresentation(on) {
    presentation = on;
    document.documentElement.dataset.presentation = on ? "true" : "false";
    const root = document.documentElement;
    try {
      if (on && root.requestFullscreen) {
        const r = root.requestFullscreen();
        if (r && r.catch) r.catch(() => {});
      } else if (!on && document.fullscreenElement) {
        const r = document.exitFullscreen();
        if (r && r.catch) r.catch(() => {});
      }
    } catch { /* pantalla completa no disponible */ }
    if (!on) wasFullscreen = false;
  }
  $("presentBtn").addEventListener("click", () => setPresentation(true));
  $("exitPresentation").addEventListener("click", () => setPresentation(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && presentation) setPresentation(false); });
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) wasFullscreen = true;
    else if (presentation && wasFullscreen) setPresentation(false); // salir de pantalla completa = salir de la presentación
  });
  try { if (new URLSearchParams(location.search).get("presentacion") === "1") setPresentation(true); } catch { /* sin parámetros */ }

  // --- Conversación por voz (sin teclado): tocar el átomo; escucha, responde hablando y vuelve a escuchar
  function listenSoon() {
    clearTimeout(listenTimer);
    listenTimer = setTimeout(() => {
      if (convo && !busy && !listening && orb.dataset.state !== "speaking") startListening();
    }, 500);
  }
  function setTalkUI(on) {
    orb.setAttribute("aria-pressed", String(on));
    talkHint.textContent = on ? "Conversación por voz activa. Toca el átomo para terminar." : "Toca el átomo para conversar por voz.";
  }
  async function requestWake() {
    try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch { /* no disponible */ }
  }
  function releaseWake() {
    try { if (wakeLock) wakeLock.release(); } catch { /* ya liberado */ }
    wakeLock = null;
  }
  function startConvo() {
    if (!SR || convo) return;
    convo = true;
    silences = 0;
    setTalkUI(true);
    requestWake();
    status.textContent = "Conversación por voz activa.";
    startListening();
  }
  function endConvo(message) {
    convo = false;
    clearTimeout(listenTimer);
    stopListening();
    stopSpeaking();
    releaseWake();
    setTalkUI(false);
    setState("idle");
    status.textContent = message || "Conversación por voz terminada.";
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && convo) endConvo("Pausé la conversación por voz porque saliste de la pantalla.");
  });

  if (SR) {
    mic.hidden = false;
    mic.addEventListener("click", () => { if (!convo) (listening ? stopListening() : startListening()); });
    orb.removeAttribute("aria-hidden");
    orb.setAttribute("role", "button");
    orb.setAttribute("tabindex", "0");
    orb.setAttribute("aria-label", "Conversar por voz. Tocar para empezar o terminar.");
    talkHint.hidden = false;
    setTalkUI(false);
    const toggle = () => (convo ? endConvo() : startConvo());
    orb.addEventListener("click", toggle);
    orb.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
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
