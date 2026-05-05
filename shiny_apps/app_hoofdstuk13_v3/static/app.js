'use strict';

const N_FIXED = 10;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
    vignette: 'Een criminoloog onderzoekt of de blootstelling aan een preventieprogramma samenhangt met inbraakcijfers, gecontroleerd voor politiezichtbaarheid.',
    entityLabel: 'Buurt',
    vars: {
      x1: { name: 'ProgrammaBlootstelling', unit: '%' },
      x2: { name: 'PolitieZichtbaarheid', unit: '0-10' },
      y: { name: 'InbraakCijfer', unit: 'per 1.000' }
    },
    bin: { name: 'BuurtPreventieActief', labels: ['Nee', 'Ja'], prob: 0.45 },
    model: { intercept: 42, b1: -0.28, b2: -1.15, bBin: -2.2, noise: 4.5 }
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Het onderzoek analyseert de relatie tussen voetpatrouille-uren, reactietijd en wekelijkse meldingen aan de politie.',
    entityLabel: 'Straat',
    vars: {
      x1: { name: 'VoetPatrouilleUren', unit: 'uren/week' },
      x2: { name: 'Reactietijd', unit: 'minuten' },
      y: { name: 'MeldingenAanPolitie', unit: 'per week' }
    },
    bin: { name: 'GerichtePatrouilles', labels: ['Nee', 'Ja'], prob: 0.50 },
    model: { intercept: 74, b1: -0.80, b2: 0.95, bBin: -2.0, noise: 5.0 }
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'In deze dataset wordt nagegaan hoe fysieke wanorde en collectieve effectiviteit samenhangen met angst voor criminaliteit.',
    entityLabel: 'Buurt',
    vars: {
      x1: { name: 'WanordeIndex', unit: '0-10' },
      x2: { name: 'CollectieveEffectiviteit', unit: '0-10' },
      y: { name: 'AngstScore', unit: '0-100' }
    },
    bin: { name: 'StraatVerlichtingVoldoende', labels: ['Nee', 'Ja'], prob: 0.55 },
    model: { intercept: 40, b1: 3.2, b2: -2.0, bBin: -3.0, noise: 6.2 }
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'De focus ligt op het verband tussen procedurele rechtvaardigheid, ervaren respect en vertrouwen in de politie.',
    entityLabel: 'District',
    vars: {
      x1: { name: 'ProcedureleRechtvaardigheid', unit: '1-7' },
      x2: { name: 'Respect', unit: '1-7' },
      y: { name: 'VertrouwenInPolitie', unit: '1-7' }
    },
    bin: { name: 'KlachtIngediend', labels: ['Nee', 'Ja'], prob: 0.30 },
    model: { intercept: 1.5, b1: 0.45, b2: 0.35, bBin: -0.40, noise: 0.55 }
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'Deze oefening bekijkt hoe toezicht en buitenverlichting samenhangen met slachtofferschap.',
    entityLabel: 'Huishouden',
    vars: {
      x1: { name: 'Toezicht', unit: '0-10' },
      x2: { name: 'BuitenVerlichting', unit: '0-10' },
      y: { name: 'Slachtofferschap', unit: 'aantal' }
    },
    bin: { name: 'AlarmBezit', labels: ['Nee', 'Ja'], prob: 0.40 },
    model: { intercept: 6.2, b1: -0.45, b2: -0.22, bBin: -0.80, noise: 1.2 }
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'We onderzoeken het effect van impulsiviteit en ouderlijk toezicht op agressieve incidenten.',
    entityLabel: 'Student',
    vars: {
      x1: { name: 'Impulsiviteit', unit: 'z-score' },
      x2: { name: 'OuderlijkToezicht', unit: '0-10' },
      y: { name: 'AgressieveIncidenten', unit: 'aantal' }
    },
    bin: { name: 'SchoolBetrokkenheidHoog', labels: ['Nee', 'Ja'], prob: 0.48 },
    model: { intercept: 3.6, b1: 1.7, b2: -0.25, bBin: -0.60, noise: 1.0 }
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Het model verklaart recidiverisico op basis van ondersteuningsuren en huisvestingsondersteuning.',
    entityLabel: 'Deelnemer',
    vars: {
      x1: { name: 'OndersteuningsUren', unit: 'per maand' },
      x2: { name: 'HuisvestingsOndersteuning', unit: '0-10' },
      y: { name: 'RecidiveRisico', unit: '0-100' }
    },
    bin: { name: 'WerkWorkshopGevolgd', labels: ['Nee', 'Ja'], prob: 0.42 },
    model: { intercept: 78, b1: -1.2, b2: -1.6, bBin: -3.5, noise: 5.8 }
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'De dataset test de relatie tussen trainingsuren, quizscores en phishing klikratio.',
    entityLabel: 'Medewerker',
    vars: {
      x1: { name: 'TrainingsUren', unit: 'uren' },
      x2: { name: 'QuizScores', unit: '0-100' },
      y: { name: 'Klikratio', unit: '%' }
    },
    bin: { name: 'BeleidKennisCertificaat', labels: ['Nee', 'Ja'], prob: 0.50 },
    model: { intercept: 62, b1: -1.05, b2: -0.20, bBin: -2.8, noise: 4.0 }
  }
];

// ── Normal CDF (Abramowitz & Stegun approximation, max error 1.5e-7) ────────
function normalCDF(z) {
  const p = 0.3275911;
  const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const sign = z >= 0 ? 1 : -1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  let poly = 0;
  for (let i = 4; i >= 0; i--) poly = a[i] + t * poly;
  const erfc = poly * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * (1 - erfc));
}

// ── Cross-tab scenarios ──────────────────────────────────────────────────────
const CROSSTAB_SCENARIOS = [
  { rowLabel: 'GESLACHT', colLabel: 'VORIG JAAR HEREXAMENS', rows: ['Jongen', 'Meisje'], colNo: 'Nee', colYes: 'Ja' },
  { rowLabel: 'GESLACHT', colLabel: 'SLACHTOFFER VAN CRIMINALITEIT', rows: ['Man', 'Vrouw'], colNo: 'Nee', colYes: 'Ja' },
  { rowLabel: 'OPLEIDING', colLabel: 'EERDER AL VEROORDEELD', rows: ['Laagopgeleid', 'Hoogopgeleid'], colNo: 'Nee', colYes: 'Ja' },
  { rowLabel: 'WOONOMGEVING', colLabel: 'ANGST VOOR CRIMINALITEIT', rows: ['Stedelijk', 'Landelijk'], colNo: 'Nee', colYes: 'Ja' }
];

function buildCrossTab(rng) {
  const sc = CROSSTAB_SCENARIOS[Math.floor(rng() * CROSSTAB_SCENARIOS.length)];
  const n1 = Math.floor(3200 + rng() * 3600);
  const n2 = Math.floor(3200 + rng() * 3600);
  const p1yes = round(0.04 + rng() * 0.12, 4);
  const p2yes = round(0.04 + rng() * 0.10, 4);
  const r1yes = Math.round(n1 * p1yes);
  const r1no = n1 - r1yes;
  const r2yes = Math.round(n2 * p2yes);
  const r2no = n2 - r2yes;
  const p1no = round(r1no / n1, 4);
  const p2no = round(r2no / n2, 4);
  const odds1 = round(r1no / r1yes, 4);
  const odds2 = round(r2no / r2yes, 4);
  return { sc, r1no, r1yes, n1, r2no, r2yes, n2, p1no, p2no, p1yes: round(p1yes, 4), p2yes: round(p2yes, 4), odds1, odds2 };
}

function renderCrossTab(ct) {
  if (!ct) return;
  const s = ct.sc;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('ct-rowlabel', s.rowLabel);
  setText('ct-collabel', s.colLabel);
  setText('ct-col-no', s.colNo);
  setText('ct-col-yes', s.colYes);
  setText('ct-row1-label', s.rows[0]);
  setText('ct-row2-label', s.rows[1]);
  setText('ct-r1-no', ct.r1no.toLocaleString('nl-BE'));
  setText('ct-r1-yes', ct.r1yes.toLocaleString('nl-BE'));
  setText('ct-r2-no', ct.r2no.toLocaleString('nl-BE'));
  setText('ct-r2-yes', ct.r2yes.toLocaleString('nl-BE'));
}

function createMultiMcq(id, question, options, correctIndices, feedbacks, hint) {
  return { id, question, options, correctIndices, feedbacks, multiSelect: true, hint: hint || 'Selecteer 2 opties.' };
}

const OPEN_PROMPT_TEMPLATES = [
  'Werk de interpretatie uit met duidelijke ceteris paribus-bewoordingen.',
  'Besteed expliciet aandacht aan het verschil tussen zero-order en partiele samenhang.',
  'Leg uit welk deel van de variatie in Y verklaard is en welk deel onverklaard blijft.',
  'Vergelijk de relatieve sterkte van de predictoren op basis van gestandaardiseerde effecten.',
  'Bespreek hoe het opnemen van de tweede predictor de relatie tussen X\u2081 en Y verandert.',
  'Reflecteer op de praktische relevantie van de gevonden effecten voor de criminologische context.',
  'Wat zegt het intercept (a) over de situatie wanneer beide predictoren gelijk zijn aan nul?',
  'Hoe verhoudt de meervoudige R\u00b2 zich tot de enkelvoudige r\u00b2 en wat impliceert dat voor de rol van X\u2082?'
];

const PATH_SCENARIOS = [
  {
    title: 'Morele vorming bij adolescenten',
    nodes: {
      xa: 'Hechting ouders-kind',
      xb: 'Sociale controle door ouders',
      m1: 'Conventionele morele normen',
      m2: 'Zelfcontrole',
      y: 'Altruisme'
    }
  },
  {
    title: 'Schoolbinding en normovertreding',
    nodes: {
      xa: 'Band met school',
      xb: 'Leerkrachttoezicht',
      m1: 'Conventionele normen',
      m2: 'Afwijzing van geweld',
      y: 'Delinquente intentie'
    }
  },
  {
    title: 'Gezinsklimaat en cyberpesten',
    nodes: {
      xa: 'Gezinscohesie',
      xb: 'Ouderlijke monitoring',
      m1: 'Morele afkeuring cyberpesten',
      m2: 'Digitale zelfcontrole',
      y: 'Cyberpestgedrag'
    }
  },
  {
    title: 'Buurtcontext en regelnaleving',
    nodes: {
      xa: 'Buurtbinding',
      xb: 'Informele sociale controle',
      m1: 'Normatieve legitimiteit',
      m2: 'Zelfregulatie',
      y: 'Regelnaleving'
    }
  },
  {
    title: 'Empathie en moreel oordeel',
    nodes: {
      xa: 'Empathische perspectiefneming',
      xb: 'Empathische bezorgdheid',
      m1: 'Morele intuïties',
      m2: 'Geanticipeerde schuld',
      y: 'Moreel oordeel'
    }
  },
  {
    title: 'Re-integratie na detentie',
    nodes: {
      xa: 'Begeleidingskwaliteit',
      xb: 'Sociale steun',
      m1: 'Legitieme kansen',
      m2: 'Zelfcontrole',
      y: 'Regelnaleving na vrijlating'
    }
  }
];

function humanizeLabel(label) {
  if (typeof label !== 'string') return label;
  return label
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeScenarioLabels() {
  SCENARIOS.forEach((sc) => {
    if (sc?.vars?.x1?.name) sc.vars.x1.name = humanizeLabel(sc.vars.x1.name);
    if (sc?.vars?.x2?.name) sc.vars.x2.name = humanizeLabel(sc.vars.x2.name);
    if (sc?.vars?.y?.name) sc.vars.y.name = humanizeLabel(sc.vars.y.name);
    if (sc?.bin?.name) sc.bin.name = humanizeLabel(sc.bin.name);
    if (sc?.path?.names) {
      Object.keys(sc.path.names).forEach((k) => {
        sc.path.names[k] = humanizeLabel(sc.path.names[k]);
      });
    }
  });
}

normalizeScenarioLabels();

const state = {
  scenario: null,
  rows: [],
  seedUsed: null,
  predCase: { x1: 4, x2: 30 },
  stats: null,
  pathModel: null,
  datasetMcqs: [],
  generalMcqs: [],
  crossTab: null,
  firstAttempt: {},
  attemptCount: {},
  firstCorrectAttempt: {},
  lastAttemptSignature: {}
};

const OPEN_SCORE_ITEMS = 19;
const EXPECTED_MCQ_ITEMS = 21;

function getScoreTotal() {
  const mcqTotal = (state.datasetMcqs.length || 0) + (state.generalMcqs.length || 0);
  return OPEN_SCORE_ITEMS + (mcqTotal || EXPECTED_MCQ_ITEMS);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round(v, digits) { const f = 10 ** digits; return Math.round(v * f) / f; }
function fmt2(v) { return Number(v).toFixed(2); }
function fmt4(v) { return Number(v).toFixed(4); }

function toNum(v) {
  if (v == null) return NaN;
  const t = String(v).trim().replace(',', '.');
  if (!t) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function safeSeed(seedRaw) {
  const s = Number(seedRaw);
  if (!Number.isFinite(s) || s <= 0) return null;
  return Math.floor(Math.abs(s)) % 2147483647;
}

function nextRandomSeed() {
  return Math.floor(Math.random() * 1000000000) + 1;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randN(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function variance(arr) {
  const m = mean(arr);
  return arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length - 1);
}
function sd(arr) { return Math.sqrt(variance(arr)); }

function covariance(a, b) {
  const ma = mean(a);
  const mb = mean(b);
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}

function correlation(a, b) {
  const sda = sd(a);
  const sdb = sd(b);
  if (!Number.isFinite(sda) || !Number.isFinite(sdb) || sda === 0 || sdb === 0) return 0;
  return covariance(a, b) / (sda * sdb);
}

function invert3x3(m) {
  const [
    [a, b, c],
    [d, e, f],
    [g, h, i]
  ] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  return [
    [A / det, D / det, G / det],
    [B / det, E / det, H / det],
    [C / det, F / det, I / det]
  ];
}

function matVecMul(m, v) {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

function simpleRegression(x, y) {
  const vx = variance(x);
  if (!Number.isFinite(vx) || vx === 0) return { a: mean(y), b: 0, r: 0, r2: 0 };
  const b = covariance(x, y) / vx;
  const a = mean(y) - b * mean(x);
  const r = correlation(x, y);
  return { a, b, r, r2: r * r };
}

function multipleRegression2(x1, x2, y) {
  const n = y.length;
  const sx1 = x1.reduce((a, b) => a + b, 0);
  const sx2 = x2.reduce((a, b) => a + b, 0);
  const sy = y.reduce((a, b) => a + b, 0);
  const sx1x1 = x1.reduce((a, b) => a + b * b, 0);
  const sx2x2 = x2.reduce((a, b) => a + b * b, 0);
  let sx1x2 = 0;
  let sx1y = 0;
  let sx2y = 0;
  for (let i = 0; i < n; i += 1) {
    sx1x2 += x1[i] * x2[i];
    sx1y += x1[i] * y[i];
    sx2y += x2[i] * y[i];
  }
  const xtx = [
    [n, sx1, sx2],
    [sx1, sx1x1, sx1x2],
    [sx2, sx1x2, sx2x2]
  ];
  const xty = [sy, sx1y, sx2y];
  const inv = invert3x3(xtx);
  if (!inv) return null;

  const [a, b1, b2] = matVecMul(inv, xty);
  const yhat = x1.map((v, i) => a + b1 * v + b2 * x2[i]);
  const yBar = mean(y);
  const sst = y.reduce((acc, yi) => acc + (yi - yBar) ** 2, 0);
  const sse = y.reduce((acc, yi, i) => acc + (yi - yhat[i]) ** 2, 0);
  const r2 = sst === 0 ? 0 : 1 - sse / sst;
  return { a, b1, b2, yhat, r2, sse, sst };
}

function partialCorrelation(rxy, rxz, ryz) {
  const denom = Math.sqrt((1 - rxz ** 2) * (1 - ryz ** 2));
  if (!Number.isFinite(denom) || denom === 0) return 0;
  return (rxy - rxz * ryz) / denom;
}

function unitProfile(unit, isY = false) {
  const u = String(unit || '').toLowerCase();
  if (u === '%' || u.includes('0-100')) return { mean: 52, sd: 18, min: 0, max: 100, integer: false, decimals: 2 };
  if (u === '0-10') return { mean: 5.2, sd: 2.1, min: 0, max: 10, integer: false, decimals: 2 };
  if (u === '1-7') return { mean: 4.0, sd: 1.2, min: 1, max: 7, integer: false, decimals: 2 };
  if (u === 'z-score') return { mean: 0, sd: 1.0, min: -2.8, max: 2.8, integer: false, decimals: 2 };
  if (u.includes('uren/week')) return { mean: 16, sd: 6.5, min: 1, max: 40, integer: false, decimals: 2 };
  if (u.includes('per maand')) return { mean: 14, sd: 5.2, min: 1, max: 35, integer: false, decimals: 2 };
  if (u.includes('uren')) return { mean: 10, sd: 4.2, min: 0, max: 25, integer: false, decimals: 2 };
  if (u.includes('jaar') || u.includes('jaren')) return { mean: 34, sd: 8.0, min: 17, max: 70, integer: true, decimals: 0 };
  if (u.includes('minuten')) return { mean: 11, sd: 3.5, min: 3, max: 25, integer: false, decimals: 2 };
  if (u.includes('aantal') || u.includes('meldingen')) return { mean: isY ? 7 : 5, sd: isY ? 3.2 : 2.5, min: 0, max: isY ? 25 : 15, integer: true, decimals: 0 };
  if (u.includes('per week')) return { mean: 52, sd: 15, min: 12, max: 120, integer: false, decimals: 2 };
  if (u.includes('per 1.000')) return { mean: 26, sd: 9, min: 4, max: 70, integer: false, decimals: 2 };
  return isY
    ? { mean: 40, sd: 12, min: 5, max: 100, integer: false, decimals: 2 }
    : { mean: 35, sd: 10, min: 0, max: 100, integer: false, decimals: 2 };
}

function sampleFromProfile(profile, z) {
  let v = profile.mean + profile.sd * z;
  v = clamp(v, profile.min, profile.max);
  if (profile.integer) return Math.round(v);
  return round(v, profile.decimals == null ? 2 : profile.decimals);
}

function pickPredictionCase(rows) {
  const x1Values = rows.map((r) => r.x1).slice().sort((a, b) => a - b);
  const x2Values = rows.map((r) => r.x2).slice().sort((a, b) => a - b);
  const i1 = Math.floor(0.55 * (rows.length - 1));
  const i2 = Math.floor(0.75 * (rows.length - 1));
  return { x1: x1Values[i1], x2: x2Values[i2] };
}

function makeRowsForScenario(sc, seedRaw) {
  const providedSeed = safeSeed(seedRaw);
  const seedUsed = providedSeed == null ? Math.floor(Math.random() * 1000000000) + 1 : providedSeed;
  const x1Prof = unitProfile(sc.vars.x1.unit, false);
  const x2Prof = unitProfile(sc.vars.x2.unit, false);
  const yProf = unitProfile(sc.vars.y.unit, true);

  let attempt = 0;
  while (attempt < 240) {
    attempt += 1;
    const rng = mulberry32(seedUsed + attempt * 131);
    const rows = [];

    for (let i = 1; i <= N_FIXED; i += 1) {
      const z1 = randN(rng);
      const z2 = randN(rng);
      const z2c = 0.35 * z1 + Math.sqrt(1 - 0.35 * 0.35) * z2;

      const x1 = sampleFromProfile(x1Prof, z1);
      const x2 = sampleFromProfile(x2Prof, z2c);
      const binNum = rng() < (sc.bin.prob ?? 0.5) ? 1 : 0;
      const binLabel = sc.bin.labels[binNum] || String(binNum);

      const yRaw = sc.model.intercept +
        sc.model.b1 * x1 +
        sc.model.b2 * x2 +
        sc.model.bBin * binNum +
        randN(rng) * sc.model.noise;

      const y = sampleFromProfile({ ...yProf, mean: yRaw, sd: 0, integer: yProf.integer, decimals: yProf.decimals }, 0);
      rows.push({ respondent: i, label: `${sc.entityLabel} ${i}`, x1, x2, y, binNum, binLabel });
    }

    const x1 = rows.map((r) => r.x1);
    const x2 = rows.map((r) => r.x2);
    const y = rows.map((r) => r.y);
    const multi = multipleRegression2(x1, x2, y);
    const g0 = rows.filter((r) => r.binNum === 0).length;
    const g1 = rows.filter((r) => r.binNum === 1).length;
    const signOkB1 = !multi ? false : (Math.sign(multi.b1) === Math.sign(sc.model.b1));
    const signOkB2 = !multi ? false : (Math.sign(multi.b2) === Math.sign(sc.model.b2));
    const strengthOk = !!multi && multi.r2 >= 0.10 && multi.r2 <= 0.90;
    const valid = (
      sd(x1) > 0 &&
      sd(x2) > 0 &&
      sd(y) > 0 &&
      Math.abs(correlation(x1, x2)) < 0.98 &&
      multi &&
      g0 >= 2 &&
      g1 >= 2 &&
      signOkB1 &&
      signOkB2 &&
      strengthOk
    );
    if (valid) return { rows, seedUsed };
  }
  return { rows: [], seedUsed };
}

function computeBinaryAnova(rows) {
  const y = rows.map((r) => r.y);
  const grand = mean(y);
  const g0 = rows.filter((r) => r.binNum === 0).map((r) => r.y);
  const g1 = rows.filter((r) => r.binNum === 1).map((r) => r.y);
  const n0 = g0.length;
  const n1 = g1.length;
  const m0 = mean(g0);
  const m1 = mean(g1);
  const ssBetween = n0 * (m0 - grand) ** 2 + n1 * (m1 - grand) ** 2;
  const ssWithin = g0.reduce((s, v) => s + (v - m0) ** 2, 0) + g1.reduce((s, v) => s + (v - m1) ** 2, 0);
  const sst = y.reduce((s, v) => s + (v - grand) ** 2, 0);
  const msBetween = ssBetween;
  const msWithin = ssWithin / (rows.length - 2);
  const f = msBetween / msWithin;
  const eta2 = sst === 0 ? 0 : ssBetween / sst;
  return { n0, n1, m0, m1, ssBetween, ssWithin, f, eta2 };
}

function computeReferenceStats(rows) {
  const x1 = rows.map((r) => r.x1);
  const x2 = rows.map((r) => r.x2);
  const y = rows.map((r) => r.y);
  const bivar = simpleRegression(x1, y);
  const multi = multipleRegression2(x1, x2, y);
  const rx1x2 = correlation(x1, x2);
  const rx1y = correlation(x1, y);
  const rx2y = correlation(x2, y);
  const partial1 = partialCorrelation(rx1y, rx1x2, rx2y);
  const partial2 = partialCorrelation(rx2y, rx1x2, rx1y);
  const n = y.length;
  const p = 2;
  const fStat = (multi.r2 / p) / ((1 - multi.r2) / (n - p - 1));
  const unexplained = 1 - multi.r2;
  const beta1 = (multi.b1 * sd(x1)) / sd(y);
  const beta2 = (multi.b2 * sd(x2)) / sd(y);
  const pred = multi.a + multi.b1 * state.predCase.x1 + multi.b2 * state.predCase.x2;
  const anovaBin = computeBinaryAnova(rows);
  return { bivar, multi, rx1x2, partial1, partial2, n, fStat, unexplained, beta1, beta2, pred, anovaBin };
}

function splitNodeLabel(label) {
  const parts = String(label || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return ['', ''];
  if (parts.length === 1) return [parts[0], ''];
  let cut = Math.ceil(parts.length / 2);
  let line1 = parts.slice(0, cut).join(' ');
  let line2 = parts.slice(cut).join(' ');
  if (line1.length > 18 && parts.length > 2) {
    cut -= 1;
    line1 = parts.slice(0, cut).join(' ');
    line2 = parts.slice(cut).join(' ');
  }
  return [line1, line2];
}

function buildPathModel(seedRaw) {
  const seed = safeSeed(seedRaw) || 1;
  const rng = mulberry32(seed + 1703);
  const sc = PATH_SCENARIOS[Math.floor(rng() * PATH_SCENARIOS.length)];

  const a = round(0.16 + rng() * 0.36, 2);
  const b = round(0.12 + rng() * 0.34, 2);
  const c = round(0.15 + rng() * 0.36, 2);
  const d = round(0.10 + rng() * 0.30, 2);
  const e = round(0.20 + rng() * 0.35, 2);
  const f = round(0.18 + rng() * 0.34, 2);

  const corrM1M2 = clamp(round(d + a * b * c, 2), -0.85, 0.85);
  const r2yRaw = e ** 2 + f ** 2 + 2 * e * f * corrM1M2;
  const r2y = clamp(round(r2yRaw, 2), 0.08, 0.86);
  const unexplained = round(1 - r2y, 2);

  const xaViaM1 = round(a * e, 4);
  const xaViaM1M2 = round(a * d * f, 4);
  const xaViaXbM2 = round(b * c * f, 4);
  const xaTotal = round(xaViaM1 + xaViaM1M2 + xaViaXbM2, 4);
  const m1TotalOnY = round(e + d * f, 4);

  return {
    scenario: sc,
    coeffs: { a, b, c, d, e, f },
    corrM1M2,
    r2y,
    unexplained,
    effects: { xaViaM1, xaViaM1M2, xaViaXbM2, xaTotal, m1TotalOnY }
  };
}

function renderPathModel(pathModel) {
  if (!pathModel) return;
  const { scenario, coeffs, r2y, unexplained, effects, corrM1M2 } = pathModel;
  const { nodes } = scenario;
  const ptxt = document.getElementById('path-scenario-text');
  if (ptxt) {
    ptxt.textContent = `Figuur 1 — ${scenario.title}: gebruik dit padmodel voor vragen over exogene/endogene variabelen, indirecte effecten en totale effecten.`;
  }

  const [xa1, xa2] = splitNodeLabel(nodes.xa);
  const [xb1, xb2] = splitNodeLabel(nodes.xb);
  const [m11, m12] = splitNodeLabel(nodes.m1);
  const [m21, m22] = splitNodeLabel(nodes.m2);
  const [y1, y2] = splitNodeLabel(nodes.y);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };

  setText('pm-node-xa-1', xa1);
  setText('pm-node-xa-2', xa2);
  setText('pm-node-xb-1', xb1);
  setText('pm-node-xb-2', xb2);
  setText('pm-node-m1-1', m11);
  setText('pm-node-m1-2', m12);
  setText('pm-node-m2-1', m21);
  setText('pm-node-m2-2', m22);
  setText('pm-node-y-1', y1);
  setText('pm-node-y-2', y2);

  setText('pm-a', `a=${fmt2(coeffs.a)}`);
  setText('pm-b', `b=${fmt2(coeffs.b)}`);
  setText('pm-c', `c=${fmt2(coeffs.c)}`);
  setText('pm-d', `d=${fmt2(coeffs.d)}`);
  setText('pm-e', `e=${fmt2(coeffs.e)}`);
  setText('pm-f', `f=${fmt2(coeffs.f)}`);
  setText('pm-r2', `R²=${Math.round(r2y * 100)}%`);

  // Figuur-only format (zoals in het echte examen): geen aparte padmodeltabel renderen.
}

function createMcq(id, question, options, correctIndex, feedbacks) {
  return { id, question, options, correctIndex, feedbacks };
}

function pickWithoutReplacement(arr, k, rng) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(k, copy.length));
}

function createPoolMcq(id, question, correctOption, wrongPool, correctFeedback, rng) {
  const selectedWrong = pickWithoutReplacement(wrongPool, 3, rng);
  const options = [correctOption, ...selectedWrong.map((w) => w.option)];
  const feedbacks = [correctFeedback, ...selectedWrong.map((w) => w.feedback)];
  return createMcq(id, question, options, 0, feedbacks);
}

function shuffleMcqOptions(mcq, rng) {
  const idx = mcq.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
  }
  const shuffledOptions = idx.map((i) => mcq.options[i]);
  const shuffledFeedbacks = idx.map((i) => mcq.feedbacks[i]);
  if (mcq.multiSelect) {
    const newCorrectIndices = mcq.correctIndices.map((ci) => idx.indexOf(ci));
    return { ...mcq, options: shuffledOptions, feedbacks: shuffledFeedbacks, correctIndices: newCorrectIndices };
  }
  const newCorrectIndex = idx.indexOf(mcq.correctIndex);
  return { ...mcq, options: shuffledOptions, feedbacks: shuffledFeedbacks, correctIndex: newCorrectIndex };
}

function shuffleMcqList(mcqs, rng) {
  // Only shuffle option order; keep question order fixed for numbered exam format
  return mcqs.map((m) => shuffleMcqOptions(m, rng));
}

function buildDatasetMcqs(sc, stats, pathModel, rng) {
  const pm = pathModel || buildPathModel(state.seedUsed || 1);
  const pmNodes = pm.scenario.nodes;
  const pmEffects = pm.effects;
  const ct = state.crossTab;

  // ── Q1: Conditional probability from Tabel 1 (2-option JUIST/FOUT) ─────────
  const useCorrect1 = rng() > 0.5;
  const presentedP = useCorrect1 ? ct.p2no : ct.p1no;
  const presentedPct = round(presentedP * 100, 2);
  const q1 = createMcq(
    'q1',
    `Gebruik Tabel 1. De voorwaardelijke kans dat een aselect gekozen persoon geen ${ct.sc.colLabel.replace('?', '').trim().toLowerCase()} had, gegeven dat het een ${ct.sc.rows[1].toLowerCase()} is, is ongeveer ${presentedP.toFixed(4)} of ${fmt2(presentedPct)}%. Deze uitspraak is...`,
    ['Juist.', 'Fout.'],
    useCorrect1 ? 0 : 1,
    [
      useCorrect1
        ? `Correct: P(${ct.sc.colNo} | ${ct.sc.rows[1]}) = ${ct.r2no}/${ct.n2} = ${ct.p2no.toFixed(4)}.`
        : `Fout: de getoonde waarde hoort bij ${ct.sc.rows[0]} (${ct.p1no.toFixed(4)}), niet bij ${ct.sc.rows[1]} (${ct.p2no.toFixed(4)}).`,
      useCorrect1
        ? `Fout: de berekening klopt. P(${ct.sc.colNo} | ${ct.sc.rows[1]}) = ${ct.r2no}/${ct.n2} = ${ct.p2no.toFixed(4)}.`
        : `Juist: ${fmt2(presentedPct)}% hoort bij ${ct.sc.rows[0]}, niet ${ct.sc.rows[1]}. P(${ct.sc.colNo} | ${ct.sc.rows[1]}) = ${ct.p2no.toFixed(4)}.`
    ]
  );

  // ── Q6: Multi-select from Tabel 1 (TWO correct of 5) ─────────────────────
  const realPctDiff = round(Math.abs(ct.p1no - ct.p2no) * 100, 2);
  const realOddsRatio = round(ct.odds1 / ct.odds2, 2);
  const wrongPctDiff = round(Math.abs(ct.p1yes - ct.p2yes) * 100, 2);
  const wrongOddsRat = round(ct.odds2 / ct.odds1, 2);
  const wrongAbsDiff = round(Math.abs(ct.r1no - ct.r2no) / (ct.n1 + ct.n2) * 100, 2);
  const q6 = createMultiMcq(
    'q6',
    `Gebruik Tabel 1. Welke TWEE uitspraken zijn JUIST over "${ct.sc.colLabel}" naar ${ct.sc.rowLabel}? Maak TWEE keuzes.`,
    [
      `Het relevante percentageverschil bedraagt ${fmt2(realPctDiff)} percentagepunten.`,
      `De verhouding ${ct.sc.colNo}/${ct.sc.colYes} bij ${ct.sc.rows[0]} is ${fmt2(realOddsRatio)} keer ${realOddsRatio > 1 ? 'hoger' : 'lager'} dan bij ${ct.sc.rows[1]}.`,
      `Het absolute verschil in aantallen (${ct.sc.colNo}) is ${fmt2(wrongAbsDiff)}% van de totale steekproef.`,
      `De odds-ratio is ${fmt2(wrongOddsRat)} (${ct.sc.rows[1]} / ${ct.sc.rows[0]}).`,
      `Het percentageverschil voor "${ct.sc.colYes.toLowerCase()}" bedraagt ${fmt2(wrongPctDiff)} pp.`
    ],
    [0, 1],
    [
      `Correct: |${ct.p1no.toFixed(4)}×100 − ${ct.p2no.toFixed(4)}×100| = ${fmt2(realPctDiff)} pp.`,
      `Correct: odds(${ct.sc.rows[0]})=${ct.odds1.toFixed(4)}, odds(${ct.sc.rows[1]})=${ct.odds2.toFixed(4)}, ratio=${fmt2(realOddsRatio)}.`,
      `Fout: dit vergelijkt absolute aantallen, geen conditionele proporties.`,
      `Fout: dit is de omgekeerde odds-ratio (${ct.sc.rows[1]}/${ct.sc.rows[0]}=${fmt2(wrongOddsRat)}).`,
      `Fout: ${fmt2(wrongPctDiff)} pp is het verschil voor "${ct.sc.colYes.toLowerCase()}", niet "${ct.sc.colNo.toLowerCase()}".`
    ]
  );

  // ── Q9: Path model TWO WRONG statements (multi-select) ───────────────────
  const pmR2Pct = Math.round(pm.r2y * 100);
  const pmUnexplainedPct = Math.round(pm.unexplained * 100);
  const q9FalseA = `Het padmodel maakt geen onderscheid tussen manifeste en latente variabelen; alle variabelen zijn latent.`;
  const q9FalseB = `${pmR2Pct}% van de variatie in '${pmNodes.y}' wordt verklaard door factoren buiten het padmodel, zoals meetfouten en niet-gemeten variabelen.`;
  const q9TrueC = `De directe coëfficiënt van '${pmNodes.m2}' op '${pmNodes.y}' bedraagt ${fmt2(pm.coeffs.f)}.`;
  const q9TrueD = `Het totale effect van '${pmNodes.xa}' op '${pmNodes.y}' bedraagt afgerond ${fmt2(pmEffects.xaTotal)}.`;
  const q9TrueE = `'${pmNodes.m1}' fungeert als mediator: het verklaart gedeeltelijk het effect van '${pmNodes.xa}' op '${pmNodes.y}'.`;
  const q9 = createMultiMcq(
    'q9',
    `Gebruik Figuur 1. Welke TWEE uitspraken zijn FOUT? Maak TWEE keuzes.`,
    [q9FalseA, q9FalseB, q9TrueC, q9TrueD, q9TrueE],
    [0, 1],
    [
      `Correct dat dit FOUT is: padmodellen gebruiken MANIFESTE (rechtstreeks gemeten) variabelen. Latente variabelen zijn het domein van SEM/factoranalyse.`,
      `Correct dat dit FOUT is: R²=${pmR2Pct}% is de VERKLAARDE proportie. De ONverklaarde (${pmUnexplainedPct}%) verwijst naar factoren buiten het model.`,
      `Dit is JUIST: de pijlcoëfficiënt f=${fmt2(pm.coeffs.f)}.`,
      `Dit is JUIST: totaal effect = a·e + a·d·f + b·c·f = ${pmEffects.xaTotal.toFixed(4)}.`,
      `Dit is JUIST: '${pmNodes.m1}' ontvangt een pijl van '${pmNodes.xa}' en stuurt er naar '${pmNodes.y}'.`
    ],
    'Selecteer de 2 FOUTE uitspraken.'
  );

  const q18 = createPoolMcq(
    'q18',
    `Gebruik Figuur 1. Welke variabele is exogeen in dit padmodel?`,
    pmNodes.xa,
    [
      { option: pmNodes.xb, feedback: `${pmNodes.xb} krijgt een inkomende pijl van ${pmNodes.xa}; daardoor is deze variabele endogeen.` },
      { option: pmNodes.m1, feedback: `${pmNodes.m1} krijgt een inkomende pijl en is dus geen exogene variabele.` },
      { option: pmNodes.m2, feedback: `${pmNodes.m2} wordt verklaard door andere variabelen in het model.` },
      { option: pmNodes.y, feedback: `${pmNodes.y} is de uitkomstvariabele en krijgt inkomende pijlen.` }
    ],
    `Correct: ${pmNodes.xa} heeft geen inkomende pijlen; er vertrekken alleen effecten vanuit deze variabele.`,
    rng
  );

  const q19 = createMultiMcq(
    'q19',
    `Gebruik Figuur 1. Welke TWEE uitspraken over endogene en intermediaire variabelen zijn JUIST? Maak TWEE keuzes.`,
    [
      `'${pmNodes.y}' is endogeen omdat er pijlen naar deze variabele toekomen.`,
      `'${pmNodes.m2}' is intermediair omdat deze variabele wordt verklaard door andere variabelen en zelf '${pmNodes.y}' verklaart.`,
      `'${pmNodes.xa}' is endogeen omdat er pijlen vanuit deze variabele vertrekken.`,
      `'${pmNodes.xb}' is exogeen omdat deze variabele links in de figuur staat.`,
      `'${pmNodes.m1}' is de finale uitkomstvariabele van het model.`
    ],
    [0, 1],
    [
      `Correct: endogene variabelen hebben minstens één inkomende pijl.`,
      `Correct: ${pmNodes.m2} ligt tussen verklarende variabelen en de uitkomstvariabele.`,
      `Fout: uitgaande pijlen maken een variabele niet endogeen; daarvoor kijk je naar inkomende pijlen.`,
      `Fout: positie links is niet genoeg. ${pmNodes.xb} krijgt een pijl van ${pmNodes.xa}.`,
      `Fout: de finale uitkomstvariabele is ${pmNodes.y}.`
    ],
    'Selecteer de 2 JUISTE uitspraken.'
  );

  const q20 = createPoolMcq(
    'q20',
    `Gebruik Figuur 1. Hoeveel indirecte effecten van '${pmNodes.xa}' op '${pmNodes.y}' worden in het model weergegeven?`,
    '3 indirecte effecten',
    [
      { option: '1 indirect effect', feedback: `Er zijn meer routes dan alleen ${pmNodes.xa} → ${pmNodes.m1} → ${pmNodes.y}.` },
      { option: '2 indirecte effecten', feedback: `Je mist één route: via ${pmNodes.xb} en ${pmNodes.m2}.` },
      { option: '4 indirecte effecten', feedback: `Er is geen extra route rechtstreeks via ${pmNodes.xb} naar ${pmNodes.y}; die loopt eerst via ${pmNodes.m2}.` },
      { option: 'Geen indirect effect', feedback: `Er zijn meerdere routes van ${pmNodes.xa} naar ${pmNodes.y} via tussenliggende variabelen.` }
    ],
    `Correct: de routes zijn via ${pmNodes.m1}; via ${pmNodes.m1} en ${pmNodes.m2}; en via ${pmNodes.xb} en ${pmNodes.m2}.`,
    rng
  );

  const m1Total = pmEffects.m1TotalOnY;
  const q21 = createPoolMcq(
    'q21',
    `Gebruik Figuur 1. Hoeveel bedraagt het totale effect van '${pmNodes.m1}' op '${pmNodes.y}'?`,
    `${fmt4(m1Total)}`,
    [
      { option: `${fmt4(pm.coeffs.e)}`, feedback: `Dit is alleen het directe effect van ${pmNodes.m1} op ${pmNodes.y}.` },
      { option: `${fmt4(pm.coeffs.d * pm.coeffs.f)}`, feedback: `Dit is alleen het indirecte effect via ${pmNodes.m2}.` },
      { option: `${fmt4(pm.coeffs.e + pm.coeffs.d + pm.coeffs.f)}`, feedback: `Bij een indirect pad vermenigvuldig je padcoëfficiënten; je telt d en f niet los op.` },
      { option: `${fmt4(pmEffects.xaTotal)}`, feedback: `Dit is het totale effect van ${pmNodes.xa} op ${pmNodes.y}, niet van ${pmNodes.m1}.` }
    ],
    `Correct: totaal effect = direct effect e + indirect effect d×f = ${fmt2(pm.coeffs.e)} + ${fmt2(pm.coeffs.d)}×${fmt2(pm.coeffs.f)} = ${fmt4(m1Total)}.`,
    rng
  );

  // ── Q10: Bivariate regression from Tabel 2 (TWO correct of 5) ────────────
  const unexpBivar = round(1 - stats.bivar.r2, 2);
  const betaBivar = round(Math.abs(stats.bivar.r), 2); // β = r for bivariate
  const wrongPred3 = round(stats.bivar.a + stats.bivar.b * 3, 2);
  const wrongSlope = round(stats.bivar.b * 10, 2);
  const wrongIntcpt = round(stats.bivar.a * 2, 2);
  const q10 = createMultiMcq(
    'q10',
    `Gebruik Tabel 2. Bekijk het bivariaat verband tussen '${sc.vars.x1.name}' en '${sc.vars.y.name}'. Welke TWEE uitspraken zijn JUIST? Maak TWEE keuzes.`,
    [
      `Ongeveer ${fmt2(unexpBivar * 100)}% van de variatie in '${sc.vars.y.name}' kan NIET verklaard worden door '${sc.vars.x1.name}'.`,
      `Als '${sc.vars.x1.name}' met 1 standaardafwijking toeneemt, verwachten we een toename van ±${fmt2(betaBivar)} standaardafwijkingen in '${sc.vars.y.name}'.`,
      `De verwachte ${sc.vars.y.name} voor een waarde van 3 ${sc.vars.x1.unit} is ${fmt2(wrongPred3)}.`,
      `Als '${sc.vars.x1.name}' met 1 eenheid toeneemt, verwachten we een toename van ${fmt2(wrongSlope)} in '${sc.vars.y.name}'.`,
      `Bij ${sc.vars.x1.name}=0 verwachten we een waarde van ${fmt2(wrongIntcpt)} op '${sc.vars.y.name}'.`
    ],
    [0, 1],
    [
      `Correct: 1 − R² = 1 − ${fmt2(stats.bivar.r2)} = ${fmt2(unexpBivar)}.`,
      `Correct: gestandaardiseerde β = r = ${fmt4(stats.bivar.r)}, afgerond ${fmt2(betaBivar)}.`,
      `Fout: Ŷ = ${fmt4(stats.bivar.a)} + ${fmt4(stats.bivar.b)}×3 = ${fmt2(stats.bivar.a + stats.bivar.b * 3)}.`,
      `Fout: b = ${fmt2(stats.bivar.b)} per 1 eenheid, niet ${fmt2(wrongSlope)} (dat zou b×10 zijn).`,
      `Fout: intercept a = ${fmt2(stats.bivar.a)}, niet ${fmt2(wrongIntcpt)}.`
    ]
  );

  // ── Q11: ANOVA from Tabel 2 (single choice) ──────────────────────────────
  const av = stats.anovaBin;
  const eta = round(Math.sqrt(av.eta2), 2);
  const critF = 11.26; // df1=1, df2=8, α=0.01
  const rejectH0 = av.f > critF;
  const q11 = createPoolMcq(
    'q11',
    `Gebruik Tabel 2. Toets of '${sc.bin.name}' een effect heeft op '${sc.vars.y.name}' via one-way ANOVA (α=0.01). Welke uitspraak is JUIST?`,
    `De totale variantie TUSSEN de groepen (SSBetween) bedraagt ${fmt2(av.ssBetween)}.`,
    [
      { option: `De kritieke F-waarde (df1=1, df2=8, α=0.01) bedraagt ${fmt2(av.f)}.`, feedback: `Fout: ${fmt2(av.f)} is de berekende F-waarde. De kritieke waarde (df1=1, df2=8, α=0.01) ≈ ${critF}.` },
      { option: `Eta (η) bedraagt ${fmt2(av.f * 0.1)}, wat op een zeer zwakke samenhang wijst.`, feedback: `Fout: η = √(SSBetween/SSTotal) = ${fmt2(eta)}, niet ${fmt2(av.f * 0.1)}.` },
      { option: `We verwerpen H0: er is een statistisch significant effect van '${sc.bin.name}' op '${sc.vars.y.name}'.`, feedback: `Fout: F=${fmt2(av.f)} is ${rejectH0 ? 'groter' : 'kleiner'} dan de kritieke waarde (${critF}), dus H0 wordt ${rejectH0 ? 'verworpen' : 'behouden'}.` },
      { option: `De verschillen tussen de groepen zijn aanzienlijk groter dan de verschillen binnen de groepen.`, feedback: `Fout: F=${fmt2(av.f)}${av.f < 1 ? ' < 1 — zelfs kleiner dan 1' : ' < kritieke waarde'}; de within-group variantie domineert.` }
    ],
    `Correct: SSBetween = ${av.n0}×(${fmt2(av.m0)}−${fmt2((av.m0 * av.n0 + av.m1 * av.n1) / (av.n0 + av.n1))})² + ${av.n1}×(${fmt2(av.m1)}−${fmt2((av.m0 * av.n0 + av.m1 * av.n1) / (av.n0 + av.n1))})² = ${fmt2(av.ssBetween)}.`,
    rng
  );

  // ── Q12: Partial correlation from Tabel 2 (TWO correct of 5) ─────────────
  const ptrendLabel = Math.abs(stats.partial1) < Math.abs(stats.bivar.r) ? 'gedaald' : 'gestegen';
  const pr1dec = round(stats.partial1, 1);
  const pr2dec = round(stats.partial2, 1);
  const q12 = createMultiMcq(
    'q12',
    `Gebruik Tabel 2. Welke TWEE uitspraken over de partiële correlatie zijn JUIST? Maak TWEE keuzes.`,
    [
      `Wanneer we het bivariaat verband tussen '${sc.vars.x1.name}' en '${sc.vars.y.name}' controleren voor '${sc.vars.x2.name}', stellen we vast dat de zero-order r (${fmt2(stats.bivar.r)}) is ${ptrendLabel} naar ${pr1dec} (afgerond decimaal getal).`,
      `De partiële correlatiecoëfficiënt is de correlatie tussen de residuen van de regressie van '${sc.vars.y.name}' op '${sc.vars.x1.name}' en de regressie van '${sc.vars.x2.name}' op '${sc.vars.x1.name}': deze bedraagt ${pr2dec}.`,
      `De partiële r(X1,Y|X2) stelt de GEDEELDE variatie voor: X1 en Y delen, controlerend voor X2, afgerond ${fmt2(round(stats.partial1 ** 2 * 100, 1))}% van de variatie.`,
      `De partiële correlatiecoëfficiënt is altijd nul als de zero-order correlatie ook nul is.`,
      `Als de partiële correlatiecoëfficiënt nul is, bestaat er geen enkel verband tussen X en Y.`
    ],
    [0, 1],
    [
      `Correct: partiële r(X1,Y|X2) = ${stats.partial1.toFixed(4)} ≈ ${pr1dec}. Zero-order r was ${fmt2(stats.bivar.r)}.`,
      `Correct: partiële correlatie = r tussen residuen van beide regressies op de controlevariabele = ${stats.partial2.toFixed(4)} ≈ ${pr2dec}.`,
      `Fout: partiële r² = ${fmt2(stats.partial1 ** 2 * 100)}% is de UNIEKE variatie die X1 en Y nog delen ná controle voor X2, niet de gedeelde variatie.`,
      `Fout: de partiële correlatie kan ook nul worden terwijl de zero-order correlatie niet nul is (suppressor of mediator).`,
      `Fout: partiële correlatie nul betekent geen LINEAIRE partiële samenhang, niet dat er absoluut geen verband is.`
    ]
  );

  return [q1, q6, q9, q18, q19, q20, q21, q10, q11, q12];
}

function buildGeneralMcqs(rng) {
  // Q2: Confidence interval / margin of error (single, 3 wrong options)
  const q2 = createPoolMcq('q2',
    'Welke uitspraak is JUIST? (Veronderstel gelijke n en σ)',
    'Als het betrouwbaarheidsniveau toeneemt, neemt de foutenmarge toe.',
    [
      { option: 'Bij een grotere steekproef wordt het 95% betrouwbaarheidsinterval breder.', feedback: 'Fout: grotere n verkleint de foutenmarge.' },
      { option: 'Bij een grotere steekproef daalt de betrouwbaarheid bij een vaste foutenmarge.', feedback: 'Fout: grotere n laat toe om bij dezelfde foutenmarge een hogere betrouwbaarheid te bereiken.' },
      { option: 'Bij grotere steekproeven neemt de spreiding in de steekproevenverdeling toe.', feedback: 'Fout: de standaardfout σ/√n daalt bij grotere n.' }
    ],
    'Correct: hogere betrouwbaarheid vereist een groter z*-getal.',
    rng
  );

  // Q3: Type I/II errors, criminological context (2 options)
  const q3 = createMcq('q3',
    'Lees de stellingen. Stelling 1: een onderzoeker besluit dat een nieuw opsporingsbeleid effectief is, terwijl dit in realiteit niet zo is. Stelling 2: een re-integratieprogramma vermindert in realiteit recidive, maar de onderzoeker vindt geen significant effect. Welke uitspraak is JUIST?',
    ['Stelling 1 is een Type-I fout. Stelling 2 is een Type-II fout.',
      'Stelling 1 is een Type-II fout. Stelling 2 is een Type-I fout.'],
    0,
    ['Correct: Type-I = H0 onterecht verwerpen; Type-II = H0 onterecht behouden.',
      'Fout: de definities zijn omgewisseld.']
  );

  // Q4: Multiple R properties (2 options)
  const q4 = createMcq('q4',
    'Evalueer: "De multiple correlatiecoëfficiënt R meet de lineaire relatie tussen geobserveerde en voorspelde Y. Multiple R is steeds positief." Deze uitspraak is...',
    ['Juist.', 'Fout.'],
    0,
    ['Correct: R = cor(Y, Ŷ) ≥ 0 per definitie.',
      'Fout: dit is de correcte definitie van R.']
  );

  // Q5: Ordinal/median from frequency distribution (generated, single choice 3 wrong)
  const catLabels = ['Volledig oneens', 'Oneens', 'Neutraal', 'Eens', 'Volledig eens'];
  const totalN5 = Math.floor(2500 + rng() * 2000);
  const rawP = [0.10 + rng() * 0.08, 0.16 + rng() * 0.10, 0.24 + rng() * 0.12, 0.22 + rng() * 0.08, 0.11 + rng() * 0.08];
  const sumP = rawP.reduce((a, b) => a + b, 0);
  let counts5 = rawP.map(v => Math.round(v / sumP * totalN5));
  counts5[2] += totalN5 - counts5.reduce((a, b) => a + b, 0);
  let cumul = 0; let medianIdx = 0;
  for (let i = 0; i < 5; i++) { cumul += counts5[i]; if (cumul >= totalN5 / 2) { medianIdx = i; break; } }
  const medLbl = catLabels[medianIdx];
  const maxIdx = counts5.indexOf(Math.max(...counts5));
  const maxLbl = catLabels[maxIdx];
  const q5 = createPoolMcq('q5',
    `In een steekproef (N=${totalN5}) vulden respondenten een tevredenheidsvraag in. Verdeling: ${catLabels.map((c, i) => c + ': ' + counts5[i]).join(', ')}. Welke uitspraak is JUIST?`,
    `De mediaan ligt in de categorie '${medLbl}'.`,
    [
      { option: `Omdat '${maxLbl}' de grootste categorie is, is de variantie minimaal.`, feedback: 'Fout: de modus bepaalt niet de minimale variantie.' },
      { option: 'Omdat er meer positieve dan negatieve antwoorden zijn, is de verdeling linksscheef.', feedback: 'Fout: meer positieve antwoorden wijst eerder op negatieve scheefheid (staart links).' },
      { option: `Omdat '${maxLbl}' het meest voorkomt, geeft dit het beste de gemiddelde tevredenheid weer.`, feedback: 'Fout: de modus ≠ gemiddelde.' }
    ],
    'Correct: cumulatief bereik je de helft van N in die categorie.',
    rng
  );

  // Q7: Normal distribution multi-select (TWO correct of 5)
  const muZ = round(3.5 + rng() * 3.0, 1);
  const sigZ = round(1.0 + rng() * 1.5, 1);
  const zA = round(0.50 + rng() * 0.80, 2);
  const valA = round(muZ + zA * sigZ, 2);
  const pAboveA = round(1 - normalCDF(zA), 4);
  const lo1 = round(muZ - (0.5 + rng() * 0.5) * sigZ, 2);
  const hi1 = round(muZ - (0.1 + rng() * 0.3) * sigZ, 2);
  const lo2 = round(muZ + (0.1 + rng() * 0.3) * sigZ, 2);
  const hi2 = round(muZ + (0.5 + rng() * 0.5) * sigZ, 2);
  const p1 = round(normalCDF((hi1 - muZ) / sigZ) - normalCDF((lo1 - muZ) / sigZ), 4);
  const p2 = round(normalCDF((hi2 - muZ) / sigZ) - normalCDF((lo2 - muZ) / sigZ), 4);
  const itv1smaller = p1 < p2;
  const wrongPct95lo = round(muZ - 2.0 * sigZ, 2);
  const wrongPct95hi = round(muZ + 2.0 * sigZ, 2);
  const someBelow = round(muZ - 0.2 * sigZ, 2);
  const pBelowTrue = round(normalCDF((someBelow - muZ) / sigZ) * 100, 2);
  const pBelowWrong = round(pBelowTrue + 12 + rng() * 10, 2);
  const varTrue = round(sigZ ** 2, 2);
  const varWrong = round(sigZ * 3, 2);
  const q7 = createMultiMcq('q7',
    `Het dagelijks internetgebruik is normaal verdeeld: μ=${fmt2(muZ)} uur, σ=${fmt2(sigZ)} uur. Welke TWEE beweringen zijn JUIST? Maak TWEE keuzes.`,
    [
      `${Math.round(pAboveA * 100)}% spendeert dagelijks ${fmt2(valA)} uur of meer.`,
      `De populatie die dagelijks tussen ${fmt2(lo1)} en ${fmt2(hi1)} uur online is, is ${itv1smaller ? 'kleiner' : 'groter'} dan de populatie die dagelijks tussen ${fmt2(lo2)} en ${fmt2(hi2)} uur online is.`,
      `95% van de populatie zit dagelijks tussen ${fmt2(wrongPct95lo)} en ${fmt2(wrongPct95hi)} uur online.`,
      `${fmt2(pBelowWrong)}% spendeert dagelijks ${fmt2(someBelow)} uur en minder.`,
      `De variantie bedraagt ${fmt2(varWrong)}.`
    ],
    [0, 1],
    [
      `Correct: z=(${fmt2(valA)}-${fmt2(muZ)})/${fmt2(sigZ)}=${fmt2(zA)}, P(Z≥${fmt2(zA)})=${fmt4(pAboveA)}.`,
      `Correct: P([${fmt2(lo1)},${fmt2(hi1)}])=${fmt4(p1)}, P([${fmt2(lo2)},${fmt2(hi2)}])=${fmt4(p2)}.`,
      `Fout: 95%-interval = μ±1.96σ = [${fmt2(muZ - 1.96 * sigZ)}, ${fmt2(muZ + 1.96 * sigZ)}].`,
      `Fout: P(X≤${fmt2(someBelow)})=${fmt2(pBelowTrue)}%, niet ${fmt2(pBelowWrong)}%.`,
      `Fout: variantie = σ² = ${fmt2(sigZ)}² = ${fmt2(varTrue)}, niet ${fmt2(varWrong)}.`
    ]
  );

  // Q8: Sample size n = ceil((z*sigma/E)^2) (single, 4 options)
  const sigma8 = Math.round((3000 + rng() * 12000) / 100) * 100;
  const E8 = Math.round((300 + rng() * 1200) / 100) * 100;
  const z95 = 1.96;
  const rawN8 = (z95 * sigma8 / E8) ** 2;
  const nTrue8 = Math.ceil(rawN8);
  const nWrong1 = Math.ceil(rawN8 * 4);
  const nWrong2 = Math.ceil(z95 ** 2 * sigma8 / E8);
  const nWrong3 = Math.ceil((z95 * sigma8 / (E8 * 2)) ** 2);
  const q8 = createPoolMcq('q8',
    `Je plant een onderzoek met σ≈${sigma8.toLocaleString('nl-BE')} en foutmarge ${E8.toLocaleString('nl-BE')}, betrouwbaarheid 95% (z=1.96). Welke steekproefomvang is nodig? (Rond tussenberekeningen op 4 dec., eindresultaat op geheel getal naar boven.)`,
    `n = ${nTrue8}`,
    [
      { option: `n = ${nWrong1}`, feedback: `Fout: je hebt E per abuis gehalveerd. Gebruik E=${E8.toLocaleString('nl-BE')}.` },
      { option: `n = ${nWrong2}`, feedback: 'Fout: je bent vergeten het gehele resultaat te kwadrateren. n = (z·σ/E)².' },
      { option: `n = ${nWrong3}`, feedback: `Fout: je hebt de foutenmarge verdubbeld naar ${(E8 * 2).toLocaleString('nl-BE')}.` }
    ],
    `Correct: n = (1.96×${sigma8}/${E8})² = ${fmt4(rawN8)} → afronden: ${nTrue8}.`,
    rng
  );

  // Q13: Chi-square rapportage (2 options, generated chi2 value)
  const chi2Val = round(2.0 + rng() * 8.0, 2);
  const critChi2 = 5.991;
  const rejectChi = chi2Val > critChi2;
  const correctRep = rejectChi
    ? `χ²=${fmt2(chi2Val)} > ${critChi2} (critisch). We verwerpen H0: statistisch significante samenhang (α=0.05).`
    : `χ²=${fmt2(chi2Val)} < ${critChi2} (critisch). We behouden H0: geen statistisch significante samenhang (α=0.05).`;
  const q13 = createMcq('q13',
    `Chi-kwadraattoets, df=2, α=0.05 (kritieke waarde=${critChi2}): χ²=${fmt2(chi2Val)}. Rapportage: "${correctRep}" — Is deze rapportage...`,
    ['Juist.', 'Fout.'],
    0,
    [`Correct: χ²=${fmt2(chi2Val)} ${rejectChi ? '>' : '<'} ${critChi2} → H0 ${rejectChi ? 'verwerpen' : 'behouden'}.`,
    `Fout: de rapportage is wel degelijk correct. χ²=${fmt2(chi2Val)} ${rejectChi ? '>' : '<'} ${critChi2}.`]
  );

  // Q14: z-test p-value (single, 3 wrong options)
  const mu0 = Math.round(400 + rng() * 200);
  const xbar = round(mu0 + 8 + rng() * 20, 1);
  const sig14 = Math.round(80 + rng() * 80);
  const n14 = Math.round(400 + rng() * 400);
  const z14 = round((xbar - mu0) / (sig14 / Math.sqrt(n14)), 4);
  const pval = round(1 - normalCDF(z14), 4);
  const pPct = round(pval * 100, 2);
  const q14 = createPoolMcq('q14',
    `H₀: μ=${mu0}, Hₐ: μ>${mu0}. Steekproef: n=${n14}, x̄=${fmt2(xbar)}, σ=${sig14}. Wat is de kans om x̄=${fmt2(xbar)} te vinden als H₀ waar is? (Rond tussenberekeningen op 4 dec., einduitkomst op 2 dec.)`,
    `Ongeveer ${fmt2(pPct)}%.`,
    [
      { option: `Ongeveer ${fmt2(round((1 - pval) * 100, 2))}%.`, feedback: 'Fout: dit is P(X̄≤x̄) — de linkerstaart. Gebruik de rechterstaart P(Z≥z).' },
      { option: `Ongeveer ${fmt2(round(pval * 2 * 100, 2))}%.`, feedback: 'Fout: dit is tweezijdig (2×p). Bij Hₐ: μ>μ₀ gebruik je enkel de rechterstaartkans.' },
      { option: `Ongeveer ${fmt2(round(normalCDF(-z14) * 100, 2))}%.`, feedback: `Fout: je hebt de negatieve z gebruikt. z=(${fmt2(xbar)}-${mu0})/(${sig14}/√${n14})=+${fmt4(z14)}.` }
    ],
    `Correct: z=${fmt4(z14)}, P(Z≥${fmt4(z14)})=${fmt4(pval)}=${fmt2(pPct)}%.`,
    rng
  );

  // Q15: Interaction effect (3 options)
  const q15 = createMcq('q15',
    'In een onderzoek vinden onderzoekers dat hogere morele normen gepaard gaan met minder intenties om te stelen, maar alleen bij personen die hoge schaamtegevoelens verwachtten. Bij personen met lage schaamtegevoelens was dit verband zwakker. Welke stelling beschrijft dit het best?',
    [
      'Het effect van morele normen op intenties om te stelen is conditioneel op het niveau van geanticipeerde schaamtegevoelens.',
      'Morele normen beïnvloeden intenties om te stelen via geanticipeerde schaamtegevoelens.',
      'Morele normen en schaamtegevoelens hangen samen met intenties om te stelen doordat ze beide gerelateerd zijn aan een derde persoonlijkheidsfactor.'
    ],
    0,
    [
      'Correct: conditioneel effect = het effect van X varieert naargelang Z. Dit is een interactie-effect.',
      'Fout: dit beschrijft mediatie (X→Z→Y), niet interactie.',
      'Fout: dit beschrijft een spurieus/confounding-effect, niet interactie.'
    ]
  );

  // Q16: Degrees of freedom (2 options)
  const q16 = createMcq('q16',
    'Evalueer: "Het aantal vrijheidsgraden is het aantal van elkaar onafhankelijke elementen in een berekening." Deze uitspraak is...',
    ['Juist.', 'Fout.'],
    0,
    ['Correct: vrijheidsgraden = het aantal informatie-eenheden dat vrij kan variëren nadat constraints zijn opgelegd.',
      'Fout: dit is de correcte definitie van vrijheidsgraden.']
  );

  // Q17: Gestandaardiseerde beta vs. onstgestandaardiseerd b (3 options)
  const q17 = createMcq('q17',
    'Wat is het voornaamste voordeel van een gestandaardiseerde regressiecoëfficiënt (β) ten opzichte van een ongestandaardiseerde coëfficiënt (b)?',
    [
      'β laat toe de relatieve sterkte van predictoren te vergelijken, ongeacht hun meeteenheid.',
      'β geeft de absolute verandering in Y weer voor een toename van 1 eenheid in X.',
      'β is altijd groter dan b omdat het gecorrigeerd is voor de steekproefomvang.'
    ],
    0,
    [
      'Correct: β is uitgedrukt in standaarddeviaties, waardoor predictoren met verschillende schalen vergelijkbaar worden.',
      'Fout: dit is de definitie van de ongestandaardiseerde b, niet van β.',
      'Fout: β heeft geen vaste grootteverhouding tot b; de waarde hangt af van de verhouding SD(X)/SD(Y).'
    ]
  );

  return [q2, q3, q4, q5, q7, q8, q13, q14, q15, q16, q17];
}

function renderMcqList(containerId, items, prefix, startAt) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = items.map((item, idx) => {
    const qNum = startAt + idx;
    const inputType = item.multiSelect ? 'checkbox' : 'radio';
    const hint = item.multiSelect ? `<p class="mcq-hint">${item.hint || 'Selecteer 2 opties.'}</p>` : '';
    const radios = item.options.map((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      return `
        <label class="mcq-option">
          <input type="${inputType}" name="${prefix}-${item.id}" value="${oIdx}" />
          <span><strong>${letter}.</strong> ${opt}</span>
        </label>
      `;
    }).join('');
    return `
      <article class="mcq-item" id="mcq-item-${prefix}-${item.id}">
        <p class="mcq-title">${qNum}. ${item.question}</p>
        ${hint}
        <div class="mcq-options">${radios}</div>
        <div class="mcq-feedback" id="fb-mcq-${prefix}-${item.id}">Nog niet nagekeken.</div>
      </article>
    `;
  }).join('');
}

function markSectionFeedback(id, stateCls, message) {
  const box = document.getElementById(id);
  if (!box) return;
  box.className = `section-feedback ${stateCls || ''}`.trim();
  box.textContent = message || '';
}

function evaluateMultiMcqItem(prefix, item) {
  const name = `${prefix}-${item.id}`;
  const checked = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => Number(el.value));
  const itemBox = document.getElementById(`mcq-item-${prefix}-${item.id}`);
  const fb = document.getElementById(`fb-mcq-${prefix}-${item.id}`);
  if (!itemBox || !fb) return { answered: false, correct: false };
  itemBox.classList.remove('ok', 'err');
  const needed = item.correctIndices.length;
  if (checked.length === 0) {
    fb.className = 'mcq-feedback';
    fb.textContent = `Kies ${needed} antwoorden.`;
    return { answered: false, correct: false };
  }
  const correctSet = new Set(item.correctIndices);
  const isCorrect = checked.length === needed && checked.every((i) => correctSet.has(i));
  const isNewFirst = state.firstAttempt[item.id] === undefined;
  const sig = `multi:${checked.slice().sort().join(',')}`;
  if (isNewFirst) state.firstAttempt[item.id] = isCorrect ? 'ok' : 'err';
  const attemptChanged = registerAttempt(item.id, sig, isCorrect);
  if (isNewFirst || attemptChanged) renderFinalScore();
  if (isCorrect) {
    itemBox.classList.add('ok');
    fb.className = 'mcq-feedback ok';
    fb.textContent = 'Juist. ' + item.correctIndices.map((i) => item.feedbacks[i]).join(' | ');
    return { answered: true, correct: true };
  }
  itemBox.classList.add('err');
  fb.className = 'mcq-feedback err';
  const wrongChosen = checked.filter((i) => !correctSet.has(i));
  const missedRight = item.correctIndices.filter((i) => !checked.includes(i));
  let msg = 'Fout.';
  if (wrongChosen.length) msg += ' ' + wrongChosen.map((i) => item.feedbacks[i]).join(' ');
  if (missedRight.length) msg += ` Je miste: ${missedRight.map((i) => String.fromCharCode(65 + item.options.indexOf(item.options[i]))).join(', ')}.`;
  fb.textContent = msg;
  return { answered: true, correct: false };
}

function evaluateMcqItem(prefix, item) {
  if (item.multiSelect) return evaluateMultiMcqItem(prefix, item);
  const name = `${prefix}-${item.id}`;
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  const itemBox = document.getElementById(`mcq-item-${prefix}-${item.id}`);
  const fb = document.getElementById(`fb-mcq-${prefix}-${item.id}`);
  if (!itemBox || !fb) return { answered: false, correct: false };
  itemBox.classList.remove('ok', 'err');
  if (!selected) {
    fb.className = 'mcq-feedback';
    fb.textContent = 'Kies 1 antwoord.';
    return { answered: false, correct: false };
  }
  const sel = Number(selected.value);
  const isCorrect = sel === item.correctIndex;
  const isNewFirst = state.firstAttempt[item.id] === undefined;
  if (isNewFirst) state.firstAttempt[item.id] = isCorrect ? 'ok' : 'err';
  const attemptChanged = registerAttempt(item.id, `mcq:${sel}`, isCorrect);
  if (isNewFirst || attemptChanged) renderFinalScore();
  if (isCorrect) {
    itemBox.classList.add('ok');
    fb.className = 'mcq-feedback ok';
    fb.textContent = `Juist. ${item.feedbacks[sel]}`;
    return { answered: true, correct: true };
  }
  itemBox.classList.add('err');
  fb.className = 'mcq-feedback err';
  const closingSuffix = (prefix === 'gen' || prefix === 'general')
    ? 'Herbekijk de conceptuele definities uit de cursus.'
    : 'Controleer de formule en de berekeningsstappen.';
  fb.textContent = `Fout. ${item.feedbacks[sel]} ${closingSuffix}`;
  return { answered: true, correct: false };
}

function updateMcqSummary(prefix, items, summaryId) {
  let correct = 0;
  let answered = 0;
  items.forEach((item) => {
    const r = evaluateMcqItem(prefix, item);
    if (r.answered) answered += 1;
    if (r.correct) correct += 1;
  });

  const total = items.length;
  const pending = total - answered;
  if (pending > 0) {
    markSectionFeedback(summaryId, '', `${correct}/${total} correct. ${pending} vraag/vragen nog onbeantwoord.`);
  } else if (correct === total) {
    markSectionFeedback(summaryId, 'ok', `${correct}/${total} correct. Sterk werk.`);
  } else {
    markSectionFeedback(summaryId, 'err', `${correct}/${total} correct. Bekijk de feedback per vraag.`);
  }
}

function bindInstantMcqFeedback(prefix, items, summaryId) {
  items.forEach((item) => {
    const name = `${prefix}-${item.id}`;
    document.querySelectorAll(`input[name="${name}"]`).forEach((inp) => {
      inp.addEventListener('change', () => {
        evaluateMcqItem(prefix, item);
        updateMcqSummary(prefix, items, summaryId);
      });
    });
    evaluateMcqItem(prefix, item);
  });
  updateMcqSummary(prefix, items, summaryId);
}

function updateVariableLabels(sc) {
  const x1Text = `${sc.vars.x1.name} (X1)`;
  const x2Text = `${sc.vars.x2.name} (X2)`;
  const yText = `${sc.vars.y.name} (Y)`;
  const st = state.stats;

  document.querySelectorAll('.var-x1-name').forEach((el) => { el.textContent = x1Text; });
  document.querySelectorAll('.var-x2-name').forEach((el) => { el.textContent = x2Text; });
  document.querySelectorAll('.var-y-name').forEach((el) => { el.textContent = yText; });
  document.querySelectorAll('.var-x1-name-opt').forEach((el) => { el.textContent = x1Text; });
  document.querySelectorAll('.var-x2-name-opt').forEach((el) => { el.textContent = x2Text; });
  document.querySelectorAll('.var-y-name-opt').forEach((el) => { el.textContent = yText; });

  document.getElementById('th-x1').textContent = x1Text;
  document.getElementById('th-x2').textContent = x2Text;
  document.getElementById('th-y').textContent = yText;
  document.getElementById('th-bin').textContent = sc.bin.name;

  const opgaveX1 = document.getElementById('opgave-x1-name');
  const opgaveX2 = document.getElementById('opgave-x2-name');
  const opgaveY = document.getElementById('opgave-y-name');
  if (opgaveX1) opgaveX1.textContent = sc.vars.x1.name;
  if (opgaveX2) opgaveX2.textContent = sc.vars.x2.name;
  if (opgaveY) opgaveY.textContent = sc.vars.y.name;

  // Fill sentence-blank span values (only non-answer labels; b values come from student input)
  const setSpan = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  // Reset b-abs mirror spans to blank on each new generate
  ['lbl-bivar-b-abs', 'lbl-multi-b1-abs', 'lbl-multi-b2-abs'].forEach(id => setSpan(id, '___'));
}

function renderScenarioText(sc) {
  document.getElementById('scenario-text').textContent =
    `Een criminoloog onderzoekt welke factoren een invloed hebben op ${sc.vars.y.name.toLowerCase()}. ` +
    `${sc.vignette}`;
}

function renderOpenQuestionContext(sc, stats, seedUsed) {
  const rng = mulberry32((safeSeed(seedUsed) || 1) + 991);
  const template = OPEN_PROMPT_TEMPLATES[Math.floor(rng() * OPEN_PROMPT_TEMPLATES.length)];
  const txt = [
    `Datasetvariant ${seedUsed}: ${template}`,
    `Voor deze dataset geldt r(X1,X2)=${fmt2(stats.rx1x2)} en R²=${fmt2(stats.multi.r2)}.`,
    `Werk je interpretatie inhoudelijk uit binnen de context van ${sc.title.toLowerCase()}.`
  ].join(' ');
  document.getElementById('open-question-context').textContent = txt;
}

function renderDataset(rows) {
  const tbody = document.getElementById('dataset-body');
  const showVal = (v) => (Number.isInteger(v) ? String(v) : fmt2(v));
  tbody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.respondent}</td>
      <td>${showVal(row.x1)}</td>
      <td>${showVal(row.x2)}</td>
      <td>${showVal(row.y)}</td>
      <td>${row.binLabel}</td>
    </tr>
  `).join('');
}

function updatePredictionQuestion() {
  const el = document.getElementById('pred-question');
  if (!el) return;
  if (!state.rows.length) {
    el.textContent = 'Genereer eerst een dataset om de voorspellingsvraag te zien.';
    return;
  }
  el.textContent = `Bereken Yhat voor X1 = ${state.predCase.x1} en X2 = ${state.predCase.x2}`;
}

function ensureOpenFeedbackSlots() {
  document.querySelectorAll('.answer-table input:not(.no-eval), .answer-table textarea').forEach((el) => {
    const id = el.id;
    if (!id) return;
    let fb = document.getElementById(`fb-${id}`);
    if (fb) return;
    fb = document.createElement('div');
    fb.id = `fb-${id}`;
    fb.className = 'ans-feedback';
    fb.textContent = 'Nog niet nagekeken.';
    el.parentElement.appendChild(fb);
  });
}

function updateSentencePreview(sentenceDiv) {
  if (!sentenceDiv) return;
  const previewId = 'preview-' + sentenceDiv.id;
  let preview = document.getElementById(previewId);
  if (!preview) {
    preview = document.createElement('div');
    preview.id = previewId;
    preview.className = 'sentence-preview';
    sentenceDiv.insertAdjacentElement('afterend', preview);
  }
  const selects = sentenceDiv.querySelectorAll('.blank-select');
  const allFilled = [...selects].every((s) => s.value !== '');
  if (!allFilled) {
    preview.innerHTML = '';
    return;
  }
  let html = '';
  sentenceDiv.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      html += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains('blank-select')) {
        const opt = node.options[node.selectedIndex];
        html += `<strong class="chosen-blank">${opt ? opt.textContent.trim() : ''}</strong>`;
      } else {
        html += node.outerHTML;
      }
    }
  });
  preview.innerHTML = html.trim();
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function registerAttempt(id, signature, isCorrect) {
  if (!id) return false;
  const sig = String(signature ?? '').trim();
  if (!sig) return false;
  if (state.lastAttemptSignature[id] === sig) return false;
  state.lastAttemptSignature[id] = sig;
  state.attemptCount[id] = (state.attemptCount[id] || 0) + 1;
  if (isCorrect && state.firstCorrectAttempt[id] === undefined) {
    state.firstCorrectAttempt[id] = state.attemptCount[id];
  }
  return true;
}

function getOpenAnswerSignature(id) {
  const pick = (elId) => document.getElementById(elId)?.value || '';
  if (id === 'ans-bivar-b-int') return `dir:${pick('ans-bivar-b-dir')}`;
  if (id === 'ans-bivar-r2-int') return `type:${pick('ans-bivar-r2-type')}`;
  if (id === 'ans-multi-b1-int') return `dir:${pick('ans-multi-b1-dir')}|ctrl:${pick('ans-multi-b1-ctrl')}`;
  if (id === 'ans-multi-b2-int') return `dir:${pick('ans-multi-b2-dir')}|ctrl:${pick('ans-multi-b2-ctrl')}`;
  if (id === 'ans-multi-r2-int') return `type:${pick('ans-multi-r2-type')}|comb:${pick('ans-multi-r2-comb')}`;
  if (id === 'ans-rx1x2-int') return `dir:${pick('ans-rx1x2-dir')}`;
  const el = document.getElementById(id);
  if (!el) return '';
  return String(el.value ?? '').trim();
}

function renderFinalScore() {
  const panel = document.getElementById('final-score-panel');
  if (!panel) return;
  const total = getScoreTotal();
  const scored = Object.values(state.firstAttempt).filter((v) => v === 'ok').length;
  const attempted = Object.keys(state.firstAttempt).length;
  const firstCorrect = Object.values(state.firstCorrectAttempt);
  const rightFirst = firstCorrect.filter((n) => n === 1).length;
  const rightSecond = firstCorrect.filter((n) => n === 2).length;
  const rightThird = firstCorrect.filter((n) => n === 3).length;
  const rightOverThree = firstCorrect.filter((n) => n > 3).length;
  panel.innerHTML = `
    <strong>Eindscore (eerste poging): ${scored} / ${total} punten</strong>
    <span class="score-attempted">${attempted} van ${total} vragen beantwoord</span>
    <ul class="score-breakdown">
      <li>Juist op 1e poging: <strong>${rightFirst}</strong></li>
      <li>Juist op 2e poging: <strong>${rightSecond}</strong></li>
      <li>Juist op 3e poging: <strong>${rightThird}</strong></li>
      <li>Juist na meer dan 3 pogingen: <strong>${rightOverThree}</strong></li>
    </ul>
    <span class="score-note">Voor een mogelijke examenscore is vooral <strong>'Juist op 1e poging'</strong> relevant. De andere aantallen tonen je leerprogressie. Genereer een nieuwe dataset om opnieuw te oefenen.</span>
  `;
  const sidebarScore = document.getElementById('sidebar-score-display');
  if (sidebarScore) sidebarScore.textContent = `${scored} / ${total}`;
}

function resetAnswers() {
  document.querySelectorAll('.answer-table input, .answer-table textarea').forEach((el) => {
    el.value = '';
    el.classList.remove('correct', 'incorrect');
  });
  document.querySelectorAll('.blank-select').forEach((el) => { el.value = ''; });
  document.querySelectorAll('.sentence-preview').forEach((el) => { el.innerHTML = ''; });
  document.querySelectorAll('.ans-feedback').forEach((fb) => {
    fb.className = 'ans-feedback';
    fb.textContent = 'Nog niet nagekeken.';
  });
  document.querySelectorAll('.mcq-list input[type="radio"], .mcq-list input[type="checkbox"]').forEach((el) => { el.checked = false; });
  document.querySelectorAll('.mcq-item').forEach((el) => el.classList.remove('ok', 'err'));
  document.querySelectorAll('.mcq-feedback').forEach((fb) => {
    fb.className = 'mcq-feedback';
    fb.textContent = 'Nog niet nagekeken.';
  });
  state.firstAttempt = {};
  state.attemptCount = {};
  state.firstCorrectAttempt = {};
  state.lastAttemptSignature = {};
  renderFinalScore();
  markSectionFeedback('fb-mcq-dataset-summary', '', '');
  markSectionFeedback('fb-mcq-general-summary', '', '');
  markSectionFeedback('fb-open-summary', '', '');

  if (state.datasetMcqs.length) updateMcqSummary('dataset', state.datasetMcqs, 'fb-mcq-dataset-summary');
  if (state.generalMcqs.length) updateMcqSummary('general', state.generalMcqs, 'fb-mcq-general-summary');
  if (state.stats) checkOpenAnswers();
}

function populateScenarioSelect() {
  const sel = document.getElementById('scenario');
  sel.innerHTML = '';
  SCENARIOS.forEach((sc) => {
    const option = document.createElement('option');
    option.value = sc.id;
    option.textContent = sc.title;
    sel.appendChild(option);
  });
}

function approxNum(user, truth) {
  if (!Number.isFinite(user) || !Number.isFinite(truth)) return false;
  return Math.abs(user - truth) <= 0.015 || Math.abs(user - truth) <= 0.0007;
}

function numericFeedback(rawValue, truth, formulaHint) {
  if (!String(rawValue ?? '').trim()) return { state: 'pending', msg: 'Nog geen antwoord.' };
  const user = toNum(rawValue);
  if (!Number.isFinite(user)) return { state: 'err', msg: 'Geen geldig getal ingevuld.' };
  if (approxNum(user, truth)) return { state: 'ok', msg: 'Correct. Goed berekend.' };
  const diff = user - truth;
  const direction = diff > 0 ? 'te hoog' : 'te laag';
  return { state: 'err', msg: `Fout: je antwoord is ${direction}. Hint: ${formulaHint}` };
}

function normalizeText(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function evaluateTextGroups(text, groups) {
  const t = normalizeText(text);
  const missing = [];
  let hit = 0;
  groups.forEach((g) => {
    if (containsAny(t, g.keys)) hit += 1;
    else missing.push(g.label);
  });
  return { hit, total: groups.length, missing };
}

function textFeedbackForGroups(text, groups, fullMsg) {
  if (!String(text || '').trim()) return { state: 'pending', msg: 'Nog geen antwoord.' };
  const r = evaluateTextGroups(text, groups);
  if (r.hit === r.total) return { state: 'ok', msg: fullMsg };
  if (r.hit >= Math.max(2, r.total - 2)) {
    return { state: 'partial', msg: `Gedeeltelijk correct. Vul nog aan: ${r.missing.join(', ')}.` };
  }
  return { state: 'err', msg: `Onvoldoende. Neem zeker op: ${r.missing.join(', ')}.` };
}

function selectBlankFeedback(id, correctValue, wrongMsg) {
  const el = document.getElementById(id);
  if (!el) return { state: 'pending', msg: 'Nog geen antwoord.' };
  const val = el.value;
  if (!val) return { state: 'pending', msg: 'Nog geen keuze gemaakt.' };
  if (val === correctValue) return { state: 'ok', msg: null };
  return { state: 'err', msg: wrongMsg };
}

function setOpenFieldFeedback(id, result) {
  const input = document.getElementById(id);
  const fb = document.getElementById(`fb-${id}`);
  if (!input || !fb) return;
  input.classList.remove('correct', 'incorrect');
  if (result.state === 'ok') input.classList.add('correct');
  else if (result.state !== 'pending') input.classList.add('incorrect');

  fb.className = result.state === 'pending' ? 'ans-feedback' : `ans-feedback ${result.state}`;
  fb.textContent = result.msg;
}

function checkOpenAnswers(recordAttempts = false) {
  if (!state.stats || !state.scenario) return;
  const sc = state.scenario;
  const st = state.stats;

  const checks = [];
  checks.push({
    id: 'ans-bivar-r',
    result: numericFeedback(document.getElementById('ans-bivar-r').value, st.bivar.r, 'gebruik r = cov(X1,Y) / (SD(X1)*SD(Y)).')
  });
  checks.push({
    id: 'ans-bivar-r2',
    result: numericFeedback(document.getElementById('ans-bivar-r2').value, st.bivar.r2, 'gebruik R² = r² in bivariate regressie.')
  });
  checks.push({
    id: 'ans-bivar-b',
    result: numericFeedback(document.getElementById('ans-bivar-b').value, st.bivar.b, 'gebruik b = cov(X1,Y) / var(X1).')
  });
  checks.push({
    id: 'ans-bivar-a',
    result: numericFeedback(document.getElementById('ans-bivar-a').value, st.bivar.a, 'gebruik a = Ygem - b*X1gem.')
  });
  checks.push({
    id: 'ans-multi-b1',
    result: numericFeedback(document.getElementById('ans-multi-b1').value, st.multi.b1, 'gebruik de meervoudige regressieoplossing voor b1.')
  });
  checks.push({
    id: 'ans-multi-b2',
    result: numericFeedback(document.getElementById('ans-multi-b2').value, st.multi.b2, 'gebruik de meervoudige regressieoplossing voor b2.')
  });
  checks.push({
    id: 'ans-multi-a',
    result: numericFeedback(document.getElementById('ans-multi-a').value, st.multi.a, 'gebruik a = Ygem - b1*X1gem - b2*X2gem.')
  });
  checks.push({
    id: 'ans-multi-r2',
    result: numericFeedback(document.getElementById('ans-multi-r2').value, st.multi.r2, 'gebruik R² = 1 - SSE/SST.')
  });
  checks.push({
    id: 'ans-rx1x2',
    result: numericFeedback(document.getElementById('ans-rx1x2').value, st.rx1x2, 'gebruik r tussen X1 en X2.')
  });
  checks.push({
    id: 'ans-partial-1',
    result: numericFeedback(document.getElementById('ans-partial-1').value, st.partial1, 'gebruik de formule voor partiele correlatie r(X1,Y|X2).')
  });
  checks.push({
    id: 'ans-partial-2',
    result: numericFeedback(document.getElementById('ans-partial-2').value, st.partial2, 'gebruik de formule voor partiele correlatie r(X2,Y|X1).')
  });
  checks.push({
    id: 'ans-pred',
    result: numericFeedback(document.getElementById('ans-pred').value, st.pred, 'substitueer X1 en X2 in Yhat = a + b1*X1 + b2*X2.')
  });

  // ans-bivar-b-int: direction of bivariate b
  {
    const dir = selectBlankFeedback(
      'ans-bivar-b-dir',
      st.bivar.b >= 0 ? 'stijgt' : 'daalt',
      `Fout: b = ${fmt2(st.bivar.b)} is ${st.bivar.b >= 0 ? 'positief' : 'negatief'}, dus de verwachte Y ${st.bivar.b >= 0 ? 'stijgt' : 'daalt'}.`
    );
    checks.push({ id: 'ans-bivar-b-int', result: dir.state === 'ok' ? { state: 'ok', msg: 'Correct: de richting klopt.' } : dir });
  }

  // ans-bivar-r2-int: explained vs unexplained
  {
    const type = selectBlankFeedback(
      'ans-bivar-r2-type',
      'verklaarde',
      `Fout: R² geeft de VERKLAARDE proportie. De onverklaarde proportie is 1 - R² = ${fmt2((1 - st.bivar.r2) * 100)}%.`
    );
    checks.push({ id: 'ans-bivar-r2-int', result: type.state === 'ok' ? { state: 'ok', msg: 'Correct: R² is de verklaarde proportie variatie.' } : type });
  }

  // ans-multi-b1-int: direction + control variable
  {
    const dir = selectBlankFeedback(
      'ans-multi-b1-dir',
      st.multi.b1 >= 0 ? 'stijgt' : 'daalt',
      `Fout: b1 = ${fmt2(st.multi.b1)} is ${st.multi.b1 >= 0 ? 'positief' : 'negatief'}, dus de verwachte Y ${st.multi.b1 >= 0 ? 'stijgt' : 'daalt'}.`
    );
    const ctrl = selectBlankFeedback(
      'ans-multi-b1-ctrl',
      'x2',
      `Fout: bij b1 controleer je voor ${sc.vars.x2.name} (de andere predictor), niet voor iets anders.`
    );
    const combined = (dir.state === 'pending' || ctrl.state === 'pending')
      ? { state: 'pending', msg: 'Nog niet alle keuzes gemaakt.' }
      : (dir.state === 'ok' && ctrl.state === 'ok')
        ? { state: 'ok', msg: 'Correct: richting en controlevariabele kloppen.' }
        : { state: 'err', msg: [dir, ctrl].filter((r) => r.state === 'err').map((r) => r.msg).join(' ') };
    checks.push({ id: 'ans-multi-b1-int', result: combined });
  }

  // ans-multi-b2-int: direction + control variable
  {
    const dir = selectBlankFeedback(
      'ans-multi-b2-dir',
      st.multi.b2 >= 0 ? 'stijgt' : 'daalt',
      `Fout: b2 = ${fmt2(st.multi.b2)} is ${st.multi.b2 >= 0 ? 'positief' : 'negatief'}, dus de verwachte Y ${st.multi.b2 >= 0 ? 'stijgt' : 'daalt'}.`
    );
    const ctrl = selectBlankFeedback(
      'ans-multi-b2-ctrl',
      'x1',
      `Fout: bij b2 controleer je voor ${sc.vars.x1.name} (de andere predictor), niet voor iets anders.`
    );
    const combined = (dir.state === 'pending' || ctrl.state === 'pending')
      ? { state: 'pending', msg: 'Nog niet alle keuzes gemaakt.' }
      : (dir.state === 'ok' && ctrl.state === 'ok')
        ? { state: 'ok', msg: 'Correct: richting en controlevariabele kloppen.' }
        : { state: 'err', msg: [dir, ctrl].filter((r) => r.state === 'err').map((r) => r.msg).join(' ') };
    checks.push({ id: 'ans-multi-b2-int', result: combined });
  }

  // ans-multi-r2-int: explained/unexplained + samen/afzonderlijk
  {
    const type = selectBlankFeedback(
      'ans-multi-r2-type',
      'verklaarde',
      `Fout: R² is de VERKLAARDE proportie, niet de onverklaarde. De onverklaarde is ${fmt2((1 - st.multi.r2) * 100)}%.`
    );
    const comb = selectBlankFeedback(
      'ans-multi-r2-comb',
      'samen',
      'Fout: in meervoudige regressie verklaren X1 en X2 SAMEN de variatie in Y — niet elk afzonderlijk.'
    );
    const combined = (type.state === 'pending' || comb.state === 'pending')
      ? { state: 'pending', msg: 'Nog niet alle keuzes gemaakt.' }
      : (type.state === 'ok' && comb.state === 'ok')
        ? { state: 'ok', msg: 'Correct: R² is de verklaarde proportie door X1 en X2 samen.' }
        : { state: 'err', msg: [type, comb].filter((r) => r.state === 'err').map((r) => r.msg).join(' ') };
    checks.push({ id: 'ans-multi-r2-int', result: combined });
  }

  // ans-rx1x2-int: direction of predictor correlation
  {
    const dir = selectBlankFeedback(
      'ans-rx1x2-dir',
      st.rx1x2 >= 0 ? 'positieve' : 'negatieve',
      `Fout: r = ${fmt2(st.rx1x2)} is ${st.rx1x2 >= 0 ? 'positief' : 'negatief'}, dus de samenhang is ${st.rx1x2 >= 0 ? 'positief' : 'negatief'}.`
    );
    checks.push({ id: 'ans-rx1x2-int', result: dir.state === 'ok' ? { state: 'ok', msg: 'Correct: de richting van de samenhang klopt.' } : dir });
  }

  const assumptionText = normalizeText(document.getElementById('ans-assumption').value);
  const rawAssumption = document.getElementById('ans-assumption').value;
  const okAssumption = containsAny(assumptionText, [
    'homoscedasticiteit',
    'homoscedasticity',
    'gelijke variantie',
    'constante variantie',
    'gelijke variantie van de foutentermen'
  ]);
  checks.push({
    id: 'ans-assumption',
    result: !String(rawAssumption || '').trim()
      ? { state: 'pending', msg: 'Nog geen antwoord.' }
      : (okAssumption
        ? { state: 'ok', msg: 'Correct: dit verwijst naar constante spreiding van de foutentermen.' }
        : { state: 'err', msg: 'Fout. Denk aan de assumptie over gelijke spreiding van de foutentermen.' })
  });

  let okCount = 0;
  let partialCount = 0;
  let pendingCount = 0;
  let scoreChanged = false;
  checks.forEach((c) => {
    setOpenFieldFeedback(c.id, c.result);
    if (recordAttempts && c.result.state !== 'pending') {
      if (state.firstAttempt[c.id] === undefined) {
        state.firstAttempt[c.id] = c.result.state;
        scoreChanged = true;
      }
      if (registerAttempt(c.id, getOpenAnswerSignature(c.id), c.result.state === 'ok')) {
        scoreChanged = true;
      }
    }
    if (c.result.state === 'ok') okCount += 1;
    else if (c.result.state === 'partial') partialCount += 1;
    else if (c.result.state === 'pending') pendingCount += 1;
  });

  const total = checks.length;
  if (okCount === total) {
    markSectionFeedback('fb-open-summary', 'ok', `${okCount}/${total} volledig correct. Sterk werk.`);
  } else if (pendingCount > 0) {
    markSectionFeedback(
      'fb-open-summary',
      '',
      `${okCount}/${total} volledig correct, ${partialCount} gedeeltelijk, ${pendingCount} nog onbeantwoord.`
    );
  } else {
    markSectionFeedback(
      'fb-open-summary',
      'err',
      `${okCount}/${total} volledig correct, ${partialCount} gedeeltelijk. Verbeter met de hints per veld.`
    );
  }
  if (scoreChanged) renderFinalScore();
}

function generate(randomScenario = false) {
  const sel = document.getElementById('scenario');
  const seedEl = document.getElementById('seed');
  let scenario = SCENARIOS.find((s) => s.id === sel.value) || SCENARIOS[0];

  if (randomScenario) {
    scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    sel.value = scenario.id;
  }

  const enteredSeed = safeSeed(seedEl.value);
  const manualSeed = seedEl.dataset.seedManual === '1';
  const forceRandom = seedEl.dataset.nextRandom === '1';
  let seedToUse;
  if (manualSeed && enteredSeed != null && !forceRandom) {
    seedToUse = enteredSeed;
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '1';
  } else {
    seedToUse = nextRandomSeed();
    seedEl.value = String(seedToUse);
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  const made = makeRowsForScenario(scenario, seedToUse);
  if (!made.rows.length) return;

  state.scenario = scenario;
  state.rows = made.rows;
  state.seedUsed = made.seedUsed;
  state.predCase = pickPredictionCase(made.rows);
  state.stats = computeReferenceStats(made.rows);
  const scenarioOffset = scenario.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  state.pathModel = buildPathModel(made.seedUsed + scenarioOffset);
  const mcqRng = mulberry32(made.seedUsed + scenarioOffset * 97 + 8801);
  state.crossTab = buildCrossTab(mcqRng);
  renderCrossTab(state.crossTab);
  state.datasetMcqs = shuffleMcqList(
    buildDatasetMcqs(scenario, state.stats, state.pathModel, mcqRng),
    mcqRng
  );
  state.generalMcqs = shuffleMcqList(
    buildGeneralMcqs(mcqRng),
    mcqRng
  );

  updateVariableLabels(scenario);
  renderScenarioText(scenario);
  renderDataset(made.rows);
  renderPathModel(state.pathModel);
  updatePredictionQuestion();
  renderOpenQuestionContext(scenario, state.stats, made.seedUsed);
  renderMcqList('mcq-dataset-list', state.datasetMcqs, 'dataset', 1);
  renderMcqList('mcq-general-list', state.generalMcqs, 'general', state.datasetMcqs.length + 1);
  ensureOpenFeedbackSlots();

  document.getElementById('seed-used').textContent = String(made.seedUsed);

  resetAnswers();
  bindInstantMcqFeedback('dataset', state.datasetMcqs, 'fb-mcq-dataset-summary');
  bindInstantMcqFeedback('general', state.generalMcqs, 'fb-mcq-general-summary');
  checkOpenAnswers();
}

function printQuestionPaper() {
  const x1name = document.querySelector('.var-x1-name')?.textContent || 'X1';
  const x2name = document.querySelector('.var-x2-name')?.textContent || 'X2';
  const yname = document.querySelector('.var-y-name')?.textContent || 'Y';
  const bname = document.getElementById('th-bin')?.textContent || 'Groep';
  const context = document.getElementById('scenario-text')?.textContent || '';
  const seedUsed = document.getElementById('seed-used')?.textContent || '-';

  const dsRows = Array.from(document.querySelectorAll('#dataset-body tr')).map((tr) => tr.outerHTML).join('');
  const pathFigureSvg = document.querySelector('#deel-path svg')?.outerHTML || '';
  const pathTitle = state.pathModel?.scenario?.title || 'Padmodel';
  const mcqCount = document.querySelectorAll('.mcq-item').length || EXPECTED_MCQ_ITEMS;
  const mcqRows = Array.from(document.querySelectorAll('.mcq-item')).map((item, i) => {
    const q = item.querySelector('.mcq-title')?.textContent || '';
    const opts = Array.from(item.querySelectorAll('.mcq-option span')).map((s) => `<li>${s.innerHTML}</li>`).join('');
    return `<div class="q"><p><strong>${i + 1}.</strong> ${q.replace(/^\d+\.\s*/, '')}</p><ul>${opts}</ul></div>`;
  }).join('');

  const ansRows = Array.from(document.querySelectorAll('.answer-table tbody tr')).map((tr) => {
    const qCell = tr.querySelector('td:first-child');
    if (!qCell) return '';
    const hasTextarea = !!tr.querySelector('textarea');
    const divCls = tr.classList.contains('divider-row') ? 'divider-row' : '';
    const ansCell = hasTextarea
      ? '<td><div style="border:1px solid #bbb;min-height:70px;"></div></td>'
      : '<td><div style="border-bottom:1px solid #aaa;min-height:26px;"></div></td>';
    return `<tr class="${divCls}"><td>${qCell.innerHTML}</td>${ansCell}</tr>`;
  }).join('');

  // Build MCQ block — span innerHTML already contains "A. text" from renderMcqList, use directly
  const mcqPrint = Array.from(document.querySelectorAll('.mcq-item')).map((item, i) => {
    const q = item.querySelector('.mcq-title')?.textContent || '';
    const opts = Array.from(item.querySelectorAll('.mcq-option span'))
      .map((s) => `<li>${s.innerHTML}</li>`)
      .join('');
    return `<div class="mcq-block"><p><strong>${i + 1}.</strong> ${q.replace(/^\d+\.\s*/, '')}</p><ul>${opts}</ul></div>`;
  }).join('');

  // Build answer rows with clean write lines (no inline colours)
  const ansRowsPrint = Array.from(document.querySelectorAll('.answer-table tbody tr')).map((tr) => {
    const qCell = tr.querySelector('td:first-child');
    if (!qCell) return '';
    const hasSentenceBlank = !!tr.querySelector('.sentence-blank');
    const divCls = tr.classList.contains('divider-row') ? ' class="divider-row"' : '';
    const ansCell = hasSentenceBlank
      ? '<td><div class="write-box"></div></td>'
      : '<td><div class="write-line"></div></td>';
    return `<tr${divCls}><td>${qCell.innerHTML}</td>${ansCell}</tr>`;
  }).join('');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="nl"><head>
  <meta charset="UTF-8"/>
  <title>Vragenblad – Statistiek Synthese-oefening</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #000;
      margin: 0;
      width: 100%;
    }
    .doc-header {
      border-bottom: 2pt solid #000;
      padding-bottom: 8pt;
      margin-bottom: 14pt;
    }
    .doc-header h1 {
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 3pt;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    .doc-header .meta {
      font-size: 9.5pt;
      color: #333;
      margin: 0;
    }
    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      border-bottom: 1pt solid #000;
      padding-bottom: 2pt;
      margin: 16pt 0 7pt;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    .context {
      border-left: 3pt solid #000;
      padding: 6pt 10pt;
      margin-bottom: 12pt;
      font-size: 10.5pt;
    }
    .var-info {
      font-size: 10pt;
      margin: 0 0 12pt;
    }
    table.data-table {
      width: calc(100% - 2pt);
      max-width: calc(100% - 2pt);
      border-collapse: collapse;
      margin: 0 0 14pt 1pt;
      font-size: 10pt;
      table-layout: fixed;
    }
    table.data-table th {
      border: 1pt solid #000;
      padding: 4pt 5pt;
      font-weight: 700;
      text-align: center;
      word-break: break-word;
    }
    table.data-table td {
      border: 1pt solid #000;
      padding: 3pt 5pt;
      text-align: center;
      word-break: break-word;
    }
    .keep-together {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .print-path {
      border: 1pt solid #999;
      padding: 8pt;
      margin-bottom: 14pt;
    }
    .print-path svg { width: 100%; height: auto; max-height: 190pt; }
    .print-path .node       { fill: #fff; stroke: #000; stroke-width: 1.5; }
    .print-path .node-y     { fill: #f0f0f0; }
    .print-path .node-main  { font-size: 14px; fill: #000; font-weight: 700; }
    .print-path .node-sub   { font-size: 11px; fill: #000; }
    .print-path .edge       { stroke: #000; stroke-width: 1.8; fill: none; }
    .print-path .edge-label { fill: #000; font-size: 12px; font-weight: 700; }
    .print-path marker polygon { fill: #000; }
    .mcq-block {
      margin-bottom: 7pt;
      page-break-inside: avoid;
    }
    .mcq-block p  { margin: 0 0 3pt; font-size: 10.5pt; font-weight: 700; }
    .mcq-block ul { margin: 0; padding-left: 0; list-style: none; }
    .mcq-block li { margin: 2pt 0; font-size: 10.5pt; padding-left: 18pt; text-indent: -18pt; }
    table.ans-table {
      width: calc(100% - 2pt);
      max-width: calc(100% - 2pt);
      border-collapse: collapse;
      margin: 0 0 14pt 1pt;
      font-size: 10pt;
      table-layout: fixed;
    }
    table.ans-table th {
      border: 1pt solid #000;
      padding: 4pt 6pt;
      font-weight: 700;
      text-align: left;
    }
    table.ans-table td {
      border: 1pt solid #000;
      padding: 4pt 6pt;
      vertical-align: top;
      word-break: break-word;
    }
    table.ans-table td:first-child { width: 50%; }
    table.ans-table tr.divider-row td:first-child {
      font-weight: 700;
      border-top: 1.5pt solid #000;
    }
    .write-line {
      border-bottom: 0.75pt solid #999;
      min-height: 18pt;
      margin: 2pt 0;
    }
    .write-box {
      border: 0.75pt solid #999;
      min-height: 54pt;
    }
    .break-before { page-break-before: always; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head><body>

  <div class="doc-header">
    <h1>Hoofdstuk 13 Synthesis Oefeningen</h1>
    <p class="meta">Datasetcode: <strong>${seedUsed}</strong></p>
  </div>

  <table class="ans-table" style="margin-bottom:18pt">
    <tbody>
      <tr><td><strong>Naam student</strong></td><td><div class="write-line"></div></td></tr>
      <tr><td><strong>Studentennummer</strong></td><td><div class="write-line"></div></td></tr>
    </tbody>
  </table>

  <h2>Opgave</h2>
  <div class="context">${context}</div>
  <p class="var-info">
    <strong>X1</strong> = ${x1name} (verklarende) &emsp;
    <strong>X2</strong> = ${x2name} (verklarende) &emsp;
    <strong>Y</strong> = ${yname} (afhankelijke)
  </p>

  <h2>Tabel 1 — ${state.crossTab.sc.rowLabel} × ${state.crossTab.sc.colLabel}</h2>
  <table class="data-table">
    <thead><tr><th>${state.crossTab.sc.rowLabel}</th><th>${state.crossTab.sc.colNo}</th><th>${state.crossTab.sc.colYes}</th></tr></thead>
    <tbody>
      <tr><td>${state.crossTab.sc.rows[0]}</td><td>${state.crossTab.r1no.toLocaleString('nl-BE')}</td><td>${state.crossTab.r1yes.toLocaleString('nl-BE')}</td></tr>
      <tr><td>${state.crossTab.sc.rows[1]}</td><td>${state.crossTab.r2no.toLocaleString('nl-BE')}</td><td>${state.crossTab.r2yes.toLocaleString('nl-BE')}</td></tr>
    </tbody>
  </table>

  <h2>Tabel 2 — Dataset voor regressie en correlatie</h2>
  <table class="data-table">
    <thead><tr><th>Respondent</th><th>${x1name}</th><th>${x2name}</th><th>${yname}</th><th>${bname}</th></tr></thead>
    <tbody>${dsRows}</tbody>
  </table>

  <div class="keep-together">
    <h2>Figuur 1 — Padmodel: ${pathTitle}</h2>
    <div class="print-path">${pathFigureSvg}</div>
  </div>

  <h2 class="break-before">Meerkeuzevragen (${mcqCount} vragen)</h2>
  <p style="font-size:10pt;margin:0 0 10pt"><em>Omcirkel telkens het gevraagde aantal antwoorden (1 of 2) per vraag.</em></p>
  ${mcqPrint}

  <h2 class="break-before">Antwoordformulier — Open vragen</h2>
  <table class="ans-table">
    <thead><tr><th>Onderdeel</th><th>Jouw antwoord</th></tr></thead>
    <tbody>${ansRowsPrint}</tbody>
  </table>

</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
}

function openDatasetInNewWindow() {
  const x1name = document.querySelector('.var-x1-name')?.textContent || 'X1';
  const x2name = document.querySelector('.var-x2-name')?.textContent || 'X2';
  const yname = document.querySelector('.var-y-name')?.textContent || 'Y';
  const bname = document.getElementById('th-bin')?.textContent || 'Groep';
  const seedUsed = document.getElementById('seed-used')?.textContent || '-';
  const context = document.getElementById('scenario-text')?.textContent || '';
  const dsRows = Array.from(document.querySelectorAll('#dataset-body tr')).map((tr) => tr.outerHTML).join('');
  const pathTitle = state.pathModel?.scenario?.title || 'Padmodel';
  const pathFigureSvg = document.querySelector('#deel-path svg')?.outerHTML || '';

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="nl"><head>
  <meta charset="UTF-8"/>
  <title>Bijlage datasets</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; color: #133e87; }
    h2 { font-size: 15px; margin: 0 0 8px; color: #133e87; }
    p { margin: 4px 0 10px; line-height: 1.45; }
    .meta { color: #475569; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .panel { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; }
    th { background: #e9f0ff; color: #133e87; }
    .path-wrap svg { width: 100%; height: auto; }
    .path-wrap .node { fill: #eef4ff; stroke: #1d4ed8; stroke-width: 1.4; }
    .path-wrap .node-y { fill: #dbeafe; }
    .path-wrap .node-main { font-size: 15px; fill: #0f172a; font-weight: 700; }
    .path-wrap .node-sub { font-size: 12px; fill: #0f172a; }
    .path-wrap .edge { stroke: #1d4ed8; stroke-width: 2; fill: none; }
    .path-wrap .edge-dashed { stroke-dasharray: 6 5; }
    .path-wrap .edge-label { fill: #1d4ed8; font-size: 13px; font-weight: 700; }
    .path-wrap marker polygon { fill: #1d4ed8; }
    @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head><body>
  <h1>Bijlage datasets</h1>
  <p class="meta"><strong>Datasetcode:</strong> ${seedUsed}</p>
  <p>${context}</p>
  <div class="grid">
    <section class="panel">
      <h2>Tabel 1 — ${state.crossTab.sc.rowLabel} × ${state.crossTab.sc.colLabel}</h2>
      <table>
        <thead><tr><th>${state.crossTab.sc.rowLabel}</th><th>${state.crossTab.sc.colNo}</th><th>${state.crossTab.sc.colYes}</th></tr></thead>
        <tbody>
          <tr><td>${state.crossTab.sc.rows[0]}</td><td>${state.crossTab.r1no.toLocaleString('nl-BE')}</td><td>${state.crossTab.r1yes.toLocaleString('nl-BE')}</td></tr>
          <tr><td>${state.crossTab.sc.rows[1]}</td><td>${state.crossTab.r2no.toLocaleString('nl-BE')}</td><td>${state.crossTab.r2yes.toLocaleString('nl-BE')}</td></tr>
        </tbody>
      </table>
    </section>
    <section class="panel">
      <h2>Tabel 2 — Dataset voor regressie en correlatie</h2>
      <table>
        <thead><tr><th>Respondent</th><th>${x1name}</th><th>${x2name}</th><th>${yname}</th><th>${bname}</th></tr></thead>
        <tbody>${dsRows}</tbody>
      </table>
    </section>
    <section class="panel">
      <h2>Figuur 1 — Padmodel (${pathTitle})</h2>
      <div class="path-wrap">${pathFigureSvg}</div>
    </section>
  </div>
</body></html>`);
  win.document.close();
}

function setSectionCollapsed(section, collapsed) {
  const btn = section.querySelector('.section-toggle');
  const body = section.querySelector('.section-body');
  if (!btn || !body) return;
  section.classList.toggle('is-collapsed', collapsed);
  btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  btn.textContent = collapsed ? 'Uitklappen' : 'Inklappen';
}

function initSectionNavigation() {
  const main = document.querySelector('.main');
  if (!main) return;

  const sections = Array.from(main.querySelectorAll(':scope > section.card'))
    .filter((s) => !s.classList.contains('hero'));
  if (!sections.length) return;

  sections.forEach((section, idx) => {
    const h3 = section.querySelector(':scope > h3');
    const title = (h3?.textContent || '').trim();
    if (!section.id) {
      if (title.toUpperCase() === 'OPGAVE') section.id = 'deel-opgave';
      else if (title.toLowerCase().includes('formule')) section.id = 'deel-formules';
      else section.id = `deel-${idx + 1}`;
    }
  });

  sections.forEach((section) => {
    const h3 = section.querySelector(':scope > h3');
    if (!h3 || section.dataset.collapsibleInit === '1') return;

    const header = document.createElement('div');
    header.className = 'section-head';
    section.insertBefore(header, h3);
    header.appendChild(h3);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'section-toggle';
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.textContent = 'Inklappen';
    header.appendChild(toggleBtn);

    const body = document.createElement('div');
    body.className = 'section-body';
    Array.from(section.children).forEach((child) => {
      if (child !== header) body.appendChild(child);
    });
    section.appendChild(body);

    body.querySelectorAll('.move-to-section-head').forEach((el) => {
      header.insertBefore(el, toggleBtn);
    });

    section.dataset.collapsibleInit = '1';

    toggleBtn.addEventListener('click', () => {
      setSectionCollapsed(section, !section.classList.contains('is-collapsed'));
    });
  });
}

function bindEvents() {
  const seedEl = document.getElementById('seed');
  document.getElementById('btn-generate').addEventListener('click', () => generate(false));
  document.getElementById('btn-random').addEventListener('click', () => generate(true));
  document.getElementById('btn-reset-answers').addEventListener('click', resetAnswers);
  document.getElementById('btn-print').addEventListener('click', printQuestionPaper);
  document.getElementById('btn-open-dataset-window')?.addEventListener('click', openDatasetInNewWindow);
  document.querySelectorAll('.nav-list a[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      const card = target.closest('.card');
      if (card && card.classList.contains('is-collapsed')) setSectionCollapsed(card, false);
    });
  });
  document.getElementById('scenario').addEventListener('change', () => generate(false));
  if (seedEl) {
    const markManual = () => {
      seedEl.dataset.seedManual = '1';
      seedEl.dataset.nextRandom = '0';
    };
    seedEl.addEventListener('input', markManual);
    seedEl.addEventListener('change', markManual);
  }
  document.querySelectorAll('.answer-table input:not(.no-eval), .answer-table textarea, .answer-table select.blank-select').forEach((el) => {
    el.addEventListener('input', debounce(() => checkOpenAnswers(false), 300));
    el.addEventListener('change', () => checkOpenAnswers(true));
  });
  // Mirror student-typed b values into interpretation sentence spans
  const mirrorAbs = (inputId, spanId) => {
    const input = document.getElementById(inputId);
    const span = document.getElementById(spanId);
    if (!input || !span) return;
    const update = () => {
      const v = parseFloat(String(input.value).replace(',', '.'));
      span.textContent = Number.isFinite(v) ? fmt2(Math.abs(v)) : '___';
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  };
  mirrorAbs('ans-bivar-b', 'lbl-bivar-b-abs');
  mirrorAbs('ans-multi-b1', 'lbl-multi-b1-abs');
  mirrorAbs('ans-multi-b2', 'lbl-multi-b2-abs');
  document.querySelector('.answer-table')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('blank-select')) {
      const container = e.target.closest('.sentence-blank');
      if (container) updateSentencePreview(container);
    }
  });
}

function initResizeHandle() {
  const handle = document.getElementById('resize-handle');
  const layout = document.querySelector('.layout');
  if (!handle || !layout) return;

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;
  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(layout).getPropertyValue('--sidebar-width') || '320', 10);
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (e.clientX - startX)));
    layout.style.setProperty('--sidebar-width', `${newWidth}px`);
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

function init() {
  initSectionNavigation();
  initResizeHandle();
  populateScenarioSelect();
  bindEvents();
  const seedEl = document.getElementById('seed');
  if (seedEl) {
    seedEl.value = String(nextRandomSeed());
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  generate(false);
}

document.addEventListener('DOMContentLoaded', init);

// ── Print: inject visible ○/●/□/☑ indicators, remove after ──────────────────
function injectPrintIndicators() {
  document.querySelectorAll('.mcq-option').forEach((label) => {
    const input = label.querySelector('input');
    if (!input) return;
    const isCheckbox = input.type === 'checkbox';
    const isChecked = input.checked;
    const symbol = isCheckbox
      ? (isChecked ? '\u2611' : '\u25A1')  // ☑ or □
      : (isChecked ? '\u25CF' : '\u25CB'); // ● or ○
    const span = document.createElement('span');
    span.className = 'print-indicator';
    span.textContent = symbol;
    label.insertBefore(span, label.firstChild);
  });
}

function removePrintIndicators() {
  document.querySelectorAll('.print-indicator').forEach((el) => el.remove());
}

window.addEventListener('beforeprint', injectPrintIndicators);
window.addEventListener('afterprint', removePrintIndicators);
