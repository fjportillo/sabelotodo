/* Rondas del modo concurso (las usan evento.html y jugar.html).
   Los puntos los calcula la base de datos al revelar cada respuesta (concurso.sql); aquí solo están los textos
   y la cuenta atrás de puntos que se enseña en pantalla. */
const RONDAS = {
  calentamiento: {ico: "🔥", nombre: "Calentamiento", reglas: "Cada acierto suma 100 puntos. Sin prisas: es para entrar en calor.", corto: "Acierto: +100"},
  contrarreloj:  {ico: "⏱️", nombre: "Contrarreloj", reglas: "Cuanto antes aciertes, más puntos: de 200 a 20.", corto: "De 200 a 20 puntos según tu rapidez", max: 200, min: 20},
  rapido:        {ico: "⚡", nombre: "El más rápido", reglas: "Solo puntúa el primero que acierta: +200. ¡Cuidado! Fallar resta 100.", corto: "Solo el primero que acierta: +200 · Fallar: −100"},
  robo:          {ico: "🦹", nombre: "Roba puntos", reglas: "Acertar da 50 puntos, y el más rápido en acertar le roba hasta 150 al que va primero (si el líder eres tú, al segundo).", corto: "Acierto: +50 · El más rápido roba 150 al líder"},
  final:         {ico: "💣", nombre: "La gran final", reglas: "Todo o nada: de 300 a 60 puntos según tu rapidez, y fallar resta 150. ¡Aún se puede remontar!", corto: "De 300 a 60 puntos · Fallar: −150", max: 300, min: 60},
};
// Pregunta extra opcional al final de la partida (clásica o por rondas); no está en el selector de rondas
RONDAS.golpe = {ico: "💀", nombre: "Golpe final", reglas: "Una última pregunta muy difícil. El primero que acierte roba 300 puntos a cada uno de los demás jugadores. Si nadie acierta, no pasa nada.", corto: "El primero que acierte roba 300 puntos a todos"};
const RONDAS_ORDEN = ["calentamiento", "contrarreloj", "rapido", "robo", "final"];
// Puntos que vale acertar ahora mismo en las rondas en las que bajan con el tiempo (null en las demás)
function valeAhora(tipo, msPasados, segundos){
  const r = RONDAS[tipo]; if (!r || !r.max) return null;
  const f = Math.min(1, Math.max(0, msPasados / (segundos * 1000)));
  return Math.round(r.max - (r.max - r.min) * f);
}
// Frases de lo que ha pasado en una pregunta (las mismas en la pantalla grande y en los móviles).
// ps: filas de ev_puntos (nombre, puntos, motivo) de esa pregunta.
function lineasJugada(ps, tipo, T, esc){
  const by = m => ps.filter(p => p.motivo === m).sort((a, b) => b.puntos - a.puntos), L = [];
  const robo = by("robo")[0], robado = by("robado")[0], primero = by("primero")[0], fallos = by("fallo"), ac = by("acierto");
  const golpe = by("golpe")[0], golpeados = by("golpeado");
  if (golpe){
    L.push(`💀 ${T("¡{a} da el golpe final y roba {n} puntos!", {a: esc(golpe.nombre), n: golpe.puntos})}`);
    if (golpeados.length) L.push(`<span class="menos">😱 ${T("Pierden puntos: {n} jugadores", {n: golpeados.length})}</span>`);
  } else if (tipo === "golpe") L.push(T("Nadie ha acertado: nadie roba nada"));
  if (robo && robado) L.push(`🦹 ${T("¡{a} roba {n} puntos a {b}!", {a: esc(robo.nombre), n: robo.puntos - 50, b: esc(robado.nombre)})}`);
  if (tipo === "robo" && ac.length) L.push(`✅ ${T("Aciertos: {n} (+50 cada uno)", {n: ac.length + (robo ? 1 : 0)})}`);
  if (primero) L.push(`⚡ ${T("¡{a} ha sido el más rápido! +{n}", {a: esc(primero.nombre), n: primero.puntos})}`);
  else if (tipo === "rapido") L.push(T("Nadie ha acertado"));
  if ((tipo === "contrarreloj" || tipo === "final") && ac.length) L.push(`🏅 ${T("Mejor jugada: {a} +{n}", {a: esc(ac[0].nombre), n: ac[0].puntos})}`);
  if (tipo === "calentamiento") L.push(`✅ ${T("Aciertos: {n}", {n: ac.length})}`);
  if (fallos.length) L.push(`<span class="menos">❌ ${T("Fallos: {n}", {n: fallos.length})}</span>`);
  return {L, robo: !!(robo && robado) || !!golpe, primero: !!primero};
}
// Reglas de una partida (pantalla grande antes de empezar y sala de espera de los móviles).
// cfg = {modo: "concurso"|"clasico", rondas: [...], porRonda, segundos, total}
function reglasPartida(cfg, T, esc){
  if (!cfg) return "";
  const conc = cfg.modo === "concurso" && cfg.rondas && cfg.rondas.length;
  const gen = [
    "📱 " + T("Responde desde tu móvil antes de que se acabe el tiempo. Solo vale la primera respuesta."),
    "⏱ " + T("{n} preguntas · {s} segundos cada una", {n: cfg.total, s: cfg.segundos}),
    conc ? "⚡ " + T("Responder rápido da ventaja en casi todas las rondas.") : "⚡ " + T("Cada acierto da 100 puntos, y hasta 100 más si respondes rápido."),
  ];
  if (conc || cfg.golpe) gen.push("🛡️ " + T("Nadie baja de 0 puntos."));
  if (cfg.golpe) gen.push("💀 " + T("Al final, el golpe final: el primero que acierte una pregunta muy difícil roba 300 puntos a cada uno de los demás."));
  let h = `<ul class="reglas-gen">${gen.map(g => `<li>${esc(g)}</li>`).join("")}</ul>`;
  if (conc) h += `<div class="reglas-rondas">${cfg.rondas.map((k, i) => { const r = RONDAS[k]; if (!r) return "";
    return `<div class="rr"><span class="ic">${r.ico}</span><div><b>${i + 1}. ${esc(T(r.nombre))}</b> <span class="n">· ${esc(T("{n} preguntas", {n: cfg.porRonda}))}</span><br><small>${esc(T(r.reglas))}</small></div></div>`; }).join("")}</div>`;
  return h;
}
