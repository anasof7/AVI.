/* =========================================================
   AVI A.M — "hace más frío"
   Web interactiva en p5.js
   Flujo: puertas -> pasillo (4 pósters) -> show (4 canciones)
          -> confeti -> luces apagadas -> boleto "volver a vivir"
   ========================================================= */

/* ---------- 1. CONTENIDO (edita aquí) ---------- */

const CONFIG = {
  // Si tus archivos están en GitHub Pages y pruebas desde otro sitio (por ejemplo el editor de p5),
  // pon aquí la dirección, por ejemplo: "https://TU-USUARIO.github.io/avi-web/". Si no, déjalo vacío.
  baseUrl: "",

  // ---- IMÁGENES: a la izquierda el nombre interno (no se toca), a la derecha la ruta de TU archivo ----
  images: {
    "azul":          "assets/img/azul.jpg",
    "hace-mas-frio": "assets/img/hace-mas-frio.jpg",
    "vox-2007":      "assets/img/vox-2007.jpg",
    "dos-almas":     "assets/img/dos-almas.jpg"
  },

  // ---- ANIMACIÓN DE AVI en la pantalla de inicio del show ----
  // Cuadros f0.jpg, f1.jpg... en esa carpeta. Si no los subes, pon count: 0 y saldrá el nombre "AVI A.M".
  aviFrames: { folder: "assets/img/frames/", count: 46, ext: ".jpg" },

  // ---- COLORES DE LOS PÓSTERS [R, G, B] ----
  theme: {
    paper:  [250, 248, 242],   // fondo del póster y de la tarjeta de lectura
    ink:    [28, 28, 38],      // color del texto
    accent: [226, 52, 20]      // detalles (línea, check, botón)
  },

  // Si no quieres usar la canción completa, pon cuántos segundos suenan.
  // null = la canción entera.
  clipSeconds: 60,

  posters: [
    { title: "¿Quién es Avi?",
      img: "azul",
      body: "Avi A.M es un artista que se presenta con una frase sencilla: “hago canciones :)”. " +
            "Tiene 101 oyentes mensuales y varios lanzamientos entre 2025 y 2026: " +
            "dos almas, vox 2007, hace más frío y azul.\n\n" +
            "[EDITA: agrega aquí su historia]" },
    { title: "¿De dónde sale?",
      img: "dos-almas",
      body: "[EDITA: escribe de dónde es Avi y dónde empezó a hacer música.]" },
    { title: "¿Qué música hace?",
      img: "vox-2007",
      body: "[EDITA: describe su género y cómo suenan sus canciones.]" },
    { title: "¿Qué quiere transmitir?",
      img: "hace-mas-frio",
      body: "[EDITA: escribe qué quiere comunicar: sus temas, emociones, el frío, el azul.]" }
  ],

  // Orden del show (como en la página de Spotify: de la más nueva a la más vieja).
  // Pon tus archivos de audio en assets/audio/ con estos nombres.
  songs: [
    { name: "azul",          tag: "single · 2026", img: "azul",          audio: "assets/audio/azul.mp3",
      colors: [[40, 80, 255], [150, 190, 255]] },
    { name: "hace más frío", tag: "single · 2026", img: "hace-mas-frio", audio: "assets/audio/hace-mas-frio.mp3",
      colors: [[200, 210, 235], [120, 130, 170]] },
    { name: "vox 2007",      tag: "EP · 2026",     img: "vox-2007",      audio: "assets/audio/vox-2007.mp3",
      colors: [[255, 140, 50], [230, 90, 70]] },
    { name: "dos almas",     tag: "single · 2025", img: "dos-almas",     audio: "assets/audio/dos-almas.mp3",
      colors: [[90, 160, 200], [240, 140, 60]] }
  ]
};

/* ---------- 2. CONSTANTES Y ESTADO ---------- */

const LW = 1280, LH = 720;           // lienzo lógico 16:9
const INK = [28, 28, 38], CREAM = [244, 241, 236], RED = [226, 52, 20], BLUE = [60, 90, 200];
const GOTHIC = "UnifrakturCook, 'Old English Text MT', serif";
const MONO = "'Courier New', monospace";
const SANS = "Helvetica, Arial, sans-serif";

let S = 1, OX = 0, OY = 0;           // escala y desplazamiento del lienzo lógico
let imgs = {}, aviFrames = [];
const N_AVI = CONFIG.aviFrames.count;
const T = CONFIG.theme;
let scene = "doors";                  // doors | hall | show | finale
let sceneT0 = 0;
let mx = 0, my = 0;                   // mouse en coordenadas lógicas
let whiteA = 0, blackA = 0, flashA = 0;
let pendingScene = null, fadeT0 = 0;

// puertas
let doorsOpening = false, doorsT0 = 0;

// pasillo
const WORLD_W = 3900;
let camX = 0, camTarget = 0;
let visited = new Set();
let openPoster = -1;
let pressX = 0, pressY = 0, dragDist = 0, dragging = false;
const POSTER_X = [620, 1250, 1880, 2510];
const DOOR_X = 3330;

// show
let songIdx = -1;                    // -1 = pantalla de Avi (gif)
let playing = true;
let audioEl = null, songStart = 0, songEnded = false;
let crowd = [];

// final
let confetti = [], finaleT0 = 0, finalePhase = 0;
let sparkles = [];

/* ---------- 3. AUDIO ---------- */

let actx = null, noiseBuffer = null;

function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === "suspended") actx.resume();
}
function getNoise() {
  if (noiseBuffer || !actx) return noiseBuffer;
  noiseBuffer = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}
function noiseBurst(o) {
  if (!actx) return;
  const { dur = 0.5, type = "bandpass", f0 = 800, f1 = 800, q = 1, gain = 0.3, attack = 0.01, when = 0 } = o;
  const t = actx.currentTime + when;
  const src = actx.createBufferSource();
  src.buffer = getNoise(); src.loop = true;
  const f = actx.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(actx.destination);
  src.start(t); src.stop(t + dur + 0.05);
}
function tone(freq, dur = 0.2, type = "sine", gain = 0.15, when = 0, slideTo = null) {
  if (!actx) return;
  const t = actx.currentTime + when;
  const osc = actx.createOscillator();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(actx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}
const sfx = {
  click()   { tone(900, 0.05, "square", 0.05); tone(620, 0.06, "square", 0.04, 0.04); },
  door()    { noiseBurst({ type: "lowpass", f0: 180, f1: 1200, dur: 2.6, gain: 0.35, attack: 0.4 });
              tone(70, 2.4, "sawtooth", 0.07, 0, 38); },
  light()   { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 1.8, "sine", 0.05, i * 0.12)); },
  next()    { noiseBurst({ type: "highpass", f0: 2500, f1: 6000, dur: 0.18, gain: 0.18 }); tone(1200, 0.08, "triangle", 0.08); },
  confetti(){ [0, 0.35, 0.8].forEach(w => noiseBurst({ type: "highpass", f0: 1500, f1: 7000, dur: 0.3, gain: 0.45, when: w }));
              noiseBurst({ type: "bandpass", f0: 900, f1: 1500, q: 0.7, dur: 3.4, gain: 0.22, attack: 0.6, when: 0.2 }); },
  blackout(){ tone(140, 0.8, "sine", 0.3, 0, 38); noiseBurst({ type: "lowpass", f0: 600, f1: 60, dur: 0.9, gain: 0.3 }); },
  ticket()  { tone(880, 0.5, "triangle", 0.07); tone(1320, 0.7, "triangle", 0.05, 0.12); }
};

function fadeAudio(el, to, ms, then) {
  if (!el) return;
  const from = el.volume, steps = 12; let i = 0;
  const id = setInterval(() => {
    i++; el.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
    if (i >= steps) { clearInterval(id); if (then) then(); }
  }, ms / steps);
}
function stopSong(fast) {
  if (!audioEl) return;
  const old = audioEl; audioEl = null;
  if (fast) { old.pause(); return; }
  fadeAudio(old, 0, 350, () => old.pause());
}
function playSong(i) {
  stopSong(false);
  songEnded = false; songStart = millis();
  const s = CONFIG.songs[i];
  if (!s.el) {
    s.el = new Audio((CONFIG.baseUrl || "") + s.audio);
    s.el.preload = "auto";
    s.el.addEventListener("error", () => { s.missing = true; });
  }
  const el = s.el;
  try { el.currentTime = 0; } catch (e) {}
  el.volume = 0;
  const p = el.play(); if (p && p.catch) p.catch(() => { s.missing = true; });
  fadeAudio(el, 1, 500);
  audioEl = el;
  playing = true;
}
function songProgress() {
  if (songIdx < 0) return 0;
  const s = CONFIG.songs[songIdx];
  const clipSec = CONFIG.clipSeconds;
  let cur, total;
  if (s.el && !s.missing && s.el.duration && isFinite(s.el.duration)) {
    cur = s.el.currentTime; total = clipSec ? Math.min(clipSec, s.el.duration) : s.el.duration;
  } else {
    cur = (millis() - songStart) / 1000; total = clipSec || 60;       // sin audio: reloj simulado
  }
  return { cur, total, p: Math.min(1, cur / total) };
}

/* ---------- 4. p5: PRELOAD / SETUP ---------- */

let loadedN = 0, failedN = 0;
// Carga de imágenes con el objeto Image nativo: funciona igual en p5.js 1.x y 2.x
class Pic {
  constructor(src) {
    this.ok = false;
    this.el = new Image();
    this.el.onload = () => { this.ok = true; loadedN++; };
    this.el.onerror = () => { loadedN++; failedN++; };
    this.el.src = src;
  }
  get width() { return this.el.naturalWidth || 1; }
  get height() { return this.el.naturalHeight || 1; }
}
function drawImg(pic, x, y, w, h, sx, sy, sw, sh) {
  if (!pic || !pic.ok) return;
  if (sx === undefined) drawingContext.drawImage(pic.el, x, y, w, h);
  else drawingContext.drawImage(pic.el, sx, sy, sw, sh, x, y, w, h);
}
function loadAssets() {
  // Si existe ASSETS (versión de un solo archivo) se usa; si no, se leen los archivos de CONFIG
  const hasA = (typeof ASSETS !== "undefined");
  const base = CONFIG.baseUrl || "";
  Object.keys(CONFIG.images).forEach(n => { imgs[n] = new Pic(hasA ? ASSETS[n] : base + CONFIG.images[n]); });
  const af = CONFIG.aviFrames;
  for (let i = 0; i < N_AVI; i++) aviFrames.push(new Pic(hasA ? ASSETS["f" + i] : base + af.folder + "f" + i + af.ext));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  loadAssets();
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  computeScale();
  // multitud del show (posiciones fijas)
  randomSeed(7);
  for (let i = 0; i < 34; i++) {
    crowd.push({ x: 20 + i * 38 + random(-10, 10), y: 668 + random(-8, 24), r: random(15, 21), ph: random(TWO_PI), phone: random() < 0.16 });
  }
  for (let i = 0; i < 90; i++) sparkles.push({ x: random(LW), y: random(LH), ph: random(TWO_PI), s: random(1, 2.6) });
  if (document.fonts) document.fonts.load("40px UnifrakturCook");
  textFont(SANS);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); computeScale(); }
function computeScale() { S = Math.min(width / LW, height / LH); OX = (width - LW * S) / 2; OY = (height - LH * S) / 2; }

/* ---------- 5. DRAW ---------- */

function draw() {
  try { drawMain(); }
  catch (e) {
    resetMatrix(); background(0); noStroke(); fill(255); textFont("monospace"); textSize(16); textAlign(LEFT, TOP);
    text("Error: " + e.message, 20, 20, width - 40);
  }
}

function drawMain() {
  background(10, 10, 16);
  mx = (mouseX - OX) / S; my = (mouseY - OY) / S;
  push(); translate(OX, OY); scale(S);
  drawingContext.save();
  drawingContext.beginPath(); drawingContext.rect(0, 0, LW, LH); drawingContext.clip();

  let hand = false;
  if (scene === "doors") hand = drawDoors();
  else if (scene === "hall") hand = drawHall();
  else if (scene === "show") hand = drawShow();
  else if (scene === "finale") hand = drawFinale();

  // transiciones globales
  if (pendingScene) {
    const k = (millis() - fadeT0) / 700;
    blackA = Math.min(1, k);
    if (k >= 1) { goScene(pendingScene); pendingScene = null; blackA = 1; }
  } else if (blackA > 0 && scene !== "finale") blackA = Math.max(0, blackA - 0.03);
  if (blackA > 0 && scene !== "finale") { noStroke(); fill(0, blackA * 255); rect(0, 0, LW, LH); }
  if (whiteA > 0) { noStroke(); fill(255, whiteA * 255); rect(0, 0, LW, LH); whiteA = Math.max(0, whiteA - 0.018); }
  if (flashA > 0) { noStroke(); fill(255, flashA * 255); rect(0, 0, LW, LH); flashA = Math.max(0, flashA - 0.09); }

  drawingContext.restore();
  pop();
  cursor(hand ? HAND : ARROW);
}

function fadeTo(name) { if (pendingScene) return; pendingScene = name; fadeT0 = millis(); }
function goScene(name) {
  scene = name; sceneT0 = millis();
  if (name === "hall") { camX = 0; camTarget = 0; }
  if (name === "show") { songIdx = -1; stopSong(true); }
}

/* ---------- helpers de dibujo ---------- */

function glow(x, y, r, c, a) {
  const g = drawingContext.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  drawingContext.save();
  drawingContext.fillStyle = g;
  drawingContext.fillRect(x - r, y - r, r * 2, r * 2);
  drawingContext.restore();
}
function vGrad(x, y, w, h, c1, c2) {
  const g = drawingContext.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
  g.addColorStop(1, `rgb(${c2[0]},${c2[1]},${c2[2]})`);
  drawingContext.save(); drawingContext.fillStyle = g; drawingContext.fillRect(x, y, w, h); drawingContext.restore();
}
function coverImage(img, x, y, w, h) {
  const ir = img.width / img.height, r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  drawImg(img, x, y, w, h, sx, sy, sw, sh);
}
function setF(font, size, style) { textFont(font); textSize(size); textStyle(style === "bold" ? BOLD : NORMAL); }
function txt(str, x, y, font, size, col, al, style, a) {
  noStroke(); fill(col[0], col[1], col[2], a === undefined ? 255 : a);
  setF(font, size, style);
  textAlign(al || LEFT, BASELINE); text(str, x, y);
}
function inRect(x, y, w, h) { return mx >= x && mx <= x + w && my >= y && my <= y + h; }
function ease(t) { t = constrain(t, 0, 1); return t * t * (3 - 2 * t); }

/* ---------- ESCENA 1: PUERTAS ---------- */

function drawDoors() {
  const t = (millis() - sceneT0) / 1000;
  // pared y piso
  vGrad(0, 0, LW, LH, [8, 8, 14], [22, 22, 34]);
  noStroke(); fill(14, 14, 22); rect(0, 600, LW, 120);
  // luz detrás de las puertas
  const o = doorsOpening ? (millis() - doorsT0) / 1000 : 0;
  const open = ease((o - 0.6) / 2.0);                 // 0 -> 1
  const crack = doorsOpening ? 1 : 0.45 + 0.25 * sin(t * 2.2);
  const DW = 330, DH = 500, DX = LW / 2, DY = 110;
  // resplandor
  const gap = open * 720;
  glow(DX, DY + DH / 2, 200 + open * 1300, [255, 255, 255], 0.25 + 0.75 * open);
  noStroke(); fill(255, 255, 255, 255 * (0.35 + 0.65 * Math.max(crack, open)));
  rect(DX - 3 - gap, DY, 6 + gap * 2, DH);
  // puertas
  for (const side of [-1, 1]) {
    const shake = (doorsOpening && o < 0.6) ? sin(o * 80) * 2 * (o / 0.6) : 0;
    const x = side < 0 ? DX - DW - gap + shake : DX + gap + shake;
    noStroke(); fill(30, 34, 58); rect(x, DY, DW, DH, 4);
    stroke(120, 140, 200); strokeWeight(2); noFill(); rect(x + 14, DY + 14, DW - 28, DH - 28, 3);
    stroke(70, 90, 150); strokeWeight(1.5);
    rect(x + 36, DY + 40, DW - 72, 180); rect(x + 36, DY + 250, DW - 72, 200);
    noStroke(); fill(210, 220, 255);
    circle(side < 0 ? x + DW - 30 : x + 30, DY + DH / 2, 16);
  }
  // marco
  noFill(); stroke(10, 10, 16); strokeWeight(14); rect(DX - DW - 7 - 0, DY - 7, DW * 2 + 14, DH + 14);
  // letrero
  const aOp = doorsOpening ? Math.max(0, 1 - o * 1.2) : 1;
  txt("AVI A.M", LW / 2, 76, GOTHIC, 66, [230, 240, 255], CENTER, "", 255 * aOp);
  if (!doorsOpening && loadedN < Object.keys(CONFIG.images).length + N_AVI) {
    txt("cargando… " + loadedN + "/" + (Object.keys(CONFIG.images).length + N_AVI), LW / 2, 664, MONO, 16, CREAM, CENTER, "", 150);
  } else if (!doorsOpening) {
    const blink = 140 + 115 * sin(t * 3);
    txt("TOCA PARA ABRIR", LW / 2, 664, MONO, 20, CREAM, CENTER, "bold", blink);
  }
  // blanco total y paso al pasillo
  if (doorsOpening) {
    if (o > 2.0) { whiteA = Math.min(1, (o - 2.0) / 0.6); }
    if (o > 2.7) { whiteA = 1; goScene("hall"); doorsOpening = false; }
  }
  return !doorsOpening;
}

/* ---------- ESCENA 2: PASILLO ---------- */

function drawHall() {
  const t = (millis() - sceneT0) / 1000;
  // movimiento de cámara
  if (!dragging && openPoster < 0) {
    if (mx < LW * 0.14 && mouseX > 0 && mouseIsInside()) camTarget -= 9 * (1 - mx / (LW * 0.14));
    if (mx > LW * 0.86 && mouseIsInside()) camTarget += 9 * ((mx - LW * 0.86) / (LW * 0.14));
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) camTarget -= 10;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) camTarget += 10;
  }
  camTarget = constrain(camTarget, 0, WORLD_W - LW);
  camX += (camTarget - camX) * 0.14;

  // fondo
  vGrad(0, 0, LW, 520, [10, 10, 18], [30, 30, 46]);
  vGrad(0, 520, LW, 200, [22, 22, 34], [8, 8, 14]);
  push(); translate(-camX, 0);
  // paneles de pared
  for (let x = 0; x < WORLD_W; x += 160) { noStroke(); fill(255, 255, 255, 5); rect(x + 10, 60, 140, 440); }
  // zócalo y piso con brillo
  noStroke(); fill(14, 14, 22); rect(0, 500, WORLD_W, 24);
  stroke(255, 255, 255, 12); strokeWeight(1);
  for (let x = 0; x < WORLD_W; x += 160) line(x, 524, x - 60 + (x % 320), 720);
  // lámparas del techo
  for (let x = 200; x < WORLD_W; x += 420) {
    noStroke(); fill(240, 240, 255); rect(x - 30, 0, 60, 10, 3);
    const flick = 0.85 + 0.15 * sin(t * 3 + x);
    drawingContext.save();
    glow(x, 40, 260, [200, 215, 255], 0.28 * flick);
    drawingContext.restore();
    noStroke(); fill(200, 215, 255, 14 * flick); triangle(x - 25, 10, x + 25, 10, x + 190, 520); triangle(x - 25, 10, x + 25, 10, x - 190, 520);
  }
  // letrero neón al inicio
  const nf = 0.75 + 0.25 * sin(t * 5) * (sin(t * 0.7) > 0.8 ? 1 : 0.2);
  glow(330, 230, 240, RED, 0.35 * nf);
  txt("AVI A.M", 330, 250, GOTHIC, 84, [255, 200, 190], CENTER, "", 255 * nf);
  txt("bienvenido al pasillo", 330, 292, MONO, 16, CREAM, CENTER, "", 170);
  txt("→ mira los pósters", 330, 318, MONO, 14, [150, 170, 230], CENTER, "", 200);

  let hand = false;
  // pósters
  for (let i = 0; i < 4; i++) {
    const p = CONFIG.posters[i], x = POSTER_X[i], y = 105, w = 290, h = 390;
    const hov = openPoster < 0 && inRect(x - camX, y, w, h);
    if (hov) hand = true;
    const sc = hov ? 1.04 : 1;
    push(); translate(x + w / 2, y + h / 2); rotate(radians((i % 2 ? 1 : -1) * 1.2)); scale(sc);
    // sombra y marco
    noStroke(); fill(0, 0, 0, 90); rect(-w / 2 + 10, -h / 2 + 14, w, h);
    if (hov) glow(0, 0, 330, [150, 180, 255], 0.35);
    fill(T.paper[0], T.paper[1], T.paper[2]); rect(-w / 2, -h / 2, w, h);
    coverImage(imgs[p.img], -w / 2 + 14, -h / 2 + 14, w - 28, 240);
    // título
    noStroke(); fill(T.ink[0], T.ink[1], T.ink[2]);
    setF(SANS, 24, "bold"); textAlign(CENTER, TOP);
    text(p.title, -w / 2 + 14, h / 2 - 118, w - 28, 80);
    // marca de visto
    if (visited.has(i)) { fill(T.accent[0], T.accent[1], T.accent[2]); circle(w / 2 - 28, -h / 2 + 28, 26); fill(255); setF(SANS, 18, "bold"); textAlign(CENTER, CENTER); text("✓", w / 2 - 28, -h / 2 + 29); }
    setF(MONO, 12); textAlign(CENTER, BASELINE); fill(110, 110, 125);
    text(visited.has(i) ? "leído" : "toca para leer", 0, h / 2 - 16);
    pop();
    txt(String(i + 1) + " / 4", x + w / 2, 66, MONO, 14, [150, 170, 230], CENTER, "bold", 190);
  }

  // puerta del show
  const unlocked = visited.size >= 4;
  const dx = DOOR_X, dy = 130, dw = 230, dh = 370;
  const dh_ = inRect(dx - camX, dy, dw, dh);
  if (unlocked) glow(dx + dw / 2, dy + dh / 2, 420, [255, 240, 200], 0.4 + 0.15 * sin(t * 3));
  noStroke(); fill(8, 8, 14); rect(dx - 12, dy - 12, dw + 24, dh + 12);
  fill(unlocked ? 255 : 40, unlocked ? 244 : 44, unlocked ? 215 : 64); rect(dx, dy, dw, dh);
  if (unlocked) { glow(dx + dw / 2, dy + dh, 260, [255, 255, 255], 0.6); }
  txt("SHOW", dx + dw / 2, dy - 36, GOTHIC, 56, unlocked ? [255, 215, 200] : [90, 95, 130], CENTER, "", 255);
  if (unlocked) {
    txt("ENTRAR AL SHOW", dx + dw / 2, dy + dh + 44, MONO, 18, CREAM, CENTER, "bold", 150 + 105 * sin(t * 4));
    if (dh_ && openPoster < 0) hand = true;
  } else {
    txt("🔒", dx + dw / 2, dy + dh / 2 + 12, SANS, 44, CREAM, CENTER, "", 220);
    txt("lee los 4 pósters", dx + dw / 2, dy + dh + 44, MONO, 16, [150, 160, 200], CENTER, "", 220);
  }
  pop();

  // flechas de desplazamiento
  if (camX > 20) txt("◀", 34, LH / 2, SANS, 38, CREAM, CENTER, "", 110 + 90 * sin(t * 4));
  if (camX < WORLD_W - LW - 20) txt("▶", LW - 34, LH / 2, SANS, 38, CREAM, CENTER, "", 110 + 90 * sin(t * 4));
  // contador
  txt("pósters leídos: " + visited.size + "/4", LW - 30, 40, MONO, 16, CREAM, RIGHT, "bold", 200);
  txt("mueve el mouse a los bordes, arrastra o usa ← →", 30, LH - 24, MONO, 13, CREAM, LEFT, "", 120);

  // tarjeta de poster abierto
  if (openPoster >= 0) hand = drawPosterCard(openPoster) || hand;
  return hand;
}
function mouseIsInside() { return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height; }

function drawPosterCard(i) {
  const p = CONFIG.posters[i];
  noStroke(); fill(0, 0, 0, 170); rect(0, 0, LW, LH);
  const x = 200, y = 90, w = 880, h = 540;
  fill(T.paper[0], T.paper[1], T.paper[2]); rect(x, y, w, h, 6);
  coverImage(imgs[p.img], x + 30, y + 30, 330, 480);
  txt(p.title, x + 400, y + 90, GOTHIC, 46, T.ink, LEFT, "", 255);
  stroke(T.accent[0], T.accent[1], T.accent[2]); strokeWeight(3); line(x + 400, y + 112, x + 520, y + 112);
  noStroke(); fill(T.ink[0], T.ink[1], T.ink[2]);
  setF(SANS, 20); textAlign(LEFT, TOP); textLeading(30);
  text(p.body, x + 400, y + 140, w - 440, h - 200);
  const bx = x + w - 150, by = y + h - 60, over = inRect(bx, by, 120, 40);
  fill(over ? T.accent[0] : T.ink[0], over ? T.accent[1] : T.ink[1], over ? T.accent[2] : T.ink[2]); rect(bx, by, 120, 40, 20);
  txt("cerrar", bx + 60, by + 26, MONO, 16, CREAM, CENTER, "bold", 255);
  return over;
}

/* ---------- ESCENA 3: SHOW ---------- */

function showColors() {
  if (songIdx < 0) return [[200, 210, 255], [255, 255, 255]];
  return CONFIG.songs[songIdx].colors;
}

function drawShow() {
  const t = (millis() - sceneT0) / 1000;
  const cols = showColors();
  vGrad(0, 0, LW, LH, [4, 4, 8], [14, 14, 22]);

  // pantalla grande
  const sx = 320, sy = 78, sw = 640, sh = 480;
  glow(sx + sw / 2, sy + sh / 2, 520, cols[0], 0.22 + 0.06 * sin(t * 2));

  // rayos de luz (aditivos)
  drawingContext.save(); drawingContext.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const bx = 130 + i * 204, ang = sin(t * 0.8 + i * 1.3) * 150;
    const c = cols[i % 2];
    noStroke(); fill(c[0], c[1], c[2], 20);
    triangle(bx - 10, 36, bx + 10, 36, bx + ang + 110, 640);
    triangle(bx - 10, 36, bx + 10, 36, bx + ang - 110, 640);
  }
  drawingContext.restore();

  // truss
  noStroke(); fill(34, 34, 48); rect(60, 22, LW - 120, 16, 3);
  for (let i = 0; i < 6; i++) { const bx = 130 + i * 204; fill(70, 70, 92); rect(bx - 16, 34, 32, 22, 4); fill(cols[i % 2][0], cols[i % 2][1], cols[i % 2][2]); circle(bx, 58, 10); }

  // bocinas
  for (const bx of [70, 1130]) {
    fill(18, 18, 26); rect(bx, 380, 80, 250, 4); fill(30, 30, 42); rect(bx, 380, 80, 8);
    for (const cy of [450, 550]) { const pulse = 1 + 0.05 * sin(t * 9); fill(10, 10, 14); circle(bx + 40, cy, 54 * pulse); fill(46, 46, 64); circle(bx + 40, cy, 24 * pulse); }
  }

  // pantalla: contenido
  fill(0); rect(sx - 12, sy - 12, sw + 24, sh + 24, 8);
  if (songIdx < 0) {
    fill(0); rect(sx, sy, sw, sh);
    const gh = sw * 9 / 16;
    const fr = N_AVI ? aviFrames[Math.floor(millis() / 83) % N_AVI] : null;
    if (fr && fr.ok) drawImg(fr, sx, sy + (sh - gh) / 2, sw, gh);
    else {   // respaldo si no hay cuadros de animación
      glow(sx + sw / 2, sy + sh / 2, 260, [150, 180, 255], 0.35 + 0.1 * sin(t * 2));
      txt("AVI A.M", sx + sw / 2, sy + sh / 2 + 30, GOTHIC, 96, [230, 240, 255], CENTER, "", 255);
    }
  } else {
    const s = CONFIG.songs[songIdx];
    drawImg(imgs[s.img], sx, sy, sw, sh);
    // barra inferior de la pantalla
    fill(0, 0, 0, 130); rect(sx, sy + sh - 74, sw, 74);
    txt(s.name, sx + 26, sy + sh - 28, GOTHIC, 48, [255, 255, 255], LEFT, "", 255);
    txt(s.tag, sx + sw - 24, sy + sh - 30, MONO, 15, CREAM, RIGHT, "", 200);
  }
  // brillo de pantalla
  fill(255, 255, 255, 10); triangle(sx, sy, sx + 260, sy, sx, sy + 260);
  stroke(cols[0][0], cols[0][1], cols[0][2], 160); strokeWeight(3); noFill(); rect(sx - 12, sy - 12, sw + 24, sh + 24, 8);

  // piso de tarima con reflejo
  noStroke(); vGrad(0, 580, LW, 140, [24, 24, 36], [6, 6, 10]);
  fill(cols[0][0], cols[0][1], cols[0][2], 22); rect(sx, 580, sw, 60);
  fill(255, 255, 255, 14); rect(0, 580, LW, 2);

  // multitud
  for (const c of crowd) {
    const b = sin(t * (songIdx < 0 ? 2 : 6) + c.ph) * (songIdx < 0 ? 2 : 6);
    noStroke(); fill(2, 2, 6); circle(c.x, c.y - c.r * 0.9 + b * 0.4, c.r * 1.2); rect(c.x - c.r, c.y - c.r * 0.3 + b * 0.4, c.r * 2, 90, 14);
    if (c.phone) { fill(255, 255, 240); rect(c.x + 6, c.y - 44 + b, 8, 13, 1); glow(c.x + 10, c.y - 40 + b, 38, [255, 250, 220], 0.35); }
  }

  // barra de control tipo Spotify
  return drawControls(t, cols);
}

function drawControls(t, cols) {
  const bx = 330, by = 566, bw = 620, bh = 78;
  noStroke(); fill(8, 8, 12, 225); rect(bx, by, bw, bh, 14);
  const s = songIdx >= 0 ? CONFIG.songs[songIdx] : null;
  txt(s ? s.name : "pre-show", bx + 22, by + 30, GOTHIC, 26, CREAM, LEFT, "", 255);
  txt("Avi A.M", bx + 22, by + 52, SANS, 13, [150, 155, 175], LEFT, "", 255);
  const cx = bx + bw / 2, cy = by + 28;
  const bprev = inRect(cx - 100 - 16, cy - 16, 32, 32), bplay = inRect(cx - 20, cy - 20, 40, 40), bnext = inRect(cx + 100 - 16, cy - 16, 32, 32);
  const lastSong = songIdx === CONFIG.songs.length - 1;
  // prev
  fill(bprev ? 255 : 190); triangle(cx - 94, cy - 9, cx - 94, cy + 9, cx - 108, cy); rect(cx - 114, cy - 9, 3, 18);
  // play/pause
  fill(255); circle(cx, cy, 40);
  fill(10);
  if (playing) { rect(cx - 7, cy - 8, 5, 16); rect(cx + 2, cy - 8, 5, 16); } else triangle(cx - 5, cy - 9, cx - 5, cy + 9, cx + 9, cy);
  // next (parpadea en intro)
  const pulse = songIdx < 0 ? 140 + 115 * sin(t * 5) : 255;
  fill(bnext ? 255 : 190, bnext ? 255 : 190, bnext ? 255 : 190, bnext ? 255 : pulse);
  triangle(cx + 94, cy - 9, cx + 94, cy + 9, cx + 108, cy); rect(cx + 111, cy - 9, 3, 18);
  // progreso
  const pr = songProgress();
  const p = pr.p || 0;
  const px = bx + 150, pw = bw - 300, py = by + 62;
  fill(70, 72, 90); rect(px, py, pw, 4, 2);
  fill(cols[0][0], cols[0][1], cols[0][2]); rect(px, py, pw * p, 4, 2);
  fill(255); circle(px + pw * p, py + 2, 10);
  if (songIdx >= 0) {
    txt(fmtTime(pr.cur || 0), px - 10, py + 6, MONO, 12, [150, 155, 175], RIGHT, "", 255);
    txt(fmtTime(pr.total || 0), px + pw + 10, py + 6, MONO, 12, [150, 155, 175], LEFT, "", 255);
  }
  // texto lateral
  const hint = songIdx < 0 ? "toca ▶▶ para empezar" : (lastSong ? "toca ▶▶ para el final" : "toca ▶▶ para la siguiente");
  txt(hint, bx + bw - 22, by + 30, MONO, 13, [200, 205, 230], RIGHT, "", 200 + 55 * sin(t * 4));
  // fin de clip
  if (songIdx >= 0 && !songEnded && pr.p >= 1) { songEnded = true; stopSong(false); playing = false; }
  return bprev || bplay || bnext || inRect(320, 78, 640, 480);
}
function fmtTime(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

function nextSong() {
  ensureAudio();
  if (songIdx >= CONFIG.songs.length - 1) { startFinale(); return; }
  songIdx++; flashA = 0.5; sfx.next(); playSong(songIdx);
}
function prevSong() {
  ensureAudio();
  if (songIdx <= -1) return;
  songIdx--; flashA = 0.4; sfx.next();
  if (songIdx < 0) stopSong(false); else playSong(songIdx);
}
function togglePlay() {
  ensureAudio();
  if (songIdx < 0) { nextSong(); return; }
  const el = audioEl || CONFIG.songs[songIdx].el;
  if (songEnded) { playSong(songIdx); return; }
  playing = !playing;
  if (el) { if (playing) { const p = el.play(); if (p && p.catch) p.catch(() => {}); } else el.pause(); }
}

/* ---------- ESCENA 4: FINAL ---------- */

function startFinale() {
  stopSong(false);
  scene = "finale"; sceneT0 = millis(); finaleT0 = millis(); finalePhase = 0;
  confetti = [];
  sfx.confetti(); flashA = 0.8;
  burstConfetti();
}
function burstConfetti() {
  const palette = [RED, BLUE, CREAM, [150, 190, 255], [255, 255, 255], [255, 180, 60], [255, 130, 170]];
  for (let i = 0; i < 200; i++) { // cañones laterales
    const left = i % 2 === 0, ang = left ? random(-75, -45) : random(-135, -105);
    const sp = random(14, 26);
    confetti.push(mkPiece(left ? 40 : LW - 40, LH - 20, cos(radians(ang)) * sp, sin(radians(ang)) * sp, palette));
  }
  for (let i = 0; i < 260; i++) // lluvia desde arriba
    confetti.push(mkPiece(random(LW), random(-500, -20), random(-1.5, 1.5), random(1, 4), palette));
}
function mkPiece(x, y, vx, vy, palette) {
  const c = palette[floor(random(palette.length))];
  return { x, y, vx, vy, rot: random(TWO_PI), vr: random(-0.25, 0.25), w: random(7, 15), h: random(4, 9), c, ph: random(TWO_PI) };
}
function drawConfetti() {
  noStroke();
  for (const p of confetti) {
    p.vy += 0.16; p.vx *= 0.992; p.vy *= 0.992;
    p.x += p.vx + sin(p.ph + millis() * 0.004) * 0.7; p.y += p.vy; p.rot += p.vr;
    push(); translate(p.x, p.y); rotate(p.rot);
    const flip = 0.4 + 0.6 * Math.abs(sin(p.rot * 2));
    fill(p.c[0], p.c[1], p.c[2]); rect(-p.w / 2, -p.h * flip / 2, p.w, p.h * flip);
    pop();
  }
  confetti = confetti.filter(p => p.y < LH + 40);
}

function drawFinale() {
  const t = (millis() - finaleT0) / 1000;
  // base: el show (luces a tope los primeros segundos)
  const keep = songIdx;
  drawShowBackdrop(t);
  // apagón
  if (finalePhase === 0 && t > 5.2) { finalePhase = 1; sfx.blackout(); }
  if (finalePhase === 1 && t > 7.6) { finalePhase = 2; sfx.ticket(); }
  const dark = ease((t - 5.2) / 2.2);
  noStroke(); fill(0, 0, 0, 255 * dark); rect(0, 0, LW, LH);
  // estrellitas tenues al quedar a oscuras
  if (dark > 0.9) for (const s of sparkles) { const a = (0.2 + 0.2 * sin(t * 2 + s.ph)) * 255 * (dark - 0.9) * 10; fill(200, 215, 255, a); circle(s.x, s.y, s.s); }
  drawConfetti();
  // boleto
  let hand = false;
  if (t > 7.6) {
    const k = ease((t - 7.6) / 1.2);
    hand = drawTicket(k, t);
  }
  return hand;
}
function drawShowBackdrop(t) {
  // reutiliza el show con luces festivas
  vGrad(0, 0, LW, LH, [4, 4, 8], [14, 14, 22]);
  const cols = [[255, 120, 90], [120, 170, 255]];
  drawingContext.save(); drawingContext.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const bx = 130 + i * 204, ang = sin(t * 3 + i * 1.3) * 260; const c = cols[i % 2];
    noStroke(); fill(c[0], c[1], c[2], 30);
    triangle(bx - 10, 36, bx + 10, 36, bx + ang + 120, 700); triangle(bx - 10, 36, bx + 10, 36, bx + ang - 120, 700);
  }
  drawingContext.restore();
  noStroke(); fill(34, 34, 48); rect(60, 22, LW - 120, 16, 3);
  const s = CONFIG.songs[CONFIG.songs.length - 1];
  fill(0); rect(308, 66, 664, 504, 8); drawImg(imgs[s.img], 320, 78, 640, 480);
  vGrad(0, 580, LW, 140, [24, 24, 36], [6, 6, 10]);
  for (const c of crowd) {
    const b = sin(t * 9 + c.ph) * 9;
    fill(2, 2, 6); circle(c.x, c.y - c.r * 0.9 + b * 0.4, c.r * 1.2); rect(c.x - c.r, c.y - c.r * 0.3 + b * 0.4, c.r * 2, 90, 14);
    if (c.phone) { fill(255, 255, 240); rect(c.x + 6, c.y - 44 + b, 8, 13, 1); }
  }
}

function ticketGeom() { return { x: LW / 2 - 270, y: LH / 2 - 105, w: 540, h: 210 }; }
function drawTicket(k, t) {
  const g = ticketGeom();
  const hov = inRect(g.x, g.y, g.w, g.h);
  push(); translate(LW / 2, LH / 2 + (1 - k) * 60);
  const sc = (hov ? 1.05 : 1) * (0.9 + 0.1 * k) * (1 + 0.012 * sin(t * 3));
  rotate(radians(-3 + (hov ? 2 : 0))); scale(sc);
  glow(0, 0, 420, [255, 220, 200], (hov ? 0.5 : 0.25) * k);
  const w = g.w, h = g.h;
  noStroke(); fill(0, 0, 0, 140 * k); rect(-w / 2 + 8, -h / 2 + 12, w, h, 12);
  // cuerpo del boleto con muescas
  fill(CREAM[0], CREAM[1], CREAM[2], 255 * k); rect(-w / 2, -h / 2, w, h, 12);
  fill(8, 8, 12); circle(-w / 2, 0, 44); circle(w / 2, 0, 44);
  // franja roja
  fill(RED[0], RED[1], RED[2], 255 * k); rect(-w / 2 + 22, -h / 2 + 20, w - 44 - 130, 10);
  // perforación
  stroke(INK[0], INK[1], INK[2], 160 * k); strokeWeight(2); drawingContext.setLineDash([6, 8]);
  line(w / 2 - 130, -h / 2 + 12, w / 2 - 130, h / 2 - 12); drawingContext.setLineDash([]);
  noStroke();
  const a = 255 * k;
  txt("AVI A.M", -w / 2 + 30, -14, GOTHIC, 62, INK, LEFT, "", a);
  txt("VOLVER A VIVIR", -w / 2 + 32, 30, MONO, 25, INK, LEFT, "bold", a);
  txt("LA EXPERIENCIA", -w / 2 + 32, 58, MONO, 25, INK, LEFT, "bold", a);
  txt("ENTRADA GENERAL · hace más frío", -w / 2 + 32, 88, MONO, 13, [90, 90, 105], LEFT, "", a);
  // talón
  push(); translate(w / 2 - 65, 0); rotate(HALF_PI);
  txt("ADMIT ONE", 0, -22, MONO, 17, INK, CENTER, "bold", a);
  txt("Nº 102", 0, 10, GOTHIC, 34, RED, CENTER, "", a);
  pop();
  pop();
  return hov && k > 0.9;
}

/* ---------- 6. ENTRADA (mouse / teclado) ---------- */

function resetExperience() {
  stopSong(true);
  visited = new Set(); openPoster = -1; songIdx = -1; confetti = [];
  doorsOpening = false; blackA = 0; whiteA = 0.9;
  scene = "doors"; sceneT0 = millis();
}

function mousePressed() {
  ensureAudio();
  pressX = mouseX; pressY = mouseY; dragDist = 0; dragging = false;
  if (scene === "doors") {
    if (!doorsOpening) { doorsOpening = true; doorsT0 = millis(); sfx.click(); sfx.door(); setTimeout(sfx.light, 1900); }
  } else if (scene === "show") {
    const bx = 330, by = 566, bw = 620, cx = bx + bw / 2, cy = by + 28;
    if (inRect(cx - 116, cy - 16, 32, 32)) { prevSong(); }
    else if (inRect(cx - 20, cy - 20, 40, 40)) { togglePlay(); }
    else if (inRect(cx + 84, cy - 16, 40, 32)) { nextSong(); }
    else if (inRect(320, 78, 640, 480)) { nextSong(); }
  } else if (scene === "finale") {
    const g = ticketGeom();
    if ((millis() - finaleT0) / 1000 > 8.2 && inRect(g.x, g.y, g.w, g.h)) { sfx.click(); resetExperience(); }
  }
  return false;
}

function mouseDragged() {
  if (scene !== "hall" || openPoster >= 0) return false;
  dragDist += Math.abs(mouseX - pmouseX) + Math.abs(mouseY - pmouseY);
  if (dragDist > 8) { dragging = true; camTarget -= (mouseX - pmouseX) / S; camX = camTarget; }
  return false;
}

function mouseReleased() {
  if (scene !== "hall") return false;
  const wasDrag = dragging; dragging = false;
  if (wasDrag || dragDist > 8) return false;
  sfx.click();
  if (openPoster >= 0) {
    if (inRect(200 + 880 - 150, 90 + 540 - 60, 120, 40) || !inRect(200, 90, 880, 540)) openPoster = -1;
    return false;
  }
  for (let i = 0; i < 4; i++) {
    if (inRect(POSTER_X[i] - camX, 105, 290, 390)) { openPoster = i; visited.add(i); return false; }
  }
  if (visited.size >= 4 && inRect(DOOR_X - camX, 130, 230, 370)) fadeTo("show");
  return false;
}

function keyPressed() {
  ensureAudio();
  if (scene === "show") {
    if (keyCode === 32) { togglePlay(); return false; }
    if (keyCode === RIGHT_ARROW) { nextSong(); return false; }
    if (keyCode === LEFT_ARROW) { prevSong(); return false; }
  }
  if (scene === "hall" && openPoster >= 0 && (keyCode === ESCAPE || keyCode === 13)) { openPoster = -1; return false; }
}
