'use strict';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
    vignette: 'Een stad heeft een preventieprogramma geimplementeerd in verschillende buurten. Onderzoek of een hogere blootstelling samenhangt met lagere inbraakcijfers (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'ProgrammaBlootstelling', unit: '%' }, y: { name: 'InbraakCijfer', unit: 'per 1.000' } },
    gen: { r_target: -0.45 },
    extras: ['PolitieZichtbaarheid', 'BuurtBijeenkomsten', 'HerhaaldSlachtofferschapPercentage', 'StraatVerlichting', 'BuurtPreventie'],
    entity: 'Buurt'
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Straten varieren in aantal voetpatrouille-uren op criminele hotspots. Beoordeel de relatie met het aantal meldingen aan de politie (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'VoetPatrouilleUren', unit: 'uren/week' }, y: { name: 'MeldingenAanPolitie', unit: 'per week' } },
    gen: { r_target: -0.25 },
    extras: ['GerichtePatrouilles', 'Arrestaties', 'Reactietijd', 'ProactieveControles', 'OpenbareOrdeMeldingen'],
    entity: 'Straat'
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'Ondervraagde bewoners beoordelen fysieke/sociale wanorde en angst voor criminaliteit (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'WanordeIndex', unit: '0-10' }, y: { name: 'AngstScore', unit: '0-100' } },
    gen: { r_target: 0.55 },
    extras: ['OnbeschoftheidIncidenten', 'CollectieveEffectiviteit', 'StraatVerlichting', 'GraffitiMeldingen', 'ZwerfvuilKlachten'],
    entity: 'Buurt'
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'Percepties van procedurale rechtvaardigheid versus vertrouwen in politie per district (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'ProcedureleRechtvaardigheid', unit: '1-7' }, y: { name: 'VertrouwenInPolitie', unit: '1-7' } },
    gen: { r_target: 0.70 },
    extras: ['Eerlijkheid', 'Respect', 'Inspraak', 'Tevredenheid', 'KlachtenPercentage'],
    entity: 'District'
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'Toezichtscores van huishoudens versus slachtofferschapincidenten (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' } },
    gen: { r_target: -0.40 },
    extras: ['SlotKwaliteit', 'BuitenVerlichting', 'AlarmBezit', 'RoutineActiviteiten', 'BekwaamToezicht'],
    entity: 'Huishouden'
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'Impulsiviteit versus agressieve incidenten onder jongeren (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'AgressieveIncidenten', unit: 'schoolmeldingen/trimester' } },
    gen: { r_target: 0.45 },
    extras: ['Zelfbeheersing', 'LeeftijdgenotenAfwijkendGedrag', 'DocentenOndersteuning', 'OuderlijkToezicht', 'SchoolBetrokkenheid'],
    entity: 'Student'
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Begeleiding na vrijlating (in uren per maand) versus een gevalideerde recidiverisicoscore (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'OndersteuningsUren', unit: 'per maand' }, y: { name: 'RecidiveRisico', unit: '0-100' } },
    gen: { r_target: -0.35 },
    extras: ['HuisvestingsOndersteuning', 'WerkgelegenheidsWorkshops', 'IdentiteitsdocumentenHulp', 'DossierContacten', 'VerslavingsBegeleiding'],
    entity: 'Deelnemer'
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'Phishing-trainingsuren versus gesimuleerde klikratio (met controle voor een tweede voorspeller).',
    vars: { x: { name: 'TrainingsUren', unit: 'uren' }, y: { name: 'Klikratio', unit: '%' } },
    gen: { r_target: -0.55 },
    extras: ['QuizScores', 'GesimuleerdeMeldingen', 'BewustzijnsIndex', 'MeldingsTijd', 'BeleidKennis'],
    entity: 'Medewerker'
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
    if (sc?.vars?.x?.name) sc.vars.x.name = humanizeLabel(sc.vars.x.name);
    if (sc?.vars?.y?.name) sc.vars.y.name = humanizeLabel(sc.vars.y.name);
    if (Array.isArray(sc?.extras)) sc.extras = sc.extras.map((v) => humanizeLabel(v));
    if (sc?.entity) sc.entity = humanizeLabel(sc.entity);
  });
}

normalizeScenarioLabels();

const FIELD_GROUPS = {
  means: [
    ['mean_X1', 'Gemiddelde x1'],
    ['mean_X2', 'Gemiddelde x2'],
    ['mean_Y', 'Gemiddelde Y']
  ],
  totals: [
    ['tot_X1_2', 'Sum (x1-xbar1)^2'],
    ['tot_X2_2', 'Sum (x2-xbar2)^2'],
    ['tot_X1X2', 'Sum (x1-xbar1)(x2-xbar2)'],
    ['tot_X1Y', 'Sum (x1-xbar1)(Y-Ybar)'],
    ['tot_X2Y', 'Sum (x2-xbar2)(Y-Ybar)'],
    ['tot_Y2', 'Sum (Y-Ybar)^2 (SST)']
  ],
  varsd: [
    ['var_X1', 'Var(x1)'], ['sd_X1', 'SD(x1)'],
    ['var_X2', 'Var(x2)'], ['sd_X2', 'SD(x2)'],
    ['var_Y', 'Var(Y)'], ['sd_Y', 'SD(Y)']
  ],
  cov: [
    ['cov_x1y', 'Cov(x1,Y)'], ['cov_x2y', 'Cov(x2,Y)'], ['cov_x1x2', 'Cov(x1,x2)']
  ],
  corr: [
    ['r_x1y', 'r_x1y'], ['r_x2y', 'r_x2y'], ['r_x1x2', 'r_x1x2']
  ],
  coef: [
    ['multi_det', 'det'],
    ['multi_b1', 'b1'],
    ['multi_b2', 'b2'],
    ['multi_intercept', 'Intercept a']
  ],
  fit: [
    ['multi_r_squared', 'R2'],
    ['multi_alienation', 'Vervreemdingscoefficient'],
    ['multi_f_stat', 'F-statistiek'],
    ['multi_model_p', 'Model p-waarde']
  ]
};

const FIELD_TRUTH_KEY = {
  mean_X1: 'x1_bar', mean_X2: 'x2_bar', mean_Y: 'y_bar',
  tot_X1_2: 'S11', tot_X2_2: 'S22', tot_X1X2: 'S12', tot_X1Y: 'S1y', tot_X2Y: 'S2y', tot_Y2: 'SST',
  var_X1: 'var_X1', sd_X1: 'sd_X1', var_X2: 'var_X2', sd_X2: 'sd_X2', var_Y: 'var_Y', sd_Y: 'sd_Y',
  cov_x1y: 'cov_x1y', cov_x2y: 'cov_x2y', cov_x1x2: 'cov_x1x2',
  r_x1y: 'r_x1y', r_x2y: 'r_x2y', r_x1x2: 'r_x1x2',
  multi_det: 'det', multi_b1: 'b1', multi_b2: 'b2', multi_intercept: 'intercept',
  multi_r_squared: 'R_squared', multi_alienation: 'alienation', multi_f_stat: 'F_stat', multi_model_p: 'model_p'
};

const REQUIRED_FIELDS = Object.keys(FIELD_TRUTH_KEY);
const CORE_REQUIRED_FIELDS = [
  'mean_X1', 'mean_X2', 'mean_Y',
  'tot_X1_2', 'tot_X2_2', 'tot_X1X2', 'tot_X1Y', 'tot_X2Y', 'tot_Y2',
  'var_X1', 'sd_X1', 'var_X2', 'sd_X2', 'var_Y', 'sd_Y',
  'multi_det', 'multi_b1', 'multi_b2', 'multi_intercept',
  'multi_r_squared', 'multi_alienation', 'multi_f_stat', 'multi_model_p'
];
const CORE_REQUIRED_SET = new Set(CORE_REQUIRED_FIELDS);

const state = {
  scenario: null,
  rows: [],
  names: { x1: '', x2: '', y: '' },
  truth: null,
  predInputs: [],
  unlocked: false,
  charts: { calibration: null, residual: null, predictor: null }
};

function r2(v) { return Math.round(v * 100) / 100; }
function r4(v) { return Math.round(v * 10000) / 10000; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function parseNum(s) {
  if (s == null) return NaN;
  const t = String(s).trim().replace(',', '.');
  if (!t) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function check4(u, t) {
  if (!Number.isFinite(u) || !Number.isFinite(t)) return false;
  return r4(u) === r4(t);
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

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sdSample(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const ss = arr.reduce((s, v) => s + (v - m) ** 2, 0);
  return Math.sqrt(ss / (arr.length - 1));
}

function scaleByUnit(z, center, scale) {
  if (!z.length) return [];
  const sd = sdSample(z);
  const mu = mean(z);
  const zz = (!Number.isFinite(sd) || sd === 0) ? z.slice() : z.map(v => (v - mu) / sd);
  return zz.map(v => r4(center + scale * v));
}

function unitParams(unit, type) {
  const u = String(unit || '').toLowerCase();
  if (type === 'x') {
    if (u === '%') return [50, 20];
    if (u === '0-10') return [5, 2.5];
    if (u === '1-7') return [4, 1.2];
    if (u === 'uren' || u === 'uren/week' || u === 'hours' || u === 'hours/week') return [20, 8];
    if (u === 'per maand' || u === 'per month') return [15, 6];
    if (u === 'z-score') return [0, 1];
    return [30, 8];
  }

  if (u === 'per 1.000' || u === 'per 1,000') return [20, 8];
  if (u === 'per week') return [60, 14];
  if (u === '0-100') return [60, 15];
  if (u === '1-7') return [4, 1.2];
  if (u === '%') return [30, 12];
  if (u === 'aantal' || u === 'count') return [6, 3];
  return [60, 12];
}

function clampVector(v, lo, hi) {
  return v.map(x => Math.max(lo, Math.min(hi, x)));
}

function makeScenarioData(sc, nRaw, seedRaw) {
  const n = Math.max(5, Math.min(MAX_SAMPLE_SIZE, Number.isFinite(Number(nRaw)) ? Math.floor(Number(nRaw)) : 10));
  const ss = safeSeed(seedRaw);
  const rng = mulberry32(ss == null ? Math.floor(Math.random() * 1e9) : ss);

  const Xz = Array.from({ length: n }, () => randN(rng));
  const eps = Array.from({ length: n }, () => randN(rng));
  const r = Number(sc.gen.r_target || 0);
  const Yz = Xz.map((v, i) => r * v + Math.sqrt(Math.max(0, 1 - r * r)) * eps[i]);

  let [xCenter, xScale] = unitParams(sc.vars.x.unit, 'x');
  let [yCenter, yScale] = unitParams(sc.vars.y.unit, 'y');

  xCenter += (rng() * 16 - 8);
  xScale *= (0.8 + rng() * 0.6);
  yCenter += (rng() * 16 - 8);
  yScale *= (0.8 + rng() * 0.6);

  let X1 = scaleByUnit(Xz, xCenter, xScale);
  let Y = scaleByUnit(Yz, yCenter, yScale);

  const x1Name = sc.vars.x.name;
  const yName = sc.vars.y.name;
  const x2Name = (sc.extras || []).find(v => v !== x1Name && v !== yName) || 'ControlVar';

  const x1Std = (() => {
    const m = mean(X1);
    const sd = sdSample(X1);
    if (!Number.isFinite(sd) || sd === 0) return X1.map(() => 0);
    return X1.map(v => (v - m) / sd);
  })();

  let X2z = x1Std.map(v => 0.5 * v + Math.sqrt(1 - 0.25) * randN(rng));
  const x2m = mean(X2z);
  const x2sd = sdSample(X2z);
  if (Number.isFinite(x2sd) && x2sd > 0) X2z = X2z.map(v => (v - x2m) / x2sd);
  let X2 = X2z.map(v => clamp(r4(50 + 18 * v), 0, 100));

  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      entity: `${sc.entity || 'Unit'} ${i + 1}`,
      [x1Name]: X1[i],
      [x2Name]: X2[i],
      [yName]: Y[i]
    });
  }

  const keys = [x1Name, x2Name, yName];
  keys.forEach(k => {
    if (/(%|score|risico|ratio|cijfer)/i.test(k)) {
      rows.forEach(rw => { rw[k] = clamp(rw[k], 0, 100); });
    } else if (/(aantal|incidenten|meldingen)/i.test(k)) {
      rows.forEach(rw => { rw[k] = Math.max(0, Math.round(rw[k])); });
    }
  });

  return { rows, names: { x1: x1Name, x2: x2Name, y: yName } };
}

function calcTruth(rows, names) {
  if (!rows.length) return null;

  const X1 = rows.map(r => r2(Number(r[names.x1])));
  const X2 = rows.map(r => r2(Number(r[names.x2])));
  const Y = rows.map(r => r2(Number(r[names.y])));
  const n = Y.length;
  if (n < 3) return null;

  const y_bar = r4(mean(Y));
  const x1_bar = r4(mean(X1));
  const x2_bar = r4(mean(X2));

  const dy = Y.map(v => r4(v - y_bar));
  const dx1 = X1.map(v => r4(v - x1_bar));
  const dx2 = X2.map(v => r4(v - x2_bar));

  const S11 = r4(dx1.reduce((s, v) => s + r4(v * v), 0));
  const S22 = r4(dx2.reduce((s, v) => s + r4(v * v), 0));
  const S12 = r4(dx1.reduce((s, v, i) => s + r4(v * dx2[i]), 0));
  const S1y = r4(dx1.reduce((s, v, i) => s + r4(v * dy[i]), 0));
  const S2y = r4(dx2.reduce((s, v, i) => s + r4(v * dy[i]), 0));
  const SST = r4(dy.reduce((s, v) => s + r4(v * v), 0));

  const det = r4(S11 * S22 - S12 * S12);
  if (Math.abs(det) < 1e-10) return null;

  const b1 = r4(r4(S1y * S22 - S2y * S12) / det);
  const b2 = r4(r4(S2y * S11 - S1y * S12) / det);
  const intercept = r4(y_bar - r4(b1 * x1_bar + b2 * x2_bar));

  const predictions = X1.map((v, i) => r4(intercept + r4(b1 * v) + r4(b2 * X2[i])));
  const SSE = r4(Y.reduce((s, v, i) => s + r4((v - predictions[i]) ** 2), 0));
  const R_squared = r4(1 - r4(SSE / SST));
  const alienation = r4(1 - R_squared);

  const p = 2;
  const SSR = r4(SST - SSE);
  const df_reg = p;
  const df_err = n - p - 1;
  const MSR = r4(SSR / df_reg);
  const MSE = r4(SSE / df_err);
  const F_stat = r4(MSR / MSE);
  const model_p = r4(pValueFromF(F_stat, df_reg, df_err));

  const var_X1 = r4(S11 / (n - 1));
  const var_X2 = r4(S22 / (n - 1));
  const var_Y = r4(SST / (n - 1));
  const sd_X1 = r4(Math.sqrt(var_X1));
  const sd_X2 = r4(Math.sqrt(var_X2));
  const sd_Y = r4(Math.sqrt(var_Y));

  const cov_x1y = r4(S1y / (n - 1));
  const cov_x2y = r4(S2y / (n - 1));
  const cov_x1x2 = r4(S12 / (n - 1));

  const r_x1y = r4(cov_x1y / r4(sd_X1 * sd_Y));
  const r_x2y = r4(cov_x2y / r4(sd_X2 * sd_Y));
  const r_x1x2 = r4(cov_x1x2 / r4(sd_X1 * sd_X2));

  return {
    n,
    x1_bar, x2_bar, y_bar,
    S11, S22, S12, S1y, S2y, SST,
    var_X1, var_X2, var_Y,
    sd_X1, sd_X2, sd_Y,
    cov_x1y, cov_x2y, cov_x1x2,
    r_x1y, r_x2y, r_x1x2,
    det, b1, b2, intercept,
    predictions,
    SSR, SSE, df_reg, df_err, MSR, MSE, F_stat, model_p,
    R_squared, alienation
  };
}

function pValueFromF(F, d1, d2) {
  if (!Number.isFinite(F) || F < 0 || d1 <= 0 || d2 <= 0) return NaN;
  const x = d2 / (d2 + d1 * F);
  return incompleteBeta(x, d2 / 2, d1 / 2);
}

function incompleteBeta(x, a, b) {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;
  const lb = logBeta(a, b);
  const bt = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lb);
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaCF(x, a, b) / a;
  }
  return 1 - (bt * betaCF(1 - x, b, a) / b);
}

function logBeta(a, b) {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function logGamma(z) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaCF(x, a, b) {
  const MAXIT = 200;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function makeField(container, id, label) {
  const w = document.createElement('div');
  w.className = 'field';
  const lab = document.createElement('label');
  lab.setAttribute('for', id);
  lab.textContent = label;
  const inp = document.createElement('input');
  inp.id = id;
  inp.type = 'number';
  inp.step = 'any';
  inp.placeholder = '0.0000';
  inp.addEventListener('input', evaluateAll);
  const msg = document.createElement('div');
  msg.id = `${id}_msg`;
  msg.className = 'msg';
  w.appendChild(lab);
  w.appendChild(inp);
  w.appendChild(msg);
  container.appendChild(w);
}

function buildFields() {
  FIELD_GROUPS.means.forEach(([id, label]) => makeField(document.getElementById('means-grid'), id, label));
  FIELD_GROUPS.totals.forEach(([id, label]) => makeField(document.getElementById('totals-grid'), id, label));
  FIELD_GROUPS.varsd.forEach(([id, label]) => makeField(document.getElementById('varsd-grid'), id, label));
  FIELD_GROUPS.cov.forEach(([id, label]) => makeField(document.getElementById('cov-grid'), id, label));
  FIELD_GROUPS.corr.forEach(([id, label]) => makeField(document.getElementById('corr-grid'), id, label));
  FIELD_GROUPS.coef.forEach(([id, label]) => makeField(document.getElementById('coef-grid'), id, label));
  FIELD_GROUPS.fit.forEach(([id, label]) => makeField(document.getElementById('fit-grid'), id, label));
}

function fillScenarioSelect() {
  const sel = document.getElementById('scenario');
  sel.innerHTML = '';
  SCENARIOS.forEach(sc => {
    const o = document.createElement('option');
    o.value = sc.id;
    o.textContent = sc.title;
    sel.appendChild(o);
  });
}

function setScenarioText(sc, names) {
  const el = document.getElementById('scenario-text');
  el.innerHTML = `<b>${sc.title}</b><br>${sc.vignette}<br><br>x1 = <b>${names.x1}</b> | x2 = <b>${names.x2}</b> | Y = <b>${names.y}</b>`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  tbl.innerHTML = '';
  const { x1, x2, y } = state.names;

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x1}</th><th>${x2}</th><th>${y}</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r2(Number(r[x1])).toFixed(2)}</td><td>${r2(Number(r[x2])).toFixed(2)}</td><td>${r2(Number(r[y])).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

function renderPredictionTable() {
  const tbl = document.getElementById('pred-table');
  tbl.innerHTML = '';
  state.predInputs = [];

  if (!state.truth) return;

  const { x1, x2, y } = state.names;
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x1}</th><th>${x2}</th><th>${y}</th><th>Yhat = a + b1*X1 + b2*X2</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r2(Number(r[x1])).toFixed(2)}</td><td>${r2(Number(r[x2])).toFixed(2)}</td><td>${r2(Number(r[y])).toFixed(2)}</td>`;
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.className = 'pred-input';
    inp.type = 'number';
    inp.step = 'any';
    inp.placeholder = '0.0000';
    inp.dataset.i = String(i);
    inp.addEventListener('input', evaluateAll);
    td.appendChild(inp);
    tr.appendChild(td);
    tbody.appendChild(tr);
    state.predInputs.push(inp);
  });

  tbl.appendChild(tbody);
}

function parseExcelPasteValues(raw) {
  return String(raw || '')
    .trim()
    .split(/\t|\r?\n|;|\s{2,}/)
    .map(v => v.trim().replace(',', '.'))
    .filter(v => v !== '');
}

function getExcelPasteFieldOrder() {
  const labelMap = new Map(Object.values(FIELD_GROUPS).flat());
  const fields = REQUIRED_FIELDS.map(id => ({ label: labelMap.get(id) || id, target: id }));
  state.predInputs.forEach((input, i) => fields.push({ label: `Yhat rij ${i + 1}`, target: input }));
  return fields;
}

function updateExcelPasteHint() {
  const hint = document.getElementById('excel-paste-format-hint');
  if (!hint) return;
  const fields = getExcelPasteFieldOrder();
  hint.innerHTML = `
    <div class="paste-hint">Volgorde kolommen (kopieer/plak uit Excel):</div>
    <table class="paste-cols-table">
      <thead><tr>${fields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead>
      <tbody><tr>${fields.map(() => '<td>...</td>').join('')}</tr></tbody>
    </table>`;
}

function setExcelPasteTarget(target, value) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function fillFromExcelPaste() {
  const area = document.getElementById('excel-paste-values');
  const status = document.getElementById('excel-paste-status');
  if (!area) return;
  const values = parseExcelPasteValues(area.value);
  const fields = getExcelPasteFieldOrder();
  let filled = 0;
  fields.forEach((field, i) => {
    if (i < values.length && setExcelPasteTarget(field.target, values[i])) filled += 1;
  });
  evaluateAll();
  if (status) {
    status.textContent = values.length < fields.length
      ? `${filled}/${fields.length} waarden ingevuld. Er ontbreken nog waarden.`
      : `${filled}/${fields.length} waarden ingevuld.`;
  }
}

function initExcelPastePanel() {
  const anchor = document.getElementById('btn-random');
  if (!anchor || document.getElementById('excel-paste-card')) return;
  const card = document.createElement('div');
  card.className = 'sidebar-card excel-paste-card';
  card.id = 'excel-paste-card';
  card.innerHTML = `
    <div class="sidebar-card-title">Plakken uit Excel</div>
    <p class="paste-hint">Plak een rij of bereik met tab-gescheiden waarden. De waarden worden van links naar rechts ingevuld.</p>
    <div id="excel-paste-format-hint" class="paste-format-wrap"></div>
    <textarea id="excel-paste-values" class="excel-paste-area" rows="3" placeholder="Plak hier waarden uit Excel"></textarea>
    <button id="btn-paste-excel" class="btn-secondary" type="button">Vul waarden in</button>
    <div id="excel-paste-status" class="paste-status"></div>`;
  anchor.insertAdjacentElement('afterend', card);
  document.getElementById('btn-paste-excel').addEventListener('click', fillFromExcelPaste);
  document.getElementById('excel-paste-values').addEventListener('paste', () => {
    window.setTimeout(fillFromExcelPaste, 0);
  });
  updateExcelPasteHint();
}

function clearStatuses() {
  REQUIRED_FIELDS.forEach(id => {
    const inp = document.getElementById(id);
    const msg = document.getElementById(`${id}_msg`);
    if (inp) {
      inp.value = '';
      inp.classList.remove('valid', 'invalid');
    }
    if (msg) {
      msg.textContent = '';
      msg.className = 'msg';
    }
  });

  document.getElementById('pred-msg').textContent = '';
  document.getElementById('pred-msg').className = 'status';
  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('interpretation').innerHTML = '';
  state.unlocked = false;
  destroyCharts();
  setVizNavLock(false);
  updateProgress(0, CORE_REQUIRED_FIELDS.length);
}

const FIELD_HINTS = {
  mean_X1: 'gem(X1) = ΣX1 / n',
  mean_X2: 'gem(X2) = ΣX2 / n',
  mean_Y: 'gem(Y) = ΣY / n',
  tot_X1_2: 'S11 = Σ(X1i − X̄₁)²',
  tot_X2_2: 'S22 = Σ(X2i − X̄₂)²',
  tot_X1X2: 'S12 = Σ(X1i−X̄₁)(X2i−X̄₂)',
  tot_X1Y: 'S1y = Σ(X1i−X̄₁)(Yi−Y̅)',
  tot_X2Y: 'S2y = Σ(X2i−X̄₂)(Yi−Y̅)',
  tot_Y2: 'SST = Σ(Yi − Y̅)²',
  var_X1: 's²(X1) = S11 / (n−1)',
  sd_X1: 's(X1) = √Var(X1)',
  var_X2: 's²(X2) = S22 / (n−1)',
  sd_X2: 's(X2) = √Var(X2)',
  var_Y: 's²(Y) = SST / (n−1)',
  sd_Y: 's(Y) = √Var(Y)',
  cov_x1y: 'Cov(X1,Y) = S1y / (n−1)',
  cov_x2y: 'Cov(X2,Y) = S2y / (n−1)',
  cov_x1x2: 'Cov(X1,X2) = S12 / (n−1)',
  r_x1y: 'r(X1,Y) = Cov(X1,Y) / (s(X1)·s(Y))',
  r_x2y: 'r(X2,Y) = Cov(X2,Y) / (s(X2)·s(Y))',
  r_x1x2: 'r(X1,X2) = Cov(X1,X2) / (s(X1)·s(X2))',
  multi_det: 'det = S11·S22 − S12²',
  multi_b1: 'b1 = (S1y·S22 − S2y·S12) / det',
  multi_b2: 'b2 = (S2y·S11 − S1y·S12) / det',
  multi_intercept: 'a = Y̅ − b1·X̄₁ − b2·X̄₂',
  multi_r_squared: 'R² = (b1·S1y + b2·S2y) / SST',
  multi_alienation: '1 − R²',
  multi_f_stat: 'F = (R²/k) / ((1−R²)/(n−k−1))',
  multi_model_p: 'p = P(F ≥ f-waarde)',
};

function markField(id, ok, attempted) {
  const inp = document.getElementById(id);
  const msg = document.getElementById(`${id}_msg`);
  if (!inp || !msg) return;

  inp.classList.remove('valid', 'invalid');
  msg.textContent = '';
  msg.className = 'msg';

  if (!attempted) return;

  if (ok) {
    inp.classList.add('valid');
    msg.classList.add('ok');
    msg.textContent = 'OK';
  } else {
    inp.classList.add('invalid');
    msg.classList.add('err');
    const hint = FIELD_HINTS[id];
    msg.textContent = hint ? `Fout — formule: ${hint}` : `${id} is onjuist.`;
  }
}

function evaluatePredictions() {
  const msg = document.getElementById('pred-msg');
  if (!state.truth || !state.predInputs.length) {
    msg.textContent = '';
    msg.className = 'status';
    return { allEntered: false, allCorrect: false, correctCount: 0, totalCount: state.predInputs.length };
  }

  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  state.predInputs.forEach((inp, i) => {
    totalCount += 1;
    inp.classList.remove('valid', 'invalid');
    const v = parseNum(inp.value);
    if (!Number.isFinite(v)) {
      allEntered = false;
      allCorrect = false;
      return;
    }

    const ok = check4(v, state.truth.predictions[i]);
    if (ok) {
      inp.classList.add('valid');
      correctCount += 1;
    }
    else {
      inp.classList.add('invalid');
      allCorrect = false;
    }
  });

  if (!allEntered) {
    msg.textContent = '';
    msg.className = 'status';
  } else if (allCorrect) {
    msg.textContent = 'Voorspellingen OK';
    msg.className = 'status ok';
  } else {
    msg.textContent = 'Sommige voorspellingen zijn fout.';
    msg.className = 'status err';
  }

  return { allEntered, allCorrect, correctCount, totalCount };
}

function simpleLine(points) {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sx2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const den = n * sx2 - sx * sx;
  if (Math.abs(den) < 1e-12) return { b0: sy / n, b1: 0 };
  const b1 = (n * sxy - sx * sy) / den;
  const b0 = (sy - b1 * sx) / n;
  return { b0, b1 };
}

function destroyCharts() {
  Object.values(state.charts).forEach(ch => { if (ch) ch.destroy(); });
  state.charts.calibration = null;
  state.charts.residual = null;
  state.charts.predictor = null;
}

function renderCharts() {
  const { x1, x2, y } = state.names;
  const t = state.truth;
  const Y = state.rows.map(r => r2(Number(r[y])));
  const X1 = state.rows.map(r => r2(Number(r[x1])));
  const X2 = state.rows.map(r => r2(Number(r[x2])));

  const calibPts = t.predictions.map((p, i) => ({ x: p, y: Y[i] }));
  const cmin = Math.min(...calibPts.map(p => Math.min(p.x, p.y)));
  const cmax = Math.max(...calibPts.map(p => Math.max(p.x, p.y)));
  const cfit = simpleLine(calibPts);

  state.charts.calibration = new Chart(document.getElementById('calibration-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Observaties', data: calibPts, backgroundColor: '#2563eb', pointRadius: 4 },
        { type: 'line', label: 'Perfecte lijn', data: [{ x: cmin, y: cmin }, { x: cmax, y: cmax }], borderColor: '#dc2626', borderDash: [6, 6], pointRadius: 0 },
        { type: 'line', label: 'Lineaire trend', data: [{ x: cmin, y: cfit.b0 + cfit.b1 * cmin }, { x: cmax, y: cfit.b0 + cfit.b1 * cmax }], borderColor: '#16a34a', pointRadius: 0 }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Kalibratieplot' } }, scales: { x: { type: 'linear', title: { display: true, text: 'Voorspeld' } }, y: { title: { display: true, text: 'Geobserveerd' } } } }
  });

  const residPts = t.predictions.map((p, i) => ({ x: p, y: r4(Y[i] - p) }));
  const rmin = Math.min(...residPts.map(p => p.x));
  const rmax = Math.max(...residPts.map(p => p.x));
  const rfit = simpleLine(residPts);

  state.charts.residual = new Chart(document.getElementById('residual-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Residuen', data: residPts, backgroundColor: '#7c3aed', pointRadius: 4 },
        { type: 'line', label: 'Nul-lijn', data: [{ x: rmin, y: 0 }, { x: rmax, y: 0 }], borderColor: '#dc2626', pointRadius: 0 },
        { type: 'line', label: 'Trend', data: [{ x: rmin, y: rfit.b0 + rfit.b1 * rmin }, { x: rmax, y: rfit.b0 + rfit.b1 * rmax }], borderColor: '#f59e0b', pointRadius: 0, borderDash: [5, 5] }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Residuenplot' } }, scales: { x: { type: 'linear', title: { display: true, text: 'Voorspeld' } }, y: { title: { display: true, text: 'Residuen' } } } }
  });

  const pmin = Math.min(...X1);
  const pmax = Math.max(...X1);
  const x2bar = t.x2_bar;
  const yline1 = t.intercept + t.b1 * pmin + t.b2 * x2bar;
  const yline2 = t.intercept + t.b1 * pmax + t.b2 * x2bar;

  state.charts.predictor = new Chart(document.getElementById('predictor-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: `${x1} vs ${y}`, data: X1.map((xv, i) => ({ x: xv, y: Y[i] })), backgroundColor: '#334155', pointRadius: 4 },
        { type: 'line', label: `Partiele lijn (X2 op gemiddelde)`, data: [{ x: pmin, y: yline1 }, { x: pmax, y: yline2 }], borderColor: '#0f766e', pointRadius: 0 }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Predictorplot' } }, scales: { x: { type: 'linear', title: { display: true, text: x1 } }, y: { title: { display: true, text: y } } } }
  });

  const pText = Number.isFinite(t.model_p) ? (t.model_p < 0.0001 ? '< 0.0001' : t.model_p.toFixed(4)) : 'n.v.t.';
  const sig = Number.isFinite(t.model_p) && t.model_p < 0.05;
  document.getElementById('interpretation').innerHTML = `
    <b>Interpretatie</b>
    <ul>
      <li>b1 = ${t.b1.toFixed(4)} (effect van ${x1}, gecontroleerd voor ${x2})</li>
      <li>b2 = ${t.b2.toFixed(4)} (effect van ${x2}, gecontroleerd voor ${x1})</li>
      <li>R2 = ${t.R_squared.toFixed(4)}; onverklaard = ${t.alienation.toFixed(4)}</li>
      <li>F(${t.df_reg}, ${t.df_err}) = ${t.F_stat.toFixed(4)}, p = ${pText}</li>
      <li>${sig ? 'Model is statistisch significant op 5%-niveau.' : 'Model is niet statistisch significant op 5%-niveau.'}</li>
    </ul>
  `;
}

function evaluateAll() {
  if (!state.truth) return;

  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  REQUIRED_FIELDS.forEach(id => {
    const isCore = CORE_REQUIRED_SET.has(id);
    if (isCore) totalCount += 1;
    const inp = document.getElementById(id);
    const attempted = Number.isFinite(parseNum(inp.value));
    const val = parseNum(inp.value);
    const key = FIELD_TRUTH_KEY[id];
    const ref = state.truth[key];
    const ok = attempted && check4(val, ref);

    if (isCore) {
      if (!attempted) allEntered = false;
      if (!ok) allCorrect = false;
      if (ok) correctCount += 1;
    }

    markField(id, ok, attempted);
  });

  evaluatePredictions();
  updateProgress(correctCount, totalCount);

  const unlock = allEntered && allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    setVizNavLock(unlock);
    if (unlock) {
      document.getElementById('success-card').classList.remove('hidden');
      document.getElementById('viz-card').classList.remove('locked');
      renderCharts();
    } else {
      document.getElementById('success-card').classList.add('hidden');
      document.getElementById('viz-card').classList.add('locked');
      document.getElementById('interpretation').innerHTML = '';
      destroyCharts();
    }
  }
}

function updateProgress(correct, total) {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (!bar || !text) return;
  const pct = total > 0 ? (100 * correct / total) : 0;
  bar.style.width = `${pct.toFixed(1)}%`;
  text.textContent = `${correct} / ${total} correct`;
}

function setVizNavLock(unlocked) {
  const nav = document.querySelector('.nav-item[data-target="viz-card"]');
  if (!nav) return;
  nav.classList.toggle('locked', !unlocked);
}

function setupNav() {
  const nav = document.getElementById('section-nav');
  if (!nav) return;
  const items = Array.from(nav.querySelectorAll('.nav-item'));

  nav.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item || item.classList.contains('locked')) return;
    const target = item.dataset.target;
    const sec = document.getElementById(target);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    items.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
}

function setupSidebarChrome() {
  const sidebarEl = document.getElementById('sidebar');
  const overlayEl = document.getElementById('sidebar-overlay');
  const btnToggle = document.getElementById('btn-sidebar-toggle');
  const btnClose = document.getElementById('btn-sidebar-close');

  function closeSidebar() {
    if (sidebarEl) sidebarEl.classList.remove('open');
    if (overlayEl) overlayEl.classList.remove('visible');
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      if (sidebarEl) sidebarEl.classList.add('open');
      if (overlayEl) overlayEl.classList.add('visible');
    });
  }
  if (btnClose) btnClose.addEventListener('click', closeSidebar);
  if (overlayEl) overlayEl.addEventListener('click', closeSidebar);

  const resizeHandle = document.getElementById('sidebar-resize-handle');
  if (resizeHandle && sidebarEl) {
    let startX = 0;
    let startWidth = 0;
    resizeHandle.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startWidth = sidebarEl.getBoundingClientRect().width;
      resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!resizeHandle.classList.contains('dragging')) return;
      const newWidth = Math.min(520, Math.max(220, startWidth + (e.clientX - startX)));
      sidebarEl.style.width = `${newWidth}px`;
    });
    document.addEventListener('mouseup', () => {
      if (!resizeHandle.classList.contains('dragging')) return;
      resizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }
}

function generate(random = false) {
  const scenarioEl = document.getElementById('scenario');
  const nEl = document.getElementById('n');
  const seedEl = document.getElementById('seed');

  let sc = null;
  if (random) sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  else sc = SCENARIOS.find(s => s.id === scenarioEl.value) || SCENARIOS[0];

  scenarioEl.value = sc.id;
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

  const made = makeScenarioData(sc, nEl.value, seedToUse);
  state.scenario = sc;
  state.rows = made.rows;
  state.names = made.names;
  state.truth = calcTruth(state.rows, state.names);

  setScenarioText(sc, state.names);
  renderDatasetTable();
  renderPredictionTable();
  clearStatuses();
  updateExcelPasteHint();
}

function bindEvents() {
  const seedEl = document.getElementById('seed');
  document.getElementById('btn-generate').addEventListener('click', () => generate(false));
  document.getElementById('btn-random').addEventListener('click', () => generate(true));
  document.getElementById('scenario').addEventListener('change', () => generate(false));
  if (seedEl) {
    const markManual = () => {
      seedEl.dataset.seedManual = '1';
      seedEl.dataset.nextRandom = '0';
    };
    seedEl.addEventListener('input', markManual);
    seedEl.addEventListener('change', markManual);
  }
}

function init() {
  fillScenarioSelect();
  buildFields();
  setupNav();
  setupSidebarChrome();
  bindEvents();
  initExcelPastePanel();
  const seedEl = document.getElementById('seed');
  if (seedEl) {
    seedEl.value = String(nextRandomSeed());
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  generate(false);
}

document.addEventListener('DOMContentLoaded', init);
