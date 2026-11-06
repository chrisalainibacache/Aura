// Interfaz de AURA (Fase 1). El historial vive solo en memoria del navegador.
(() => {
  "use strict";

  const WELCOME = "Hola. Estoy aquí si necesitas conversar, organizar algo o simplemente ordenar tus ideas. Podemos ir a tu ritmo.";
  const HISTORY_LIMIT = 10;
  const FRIENDLY_NETWORK = "No pude conectarme. Revisa tu internet e inténtalo de nuevo cuando quieras.";

  const $ = (id) => document.getElementById(id);
  const orb = $("orb"), log = $("log"), reply = $("reply"), you = $("you"), status = $("status");
  const form = $("form"), input = $("message"), send = $("send");
  const calm = $("calm"), voice = $("voice"), reset = $("reset");

  let history = [];
  let busy = false;
  let stateTimer = null;

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

  // --- Voz (opcional, apagada por defecto; usa la voz del propio dispositivo)
  const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  let voiceOn = false;
  function setVoice(on) {
    voiceOn = on && canSpeak;
    voice.setAttribute("aria-pressed", String(voiceOn));
    voice.textContent = voiceOn ? "Voz: sí" : "Voz: no";
    store.set("aura-voice", voiceOn ? "1" : "0");
    if (!voiceOn && canSpeak) window.speechSynthesis.cancel();
  }
  if (canSpeak) {
    voice.hidden = false;
    setVoice(store.get("aura-voice") === "1");
    voice.addEventListener("click", () => setVoice(!voiceOn));
  }

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => /^es[-_]CL/i.test(v.lang)) || voices.find((v) => /^es/i.test(v.lang)) || null;
  }

  // --- Estado del átomo: idle | thinking | speaking
  function setState(state) {
    clearTimeout(stateTimer);
    orb.dataset.state = state;
  }

  function startSpeaking(text) {
    setState("speaking");
    const back = () => setState("idle");
    if (voiceOn) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-CL";
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.95;
      u.onend = back;
      u.onerror = back;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
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
        history.push({ role: "assistant", content: data.reply });
        addToLog("aura", data.reply);
        showReply(data.reply);
        startSpeaking(data.reply);
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
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    if (canSpeak) window.speechSynthesis.cancel();
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
    log.replaceChildren();
    you.hidden = true;
    showReply(WELCOME);
    setState("idle");
  }
  reset.addEventListener("click", () => {
    if (canSpeak) window.speechSynthesis.cancel();
    welcome();
    input.value = "";
    input.focus();
  });
  welcome();
})();
