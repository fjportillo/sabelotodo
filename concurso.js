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
  if (robo && robado) L.push(`🦹 ${T("¡{a} roba {n} puntos a {b}!", {a: esc(robo.nombre), n: robo.puntos - 50, b: esc(robado.nombre)})}`);
  if (tipo === "robo" && ac.length) L.push(`✅ ${T("Aciertos: {n} (+50 cada uno)", {n: ac.length + (robo ? 1 : 0)})}`);
  if (primero) L.push(`⚡ ${T("¡{a} ha sido el más rápido! +{n}", {a: esc(primero.nombre), n: primero.puntos})}`);
  else if (tipo === "rapido") L.push(T("Nadie ha acertado"));
  if ((tipo === "contrarreloj" || tipo === "final") && ac.length) L.push(`🏅 ${T("Mejor jugada: {a} +{n}", {a: esc(ac[0].nombre), n: ac[0].puntos})}`);
  if (tipo === "calentamiento") L.push(`✅ ${T("Aciertos: {n}", {n: ac.length})}`);
  if (fallos.length) L.push(`<span class="menos">❌ ${T("Fallos: {n}", {n: fallos.length})}</span>`);
  return {L, robo: !!(robo && robado), primero: !!primero};
}
