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

const OPEN_PROMPT_TEMPLATES = [
  'Werk de interpretatie uit met duidelijke ceteris paribus-bewoordingen.',
  'Besteed expliciet aandacht aan het verschil tussen zero-order en partiele samenhang.',
  'Leg uit welk deel van de variatie in Y verklaard is en welk deel onverklaard blijft.',
  'Vergelijk de relatieve sterkte van de predictoren op basis van gestandaardiseerde effecten.'
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
  }
];

const state = {
  scenario: null,
  rows: [],
  seedUsed: null,
  predCase: { x1: 4, x2: 30 },
  stats: null,
  pathModel: null,
  datasetMcqs: [],
  generalMcqs: []
};

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
  while (attempt < 80) {
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
    const valid = sd(x1) > 0 && sd(x2) > 0 && sd(y) > 0 && Math.abs(correlation(x1, x2)) < 0.98 && multi && g0 >= 2 && g1 >= 2;
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
    ptxt.textContent = `Dataset 2 (${scenario.title}): gebruik dit padmodel voor vragen over exogene/endogene variabelen, indirecte effecten en totale effecten.`;
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
  setText('pm-r2', `R^2=${fmt2(r2y)}`);

  const rows = [
    ['a', `${nodes.xa} -> ${nodes.m1}`, fmt2(coeffs.a)],
    ['b', `${nodes.xa} -> ${nodes.xb}`, fmt2(coeffs.b)],
    ['c', `${nodes.xb} -> ${nodes.m2}`, fmt2(coeffs.c)],
    ['d', `${nodes.m1} -> ${nodes.m2}`, fmt2(coeffs.d)],
    ['e', `${nodes.m1} -> ${nodes.y}`, fmt2(coeffs.e)],
    ['f', `${nodes.m2} -> ${nodes.y}`, fmt2(coeffs.f)],
    ['corr', `Correlatie ${nodes.m1} en ${nodes.m2}`, fmt2(corrM1M2)],
    ['R^2', `Verklaarde variantie in ${nodes.y}`, `${fmt2(r2y)} (${fmt2(r2y * 100)}%)`],
    ['1-R^2', `Onverklaarde variantie in ${nodes.y}`, `${fmt2(unexplained)} (${fmt2(unexplained * 100)}%)`],
    ['tot', `Totaal effect ${nodes.xa} op ${nodes.y}`, fmt4(effects.xaTotal)]
  ];

  const tbody = document.getElementById('path-table-body');
  if (!tbody) return;
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r[0]}</td>
      <td>${r[1]}</td>
      <td>${r[2]}</td>
    </tr>
  `).join('');
}

function createMcq(id, question, options, correctIndex, feedbacks) {
  return { id, question, options, correctIndex, feedbacks };
}

function shuffleMcqOptions(mcq, rng) {
  const idx = mcq.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }

  const shuffledOptions = idx.map((i) => mcq.options[i]);
  const shuffledFeedbacks = idx.map((i) => mcq.feedbacks[i]);
  const newCorrectIndex = idx.indexOf(mcq.correctIndex);

  return {
    ...mcq,
    options: shuffledOptions,
    feedbacks: shuffledFeedbacks,
    correctIndex: newCorrectIndex
  };
}

function shuffleMcqList(mcqs, rng) {
  return mcqs.map((m) => shuffleMcqOptions(m, rng));
}

function buildDatasetMcqs(sc, stats, pathModel) {
  const partialTrend = Math.abs(stats.partial1) < Math.abs(stats.bivar.r) ? 'gedaald' : 'gestegen';
  const strongest = Math.abs(stats.beta1) >= Math.abs(stats.beta2) ? sc.vars.x1.name : sc.vars.x2.name;
  const dir12 = stats.rx1x2 >= 0 ? 'positieve' : 'negatieve';
  const pm = pathModel || buildPathModel(state.seedUsed || 1);
  const pmNodes = pm.scenario.nodes;
  const pmEffects = pm.effects;

  return [
    createMcq(
      'q1',
      'Welke waarde benadert de multiple correlatiecoefficient R het best?',
      [`R = ${fmt2(Math.sqrt(Math.max(0, stats.multi.r2)))}`, `R = ${fmt2(stats.multi.r2)}`, `R = ${fmt2(1 - stats.multi.r2)}`, `R = ${fmt2(Math.abs(stats.rx1x2))}`],
      0,
      [
        'R is de wortel van R^2 en geeft de correlatie tussen geobserveerde en voorspelde Y.',
        'Dit is R^2, niet R.',
        'Dit is de onverklaarde proportie, niet R.',
        'Dit is de correlatie tussen de predictoren, niet de multiple R.'
      ]
    ),
    createMcq(
      'q2',
      `Hoeveel procent van de variatie in ${sc.vars.y.name} kan niet verklaard worden door het meervoudige model?`,
      [`${fmt2(stats.unexplained * 100)}%`, `${fmt2(stats.multi.r2 * 100)}%`, `${fmt2(Math.abs(stats.rx1x2) * 100)}%`, `${fmt2((1 - Math.sqrt(Math.max(0, stats.multi.r2))) * 100)}%`],
      0,
      [
        'Onverklaarde variantie = 1 - R^2.',
        'Dit is de verklaarde variantie (R^2).',
        'Dit is een correlatie-interpretatie, geen onverklaarde variantie.',
        'Deze omzetting gebruikt niet de juiste definitie van onverklaarde variantie.'
      ]
    ),
    createMcq(
      'q3',
      `Welke uitspraak over b1 (voor ${sc.vars.x1.name}) is statistisch correct?`,
      [
        `Als ${sc.vars.x1.name} met 1 stijgt, verandert de verwachte ${sc.vars.y.name} met ${fmt2(stats.multi.b1)}, onder controle van ${sc.vars.x2.name}.`,
        `Als ${sc.vars.x1.name} met 1 stijgt, verandert ${sc.vars.x2.name} met ${fmt2(stats.multi.b1)}.`,
        `b1 is gelijk aan de correlatie tussen ${sc.vars.x1.name} en ${sc.vars.y.name}.`,
        'b1 is enkel interpreteerbaar als b2 exact nul is.'
      ],
      0,
      [
        'Correct: dit is de ceteris paribus-interpretatie van b1.',
        'Dit verwart regressiecoefficienten met onderlinge predictorrelaties.',
        'b1 is een netto-effect, geen correlatiecoefficient.',
        'b1 blijft interpreteerbaar zolang de modelaannames redelijk zijn.'
      ]
    ),
    createMcq(
      'q4',
      `Welke predictor heeft het sterkste relatieve effect op ${sc.vars.y.name} (op basis van |gestandaardiseerde beta|)?`,
      [`${strongest}`, `${strongest === sc.vars.x1.name ? sc.vars.x2.name : sc.vars.x1.name}`, 'Beide exact even sterk', 'Dit kan niet bepaald worden uit regressie-uitvoer'],
      0,
      [
        'Correct: vergelijk absolute gestandaardiseerde beta-waarden.',
        'Deze predictor heeft een kleinere absolute gestandaardiseerde impact.',
        'De absolute beta-waarden zijn niet exact gelijk.',
        'Met gestandaardiseerde beta kan dit juist wel bepaald worden.'
      ]
    ),
    createMcq(
      'q5',
      `Wat is de verwachte ${sc.vars.y.name} voor X1=${state.predCase.x1} en X2=${state.predCase.x2}?`,
      [`${fmt2(stats.pred)}`, `${fmt2(stats.pred + 4)}`, `${fmt2(stats.pred - 4)}`, `${fmt2(stats.multi.a)}`],
      0,
      [
        'Correct ingevuld via Yhat = a + b1*X1 + b2*X2.',
        'Controleer de substitutie in de regressievergelijking.',
        'Controleer de substitutie in de regressievergelijking.',
        'Dit is enkel het intercept (X1=X2=0).'
      ]
    ),
    createMcq(
      'q6',
      `Wat gebeurt er met r(${sc.vars.x1.name}, ${sc.vars.y.name}) wanneer je controleert voor ${sc.vars.x2.name}?`,
      [
        `De samenhang is ${partialTrend}: van ${fmt2(stats.bivar.r)} naar ${fmt2(stats.partial1)}.`,
        `De samenhang blijft exact gelijk: ${fmt2(stats.bivar.r)}.`,
        'De samenhang wordt per definitie nul.',
        'De samenhang wordt per definitie 1.'
      ],
      0,
      [
        'Correct: partiele correlatie kan dalen of stijgen ten opzichte van zero-order.',
        'Controle verandert meestal wel de samenhang.',
        'Partiele correlatie is niet per definitie nul.',
        'Partiele correlatie is niet per definitie 1.'
      ]
    ),
    createMcq(
      'q7',
      `Welke uitspraak over r(${sc.vars.x1.name}, ${sc.vars.x2.name}) is het meest correct?`,
      [
        `Er is een ${dir12} lineaire samenhang (r=${fmt2(stats.rx1x2)}).`,
        `r=${fmt2(stats.rx1x2)} betekent noodzakelijk causaliteit.`,
        `r=${fmt2(stats.rx1x2)} is gelijk aan R^2 van het meervoudig model.`,
        `r=${fmt2(stats.rx1x2)} betekent dat er geen lineaire samenhang is.`
      ],
      0,
      [
        'Correct: r beschrijft richting en sterkte van lineaire samenhang.',
        'Correlatie impliceert geen causaliteit.',
        'r(X1,X2) is niet hetzelfde als R^2 van het model.',
        'r dicht bij nul wijst op zwakke lineaire samenhang; hier is dat niet het geval.'
      ]
    ),
    createMcq(
      'q8',
      `In de bivariate regressie van ${sc.vars.y.name} op ${sc.vars.x1.name}: hoeveel procent variantie wordt verklaard?`,
      [`${fmt2(stats.bivar.r2 * 100)}%`, `${fmt2((1 - stats.bivar.r2) * 100)}%`, `${fmt2(Math.abs(stats.bivar.r) * 100)}%`, `${fmt2(stats.multi.r2 * 100)}%`],
      0,
      [
        'Correct: verklaarde variantie in bivariate regressie is R^2 = r^2.',
        'Dit is juist de onverklaarde variantie.',
        'De absolute correlatie is geen percentage verklaarde variantie.',
        'Dit percentage hoort bij het meervoudige model, niet het bivariate model.'
      ]
    ),
    createMcq(
      'q9',
      `In het padmodel (Dataset 2): welke variabele is exogeen?`,
      [pmNodes.xa, pmNodes.xb, pmNodes.m2, pmNodes.y],
      0,
      [
        `Correct: ${pmNodes.xa} heeft in dit model geen inkomende pijlen.`,
        `${pmNodes.xb} wordt verklaard door ${pmNodes.xa} en is dus endogeen.`,
        `${pmNodes.m2} wordt verklaard door meerdere variabelen en is endogeen.`,
        `${pmNodes.y} is de uitkomstvariabele en dus endogeen.`
      ]
    ),
    createMcq(
      'q10',
      `In het padmodel (Dataset 2): hoeveel procent van de variatie in ${pmNodes.y} blijft onverklaard?`,
      [`${fmt2(pm.unexplained * 100)}%`, `${fmt2(pm.r2y * 100)}%`, `${fmt2((1 - pm.unexplained) * 10)}%`, `${fmt2(pm.r2y)}%`],
      0,
      [
        'Correct: onverklaarde variantie = 1 - R^2.',
        'Dit is de verklaarde variantie, niet de onverklaarde.',
        'Deze omzetting gebruikt een foutieve schaal.',
        'Dit leest R^2 fout als percentage.'
      ]
    ),
    createMcq(
      'q11',
      `In het padmodel (Dataset 2): wat is het totale effect van ${pmNodes.xa} op ${pmNodes.y}?`,
      [
        `${fmt4(pmEffects.xaTotal)}`,
        `${fmt4(pmEffects.xaViaM1)}`,
        `${fmt4(pmEffects.xaViaM1M2)}`,
        `${fmt4(pmEffects.xaViaXbM2)}`
      ],
      0,
      [
        `Correct: totaal effect = a*e + a*d*f + b*c*f = ${fmt4(pmEffects.xaTotal)}.`,
        'Dit is slechts 1 indirect pad (via M1).',
        'Dit is slechts 1 indirect pad (via M1 en M2).',
        'Dit is slechts 1 indirect pad (via Xb en M2).'
      ]
    )
  ];
}

function buildGeneralMcqs() {
  return [
    createMcq(
      'q12',
      'Als het betrouwbaarheidsniveau stijgt (bij gelijke n en sigma), wat gebeurt er met de foutenmarge?',
      ['De foutenmarge neemt toe.', 'De foutenmarge neemt af.', 'De foutenmarge blijft exact gelijk.', 'Dit kan enkel bepaald worden met een ANOVA-tabel.'],
      0,
      [
        'Correct: hogere betrouwbaarheid vereist een bredere marge.',
        'Dit geldt net omgekeerd.',
        'De foutenmarge hangt mee af van het gekozen betrouwbaarheidsniveau.',
        'ANOVA is hiervoor niet nodig.'
      ]
    ),
    createMcq(
      'q13',
      'Welke combinatie is correct voor Type-I en Type-II fout?',
      [
        'Type-I: onterecht H0 verwerpen. Type-II: H0 onterecht behouden.',
        'Type-I: H0 onterecht behouden. Type-II: onterecht H0 verwerpen.',
        'Type-I en Type-II betekenen exact hetzelfde.',
        'Type-I en Type-II bestaan niet bij regressie.'
      ],
      0,
      [
        'Correcte definities van beide fouttypes.',
        'Deze definities zijn omgewisseld.',
        'Type-I en Type-II zijn verschillende fouttypes.',
        'Beide fouten bestaan in alle hypothesetoetsen, ook in regressiecontext.'
      ]
    ),
    createMcq(
      'q14',
      'Welke uitspraak beschrijft een interactie-effect het best?',
      [
        'Het effect van X op Y hangt af van het niveau van een derde variabele Z.',
        'X beinvloedt Z, en Z beinvloedt Y, dus er is altijd interactie.',
        'Interactie betekent dat er per definitie geen hoofdeffecten zijn.',
        'Interactie kan enkel bij nominale variabelen.'
      ],
      0,
      [
        'Correct: interactie betekent conditioneel effect van X op Y afhankelijk van Z.',
        'Dit beschrijft eerder mediatie dan interactie.',
        'Hoofdeffecten kunnen naast interactie bestaan.',
        'Interactie kan ook met metrische variabelen via producttermen.'
      ]
    ),
    createMcq(
      'q15',
      'Wat betekent het begrip vrijheidsgraden in statistische berekeningen?',
      [
        'Het aantal onderling onafhankelijke informatie-eenheden dat vrij kan varieren.',
        'Het aantal variabelen in de dataset.',
        'Het aantal respondenten minus 1 ongeacht de analyse.',
        'Het aantal significante regressiecoefficienten.'
      ],
      0,
      [
        'Correcte conceptuele definitie van vrijheidsgraden.',
        'Dit is geen definitie van vrijheidsgraden.',
        'n-1 geldt enkel in specifieke situaties, niet algemeen.',
        'Significantie bepaalt de vrijheidsgraden niet.'
      ]
    ),
    createMcq(
      'q16',
      'Kan een niet-significante predictor toch nuttig zijn in een model?',
      [
        'Ja, afhankelijk van theorie, controlefunctie of modeldoel.',
        'Nee, die predictor moet altijd meteen verwijderd worden.',
        'Nee, want niet-significant betekent altijd meetfout.',
        'Ja, maar alleen als de predictor nominaal is.'
      ],
      0,
      [
        'Correct: interpretatie hangt af van theorie, design en modeldoel.',
        'Automatisch verwijderen is methodologisch vaak te simplistisch.',
        'Niet-significant is niet hetzelfde als meetfout.',
        'Dit is te restrictief; bruikbaarheid hangt niet af van meetniveau alleen.'
      ]
    )
  ];
}

function renderMcqList(containerId, items, prefix, startAt) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = items.map((item, idx) => {
    const qNum = startAt + idx;
    const radios = item.options.map((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      return `
        <label class="mcq-option">
          <input type="radio" name="${prefix}-${item.id}" value="${oIdx}" />
          <span><strong>${letter}.</strong> ${opt}</span>
        </label>
      `;
    }).join('');

    return `
      <article class="mcq-item" id="mcq-item-${prefix}-${item.id}">
        <p class="mcq-title">${qNum}. ${item.question}</p>
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

function evaluateMcqItem(prefix, item) {
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
  if (isCorrect) {
    itemBox.classList.add('ok');
    fb.className = 'mcq-feedback ok';
    fb.textContent = `Juist. ${item.feedbacks[sel]}`;
    return { answered: true, correct: true };
  }

  itemBox.classList.add('err');
  fb.className = 'mcq-feedback err';
  fb.textContent = `Fout. ${item.feedbacks[sel]} Denk aan de definities en de stappen in de formule.`;
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

  document.querySelectorAll('.var-x1-name').forEach((el) => { el.textContent = x1Text; });
  document.querySelectorAll('.var-x2-name').forEach((el) => { el.textContent = x2Text; });
  document.querySelectorAll('.var-y-name').forEach((el) => { el.textContent = yText; });

  document.getElementById('th-x1').textContent = x1Text;
  document.getElementById('th-x2').textContent = x2Text;
  document.getElementById('th-y').textContent = yText;
  document.getElementById('th-bin').textContent = sc.bin.name;

  document.getElementById('model-x1-name').textContent = sc.vars.x1.name;
  document.getElementById('model-x2-name').textContent = sc.vars.x2.name;
  document.getElementById('model-y-name').textContent = sc.vars.y.name;

  const opgaveX1 = document.getElementById('opgave-x1-name');
  const opgaveX2 = document.getElementById('opgave-x2-name');
  const opgaveY = document.getElementById('opgave-y-name');
  if (opgaveX1) opgaveX1.textContent = sc.vars.x1.name;
  if (opgaveX2) opgaveX2.textContent = sc.vars.x2.name;
  if (opgaveY) opgaveY.textContent = sc.vars.y.name;
}

function renderScenarioText(sc) {
  document.getElementById('scenario-text').textContent =
    `Een criminoloog onderzoekt welke factoren een invloed hebben op ${sc.vars.y.name.toLowerCase()}. ` +
    `${sc.vignette}`;
}

function updateConceptModelValues(stats) {
  document.getElementById('model-b1-label').textContent = `b1 = ${fmt2(stats.multi.b1)}`;
  document.getElementById('model-b2-label').textContent = `b2 = ${fmt2(stats.multi.b2)}`;
  document.getElementById('model-r-label').textContent = `r = ${fmt2(stats.rx1x2)}`;
  document.getElementById('model-r2-label').textContent = `R^2 = ${fmt2(stats.multi.r2)}`;
}

function renderOpenQuestionContext(sc, stats, seedUsed) {
  const rng = mulberry32((safeSeed(seedUsed) || 1) + 991);
  const template = OPEN_PROMPT_TEMPLATES[Math.floor(rng() * OPEN_PROMPT_TEMPLATES.length)];
  const txt = [
    `Datasetvariant ${seedUsed}: ${template}`,
    `Voor deze dataset geldt r(X1,X2)=${fmt2(stats.rx1x2)} en R^2=${fmt2(stats.multi.r2)}.`,
    `Werk je interpretatie inhoudelijk uit binnen de context van ${sc.title.toLowerCase()}.`
  ].join(' ');
  document.getElementById('open-question-context').textContent = txt;
}

function renderDataset(rows) {
  const tbody = document.getElementById('dataset-body');
  tbody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.respondent}</td>
      <td>${row.x1}</td>
      <td>${row.x2}</td>
      <td>${row.y}</td>
      <td>${row.binLabel}</td>
    </tr>
  `).join('');
}

function updatePredictionQuestion() {
  document.getElementById('pred-question').textContent =
    `Bereken Yhat voor X1 = ${state.predCase.x1} en X2 = ${state.predCase.x2}`;
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

function resetAnswers() {
  document.querySelectorAll('.answer-table input, .answer-table textarea').forEach((el) => {
    el.value = '';
    el.classList.remove('correct', 'incorrect');
  });
  document.querySelectorAll('.ans-feedback').forEach((fb) => {
    fb.className = 'ans-feedback';
    fb.textContent = 'Nog niet nagekeken.';
  });
  document.querySelectorAll('.mcq-list input[type="radio"]').forEach((el) => { el.checked = false; });
  document.querySelectorAll('.mcq-item').forEach((el) => el.classList.remove('ok', 'err'));
  document.querySelectorAll('.mcq-feedback').forEach((fb) => {
    fb.className = 'mcq-feedback';
    fb.textContent = 'Nog niet nagekeken.';
  });
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

function checkOpenAnswers() {
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
    result: numericFeedback(document.getElementById('ans-bivar-r2').value, st.bivar.r2, 'gebruik R^2 = r^2 in bivariate regressie.')
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
    result: numericFeedback(document.getElementById('ans-multi-r2').value, st.multi.r2, 'gebruik R^2 = 1 - SSE/SST.')
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

  const dirBivar = st.bivar.b >= 0 ? ['stijgt', 'neemt toe', 'hoger'] : ['daalt', 'neemt af', 'lager'];
  const dirB1 = st.multi.b1 >= 0 ? ['stijgt', 'neemt toe', 'hoger'] : ['daalt', 'neemt af', 'lager'];
  const dirB2 = st.multi.b2 >= 0 ? ['stijgt', 'neemt toe', 'hoger'] : ['daalt', 'neemt af', 'lager'];
  const dirR12 = st.rx1x2 >= 0 ? ['positief'] : ['negatief'];

  checks.push({
    id: 'ans-bivar-b-int',
    result: textFeedbackForGroups(document.getElementById('ans-bivar-b-int').value, [
      { label: `${sc.vars.x1.name} expliciet noemen`, keys: [normalizeText(sc.vars.x1.name), 'x1'] },
      { label: `${sc.vars.y.name} expliciet noemen`, keys: [normalizeText(sc.vars.y.name), 'y'] },
      { label: '1-eenheidstoename noemen', keys: ['met 1', '1 eenheid', 'toename met 1'] },
      { label: 'richting van effect benoemen', keys: dirBivar },
      { label: 'verwachte waarde-taal gebruiken', keys: ['verwachte', 'voorspelde'] }
    ], 'Correct: volledige bivariate b-interpretatie.')
  });

  checks.push({
    id: 'ans-bivar-r2-int',
    result: textFeedbackForGroups(document.getElementById('ans-bivar-r2-int').value, [
      { label: 'variantie/proportie noemen', keys: ['variantie', 'proportie', 'percentage'] },
      { label: 'verklaard noemen', keys: ['verklaard', 'uitleggen'] },
      { label: `${sc.vars.y.name} noemen`, keys: [normalizeText(sc.vars.y.name), 'y'] },
      { label: `${sc.vars.x1.name} noemen`, keys: [normalizeText(sc.vars.x1.name), 'x1'] }
    ], 'Correct: R^2 geeft de verklaarde variantie van Y door X1 in het bivariate model.')
  });

  checks.push({
    id: 'ans-multi-b1-int',
    result: textFeedbackForGroups(document.getElementById('ans-multi-b1-int').value, [
      { label: `${sc.vars.x1.name} noemen`, keys: [normalizeText(sc.vars.x1.name), 'x1'] },
      { label: `${sc.vars.y.name} noemen`, keys: [normalizeText(sc.vars.y.name), 'y'] },
      { label: '1-eenheidstoename noemen', keys: ['met 1', '1 eenheid', 'toename met 1'] },
      { label: `controle voor ${sc.vars.x2.name} noemen`, keys: ['onder controle', 'ceteris paribus', normalizeText(sc.vars.x2.name)] },
      { label: 'richting van effect benoemen', keys: dirB1 }
    ], 'Correct: volledige ceteris paribus-interpretatie van b1.')
  });

  checks.push({
    id: 'ans-multi-b2-int',
    result: textFeedbackForGroups(document.getElementById('ans-multi-b2-int').value, [
      { label: `${sc.vars.x2.name} noemen`, keys: [normalizeText(sc.vars.x2.name), 'x2'] },
      { label: `${sc.vars.y.name} noemen`, keys: [normalizeText(sc.vars.y.name), 'y'] },
      { label: '1-eenheidstoename noemen', keys: ['met 1', '1 eenheid', 'toename met 1'] },
      { label: `controle voor ${sc.vars.x1.name} noemen`, keys: ['onder controle', 'ceteris paribus', normalizeText(sc.vars.x1.name)] },
      { label: 'richting van effect benoemen', keys: dirB2 }
    ], 'Correct: volledige ceteris paribus-interpretatie van b2.')
  });

  checks.push({
    id: 'ans-multi-r2-int',
    result: textFeedbackForGroups(document.getElementById('ans-multi-r2-int').value, [
      { label: 'variantie/proportie noemen', keys: ['variantie', 'proportie', 'percentage'] },
      { label: 'verklaard noemen', keys: ['verklaard', 'uitleggen'] },
      { label: `${sc.vars.y.name} noemen`, keys: [normalizeText(sc.vars.y.name), 'y'] },
      { label: `${sc.vars.x1.name} en ${sc.vars.x2.name} samen noemen`, keys: [normalizeText(sc.vars.x1.name), normalizeText(sc.vars.x2.name), 'samen'] }
    ], 'Correct: R^2 in meervoudige regressie is de verklaarde variantie in Y door X1 en X2 samen.')
  });

  checks.push({
    id: 'ans-rx1x2-int',
    result: textFeedbackForGroups(document.getElementById('ans-rx1x2-int').value, [
      { label: 'samenhang/correlatie noemen', keys: ['samenhang', 'correlatie', 'verband'] },
      { label: 'richting noemen', keys: dirR12 },
      { label: `${sc.vars.x1.name} noemen`, keys: [normalizeText(sc.vars.x1.name), 'x1'] },
      { label: `${sc.vars.x2.name} noemen`, keys: [normalizeText(sc.vars.x2.name), 'x2'] }
    ], 'Correct: interpretatie van de correlatie tussen de predictoren.')
  });

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
        ? { state: 'ok', msg: 'Correct: dit verwijst naar homoscedasticiteit (constante variantie).' }
        : { state: 'err', msg: 'Fout: gezochte term is homoscedasticiteit (constante variantie van de foutentermen).' })
  });

  let okCount = 0;
  let partialCount = 0;
  let pendingCount = 0;
  checks.forEach((c) => {
    setOpenFieldFeedback(c.id, c.result);
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
}

function generate(randomScenario = false) {
  const sel = document.getElementById('scenario');
  const seedEl = document.getElementById('seed');
  let scenario = SCENARIOS.find((s) => s.id === sel.value) || SCENARIOS[0];

  if (randomScenario) {
    scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    sel.value = scenario.id;
  }

  const made = makeRowsForScenario(scenario, seedEl.value);
  if (!made.rows.length) return;

  state.scenario = scenario;
  state.rows = made.rows;
  state.seedUsed = made.seedUsed;
  state.predCase = pickPredictionCase(made.rows);
  state.stats = computeReferenceStats(made.rows);
  const scenarioOffset = scenario.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  state.pathModel = buildPathModel(made.seedUsed + scenarioOffset);
  const mcqRng = mulberry32(made.seedUsed + scenarioOffset * 97 + 8801);
  state.datasetMcqs = shuffleMcqList(
    buildDatasetMcqs(scenario, state.stats, state.pathModel),
    mcqRng
  );
  state.generalMcqs = shuffleMcqList(
    buildGeneralMcqs(),
    mcqRng
  );

  updateVariableLabels(scenario);
  renderScenarioText(scenario);
  renderDataset(made.rows);
  renderPathModel(state.pathModel);
  updatePredictionQuestion();
  updateConceptModelValues(state.stats);
  renderOpenQuestionContext(scenario, state.stats, made.seedUsed);
  renderMcqList('mcq-dataset-list', state.datasetMcqs, 'dataset', 1);
  renderMcqList('mcq-general-list', state.generalMcqs, 'general', state.datasetMcqs.length + 1);
  ensureOpenFeedbackSlots();

  document.getElementById('seed-used').textContent = String(made.seedUsed);
  seedEl.value = String(made.seedUsed);

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
  const pathRows = Array.from(document.querySelectorAll('#path-table-body tr')).map((tr) => tr.outerHTML).join('');
  const pathTitle = state.pathModel?.scenario?.title || 'Padmodel';
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

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="nl"><head>
  <meta charset="UTF-8"/>
  <title>Vragenblad - Synthese-oefening</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;margin:30px 40px;color:#111}
    h1{font-size:15px;margin-bottom:4px}
    h2{font-size:13px;margin:14px 0 6px}
    .meta{font-size:12px;color:#555;margin-bottom:12px}
    .context{background:#f8f9fc;border-left:3px solid #1a4799;padding:9px 13px;margin-bottom:14px;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #ccc;padding:5px 8px;font-size:12px;vertical-align:top}
    th{background:#1a4799;color:#fff;text-align:left}
    tr.divider-row td:first-child{border-top:2px solid #1a4799;font-weight:700}
    .q{border:1px solid #d5dbe7;padding:8px;margin:0 0 8px}
    .q p{margin:0 0 6px}
    .q ul{margin:0;padding-left:18px}
    .q li{margin:4px 0}
    @media print{@page{margin:15mm 20mm}}
  </style>
</head><body>
  <h1>OPEN EXAMENVRAAG STATISTIEK AJ 2024-2025 1ste zittijd</h1>
  <p class="meta">Datasetcode: ${seedUsed}</p>
  <h2>OPGAVE</h2>
  <div class="context">${context}</div>
  <h2>Tabel 2 - Dataset 1</h2>
  <table>
    <thead><tr><th>Respondent</th><th>${x1name}</th><th>${x2name}</th><th>${yname}</th><th>${bname}</th></tr></thead>
    <tbody>${dsRows}</tbody>
  </table>
  <h2>Figuur 2 - Padmodel (${pathTitle})</h2>
  <table>
    <thead><tr><th>Pad</th><th>Interpretatie</th><th>Waarde</th></tr></thead>
    <tbody>${pathRows}</tbody>
  </table>
  <h2>Meerkeuzevragen</h2>
  ${mcqRows}
  <h2>Open antwoorden</h2>
  <table>
    <thead><tr><th style="width:55%">Onderdeel</th><th>Antwoord</th></tr></thead>
    <tbody>${ansRows}</tbody>
  </table>
</body></html>`);
  win.document.close();
  win.print();
}

function bindEvents() {
  document.getElementById('btn-generate').addEventListener('click', () => generate(false));
  document.getElementById('btn-random').addEventListener('click', () => generate(true));
  document.getElementById('btn-reset-answers').addEventListener('click', resetAnswers);
  document.getElementById('btn-print').addEventListener('click', printQuestionPaper);
  document.getElementById('scenario').addEventListener('change', () => generate(false));
  document.querySelectorAll('.answer-table input:not(.no-eval), .answer-table textarea').forEach((el) => {
    el.addEventListener('input', checkOpenAnswers);
  });
}

function init() {
  populateScenarioSelect();
  bindEvents();
  generate(false);
}

document.addEventListener('DOMContentLoaded', init);

