/*Trabaje con el artista AVI A.M */
const CONFIG = {
  baseUrl: "",

  images: {
    "azul": "assets/Azul.png",
    "hace-mas-frio": "assets/Hacemasfrio.png",
    "dos-almas": "assets/Dos-almas.png",
    "foto-poster-2": "assets/p1foto.png",
    "foto-poster-3": "assets/p2foto.png",
    "foto-poster-4": "assets/p3foto.png",
    "primer-poster": "assets/imagespoti.jpg"
  },

  aviFrames: { folder: "assets/frames/", count: 0, ext: ".png" },

  theme: {
    paper: [250, 248, 242],
    ink: [28, 28, 38],
    accent: [226, 52, 20]
  },

  clipSeconds: 60,

  posters: [
    {
      title: "¿Quién es AVI A.M?",
      img: "primer-poster",
      body: "AVI A.M es un artista que encuentra en la música una forma de explorar, crear y expresarse. Su relación con los sonidos nace de la curiosidad y del deseo constante de experimentar. Más que encasillarse en un solo estilo, busca construir una identidad musical propia a través de cada canción."
    },
    {
      title: "Experimentar sin límites",
      img: "foto-poster-2",
      body: "La experimentación es una parte esencial de su universo musical. Le gusta explorar distintos sonidos, combinar ideas y descubrir nuevas posibilidades. No se trata de seguir una fórmula, sino de dejar que cada canción encuentre su propio camino y desarrolle una identidad particular."
    },
    {
      title: "Detrás de cada canción",
      img: "foto-poster-3",
      body: "Para AVI A.M, crear música va mucho más allá de grabar una voz o escribir una letra. Disfruta involucrarse en cada etapa del proceso creativo, desde las primeras ideas hasta los detalles finales de producción. Cada decisión aporta algo al resultado y convierte cada canción en un universo independiente."
    },
    {
      title: "Música para sentir",
      img: "foto-poster-4",
      body: "Su intención es transmitir sentimientos reales y contar distintas historias desde su propia experiencia. A través de la música encuentra una manera de expresar pensamientos, emociones y momentos personales, permitiendo que cada canción comunique algo diferente y conecte con quien la escucha."
    }
  ],

  songs: [
    {
      name: "azul",
      tag: "single · 2026",
      img: "azul",
      audio: "assets/azul (master).mp3",
      colors: [[40, 80, 255], [150, 190, 255]]
    },
    {
      name: "hace más frío",
      tag: "single · 2026",
      img: "hace-mas-frio",
      audio: "assets/hace mas frio (master).mp3",
      colors: [[200, 210, 235], [120, 130, 170]]
    },
    {
      name: "dos almas",
      tag: "single · 2025",
      img: "dos-almas",
      audio: "assets/dos almas (master).mp3.mp3",
      colors: [[90, 160, 200], [240, 140, 60]]
    },
    {
      name: "Kairi",
      tag: "INÉDITA · ESCÚCHALA ANTES DE SU LANZAMIENTO",
      img: "",
      audio: "assets/Kairi (Master).mp3",
      colors: [[255, 140, 50], [230, 90, 70]]
    }
  ]
};


/* ---------- 2. CONSTANTES Y ESTADO ---------- */

const LW = 1280, LH = 720;

const INK = [28, 28, 38];
const CREAM = [244, 241, 236];
const RED = [226, 52, 20];
const BLUE = [60, 90, 200];

const GOTHIC = "UnifrakturCook, 'Old English Text MT', serif";
const LEDLIGHT = "Ledlight";
const OLNEY = "Olney Light";
const CALCULATOR = "Calculator";
const MONO = "'Courier New', monospace";
const SANS = "Helvetica, Arial, sans-serif";

let S = 1, OX = 0, OY = 0;

let imgs = {};
let aviFrames = [];

const N_AVI = CONFIG.aviFrames.count;
const T = CONFIG.theme;

let scene = "doors";
let sceneT0 = 0;

let mx = 0, my = 0;

let whiteA = 0, blackA = 0, flashA = 0;
let pendingScene = null, fadeT0 = 0;

// Puertas
let doorsOpening = false, doorsT0 = 0;

// Pasillo
const WORLD_W = 3900;

let camX = 0, camTarget = 0;
let visited = new Set();
let openPoster = -1;
let dragDist = 0, dragging = false;

const POSTER_X = [620, 1250, 1880, 2510];
const DOOR_X = 3330;

// Show
let songIdx = -1;
let playing = true;

let audioEl = null;
let songStart = 0;
let songEnded = false;

let crowd = [];
let kairiAlert = false;

// Música ambiental del concierto
let ambientAudio = new Audio("assets/ambientacion.mp3");
ambientAudio.loop = true;
ambientAudio.volume = 0.25;

// Final
let confetti = [];
let finaleT0 = 0;
let finalePhase = 0;
let sparkles = [];


/* ---------- 3. AUDIO ---------- */

let actx = null;
let noiseBuffer = null;

function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }

  if (!actx) return;

  if (!actx.__stageInput) {
    const input = actx.createGain();
    const delay = actx.createDelay(0.5);
    const feedback = actx.createGain();
    const wet = actx.createGain();
    const filter = actx.createBiquadFilter();

    delay.delayTime.value = 0.19;
    feedback.gain.value = 0.18;
    wet.gain.value = 0.16;

    filter.type = "lowpass";
    filter.frequency.value = 2800;

    input.connect(actx.destination);
    input.connect(delay);
    delay.connect(filter);
    filter.connect(wet);
    wet.connect(actx.destination);

    filter.connect(feedback);
    feedback.connect(delay);

    actx.__stageInput = input;
  }

  if (actx.state === "suspended") actx.resume();
}


function getNoise() {
  if (noiseBuffer || !actx) return noiseBuffer;

  noiseBuffer = actx.createBuffer(
    1,
    actx.sampleRate * 2,
    actx.sampleRate
  );

  const d = noiseBuffer.getChannelData(0);

  for (let i = 0; i < d.length; i++) {
    d[i] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}


function noiseBurst(o) {
  if (!actx) return;

  const {
    dur = 0.5,
    type = "bandpass",
    f0 = 800,
    f1 = 800,
    q = 1,
    gain = 0.3,
    attack = 0.01,
    when = 0
  } = o;

  const t = actx.currentTime + when;

  const src = actx.createBufferSource();
  src.buffer = getNoise();
  src.loop = true;

  const f = actx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;

  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(
    Math.max(f1, 20),
    t + dur
  );

  const g = actx.createGain();

  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(f);
  f.connect(g);
  g.connect(actx.__stageInput || actx.destination);

  src.start(t);
  src.stop(t + dur + 0.05);
}


function tone(
  freq,
  dur = 0.2,
  type = "sine",
  gain = 0.15,
  when = 0,
  slideTo = null
) {
  if (!actx) return;

  const t = actx.currentTime + when;

  const osc = actx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(
      slideTo,
      t + dur
    );
  }

  const g = actx.createGain();

  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(
    gain,
    t + Math.min(0.03, dur / 3)
  );
  g.gain.exponentialRampToValueAtTime(
    0.0001,
    t + dur
  );

  osc.connect(g);
  g.connect(actx.__stageInput || actx.destination);

  osc.start(t);
  osc.stop(t + dur + 0.05);
}


const sfx = {
  click() {
    noiseBurst({
      type: "bandpass",
      f0: 1100,
      f1: 450,
      q: 2,
      dur: 0.12,
      gain: 0.10,
      attack: 0.003
    });

    tone(115, 0.6, "triangle", 0.07, 0, 65);
  },

  next() {
    noiseBurst({
      type: "highpass",
      f0: 2500,
      f1: 6000,
      dur: 0.18,
      gain: 0.08
    });

    tone(1200, 0.08, "triangle", 0.035);
  },

  confetti() {
    [0, 0.35, 0.8].forEach(w =>
      noiseBurst({
        type: "highpass",
        f0: 1500,
        f1: 7000,
        dur: 0.3,
        gain: 0.25,
        when: w
      })
    );

    noiseBurst({
      type: "bandpass",
      f0: 900,
      f1: 1500,
      q: 0.7,
      dur: 3.4,
      gain: 0.15,
      attack: 0.6,
      when: 0.2
    });
  },

  blackout() {
    tone(140, 0.8, "sine", 0.18, 0, 38);

    noiseBurst({
      type: "lowpass",
      f0: 600,
      f1: 60,
      dur: 0.9,
      gain: 0.18
    });
  },

  ticket() {
    tone(880, 0.5, "triangle", 0.045);
    tone(1320, 0.7, "triangle", 0.035, 0.12);
  }
};


function stopSong(fast) {
  if (!audioEl) return;

  const old = audioEl;
  audioEl = null;

  if (fast) {
    old.pause();
    return;
  }

  fadeAudio(old, 0, 350, () => old.pause());
}


function fadeAudio(el, to, ms, then) {
  const from = el.volume;
  const start = millis();

  const timer = setInterval(() => {
    const progress = Math.min((millis() - start) / ms, 1);

    el.volume = from + (to - from) * progress;

    if (progress >= 1) {
      clearInterval(timer);
      if (then) then();
    }
  }, 20);
}


function playSong(i) {
  stopSong(false);
  ambientAudio.pause();

  songEnded = false;
  songStart = millis();

  const s = CONFIG.songs[i];

  if (!s.el) {
    s.el = new Audio((CONFIG.baseUrl || "") + s.audio);
    s.el.preload = "auto";

    s.el.addEventListener("error", () => {
      s.missing = true;
    });
  }

  const el = s.el;

  try {
    el.currentTime = 0;
  } catch (e) {}

  el.volume = 0;

  const p = el.play();

  if (p && p.catch) {
    p.catch(() => {
      s.missing = true;
    });
  }

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
    cur = s.el.currentTime;
    total = clipSec
      ? Math.min(clipSec, s.el.duration)
      : s.el.duration;
  } else {
    cur = (millis() - songStart) / 1000;
    total = clipSec || 60;
  }

  return {
    cur,
    total,
    p: Math.min(1, cur / total)
  };
}


/* ---------- 4. p5: PRELOAD / SETUP ---------- */

let loadedN = 0;

// Carga de imágenes con el objeto Image nativo
class Pic {
  constructor(src) {
    this.ok = false;
    this.el = new Image();

    this.el.onload = () => {
      this.ok = true;
      loadedN++;
    };

    this.el.onerror = () => {
      loadedN++;
    };

    this.el.src = src;
  }

  get width() {
    return this.el.naturalWidth || 1;
  }

  get height() {
    return this.el.naturalHeight || 1;
  }
}


function drawImg(pic, x, y, w, h, sx, sy, sw, sh) {
  if (!pic || !pic.ok) return;

  if (sx === undefined) {
    drawingContext.drawImage(pic.el, x, y, w, h);
  } else {
    drawingContext.drawImage(
      pic.el,
      sx, sy, sw, sh,
      x, y, w, h
    );
  }
}


function loadAssets() {
  const hasA = (typeof ASSETS !== "undefined");
  const base = CONFIG.baseUrl || "";

  Object.keys(CONFIG.images).forEach(n => {
    imgs[n] = new Pic(
      hasA && ASSETS[n]
        ? ASSETS[n]
        : base + CONFIG.images[n]
    );
  });

  const af = CONFIG.aviFrames;

  for (let i = 0; i < N_AVI; i++) {
    aviFrames.push(
      new Pic(
        hasA
          ? ASSETS["f" + i]
          : base + af.folder + "f" + i + af.ext
      )
    );
  }
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  loadAssets();

  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  computeScale();

  randomSeed(7);

  for (let i = 0; i < 34; i++) {
    crowd.push({
      x: 20 + i * 38 + random(-10, 10),
      y: 668 + random(-8, 24),
      r: random(15, 21),
      ph: random(TWO_PI),
      phone: random() < 0.16
    });
  }

  for (let i = 0; i < 90; i++) {
    sparkles.push({
      x: random(LW),
      y: random(LH),
      ph: random(TWO_PI),
      s: random(1, 2.6)
    });
  }

  if (document.fonts) {
    document.fonts.load("40px UnifrakturCook");

    document.fonts.load("40px Ledlight").then(() => {
      document.fonts.load("40px Calculator");
    });
  }

  textFont(SANS);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeScale();
}


function computeScale() {
  S = Math.min(width / LW, height / LH);
  OX = (width - LW * S) / 2;
  OY = (height - LH * S) / 2;
}


/* ---------- 5. DRAW ---------- */

function draw() {
  try {
    drawMain();
  } catch (e) {
    resetMatrix();
    background(0);
    noStroke();
    fill(255);
    textFont("monospace");
    textSize(16);
    textAlign(LEFT, TOP);
    text("Error: " + e.message, 20, 20, width - 40);
  }
}


function drawMain() {
  background(10, 10, 16);

  mx = (mouseX - OX) / S;
  my = (mouseY - OY) / S;

  push();
  translate(OX, OY);
  scale(S);

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, 0, LW, LH);
  drawingContext.clip();

  let hand = false;

  if (scene === "doors") {
    hand = drawDoors();
  } else if (scene === "hall") {
    hand = drawHall();
  } else if (scene === "show") {
    hand = drawShow();
  } else if (scene === "finale") {
    hand = drawFinale();
  }

  // Transiciones globales
  if (pendingScene) {
    const k = (millis() - fadeT0) / 700;

    blackA = Math.min(1, k);

    if (k >= 1) {
      goScene(pendingScene);
      pendingScene = null;
      blackA = 1;
    }
  } else if (blackA > 0 && scene !== "finale") {
    blackA = Math.max(0, blackA - 0.03);
  }

  if (blackA > 0 && scene !== "finale") {
    noStroke();
    fill(0, blackA * 255);
    rect(0, 0, LW, LH);
  }

  if (whiteA > 0) {
    noStroke();
    fill(255, whiteA * 255);
    rect(0, 0, LW, LH);
    whiteA = Math.max(0, whiteA - 0.018);
  }

  if (flashA > 0) {
    noStroke();
    fill(255, flashA * 255);
    rect(0, 0, LW, LH);
    flashA = Math.max(0, flashA - 0.09);
  }

  drawingContext.restore();
  pop();

  cursor(hand ? HAND : ARROW);
}


function goScene(name) {
  scene = name;
  sceneT0 = millis();

  if (name === "hall") {
    camX = 0;
    camTarget = 0;

    ambientAudio.volume = 0.25;
    ambientAudio.currentTime = 8;
    ambientAudio.play().catch(() => {});

  } else if (name === "show") {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio.volume = 0.25;

    setTimeout(() => {
      ambientAudio.play().catch(() => {});
    }, 300);

    ambientAudio.currentTime = 0;
    ambientAudio.volume = 0.25;
    ambientAudio.play().catch(() => {});

  } else if (name === "finale") {
    ambientAudio.pause();
  }

  if (name === "show") {
    songIdx = -1;
    stopSong(true);
  }
}


/* ---------- HELPERS DE DIBUJO ---------- */

function glow(x, y, r, c, a) {
  const g = drawingContext.createRadialGradient(
    x, y, 0,
    x, y, r
  );

  g.addColorStop(
    0,
    `rgba(${c[0]},${c[1]},${c[2]},${a})`
  );

  g.addColorStop(
    1,
    `rgba(${c[0]},${c[1]},${c[2]},0)`
  );

  drawingContext.save();
  drawingContext.fillStyle = g;
  drawingContext.fillRect(
    x - r, y - r,
    r * 2, r * 2
  );
  drawingContext.restore();
}


function vGrad(x, y, w, h, c1, c2) {
  const g = drawingContext.createLinearGradient(
    0, y,
    0, y + h
  );

  g.addColorStop(
    0,
    `rgb(${c1[0]},${c1[1]},${c1[2]})`
  );

  g.addColorStop(
    1,
    `rgb(${c2[0]},${c2[1]},${c2[2]})`
  );

  drawingContext.save();
  drawingContext.fillStyle = g;
  drawingContext.fillRect(x, y, w, h);
  drawingContext.restore();
}



function coverImage(img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;

  const ir = img.width / img.height;
  const r = w / h;

  let sw, sh, sx, sy;

  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  drawImg(img, x, y, w, h, sx, sy, sw, sh);
}



function containImage(img, x, y, w, h) {
  const r = Math.min(
    w / img.width,
    h / img.height
  );

  const nw = img.width * r;
  const nh = img.height * r;

  drawImg(
    img,
    x + (w - nw) / 2,
    y + (h - nh) / 2,
    nw,
    nh
  );
}


function setF(font, size, style) {
  textFont(font);
  textSize(size);
  textStyle(style === "bold" ? BOLD : NORMAL);
}


function txt(str, x, y, font, size, col, al, style, a) {
  noStroke();

  fill(
    col[0],
    col[1],
    col[2],
    a === undefined ? 255 : a
  );

  setF(font, size, style);
  textAlign(al || LEFT, BASELINE);
  text(str, x, y);
}


function inRect(x, y, w, h) {
  return (
    mx >= x &&
    mx <= x + w &&
    my >= y &&
    my <= y + h
  );
}


function ease(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}


/* ---------- ESCENA 1: PUERTAS ---------- */

function drawDoors() {
  const t = (millis() - sceneT0) / 1000;

  vGrad(0, 0, LW, LH, [5, 5, 12], [18, 10, 24]);

  const pulse = 0.65 + 0.35 * sin(t * 2.5);

  glow(180, 300, 380, [180, 0, 35], 0.22 * pulse);
  glow(LW - 180, 300, 380, [100, 20, 150], 0.18 * pulse);
  glow(LW / 2, 530, 500, [255, 0, 35], 0.10 * pulse);

  noStroke();
  fill(8, 8, 14);
  rect(0, 600, LW, 120);

  const o = doorsOpening
    ? (millis() - doorsT0) / 1000
    : 0;

  const open = ease((o - 0.6) / 2.0);

  const crack = doorsOpening
    ? 1
    : 0.45 + 0.25 * sin(t * 2.2);

  const DW = 330;
  const DH = 500;
  const DX = LW / 2;
  const DY = 110;

  const gap = open * 720;

  glow(
    DX,
    DY + DH / 2,
    200 + open * 1300,
    [255, 30, 65],
    0.25 + 0.75 * open
  );

  noStroke();
  fill(
    255,
    40,
    75,
    255 * (0.25 + 0.75 * Math.max(crack, open))
  );

  rect(DX - 3 - gap, DY, 6 + gap * 2, DH);

  noFill();
  stroke(110, 8, 35);
  strokeWeight(18);
  rect(
    DX - DW - 12,
    DY - 12,
    DW * 2 + 24,
    DH + 24,
    8
  );

  stroke(255, 30, 65, 150 + 100 * pulse);
  strokeWeight(3);

  rect(
    DX - DW - 12,
    DY - 12,
    DW * 2 + 24,
    DH + 24,
    8
  );

  for (const side of [-1, 1]) {
    const shake = (doorsOpening && o < 0.6)
      ? sin(o * 80) * 2 * (o / 0.6)
      : 0;

    const x = side < 0
      ? DX - DW - gap + shake
      : DX + gap + shake;

    vGrad(
      x, DY,
      DW, DH,
      [30, 27, 38],
      [7, 7, 13]
    );

    noFill();
    stroke(105, 85, 100);
    strokeWeight(2);
    rect(x + 12, DY + 12, DW - 24, DH - 24, 5);

    stroke(75, 55, 75);
    strokeWeight(1.5);
    rect(x + 35, DY + 42, DW - 70, 180, 3);
    rect(x + 35, DY + 245, DW - 70, 200, 3);

    stroke(190, 20, 55, 180 * pulse);
    strokeWeight(3);

    line(
      x + 45, DY + 48,
      x + DW - 45, DY + 48
    );

    line(
      x + 45, DY + DH - 48,
      x + DW - 45, DY + DH - 48
    );

    noStroke();
    fill(190, 165, 170);

    circle(
      side < 0 ? x + DW - 30 : x + 30,
      DY + DH / 2,
      13
    );

    fill(255, 40, 75, 150);

    circle(
      side < 0 ? x + DW - 30 : x + 30,
      DY + DH / 2,
      23
    );
  }

  glow(DX, 70, 300, [255, 15, 55], 0.35 * pulse);

  const aOp = doorsOpening
    ? Math.max(0, 1 - o * 1.2)
    : 1;

  txt(
    "AVI A.M",
    DX, 78,
    LEDLIGHT, 72,
    [190, 12, 40],
    CENTER, "",
    255 * aOp
  );

  txt(
    "LIVE EXPERIENCE",
    DX, 101,
    CALCULATOR, 14,
    CREAM,
    CENTER, "",
    180 * aOp
  );

  if (
    !doorsOpening &&
    loadedN < Object.keys(CONFIG.images).length + N_AVI
  ) {
    txt(
      "cargando… " +
      loadedN + "/" +
      (Object.keys(CONFIG.images).length + N_AVI),
      DX, 664,
      MONO, 16,
      CREAM,
      CENTER, "",
      150
    );

  } else if (!doorsOpening) {
    const blink = 140 + 115 * sin(t * 3);

    txt(
      "TOCA PARA ENTRAR",
      DX, 664,
      LEDLIGHT, 23,
      CREAM,
      CENTER, "",
      blink
    );
  }

  if (doorsOpening) {
    if (o > 2.0) {
      whiteA = Math.min(1, (o - 2.0) / 0.6);
    }

    if (o > 2.7) {
      whiteA = 1;
      goScene("hall");
      doorsOpening = false;
    }
  }

  return !doorsOpening;
}


/* ---------- ESCENA 2: PASILLO ---------- */

function drawHall() {
  const t = (millis() - sceneT0) / 1000;

  // Movimiento de cámara
  if (!dragging && openPoster < 0) {
    if (
      mx < LW * 0.14 &&
      mouseX > 0 &&
      mouseIsInside()
    ) {
      camTarget -= 9 * (1 - mx / (LW * 0.14));
    }

    if (mx > LW * 0.86 && mouseIsInside()) {
      camTarget += 9 * (
        (mx - LW * 0.86) / (LW * 0.14)
      );
    }

    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      camTarget -= 10;
    }

    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
      camTarget += 10;
    }
  }

  camTarget = constrain(
    camTarget,
    0,
    WORLD_W - LW
  );

  camX += (camTarget - camX) * 0.14;

  // Fondo nocturno
  vGrad(0, 0, LW, 520, [5, 5, 13], [24, 10, 25]);
  vGrad(0, 520, LW, 200, [20, 12, 25], [5, 5, 12]);

  // Luces ambientales
  const pulse = 0.7 + 0.3 * sin(t * 2.4);

  glow(120, 250, 420, [210, 0, 45], 0.20 * pulse);
  glow(LW - 100, 280, 420, [110, 20, 190], 0.18 * pulse);
  glow(LW / 2, 480, 500, [255, 20, 60], 0.09 * pulse);

  push();
  translate(-camX, 0);

  // Paneles de pared
  for (let x = 0; x < WORLD_W; x += 160) {
    noStroke();
    fill(255, 255, 255, 5);
    rect(x + 10, 60, 140, 440);
  }

  // Zócalo y piso
  noStroke();
  fill(14, 14, 22);
  rect(0, 500, WORLD_W, 24);

  stroke(255, 255, 255, 12);
  strokeWeight(1);

  for (let x = 0; x < WORLD_W; x += 160) {
    line(x, 524, x - 60 + (x % 320), 720);
  }

  // Lámparas del techo
  for (let x = 200; x < WORLD_W; x += 420) {
    noStroke();
    fill(240, 240, 255);
    rect(x - 30, 0, 60, 10, 3);

    const flick = 0.85 + 0.15 * sin(t * 3 + x);

    glow(x, 40, 260, [200, 215, 255], 0.28 * flick);

    noStroke();
    fill(200, 215, 255, 14 * flick);

    triangle(
      x - 25, 10,
      x + 25, 10,
      x + 190, 520
    );

    triangle(
      x - 25, 10,
      x + 25, 10,
      x - 190, 520
    );
  }

  // Letrero de entrada
  const nf = 0.75 + 0.25 *
    sin(t * 5) *
    (sin(t * 0.7) > 0.8 ? 1 : 0.2);

  glow(330, 230, 280, [255, 245, 235], 0.45 * nf);

  txt(
    "AVI A.M",
    330, 250,
    LEDLIGHT, 84,
    [109, 3, 3],
    CENTER, "",
    255 * nf
  );

  txt(
    "bienvenido al pasillo",
    330, 292,
    CALCULATOR, 16,
    CREAM,
    CENTER, "",
    170
  );

  txt(
    "→ mira los pósters",
    330, 318,
    CALCULATOR, 14,
    [150, 170, 230],
    CENTER, "",
    200
  );

  let hand = false;

 
  // PÓSTERS — DISEÑO EDITORIAL
  for (let i = 0; i < 4; i++) {
    const p = CONFIG.posters[i];
    const x = POSTER_X[i];
    const y = 105;
    const w = 290;
    const h = 390;

    const hov = (
      openPoster < 0 &&
      inRect(x - camX, y, w, h)
    );

    if (hov) hand = true;

    const sc = hov ? 1.035 : 1;

    push();

    translate(x + w / 2, y + h / 2);
    rotate(radians((i % 2 ? 1 : -1) * 1.2));
    scale(sc);

    // Sombra
    noStroke();
    fill(0, 0, 0, 100);
    rect(-w / 2 + 10, -h / 2 + 14, w, h);

    // Luz al pasar el cursor
    if (hov) {
      glow(0, 0, 330, [150, 180, 255], 0.35);
    }

    // Papel
    fill(T.paper[0], T.paper[1], T.paper[2]);
    rect(-w / 2, -h / 2, w, h);

    // Área de fotografía
    const ix = -w / 2 + 12;
    const iy = -h / 2 + 12;
    const iw = w - 24;
    const ih = 205;

    const im = p.img ? imgs[p.img] : null;

    if (im && im.width > 0) {
      const ar = im.width / im.height;
      let sx = 0, sy = 0;
      let sw = im.width, sh = im.height;

      if (ar > iw / ih) {
        sw = im.height * (iw / ih);
        sx = (im.width - sw) / 2;
      } else {
        sh = im.width / (iw / ih);
        sy = (im.height - sh) / 2;
      }

      drawImg(im, ix, iy, iw, ih, sx, sy, sw, sh);

    } else {
      // Composición gráfica para el póster sin fotografía
      fill(18, 17, 26);
      rect(ix, iy, iw, ih);

      noFill();
      stroke(226, 52, 20, 150);
      strokeWeight(2);

      for (let j = 0; j < 7; j++) {
        circle(0, -h / 2 + 112, 35 + j * 27);
      }

      noStroke();
      fill(244, 241, 236);
      setF(LEDLIGHT, 34);
      textAlign(CENTER, CENTER);
      text("AVI A.M", 0, -h / 2 + 110);
    }

    // Línea divisoria
    stroke(30, 30, 40, 45);
    strokeWeight(1);
    line(-w / 2 + 18, h / 2 - 128, w / 2 - 18, h / 2 - 128);

    // Identificador editorial
    noStroke();
    fill(110, 110, 125);
    setF(CALCULATOR, 10);
    textAlign(LEFT, BASELINE);
    text("AVI A.M  /  ARCHIVO " + String(i + 1).padStart(2, "0"),
      -w / 2 + 18, h / 2 - 139);

    // Título
    fill(T.ink[0], T.ink[1], T.ink[2]);
    setF(LEDLIGHT, 29);
    textAlign(CENTER, CENTER);
    text(p.title, -w / 2 + 15, h / 2 - 105, w - 30, 65);

    // Marca de visto
    if (visited.has(i)) {
      noStroke();
      fill(T.accent[0], T.accent[1], T.accent[2]);
      circle(w / 2 - 28, -h / 2 + 28, 26);

      fill(255);
      setF(SANS, 18, "bold");
      textAlign(CENTER, CENTER);
      text("✓", w / 2 - 28, -h / 2 + 29);
    }

    // Instrucción
    setF(CALCULATOR, 12);
    textAlign(CENTER, BASELINE);
    fill(110, 110, 125);

    text(
      visited.has(i) ? "VISTO" : "TOCA PARA LEER",
      0,
      h / 2 - 16
    );

    pop();

    // Numeración exterior
    txt(
      String(i + 1) + " / 4",
      x + w / 2, 66,
      CALCULATOR, 14,
      [150, 170, 230],
      CENTER, "bold",
      190
    );
  }

  // Puerta del show
  const unlocked = visited.size >= 4;

  const dx = DOOR_X;
  const dy = 130;
  const dw = 230;
  const dh = 370;

  const dh_ = inRect(dx - camX, dy, dw, dh);

  if (unlocked) {
    glow(
      dx + dw / 2,
      dy + dh / 2,
      420,
      [255, 240, 200],
      0.4 + 0.15 * sin(t * 3)
    );
  }

  noStroke();
  fill(8, 8, 14);
  rect(dx - 12, dy - 12, dw + 24, dh + 12);

  fill(
    unlocked ? 255 : 40,
    unlocked ? 244 : 44,
    unlocked ? 215 : 64
  );

  rect(dx, dy, dw, dh);

  if (unlocked) {
    glow(
      dx + dw / 2,
      dy + dh,
      260,
      [255, 255, 255],
      0.6
    );
  }

  txt(
    "SHOW",
    dx + dw / 2,
    dy - 36,
    LEDLIGHT, 56,
    [109, 3, 3],
    CENTER, "",
    255
  );

  if (unlocked) {
    txt(
      "ENTRAR AL SHOW",
      dx + dw / 2,
      dy + dh + 44,
      MONO, 18,
      CREAM,
      CENTER, "bold",
      150 + 105 * sin(t * 4)
    );

    if (dh_ && openPoster < 0) {
      hand = true;
    }

  } else {
    txt(
      "🔒",
      dx + dw / 2,
      dy + dh / 2 + 12,
      CALCULATOR, 44,
      [109, 3, 3],
      CENTER, "",
      220
    );

    txt(
      "lee los 4 posters",
      dx + dw / 2,
      dy + dh + 44,
      CALCULATOR, 16,
      [150, 160, 200],
      CENTER, "",
      220
    );
  }

  pop();

  // Flechas de desplazamiento
  if (camX > 20) {
    txt(
      "◀",
      34, LH / 2,
      SANS, 38,
      CREAM,
      CENTER, "",
      110 + 90 * sin(t * 4)
    );
  }

  if (camX < WORLD_W - LW - 20) {
    txt(
      "▶",
      LW - 34, LH / 2,
      SANS, 38,
      CREAM,
      CENTER, "",
      110 + 90 * sin(t * 4)
    );
  }

  // Contador
  txt(
    "pósters leídos: " + visited.size + "/4",
    LW - 30, 40,
    MONO, 16,
    CREAM,
    RIGHT, "bold",
    200
  );

  txt(
    "mueve el mouse a los bordes, arrastra o usa ← →",
    30, LH - 24,
    CALCULATOR, 13,
    CREAM,
    LEFT, "",
    120
  );

  // Tarjeta de póster abierto
  if (openPoster >= 0) {
    hand = drawPosterCard(openPoster) || hand;
  }

  return hand;
}


function mouseIsInside() {
  return (
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY >= 0 &&
    mouseY <= height
  );
}


function drawPosterCard(i) {
  const p = CONFIG.posters[i];

  noStroke();
  fill(0, 0, 0, 170);
  rect(0, 0, LW, LH);

  const x = 200;
  const y = 90;
  const w = 880;
  const h = 540;

  fill(T.paper[0], T.paper[1], T.paper[2]);
  rect(x, y, w, h, 6);

  const posterImages = [
    "primer-poster",
    "foto-poster-2",
    "foto-poster-3",
    "foto-poster-4"
  ];

  const posterImage = imgs[posterImages[i]];

  if (posterImage && posterImage.ok) {
    containImage(
      posterImage,
      x + 30,
      y + 30,
      330,
      480
    );
  }

  const titleSize = p.title.length > 20
    ? 32
    : p.title.length > 15
      ? 38
      : 52;

  txt(
    p.title,
    x + 400, y + 90,
    LEDLIGHT, titleSize,
    [109, 3, 3],
    LEFT, "",
    255
  );

  stroke(T.accent[0], T.accent[1], T.accent[2]);
  strokeWeight(3);

  line(
    x + 400, y + 112,
    x + 520, y + 112
  );

  noStroke();
  fill(T.ink[0], T.ink[1], T.ink[2]);

  setF(OLNEY, 20);
  textAlign(LEFT, TOP);
  textLeading(30);

  text(
    p.body,
    x + 400,
    y + 140,
    w - 440,
    h - 200
  );

  const bx = x + w - 150;
  const by = y + h - 60;

  const over = inRect(bx, by, 120, 40);

  fill(
    over ? T.accent[0] : T.ink[0],
    over ? T.accent[1] : T.ink[1],
    over ? T.accent[2] : T.ink[2]
  );

  rect(bx, by, 120, 40, 20);

  txt(
    "cerrar",
    bx + 60, by + 26,
    MONO, 16,
    CREAM,
    CENTER, "bold",
    255
  );

  return over;
}


/* ---------- ESCENA 3: SHOW ---------- */

function showColors() {
  if (songIdx < 0) {
    return [
      [200, 210, 255],
      [255, 255, 255]
    ];
  }

  return CONFIG.songs[songIdx].colors;
}




function drawSongInteraction(index, t, x, y, w, h) {
  const inside = (
    mx >= x &&
    mx <= x + w &&
    my >= y &&
    my <= y + h
  );

  const px = constrain(mx - x, 0, w);
  const py = constrain(my - y, 0, h);
  const pressed = inside && mouseIsPressed;

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();
  drawingContext.globalCompositeOperation = "lighter";

  // AZUL: ondas de agua y energía
  if (index === 0) {
    const cx = inside ? px : w / 2;
    const cy = inside ? py : h / 2;

    const pulse = pressed ? 2 : 1;

    for (let i = 0; i < 12; i++) {
      const r = (t * 45 + i * 48) % 520;

      noFill();
      stroke(80, 150, 255, 95 - i * 6);
      strokeWeight(1.5 + (pressed ? 1 : 0));

      circle(x + cx, y + cy, r * pulse);
    }

    for (let i = 0; i < 45; i++) {
      const a = t * 0.5 + i * TWO_PI / 45;
      const r = 65 + 35 * sin(t * 1.5 + i);

      noStroke();
      fill(100, 180, 255, 130);

      circle(
        x + cx + cos(a) * r,
        y + cy + sin(a) * r,
        pressed ? 6 : 3
      );
    }

    glow(
      x + cx, y + cy,
      pressed ? 300 : 190,
      [55, 120, 255],
      pressed ? 0.4 : 0.22
    );
  }

  // HACE MÁS FRÍO: viento y tormenta de nieve
  else if (index === 1) {
    for (let i = 0; i < 110; i++) {
      const baseX = (i * 83.7 + sin(t * 0.5 + i) * 35) % w;
      const baseY = (t * (25 + i % 7 * 7) + i * 37) % h;

      const dx = baseX - px;
      const dy = baseY - py;
      const distance = dist(baseX, baseY, px, py);

      const force = inside
        ? Math.max(0, 1 - distance / 150)
        : 0;

      const direction = pressed ? -1 : 1;

      const sx = baseX + dx * force * direction * 1.8;
      const sy = baseY + dy * force * direction * 1.8;

      noStroke();
      fill(220, 235, 255, 100 + force * 140);

      circle(
        x + sx,
        y + sy,
        1.5 + force * 4
      );
    }

    // Viento alrededor del cursor
    if (inside) {
      for (let i = 0; i < 12; i++) {
        const a = t * 1.5 + i * TWO_PI / 12;
        const r = 35 + 55 * sin(t * 2 + i);

        noFill();
        stroke(190, 220, 255, 75);
        strokeWeight(1);

        arc(
          x + px,
          y + py,
          r * 2,
          r * 2,
          a,
          a + PI / 3
        );
      }

      glow(
        x + px,
        y + py,
        pressed ? 230 : 130,
        [180, 215, 255],
        0.25
      );
    }
  }

  // DOS ALMAS: dos energías que se encuentran
  else if (index === 2) {
    const cx = inside ? px : w / 2;
    const cy = inside ? py : h / 2;

    const meet = pressed ? 0.25 : 1;
    const separation = (85 + 35 * sin(t * 1.2)) * meet;
    const orbit = t * 0.8;

    const ax = cx - separation * cos(orbit);
    const ay = cy + separation * sin(orbit);

    const bx = cx + separation * cos(orbit);
    const by = cy - separation * sin(orbit);

    // Caminos de luz
    noFill();
    stroke(130, 190, 255, 90);
    strokeWeight(2);

    bezier(
      x + ax, y + ay,
      x + cx - 70, y + cy - 100,
      x + cx + 70, y + cy + 100,
      x + bx, y + by
    );

    // Primera energía
    glow(x + ax, y + ay, 170, [70, 155, 255], 0.42);
    noStroke();
    fill(120, 195, 255);
    circle(x + ax, y + ay, pressed ? 28 : 18);

    // Segunda energía
    glow(x + bx, y + by, 170, [255, 135, 75], 0.42);
    fill(255, 175, 110);
    circle(x + bx, y + by, pressed ? 28 : 18);

    // Anillos de encuentro
    if (pressed) {
      for (let i = 0; i < 5; i++) {
        noFill();
        stroke(255, 210, 170, 150 - i * 22);
        strokeWeight(2);

        circle(
          x + cx,
          y + cy,
          (t * 90 + i * 55) % 300
        );
      }
    }

    glow(
      x + cx,
      y + cy,
      pressed ? 260 : 100,
      [220, 165, 150],
      pressed ? 0.5 : 0.12
    );
  }

  // KAIRI: distorsión y señales misteriosas
  else if (index === 3) {
    const cx = inside ? px : w / 2;
    const cy = inside ? py : h / 2;

    // Destellos
    for (let i = 0; i < 65; i++) {
      const sx = (i * 71 + sin(t * 1.3 + i) * 45) % w;
      const sy = (i * 43 + cos(t + i) * 35) % h;

      const d = dist(sx, sy, cx, cy);
      const visible = inside ? d < 240 : i % 4 === 0;

      if (visible) {
        const size = 2 + 4 * abs(sin(t * 3 + i));

        noStroke();
        fill(255, 180 + i % 60, 95, 180);

        circle(x + sx, y + sy, size);
      }
    }

    // Interferencias horizontales
    for (let i = 0; i < (pressed ? 18 : 7); i++) {
      const lineY = (t * 95 + i * 61) % h;
      const offset = sin(t * 8 + i) * (pressed ? 45 : 12);

      stroke(255, 125 + i % 80, 70, pressed ? 110 : 45);
      strokeWeight(pressed ? 2 : 1);

      line(
        x + offset,
        y + lineY,
        x + w - offset,
        y + lineY
      );
    }

    // Fragmentos que reaccionan al cursor
    if (inside) {
      for (let i = 0; i < 10; i++) {
        const offset = pressed ? 90 : 35;
        const sx = cx + sin(t * 5 + i) * offset;
        const sy = cy + cos(t * 4 + i) * offset;

        noFill();
        stroke(255, 155, 85, 150);
        strokeWeight(2);

        rect(
          x + sx,
          y + sy,
          8 + i * 2,
          3 + i
        );
      }

      glow(
        x + cx,
        y + cy,
        pressed ? 300 : 150,
        [255, 115, 55],
        pressed ? 0.45 : 0.2
      );
    }
  }

  drawingContext.restore();
}


function drawShow() {
  const t = (millis() - sceneT0) / 1000;
  const cols = showColors();

  const lastSong = songIdx === CONFIG.songs.length - 1;

  const bgTop = cols[0].map(c => c * 0.035);
const bgBottom = cols[1].map(c => c * 0.11);

vGrad(0, 0, LW, LH, bgTop, bgBottom);

  // Pantalla grande
  const sx = 320;
  const sy = 78;
  const sw = 640;
  const sh = 480;

  glow(
    sx + sw / 2,
    sy + sh / 2,
    520,
    cols[0],
    0.22 + 0.06 * sin(t * 2)
  );



  // Rayos de luz
  drawingContext.save();
  drawingContext.globalCompositeOperation = "lighter";

  for (let i = 0; i < 6; i++) {
    const bx = 130 + i * 204;
    const ang = sin(t * 0.8 + i * 1.3) * 150;
    const c = cols[i % 2];

    noStroke();
    fill(c[0], c[1], c[2], 20);

    triangle(
      bx - 10, 36,
      bx + 10, 36,
      bx + ang + 110, 640
    );

    triangle(
      bx - 10, 36,
      bx + 10, 36,
      bx + ang - 110, 640
    );
  }

  drawingContext.restore();

  // Estructura de luces
  noStroke();
  fill(34, 34, 48);
  rect(60, 22, LW - 120, 16, 3);

  for (let i = 0; i < 6; i++) {
    const bx = 130 + i * 204;

    fill(70, 70, 92);
    rect(bx - 16, 34, 32, 22, 4);

    fill(
      cols[i % 2][0],
      cols[i % 2][1],
      cols[i % 2][2]
    );

    circle(bx, 58, 10);
  }

  // Bocinas
  for (const bx of [70, 1130]) {
    fill(18, 18, 26);
    rect(bx, 380, 80, 250, 4);

    fill(30, 30, 42);
    rect(bx, 380, 80, 8);

    for (const cy of [450, 550]) {
      const pulse = 1 + 0.05 * sin(t * 9);

      fill(10, 10, 14);
      circle(bx + 40, cy, 54 * pulse);

      fill(46, 46, 64);
      circle(bx + 40, cy, 24 * pulse);
    }
  }

  // Marco de la pantalla
  fill(0);
  rect(sx - 12, sy - 12, sw + 24, sh + 24, 8);

  // Pantalla inicial de AVI
  if (songIdx < 0) {
    fill(0);
    rect(sx, sy, sw, sh);

    const gh = sw * 9 / 16;

    const fr = N_AVI
      ? aviFrames[Math.floor(millis() / 83) % N_AVI]
      : null;

    if (fr && fr.ok) {
      drawImg(
        fr,
        sx,
        sy + (sh - gh) / 2,
        sw,
        gh
      );
    } else {
      glow(
        sx + sw / 2,
        sy + sh / 2,
        260,
        [150, 180, 255],
        0.35 + 0.1 * sin(t * 2)
      );

      txt(
        "AVI A.M",
        sx + sw / 2,
        sy + sh / 2 + 30,
        GOTHIC, 96,
        [230, 240, 255],
        CENTER, "",
        255
      );
    }

    txt(
      "TOCA PARA EMPEZAR",
      LW / 2, 530,
      MONO, 17,
      CREAM,
      CENTER, "bold",
      220
    );

  } else {
    // Portada de la canción
    const song = CONFIG.songs[songIdx];
    const cover = song.img ? imgs[song.img] : null;

    fill(0);
    rect(sx, sy, sw, sh);

    if (song.name === "Kairi" && kairiAlert) {
      fill(8, 8, 16);
      rect(sx, sy, sw, sh);

      noFill();
      stroke(220, 170, 85);
      strokeWeight(2);

      rect(
        sx + 65,
        sy + 55,
        sw - 130,
        sh - 110,
        8
      );

      noStroke();

      txt(
        "⚠ AVISO · CONTENIDO INÉDITO",
        sx + sw / 2,
        sy + 125,
        OLNEY, 17,
        [230, 185, 105],
        CENTER, "bold",
        255
      );

      txt(
        "K A I R I",
        sx + sw / 2,
        sy + 215,
        LEDLIGHT, 68,
        CREAM,
        CENTER, "",
        255
      );

      txt(
        "Estás a punto de escuchar una canción",
        sx + sw / 2,
        sy + 280,
        OLNEY, 17,
        CREAM,
        CENTER, "",
        230
      );

      txt(
        "que todavía no ha sido lanzada oficialmente.",
        sx + sw / 2,
        sy + 310,
        OLNEY, 17,
        CREAM,
        CENTER, "",
        230
      );

      txt(
        "Esta escucha es anticipada.",
        sx + sw / 2,
        sy + 355,
        CALCULATOR, 15,
        [230, 185, 105],
        CENTER, "",
        255
      );

      fill(230, 185, 105);
      rect(sx + 190, sy + 385, 260, 48, 5);

      txt(
        "ESCUCHAR KAI RI  →",
        sx + sw / 2,
        sy + 409,
        MONO, 16,
        [15, 15, 20],
        CENTER, "bold",
        255
      );

    } else if (cover && cover.ok) {
      coverImage(cover, sx, sy, sw, sh);

      // Efecto interactivo propio de cada canción
      drawSongInteraction(songIdx, t, sx, sy, sw, sh);

    } else {
      glow(
        sx + sw / 2,
        sy + sh / 2,
        260,
        cols[0],
        0.4
      );

      txt(
        song.name,
        sx + sw / 2,
        sy + sh / 2,
        GOTHIC, 60,
        CREAM,
        CENTER, "",
        255
      );
    }

    // Franja inferior
    if (!kairiAlert) {
      noStroke();
      fill(0, 0, 0, 175);
      rect(sx, sy + sh - 105, sw, 105);

      txt(
        song.name,
        sx + 28,
        sy + sh - 60,
        LEDLIGHT, 42,
        [255, 255, 255],
        LEFT, "",
        255
      );

      txt(
        song.tag,
        sx + 30,
        sy + sh - 30,
        LEDLIGHT, 13,
        CREAM,
        LEFT, "",
        220
      );
    }
  }

  // Controles del reproductor
  const bx = 330;
  const by = 566;
  const bw = 620;

  const cx = bx + bw / 2;
  const cy = by + 28;

  const bprev = inRect(cx - 116, cy - 16, 32, 32);
  const bplay = inRect(cx - 20, cy - 20, 40, 40);
  const bnext = inRect(cx + 84, cy - 16, 40, 32);

  // Botón anterior
  noStroke();
  fill(bprev ? 255 : 180);
  textAlign(CENTER, CENTER);
  textSize(25);
  text("◀", cx - 100, cy);

  // Botón reproducir / pausa
  fill(bplay ? 255 : 210);
  circle(cx, cy, 42);

  fill(15, 15, 25);
  textSize(19);
  text(playing ? "Ⅱ" : "▶", cx, cy + 1);

  // Botón siguiente
  fill(bnext ? 255 : 180);
  textSize(25);
  text("▶", cx + 104, cy);

  // Barra de progreso
  const pr = songIdx >= 0
    ? songProgress()
    : {
        cur: 0,
        total: CONFIG.clipSeconds || 60,
        p: 0
      };

  const barX = 390;
  const barY = 630;
  const barW = 500;

  noStroke();
  fill(80, 80, 100);
  rect(barX, barY, barW, 4, 3);

  fill(230, 230, 255);
  rect(barX, barY, barW * pr.p, 4, 3);

  txt(
    fmtTime(pr.cur),
    barX,
    barY + 24,
    MONO, 12,
    CREAM,
    LEFT, "",
    200
  );

  txt(
    fmtTime(pr.total),
    barX + barW,
    barY + 24,
    MONO, 12,
    CREAM,
    RIGHT, "",
    200
  );

  // Texto lateral
  const hint = songIdx < 0
    ? "toca ▶ para empezar"
    : (lastSong
        ? "toca ▶ para el final"
        : "toca ▶ para la siguiente");

  txt(
    hint,
    bx + bw - 22,
    by + 30,
    MONO, 13,
    [200, 205, 230],
    RIGHT, "",
    200 + 55 * sin(t * 4)
  );

  // Fin de canción
  if (songIdx >= 0 && !songEnded && pr.p >= 1) {
    songEnded = true;
    stopSong(false);
    playing = false;
    ambientAudio.play().catch(() => {});
  }

  return (
    bprev ||
    bplay ||
    bnext ||
    inRect(320, 78, 640, 480)
  );
}


function fmtTime(s) {
  s = Math.max(0, Math.floor(s));

  return (
    Math.floor(s / 60) +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}


function nextSong() {
  ensureAudio();

  if (songIdx >= CONFIG.songs.length - 1) {
    startFinale();
    return;
  }

  songIdx++;

  if (CONFIG.songs[songIdx].name === "Kairi") {
    stopSong(false);
    kairiAlert = true;
    playing = false;

    ambientAudio.play().catch(() => {});

    flashA = 0.5;
    sfx.next();

    return;
  }

  flashA = 0.5;
  sfx.next();
  playSong(songIdx);
}


function prevSong() {
  ensureAudio();

  if (songIdx <= -1) return;

  songIdx--;
  flashA = 0.4;
  sfx.next();

  if (songIdx < 0) {
    stopSong(false);
    ambientAudio.play().catch(() => {});
  } else {
    playSong(songIdx);
  }
}


function togglePlay() {
  ensureAudio();

  if (songIdx < 0) {
    nextSong();
    return;
  }

  const el = audioEl || CONFIG.songs[songIdx].el;

  if (songEnded) {
    playSong(songIdx);
    return;
  }

  playing = !playing;

  if (el) {
    if (playing) {
      ambientAudio.pause();

      const p = el.play();

      if (p && p.catch) {
        p.catch(() => {});
      }

    } else {
      el.pause();
      ambientAudio.play().catch(() => {});
    }
  }
}


/* ---------- ESCENA 4: FINAL ---------- */

function startFinale() {
  stopSong(false);

  scene = "finale";
  sceneT0 = millis();
  finaleT0 = millis();
  finalePhase = 0;

  confetti = [];

  sfx.confetti();
  flashA = 0.8;

  burstConfetti();
}


function burstConfetti() {
  const palette = [
    [220, 38, 28],    // Rojo intenso
    [245, 240, 230],  // Blanco hueso
    [95, 95, 105],    // Gris
    [35, 35, 45],     // Carbón
    [145, 35, 40]     // Rojo oscuro
  ];

  // Cañones laterales
  for (let i = 0; i < 200; i++) {
    const left = i % 2 === 0;

    const ang = left
      ? random(-75, -45)
      : random(-135, -105);

    const sp = random(14, 26);

    confetti.push(
      mkPiece(
        left ? 40 : LW - 40,
        LH - 20,
        cos(radians(ang)) * sp,
        sin(radians(ang)) * sp,
        palette
      )
    );
  }

  // Lluvia desde arriba
  for (let i = 0; i < 90; i++) {
    confetti.push(
      mkPiece(
        random(LW),
        random(-500, -20),
        random(-1.5, 1.5),
        random(1, 4),
        palette
      )
    );
  }
}


function mkPiece(x, y, vx, vy, palette) {
  const c = palette[floor(random(palette.length))];

  return {
    x,
    y,
    vx,
    vy,
    rot: random(TWO_PI),
    vr: random(-0.08, 0.08),
    w: random(3, 9),
    h: random(12, 26),
    c,
    ph: random(TWO_PI)
  };
}


function drawConfetti() {
  noStroke();

  for (const p of confetti) {
    p.vy += 0.07;
    p.vx *= 0.992;
    p.vy *= 0.992;

    p.x += p.vx + sin(p.ph + millis() * 0.004) * 0.7;
    p.y += p.vy;
    p.rot += p.vr;

    push();

    translate(p.x, p.y);
    rotate(p.rot);

    const flip = 0.4 + 0.6 * Math.abs(sin(p.rot * 2));

    fill(p.c[0], p.c[1], p.c[2]);

    rect(
      -p.w / 2,
      -p.h * flip / 2,
      p.w,
      p.h * flip
    );

    pop();
  }

  confetti = confetti.filter(p => p.y < LH + 40);
}


function drawFinale() {
  const t = (millis() - finaleT0) / 1000;

  drawShowBackdrop(t);

  // Apagón
  if (finalePhase === 0 && t > 5.2) {
    finalePhase = 1;
    sfx.blackout();
  }

  if (finalePhase === 1 && t > 7.6) {
    finalePhase = 2;
   
  }

  const dark = ease((t - 5.2) / 2.2);

  noStroke();
  fill(0, 0, 0, 255 * dark);
  rect(0, 0, LW, LH);

  // Estrellitas
  if (dark > 0.9) {
    for (const s of sparkles) {
      const a = (
        0.2 + 0.2 * sin(t * 2 + s.ph)
      ) * 255 * (dark - 0.9) * 10;

      fill(200, 215, 255, a);
      circle(s.x, s.y, s.s);
    }
  }

  drawConfetti();

  // Boleto
  let hand = false;

  if (t > 7.6) {
    const k = ease((t - 7.6) / 1.2);
    hand = drawTicket(k, t);
  }

  return hand;
}


function drawShowBackdrop(t) {
  vGrad(0, 0, LW, LH, [4, 4, 8], [14, 14, 22]);

  const cols = [
    [255, 120, 90],
    [120, 170, 255]
  ];

  drawingContext.save();
  drawingContext.globalCompositeOperation = "lighter";

  for (let i = 0; i < 6; i++) {
    const bx = 130 + i * 204;
    const ang = sin(t * 3 + i * 1.3) * 260;
    const c = cols[i % 2];

    noStroke();
    fill(c[0], c[1], c[2], 30);

    triangle(
      bx - 10, 36,
      bx + 10, 36,
      bx + ang + 120, 700
    );

    triangle(
      bx - 10, 36,
      bx + 10, 36,
      bx + ang - 120, 700
    );
  }

  drawingContext.restore();

  noStroke();
  fill(34, 34, 48);
  rect(60, 22, LW - 120, 16, 3);

  const s = CONFIG.songs[CONFIG.songs.length - 1];

  fill(0);
  rect(308, 66, 664, 504, 8);

  drawImg(imgs[s.img], 320, 78, 640, 480);

  vGrad(0, 580, LW, 140, [24, 24, 36], [6, 6, 10]);

  for (const c of crowd) {
    const b = sin(t * 9 + c.ph) * 9;

    fill(2, 2, 6);

    circle(
      c.x,
      c.y - c.r * 0.9 + b * 0.4,
      c.r * 1.2
    );

    rect(
      c.x - c.r,
      c.y - c.r * 0.3 + b * 0.4,
      c.r * 2,
      90,
      14
    );

    if (c.phone) {
      fill(255, 255, 240);

      rect(
        c.x + 6,
        c.y - 44 + b,
        8,
        13,
        1
      );
    }
  }
}


function ticketGeom() {
  return {
    x: LW / 2 - 270,
    y: LH / 2 - 105,
    w: 540,
    h: 210
  };
}


function drawTicket(k, t) {
  const g = ticketGeom();
  const hov = inRect(g.x, g.y, g.w, g.h);

  push();

  translate(
    LW / 2,
    LH / 2 + (1 - k) * 110
  );

  const sc = (
    (hov ? 1.05 : 1) *
    (0.78 + 0.22 * k)*
    (1 + 0.012 * sin(t * 3))
  );

  rotate(radians(-8 * (1 - k) + (hov ? 2 : 0)));
  scale(sc);

  const flash = Math.pow(
    Math.max(0, 1 - Math.abs(k - 0.88) / 0.12),
    2
  );
  
  glow(
    0, 0,
    460,
    [255, 225, 205],
    (0.18 + flash * 0.65 + (hov ? 0.2 : 0)) * k
  );

  const w = g.w;
  const h = g.h;

  noStroke();

  fill(0, 0, 0, 140 * k);
  rect(-w / 2 + 8, -h / 2 + 12, w, h, 12);

  // Cuerpo del boleto
  fill(CREAM[0], CREAM[1], CREAM[2], 255 * k);
  rect(-w / 2, -h / 2, w, h, 12);

  fill(8, 8, 12);
  circle(-w / 2, 0, 44);
  circle(w / 2, 0, 44);

  // Franja roja
  fill(RED[0], RED[1], RED[2], 255 * k);

  rect(
    -w / 2 + 22,
    -h / 2 + 20,
    w - 44 - 130,
    10
  );

  // Perforación
  stroke(INK[0], INK[1], INK[2], 160 * k);
  strokeWeight(2);

  drawingContext.setLineDash([6, 8]);

  line(
    w / 2 - 130,
    -h / 2 + 12,
    w / 2 - 130,
    h / 2 - 12
  );

  drawingContext.setLineDash([]);

  noStroke();

  const a = 255 * k;

  txt(
    "AVI A.M",
    -w / 2 + 30,
    -14,
    LEDLIGHT, 62,
    INK,
    LEFT, "",
    a
  );

  txt(
    "VOLVER A VIVIR",
    -w / 2 + 32,
    30,
    CALCULATOR, 25,
    INK,
    LEFT, "bold",
    a
  );

  txt(
    "LA EXPERIENCIA",
    -w / 2 + 32,
    58,
    CALCULATOR, 25,
    INK,
    LEFT, "bold",
    a
  );

  txt(
    "ENTRADA GENERAL · hace más frío",
    -w / 2 + 32,
    88,
    OLNEY, 13,
    [90, 90, 105],
    LEFT, "",
    a
  );

  // Talón
  push();

  translate(w / 2 - 65, 0);
  rotate(HALF_PI);

  txt(
    "ADMIT ONE",
    0, -22,
    OLNEY, 17,
    INK,
    CENTER, "bold",
    a
  );

  txt(
    "Nº 102",
    0, 10,
    CALCULATOR, 34,
    RED,
    CENTER, "",
    a
  );

  pop();
  pop();

  return hov && k > 0.9;
}


/* ---------- 6. ENTRADA (MOUSE / TECLADO) ---------- */

function resetExperience() {
  stopSong(true);

  visited = new Set();
  openPoster = -1;
  songIdx = -1;
  confetti = [];

  doorsOpening = false;
  blackA = 0;
  whiteA = 0.9;

  scene = "doors";
  sceneT0 = millis();
}


function fadeTo(name) {
  if (pendingScene) return;

  pendingScene = name;
  fadeT0 = millis();
}


// Permite arrastrar horizontalmente el pasillo
function mouseDragged() {
  if (scene !== "hall" || openPoster >= 0) {
    return false;
  }

  const dx = mouseX - pmouseX;
  const dy = mouseY - pmouseY;

  dragDist += Math.hypot(dx, dy);

  if (dragDist > 8) {
    dragging = true;
    camTarget -= dx / S;
  }

  return false;
}


function mouseReleased() {
  if (scene !== "hall") return false;

  const wasDrag = dragging;
  dragging = false;

  if (wasDrag || dragDist > 8) {
    return false;
  }

  sfx.click();

  if (openPoster >= 0) {
    if (
      inRect(200 + 880 - 150, 90 + 540 - 60, 120, 40) ||
      !inRect(200, 90, 880, 540)
    ) {
      openPoster = -1;
    }

    return false;
  }

  for (let i = 0; i < 4; i++) {
    if (
      inRect(
        POSTER_X[i] - camX,
        105,
        290,
        390
      )
    ) {
      openPoster = i;
      visited.add(i);
      return false;
    }
  }

  if (
    visited.size >= 4 &&
    inRect(DOOR_X - camX, 130, 230, 370)
  ) {
    fadeTo("show");
  }

  return false;
}


function mousePressed() {
  ensureAudio();

  dragDist = 0;
  dragging = false;

  if (scene === "doors") {
    if (!doorsOpening) {
      doorsOpening = true;
      doorsT0 = millis();
      sfx.click();
    }
  }

  else if (scene === "show") {
    const bx = 330;
    const by = 566;
    const bw = 620;

    const cx = bx + bw / 2;
    const cy = by + 28;

    if (kairiAlert) {
      if (inRect(510, 463, 260, 48)) {
        kairiAlert = false;
        playing = true;

        playSong(songIdx);
        sfx.click();
      }

      return false;
    }

    if (inRect(cx - 116, cy - 16, 32, 32)) {
      prevSong();

    } else if (inRect(cx - 20, cy - 20, 40, 40)) {
      togglePlay();

    } else if (inRect(cx + 84, cy - 16, 40, 32)) {
      nextSong();

    } else if (inRect(320, 78, 640, 480)) {
      nextSong();
    }
  }

  else if (scene === "finale") {
    const g = ticketGeom();

    if (
      (millis() - finaleT0) / 1000 > 8.2 &&
      inRect(g.x, g.y, g.w, g.h)
    ) {
      sfx.click();
      resetExperience();
    }
  }

  return false;
}
