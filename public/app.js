// Interfaz de AURA (Fase 1). El historial vive solo en memoria del navegador.
(() => {
  "use strict";

  const WELCOME = "Hola. Estoy aquí si necesitas conversar, organizar algo o simplemente ordenar tus ideas. Podemos ir a tu ritmo.";
  const HISTORY_LIMIT = 10;
  const FRIENDLY_NETWORK = "No pude conectarme. Revisa tu internet e inténtalo de nuevo cuando quieras.";

  const $ = (id) => document.getElementById(id);
  const log = $("log"), form = $("form"), input = $("message"), send = $("send");
  const status = $("status"), calm = $("calm"), reset = $("reset");

  let history = [];
  let busy = false;

  // --- Preferencia "menos estímulos" (opcional; si no hay almacenamiento, sigue funcionando)
  function setCalm(on) {
    document.documentElement.dataset.calm = on ? "true" : "false";
    calm.setAttribute("aria-pressed", String(on));
    try { localStorage.setItem("aura-calm", on ? "1" : "0"); } catch { /* sin almacenamiento */ }
  }
  let saved = null;
  try { saved = localStorage.getItem("aura-calm"); } catch { /* sin almacenamiento */ }
  setCalm(saved === "1");
  calm.addEventListener("click", () => setCalm(calm.getAttribute("aria-pressed") !== "true"));

  // --- Render seguro: siempre textContent, nunca innerHTML
  function addMessage(role, text, extraClass) {
    const box = document.createElement("div");
    box.className = `msg ${role}${extraClass ? " " + extraClass : ""}`;
    text.split(/\n{2,}/).forEach((part) => {
      const p = document.createElement("p");
      p.textContent = part;
      box.appendChild(p);
    });
    log.appendChild(box);
    box.scrollIntoView({ block: "end", behavior: calm.getAttribute("aria-pressed") === "true" ? "auto" : "smooth" });
    return box;
  }

  function addLoading() {
    const box = document.createElement("div");
    box.className = "msg aura";
    box.innerHTML = '<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>';
    log.appendChild(box);
    box.scrollIntoView({ block: "end" });
    return box;
  }

  function setBusy(on) {
    busy = on;
    send.disabled = on;
    status.hidden = !on;
    status.textContent = on ? "AURA está escribiendo…" : "";
  }

  async function submit(text) {
    history.push({ role: "user", content: text });
    addMessage("user", text);
    setBusy(true);
    const loading = addLoading();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT) }),
      });
      let data = null;
      try { data = await res.json(); } catch { /* respuesta no JSON */ }
      loading.remove();
      if (!res.ok || !data || typeof data.reply !== "string") {
        history.pop(); // el mensaje no se procesó; se puede reintentar
        input.value = text;
        let msg = data && data.error && data.error.message ? data.error.message : "Algo no salió bien. Inténtalo de nuevo.";
        if (data && data.error && data.error.ref) msg += ` (referencia ${data.error.ref})`;
        addMessage("aura", msg, "error");
      } else {
        history.push({ role: "assistant", content: data.reply });
        addMessage("aura", data.reply);
      }
    } catch {
      loading.remove();
      history.pop();
      input.value = text;
      addMessage("aura", FRIENDLY_NETWORK, "error");
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
    submit(text);
  });

  // Enter envía; Shift+Enter hace salto de línea
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  reset.addEventListener("click", () => {
    history = [];
    log.replaceChildren();
    addMessage("aura", WELCOME);
    input.value = "";
    input.focus();
  });
})();
