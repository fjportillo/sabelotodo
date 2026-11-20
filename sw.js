/* Service worker de Sabelotodo: permite instalar la web como app y jugar sin conexión.
   Estrategia: primero la red (para tener siempre la última versión y las preguntas nuevas) y,
   si no hay conexión, la copia guardada. Supabase y otras webs no pasan por aquí. */
const CACHE = "sabelotodo-v3";
const SHELL = ["./", "index.html", "preguntas.csv", "logo.png", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "i18n/ui.js", "i18n/preguntas_ca.csv", "i18n/preguntas_en.csv"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const sameOrigin = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;                       // Supabase, PayPal, etc.: directo a la red
  if (fonts){                                              // fuentes: copia guardada y se actualiza en segundo plano
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // cache "no-cache": siempre se pregunta al servidor si hay versión nueva (si no la hay, responde 304 y no se descarga nada)
  const fresh = req.mode === "navigate" ? new Request(req.url, {cache: "no-cache", credentials: "same-origin"}) : new Request(req, {cache: "no-cache"});
  e.respondWith(fetch(fresh).then(r => {
    if (r.ok){ const copy = r.clone(); const csv = url.pathname.match(/(i18n\/preguntas_\w+\.csv|preguntas\.csv)$/); const key = csv ? csv[1] : req;
      caches.open(CACHE).then(c => c.put(key, copy)); }
    return r;
  }).catch(async () => {
    const c = await caches.open(CACHE);
    return (await c.match(req, {ignoreSearch: true})) ||
           ((url.pathname.match(/(i18n\/preguntas_\w+\.csv|preguntas\.csv)$/) || [])[1] ? await c.match(url.pathname.match(/(i18n\/preguntas_\w+\.csv|preguntas\.csv)$/)[1]) : null) ||
           (req.mode === "navigate" ? await c.match("index.html") : Response.error());
  }));
});
