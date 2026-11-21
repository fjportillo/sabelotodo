/* Idiomas para las páginas del modo evento (evento.html y jugar.html).
   Usa las mismas traducciones que el quiz (i18n/ui.js) y el mismo idioma guardado (rmq-lang). */
(function(){
  const LANGS = {es: "Castellano", ca: "Català", en: "English"};
  const u = new URLSearchParams(location.search).get("lang");
  let lang = null;
  if (u && LANGS[u]){ lang = u; try{ localStorage.setItem("sab:rmq-lang", JSON.stringify(u)); }catch(e){} }
  if (!lang){ try{ const s = JSON.parse(localStorage.getItem("sab:rmq-lang")); if (LANGS[s]) lang = s; }catch(e){} }
  if (!lang){ const n = (navigator.language || "es").slice(0, 2).toLowerCase(); lang = n === "ca" ? "ca" : ["es", "gl", "eu"].includes(n) ? "es" : "en"; }
  const LOCALE = {es: "es-ES", ca: "ca-ES", en: "en-GB"}[lang];
  const MISS = new Set();
  function T(str, vars){
    let r = str;
    if (lang !== "es"){ const d = (window.I18N || {})[lang] || {}; if (d[str] != null) r = d[str]; else MISS.add(str); }
    if (vars) r = r.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
    return r;
  }
  function translateStatic(){
    const key = h => h.trim().replace(/\s+/g, " ");
    document.querySelectorAll("[data-t]").forEach(el => {
      const m = el.innerHTML.match(/^(\s*)([\s\S]*?)(\s*)$/), k = key(m[2]), tr = T(k);
      if (tr !== k) el.innerHTML = m[1] + tr + m[3];
    });
    [["data-t-ph", "placeholder"], ["data-t-title", "title"], ["data-t-aria", "aria-label"]].forEach(([a, attr]) =>
      document.querySelectorAll(`[${a}]`).forEach(el => el.setAttribute(attr, T(el.getAttribute(attr)))));
    document.querySelectorAll("#lang-sw [data-lang]").forEach(b => {
      b.classList.toggle("on", b.dataset.lang === lang);
      b.addEventListener("click", () => {
        if (b.dataset.lang === lang) return;
        if (window.I18N_CONFIRM && !window.I18N_CONFIRM()) return;
        try{ localStorage.setItem("sab:rmq-lang", JSON.stringify(b.dataset.lang)); }catch(e){}
        const url = new URL(location.href); url.searchParams.delete("lang"); history.replaceState(history.state, "", url.toString()); location.reload();
      });
    });
    document.documentElement.lang = lang;
  }
  // Traducciones de preguntas: Map "pregunta en castellano|visual" -> {correctaEs, q, c, w:[...]}
  async function questionMap(l){
    const map = new Map();
    if (l === "es") return map;
    try{
      const res = await fetch(`i18n/preguntas_${l}.csv?t=${Date.now()}`, {cache: "no-store"});
      if (!res.ok) return map;
      const rows = window.parseCSV(await res.text());
      const h = rows[0].map(x => x.trim().toLowerCase().replace(/[^a-z0-9]/g, "")), ix = k => h.indexOf(k);
      for (const r of rows.slice(1)){
        const g = i => i >= 0 ? (r[i] || "").trim() : "";
        map.set(g(ix("preguntaes")) + "|" + g(ix("visual")), {ce: g(ix("correctaes")), q: g(ix("pregunta")), c: g(ix("correcta")), w: [g(ix("incorrecta1")), g(ix("incorrecta2")), g(ix("incorrecta3"))]});
      }
    }catch(e){}
    return map;
  }
  // Devuelve {texto, base:[correcta, incorrectas...]} traducidos (o en castellano si no hay traducción válida)
  function translateQ(map, b){
    const t = map.get(b.q + "|" + (b.vis || ""));
    const base = [b.c, ...b.wrong];
    if (!t || t.ce !== b.c || !t.q) return {texto: b.q, base};
    return {texto: t.q, base: base.map((x, i) => (i === 0 ? t.c : t.w[i - 1]) || x)};
  }
  window.LANG = lang; window.LOCALE = LOCALE; window.T = T; window.I18N_MISS = MISS;
  window.I18NX = {translateStatic, questionMap, translateQ, LANGS};
})();
