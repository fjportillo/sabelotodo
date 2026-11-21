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
