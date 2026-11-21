/* Música y efectos del modo evento, sintetizados en el navegador con Web Audio:
   sin archivos de audio y sin derechos de autor. Lo usan evento.html (música + efectos) y jugar.html (efectos).
   El navegador solo deja sonar audio tras un toque o una tecla: el motor se activa en la primera interacción. */
const Sonido = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  const VOL_MUSICA = 0.22, VOL_EFECTOS = 0.75;
  const pref = (k, d) => { try{ const v = localStorage.getItem("ev-sonido-" + k); return v === null ? d : v === "1"; }catch(e){ return d; } };
  const guarda = (k, v) => { try{ localStorage.setItem("ev-sonido-" + k, v ? "1" : "0"); }catch(e){} };
  const st = {musica: pref("musica", true), efectos: pref("efectos", true)};

  function init(){
    if (ctx){ if (ctx.state === "suspended") ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = st.musica ? VOL_MUSICA : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = VOL_EFECTOS; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  ["pointerdown", "keydown", "touchstart"].forEach(ev => addEventListener(ev, () => init(), {passive: true}));

  /* ---------- Instrumentos básicos ---------- */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function tone(bus, t, midi, dur, o = {}){
    const {type = "square", vol = 0.3, attack = 0.005, release = 0.08, slideTo = null, filter = null} = o;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(hz(midi), t);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(hz(slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = osc;
    if (filter){ const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filter; osc.connect(f); n = f; }
    n.connect(g); g.connect(bus); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(bus, t, dur, o = {}){
    const {vol = 0.3, type = "highpass", f = 6000, fTo = null, q = 1} = o;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (fTo) fl.frequency.exponentialRampToValueAtTime(fTo, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(bus, t, v = 0.9){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3);
  }
  const snare = (bus, t, v = 0.25) => noise(bus, t, 0.13, {vol: v, type: "bandpass", f: 1800, q: 0.8});
  const hat = (bus, t, v = 0.08) => noise(bus, t, 0.035, {vol: v, f: 8500});

  /* ---------- Música (secuenciador de 16 pasos por compás, 4 compases) ---------- */
  const MAYOR = [[48, 52, 55, 60], [45, 48, 52, 57], [41, 45, 48, 53], [43, 47, 50, 55]];   // Do – Lam – Fa – Sol
  const MENOR = [[45, 48, 52, 57], [45, 48, 52, 57], [41, 45, 48, 53], [40, 44, 47, 52]];   // Lam – Lam – Fa – Mi
  const TEMAS = {
    espera:   {bpm: 112, acordes: MAYOR, estilo: "espera"},
    pregunta: {bpm: 132, acordes: MENOR, estilo: "tension"},
    final:    {bpm: 146, acordes: MENOR, estilo: "tension", extra: true},
  };
  let tema = null, paso = 0, siguiente = 0, reloj = null;
  function tocaPaso(t){
    const T = TEMAS[tema], s = paso % 16, ac = T.acordes[Math.floor(paso / 16) % 4], B = musicBus;
    if (T.estilo === "espera"){
      if (s === 0 || s === 8) kick(B, t, 0.55);
      if (s === 4 || s === 12) snare(B, t, 0.2);
      if (s % 4 === 2) hat(B, t, 0.1);
      if (s === 0 || s === 6 || s === 8 || s === 14) tone(B, t, ac[0] - 12, 0.22, {type: "triangle", vol: 0.5});
      if (s % 2 === 0) tone(B, t, ac[(s / 2) % 4] + 12, 0.16, {type: "square", vol: 0.07, filter: 2500});
    } else {
      if (s % 4 === 0) kick(B, t, 0.8);
      if (T.extra && (s === 4 || s === 12)) snare(B, t, 0.22);
      hat(B, t, s % 2 ? 0.04 : 0.08);
      if (s % 2 === 0) tone(B, t, ac[0] - 12, 0.12, {type: "sawtooth", vol: 0.18, filter: 700});
      tone(B, t, ac[[0, 2, 1, 3][s % 4]] + 12, 0.09, {type: "square", vol: 0.055, filter: 3000});
      if (T.extra && s % 8 === 0) tone(B, t, ac[3] + 24, 0.3, {type: "triangle", vol: 0.1});
    }
  }
  function bucle(){
    if (!tema) return;
    const dur = 60 / TEMAS[tema].bpm / 4;
    while (siguiente < ctx.currentTime + 0.15){ tocaPaso(siguiente); siguiente += dur; paso++; }
  }
  function musica(nombre){
    nombre = nombre || null;
    if (nombre === tema) return;
    tema = nombre; clearInterval(reloj); reloj = null;
    if (!nombre || !init()) return;
    paso = 0; siguiente = ctx.currentTime + 0.05; reloj = setInterval(bucle, 40);
  }

  /* ---------- Efectos ---------- */
  const ya = () => ctx.currentTime + 0.01;
  const FX = {
    ronda(){ const t = ya(), S = sfxBus;            // fanfarria de presentación de ronda
      [60, 64, 67, 72].forEach((m, i) => tone(S, t + i * 0.11, m, 0.18, {type: "square", vol: 0.22}));
      tone(S, t + 0.44, 76, 0.7, {type: "square", vol: 0.24}); tone(S, t + 0.44, 72, 0.7, {type: "square", vol: 0.16}); tone(S, t + 0.44, 48, 0.7, {type: "triangle", vol: 0.4});
      noise(S, t + 0.44, 1.0, {vol: 0.22, f: 5000}); kick(S, t + 0.44, 0.9); },
    pregunta(){ const t = ya();                      // aparece una pregunta
      noise(sfxBus, t, 0.35, {vol: 0.18, type: "bandpass", f: 400, fTo: 4000, q: 2}); tone(sfxBus, t + 0.3, 84, 0.45, {type: "sine", vol: 0.28}); },
    respuesta(){ tone(sfxBus, ya(), 79, 0.07, {type: "sine", vol: 0.16}); },                    // llega una respuesta / entra un jugador
    toque(){ const t = ya(); tone(sfxBus, t, 74, 0.05, {type: "square", vol: 0.12, filter: 3000}); tone(sfxBus, t + 0.05, 86, 0.08, {type: "sine", vol: 0.15}); },
    tic(ultimo){ tone(sfxBus, ya(), ultimo ? 88 : 76, 0.05, {type: "square", vol: 0.14, filter: 4000}); },
    tiempo(){ const t = ya(); tone(sfxBus, t, 43, 0.6, {type: "sawtooth", vol: 0.28, filter: 900}); tone(sfxBus, t, 44, 0.6, {type: "sawtooth", vol: 0.28, filter: 900}); },
    acierto(){ const t = ya(); tone(sfxBus, t, 72, 0.12, {type: "square", vol: 0.2}); tone(sfxBus, t + 0.12, 79, 0.4, {type: "square", vol: 0.2}); tone(sfxBus, t + 0.12, 84, 0.4, {type: "triangle", vol: 0.18}); },
    fallo(){ tone(sfxBus, ya(), 52, 0.38, {type: "square", vol: 0.18, filter: 1500, slideTo: 46}); },
    nadie(){ const t = ya();                         // nadie ha acertado: trombón triste
      [67, 66, 65].forEach((m, i) => tone(sfxBus, t + i * 0.32, m, 0.3, {type: "sawtooth", vol: 0.16, filter: 1200}));
      tone(sfxBus, t + 0.96, 64, 0.9, {type: "sawtooth", vol: 0.16, filter: 1200, slideTo: 62}); },
    rayo(){ const t = ya(); tone(sfxBus, t, 96, 0.25, {type: "sawtooth", vol: 0.16, slideTo: 60}); noise(sfxBus, t, 0.22, {vol: 0.14, f: 3000}); },
    robo(){ const t = ya(); tone(sfxBus, t, 76, 0.5, {type: "triangle", vol: 0.24, slideTo: 50});
      [0, 0.1, 0.2].forEach((d, i) => tone(sfxBus, t + 0.55 + d, 88 + i * 4, 0.08, {type: "square", vol: 0.13})); },
    redoble(dur = 1.2){ const t = ya();
      for (let x = 0; x < dur; x += 0.05) noise(sfxBus, t + x, 0.05, {vol: 0.06 + 0.12 * x / dur, type: "bandpass", f: 1600, q: 0.7});
      noise(sfxBus, t + dur, 0.6, {vol: 0.25, f: 5000}); kick(sfxBus, t + dur, 0.8); },
    podio(){ const t = ya(); let x = 0;              // fanfarria final y aplausos
      [[67, 0.15], [67, 0.15], [67, 0.15], [72, 0.6], [76, 0.3], [79, 1.0]].forEach(([m, d]) => {
        tone(sfxBus, t + x, m, d, {type: "square", vol: 0.2}); tone(sfxBus, t + x, m - 12, d, {type: "triangle", vol: 0.16}); x += d; });
      kick(sfxBus, t + 1.05, 0.9); noise(sfxBus, t + 1.05, 1.4, {vol: 0.2, f: 5000});
      for (let i = 0; i < 90; i++) noise(sfxBus, t + 1.2 + Math.random() * 3.2, 0.07, {vol: 0.04 + Math.random() * 0.07, type: "bandpass", f: 1200 + Math.random() * 3000, q: 1.5}); },
  };
  function fx(nombre, ...args){ if (!st.efectos || !FX[nombre] || !init()) return; try{ FX[nombre](...args); }catch(e){} }

  function setMusica(on){ st.musica = !!on; guarda("musica", st.musica); if (ctx) musicBus.gain.setTargetAtTime(st.musica ? VOL_MUSICA : 0, ctx.currentTime, 0.1); }
  function setEfectos(on){ st.efectos = !!on; guarda("efectos", st.efectos); }
  return {init, musica, fx, setMusica, setEfectos, get musicaOn(){ return st.musica; }, get efectosOn(){ return st.efectos; }};
})();
