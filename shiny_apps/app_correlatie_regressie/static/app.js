'use strict';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
    vignette: 'Een stad heeft een criminaliteitspreventieprogramma uitgerold in tien vergelijkbare buurten. De mate van blootstelling aan het programma verschilt per buurt naargelang de intensiteit van de uitvoering. De afhankelijke variabele is het inbraakcijfer per 1.000 inwoners. Onderzoeksvraag: hangt een hogere programmaBlootstelling (X) significant samen met een lager inbraakcijfer (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'ProgrammaBlootstelling', unit: '%' }, y: { name: 'InbraakCijfer', unit: 'per 1.000' } },
    gen: { r_target: -0.45 },
    entity: 'Buurt'
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Een stedelijke politiezone concentreert voetpatrouilles op meldingenrijke locaties. Het aantal patrouille-uren per straat per week varieert naargelang prioriteit en beschikbare capaciteit. De afhankelijke variabele is het aantal meldingen aan de politie per straat per week. Onderzoeksvraag: gaat een hoger aantal voetPatrouilleUren (X) significant samen met minder politiemeldingen (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'VoetPatrouilleUren', unit: 'uren/week' }, y: { name: 'MeldingenAanPolitie', unit: 'per week' } },
    gen: { r_target: -0.25 },
    entity: 'Straat'
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'Bewoners in een stedelijke gemeente worden bevraagd via een slachtofferenqu\u00eate. Hun buurten worden door getrainde observatoren gescoord op fysieke en sociale wanorde (graffiti, verval, overlast). De afhankelijke variabele is de angst voor criminaliteit gemeten op een gevalideerde schaal (0\u2013100). Onderzoeksvraag: gaat een hogere wanordeIndex (X) significant samen met meer angst voor criminaliteit (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'WanordeIndex', unit: '0-10' }, y: { name: 'AngstScore', unit: '0-100' } },
    gen: { r_target: 0.55 },
    entity: 'Buurt'
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'Burgers in diverse wijken worden bevraagd over hun meest recente contact met de politie. Procedurele rechtvaardigheid meet de mate waarin men zich eerlijk en respectvol behandeld voelde. De afhankelijke variabele is het vertrouwen in de politie op een schaal van 1 tot 7. Onderzoeksvraag: hangt een hogere perceptie van procedurele rechtvaardigheid (X) significant samen met meer vertrouwen in de politie (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'ProcedureleRechtvaardigheid', unit: '1-7' }, y: { name: 'VertrouwenInPolitie', unit: '1-7' } },
    gen: { r_target: 0.70 },
    entity: 'District'
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'De routineactiviteitentheorie stelt dat toezicht (\u2018guardianship\u2019) het risico op victimisatie remt. Huishoudens worden gescoord op een gecombineerde toezichtsindex (sociale controle, beveiliging, bezetting). De afhankelijke variabele is het aantal slachtofferschapincidenten in het voorbije jaar. Onderzoeksvraag: hangt een hogere toezichtsscore (X) significant samen met minder slachtofferschapincidenten (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' } },
    gen: { r_target: -0.40 },
    entity: 'Huishouden'
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'Op basis van een biosociale risicobeoordeling wordt bij jongeren een impulsiviteitsscore bepaald via een gevalideerd zelfinvulformulier (z-score). Het aantal schoolmeldingen van agressieve incidenten per trimester wordt geregistreerd door leerkrachten. Onderzoeksvraag: gaat een hogere impulsiviteitsscore (X) significant samen met meer agressieve incidenten (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'AgressieveIncidenten', unit: 'schoolmeldingen/trimester' } },
    gen: { r_target: 0.45 },
    entity: 'Student'
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Na vrijlating nemen ex-gedetineerden deel aan een re-integratieprogramma met variabele intensiteit naargelang zorgbehoefte. Het aantal ondersteuningsuren per maand verschilt per deelnemer. Na zes maanden wordt een gevalideerde recidiverisicoscore (0\u2013100) afgenomen. Onderzoeksvraag: hangt meer begeleiding (X) significant samen met een lager recidiverisico (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'OndersteuningsUren', unit: 'per maand' }, y: { name: 'RecidiveRisico', unit: '0-100' } },
    gen: { r_target: -0.35 },
    entity: 'Deelnemer'
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'Een overheidsorganisatie voert een gesimuleerde phishing-campagne uit bij medewerkers. Het aantal gevolgde cyberveiligheidstrainingsuren verschilt per medewerker naargelang afdeling en planning. De afhankelijke variabele is het klikratio op nep-phishingmails (%). Onderzoeksvraag: gaat meer trainingstijd (X) significant samen met een lager klikratio (Y)? Toets de correlatie en schat de regressierechte (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'TrainingsUren', unit: 'uren' }, y: { name: 'Klikratio', unit: '%' } },
    gen: { r_target: -0.55 },
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
    if (sc?.entity) sc.entity = humanizeLabel(sc.entity);
  });
}

normalizeScenarioLabels();

const FIELD_GROUPS = {
  means: [['mean_X', 'Gemiddelde X'], ['mean_Y', 'Gemiddelde Y']],
  totals: [['tot_X1_2', 'Sum (X-Xbar)^2'], ['tot_Y2', 'Sum (Y-Ybar)^2']],
  stats: [
    ['var_X', 'Var(X)'], ['sd_X', 'SD(X)'], ['var_Y', 'Var(Y)'], ['sd_Y', 'SD(Y)'],
    ['cross_product_sum', 'Kruisproductsom'], ['covariance', 'Cov(X,Y)'], ['sd_product', 'SD(X)*SD(Y)'],
    ['correlation', 'Correlatie r']
  ],
  reg: [['slope', 'Helling b'], ['intercept', 'Intercept a']],
  fit: [['r_squared', 'R2'], ['alienation', 'Vervreemdingscoefficient'], ['f_stat', 'F-statistiek'], ['model_p_value', 'Model p-waarde']]
};

const FIELD_TRUTH_KEY = {
  mean_X: 'mean_X', mean_Y: 'mean_Y',
  tot_X1_2: 'sum_dX2', tot_Y2: 'sum_dY2',
  var_X: 'var_X', sd_X: 'sd_X', var_Y: 'var_Y', sd_Y: 'sd_Y',
  cross_product_sum: 'cross_product_sum', covariance: 'covariance', sd_product: 'sd_product', correlation: 'correlation',
  slope: 'slope', intercept: 'intercept',
  r_squared: 'r_squared', alienation: 'alienation', f_stat: 'f_stat', model_p_value: 'model_p'
};

const REQUIRED_FIELDS = Object.keys(FIELD_TRUTH_KEY);
const CORRELATION_REQUIRED_FIELDS = [
  'mean_X', 'mean_Y',
  'tot_X1_2', 'tot_Y2',
  'var_X', 'sd_X', 'var_Y', 'sd_Y',
  'cross_product_sum', 'covariance', 'sd_product', 'correlation'
];
const CORRELATION_REQUIRED_SET = new Set(CORRELATION_REQUIRED_FIELDS);

const state = {
  mode: 'Bivariate',
  scenario: null,
  rows: [],
  names: { x: '', y: '' },
  truth: null,
  unlocked: false,
  charts: { scatter: null, calibration: null, residual: null },
  hotMeans: null, hotMeansCellClasses: {},
  hotDev: null, hotDevCellClasses: {},
  hotStats: null, hotStatsCellClasses: {},
  hotReg: null, hotRegCellClasses: {},
  hotPred: null, hotPredCellClasses: {},
  hotFit: null, hotFitCellClasses: {},
};

const feedbackStore = {};

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

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

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function sdSample(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const ss = arr.reduce((s, v) => s + (v - m) ** 2, 0);
  return Math.sqrt(ss / (arr.length - 1));
}

function scaleByUnit(z, center, scale) {
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

function logBeta(a, b) { return logGamma(a) + logGamma(b) - logGamma(a + b); }

function logGamma(z) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
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

  let X = scaleByUnit(Xz, xCenter, xScale);
  let Y = scaleByUnit(Yz, yCenter, yScale);

  const xName = sc.vars.x.name;
  const yName = sc.vars.y.name;

  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      entity: `${sc.entity || 'Eenheid'} ${i + 1}`,
      [xName]: X[i],
      [yName]: Y[i]
    });
  }

  [xName, yName].forEach(k => {
    if (/(%|score|risico|ratio|cijfer)/i.test(k)) {
      rows.forEach(rw => { rw[k] = clamp(rw[k], 0, 100); });
    } else if (/(aantal|incidenten|meldingen)/i.test(k)) {
      rows.forEach(rw => { rw[k] = Math.max(0, Math.round(rw[k])); });
    }
  });

  return { rows, names: { x: xName, y: yName } };
}

function calcTruth(rows, names) {
  if (!rows.length) return null;

  const X = rows.map(r => r2(Number(r[names.x])));
  const Y = rows.map(r => r2(Number(r[names.y])));
  const n = X.length;
  if (n < 3) return null;

  const mean_X = r4(mean(X));
  const mean_Y = r4(mean(Y));

  const dX = X.map(v => v - mean_X);
  const dY = Y.map(v => v - mean_Y);
  const dX2 = dX.map(v => v * v);
  const dY2 = dY.map(v => v * v);
  const dXdY = dX.map((v, i) => v * dY[i]);

  const sum_dX2 = r4(dX2.reduce((s, v) => s + v, 0));
  const sum_dY2 = r4(dY2.reduce((s, v) => s + v, 0));
  const cross_product_sum = r4(dXdY.reduce((s, v) => s + v, 0));

  const var_X = r4(sum_dX2 / (n - 1));
  const var_Y = r4(sum_dY2 / (n - 1));
  const sd_X = r4(Math.sqrt(var_X));
  const sd_Y = r4(Math.sqrt(var_Y));

  const covariance = r4(cross_product_sum / (n - 1));
  const sd_product = r4(Math.sqrt(var_X) * Math.sqrt(var_Y));

  const correlation = r4(covariance / sd_product);
  const slope = r4(covariance / var_X);
  const intercept = r4(mean_Y - slope * mean_X);

  const predictions = X.map(xv => r4(intercept + slope * xv));

  const r_squared = r4(correlation * correlation);
  const alienation = r4(1 - r_squared);
  const f_stat = r4((r_squared / 1) / ((1 - r_squared) / (n - 2)));
  const model_p = r4(pValueFromF(f_stat, 1, n - 2));

  return {
    n,
    mean_X, mean_Y,
    dX, dY, dX2, dY2, dXdY,
    sum_dX2, sum_dY2,
    var_X, var_Y, sd_X, sd_Y,
    cross_product_sum, covariance, sd_product,
    correlation, slope, intercept,
    predictions,
    r_squared, alienation, f_stat, model_p
  };
}

function getRequiredSet() {
  if (state.mode === 'Correlation') return CORRELATION_REQUIRED_SET;
  return null;
}

function isRequiredField(id) {
  const corrSet = getRequiredSet();
  if (!corrSet) return true;
  return corrSet.has(id);
}

function getRequiredCount() {
  const devCount = state.rows.length * 5;
  if (state.mode === 'Correlation') return devCount + CORRELATION_REQUIRED_FIELDS.length;
  return devCount + REQUIRED_FIELDS.length;
}

function chkHot(hotCellClasses, row, col, expected, rawVal, msgId, hint) {
  const key = `${row}-${col}`;
  const str = rawVal == null ? '' : String(rawVal).trim();
  if (!str || str === 'null') {
    delete hotCellClasses[key];
    feedbackStore[msgId] = null;
    return 'empty';
  }
  const num = parseFloat(str.replace(',', '.'));
  if (isNaN(num)) {
    hotCellClasses[key] = 'incorrect';
    feedbackStore[msgId] = 'Geen geldig getal.';
    return 'incorrect';
  }
  if (Math.abs(r4(num) - r4(expected)) < 0.0001) {
    hotCellClasses[key] = 'correct';
    feedbackStore[msgId] = null;
    return 'correct';
  }
  hotCellClasses[key] = 'incorrect';
  feedbackStore[msgId] = hint ? `Formule: ${hint}` : 'Controleer je berekening.';
  return 'incorrect';
}

function updateSectionSummary(divId, correct, total, labelOk, labelPartial) {
  const el = document.getElementById(divId);
  if (!el) return;
  if (total === 0) { el.innerHTML = ''; el.className = 'section-summary'; return; }
  if (correct === total) {
    el.innerHTML = `&#10003; ${labelOk} (${correct}/${total})`;
    el.className = 'section-summary ok';
  } else {
    el.innerHTML = `${correct}/${total} correct &mdash; ${labelPartial}`;
    el.className = 'section-summary partial';
  }
}
function renderFeedbackPanel(panelId, fieldMap) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const items = Object.entries(fieldMap)
    .filter(([, msgId]) => feedbackStore[msgId])
    .map(([label, msgId]) => ({ label, html: feedbackStore[msgId] }));
  if (!items.length) { panel.innerHTML = ''; panel.className = 'feedback-panel'; return; }
  let html = '<div class="feedback-panel-title">Aanwijzingen:</div>';
  items.forEach(item => {
    html += `<div class="feedback-detail-item"><span class="feedback-detail-label">${item.label}</span> &mdash; ${item.html}</div>`;
  });
  panel.innerHTML = html;
  panel.className = 'feedback-panel visible';
}

function renderHotMeans() {
  const container = document.getElementById('hot-means-container');
  if (!container) return;
  if (state.hotMeans) { state.hotMeans.destroy(); state.hotMeans = null; }
  state.hotMeansCellClasses = {};
  container.innerHTML = '';
  const { x, y } = state.names;
  const tableData = [
    [`Gemiddelde X (${x || 'X'})`, null],
    [`Gemiddelde Y (${y || 'Y'})`, null]
  ];
  const longestLabel = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Grootheid');
  const w0 = Math.max(130, Math.ceil(longestLabel.length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotMeans = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 140],
    rowHeaders: false,
    width: w0 + 140,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotMeansCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotDev() {
  const container = document.getElementById('hot-dev-container');
  if (!container) return;
  if (state.hotDev) { state.hotDev.destroy(); state.hotDev = null; }
  state.hotDevCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length || !state.truth) return;
  const { x, y } = state.names;
  const n = state.rows.length;
  const tableData = state.rows.map(row => [
    row.entity,
    r2(Number(row[x])),
    r2(Number(row[y])),
    null, null, null, null, null
  ]);
  tableData.push(['Kolomsommen', null, null, null, null, null, null, null]);
  const longestEntity = state.rows.map(r => r.entity).reduce((a, b) => a.length >= b.length ? a : b, 'Eenheid');
  const w0 = Math.max(70, Math.ceil(longestEntity.length * 7) + 16);
  const w1 = Math.max(55, Math.ceil((x || 'X').length * 7) + 16);
  const w2 = Math.max(55, Math.ceil((y || 'Y').length * 7) + 16);
  const wF = 90;
  const hotValidate = debounce(evaluateAll, 250);
  state.hotDev = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: [
      'Eenheid', x || 'X', y || 'Y',
      '(x \u2212 x\u0304)', '(y \u2212 \u0233)',
      '(x \u2212 x\u0304)\u00b2', '(y \u2212 \u0233)\u00b2',
      '(x \u2212 x\u0304)(y \u2212 \u0233)'
    ],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, w1, w2, wF, wF, wF, wF, wF],
    rowHeaders: false,
    width: w0 + w1 + w2 + wF * 5,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotDevCellClasses[key];
      const isLastRow = row === n;
      const classes = [col < 3 ? 'htLeft' : 'htCenter'];
      if (isLastRow && col < 5) {
        classes.push('hot-sum-label-cell');
        return { readOnly: true, type: 'text', className: classes.join(' ') };
      }
      if (isLastRow) classes.push('hot-sum-value-cell');
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotStats() {
  const container = document.getElementById('hot-stats-container');
  if (!container) return;
  if (state.hotStats) { state.hotStats.destroy(); state.hotStats = null; }
  state.hotStatsCellClasses = {};
  container.innerHTML = '';
  const tableData = [
    ['Var(X)', null],
    ['SD(X)', null],
    ['Var(Y)', null],
    ['SD(Y)', null],
    ['Cov(X,Y)', null],
    ['SD(X) \u00d7 SD(Y)', null],
    ['Correlatie r', null]
  ];
  const w0 = 160;
  const hotValidate = debounce(evaluateAll, 250);
  state.hotStats = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 140],
    rowHeaders: false,
    width: w0 + 140,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotStatsCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotReg() {
  const container = document.getElementById('hot-reg-container');
  if (!container) return;
  if (state.hotReg) { state.hotReg.destroy(); state.hotReg = null; }
  state.hotRegCellClasses = {};
  container.innerHTML = '';
  const tableData = [
    ['Helling b', null],
    ['Intercept a', null]
  ];
  const w0 = 130;
  const hotValidate = debounce(evaluateAll, 250);
  state.hotReg = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 140],
    rowHeaders: false,
    width: w0 + 140,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotRegCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotFit() {
  const container = document.getElementById('hot-fit-container');
  if (!container) return;
  if (state.hotFit) { state.hotFit.destroy(); state.hotFit = null; }
  state.hotFitCellClasses = {};
  container.innerHTML = '';
  const tableData = [
    ['R\u00b2', null],
    ['Vervreemdingsco\u00ebffici\u00ebnt (1 \u2212 R\u00b2)', null],
    ['F-statistiek', null],
    ['Model p-waarde', null]
  ];
  const w0 = 230;
  const hotValidate = debounce(evaluateAll, 250);
  state.hotFit = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 140],
    rowHeaders: false,
    width: w0 + 140,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotFitCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotPred() {
  const container = document.getElementById('hot-pred-container');
  if (!container) return;
  if (state.hotPred) { state.hotPred.destroy(); state.hotPred = null; }
  state.hotPredCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length || !state.truth) return;
  const { x, y } = state.names;
  const tableData = state.rows.map(row => [
    row.entity,
    r2(Number(row[x])),
    r2(Number(row[y])),
    null
  ]);
  const longestEntity = state.rows.map(r => r.entity).reduce((a, b) => a.length >= b.length ? a : b, 'Eenheid');
  const w0 = Math.max(70, Math.ceil(longestEntity.length * 7) + 16);
  const w1 = Math.max(55, Math.ceil((x || 'X').length * 7) + 16);
  const w2 = Math.max(55, Math.ceil((y || 'Y').length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotPred = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Eenheid', x || 'X', y || 'Y', 'Y\u0302 = a + b\u00d7X'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, w1, w2, 130],
    rowHeaders: false,
    width: w0 + w1 + w2 + 130,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotPredCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function buildFields() {
  renderHotMeans();
  renderHotDev();
  renderHotStats();
  renderHotReg();
  renderHotPred();
  renderHotFit();
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

function renderTaskDetail() {
  const detail = document.getElementById('task-detail');
  if (!detail || !state.scenario) return;

  const { x, y } = state.names;
  const sc = state.scenario;
  const corrMode = state.mode === 'Correlation';
  const xUnit = sc.vars?.x?.unit ? ` (${sc.vars.x.unit})` : '';
  const yUnit = sc.vars?.y?.unit ? ` (${sc.vars.y.unit})` : '';

  detail.innerHTML = corrMode
    ? `
      <p><strong>Context:</strong> in deze oefening onderzoek je of er in de gegenereerde criminologische dataset een lineaire samenhang bestaat tussen twee gemeten kenmerken.</p>
      <p><strong>Opdracht:</strong> bereken de Pearson-correlatie tussen <strong>${x}</strong> en <strong>${y}</strong>.</p>
      <ul>
        <li>Gebruik <strong>${x}</strong>${xUnit} als X-variabele.</li>
        <li>Gebruik <strong>${y}</strong>${yUnit} als Y-variabele.</li>
        <li>Bereken eerst de gemiddelden, afwijkingen, kwadraten en kruisproducten.</li>
        <li>Bereken daarna variantie, standaarddeviatie, covariantie en Pearson r.</li>
      </ul>
      <p><strong>Rond af:</strong> gebruik <strong>4 decimalen</strong> voor alle handmatige berekeningen. Wanneer alles correct is, verschijnt de visualisatie automatisch.</p>
    `
    : `
      <p><strong>Context:</strong> in deze oefening onderzoek je of verschillen in <strong>${x}</strong> kunnen helpen om verschillen in <strong>${y}</strong> te voorspellen.</p>
      <p><strong>Opdracht:</strong> voer een bivariate lineaire regressie uit met <strong>${y}</strong> als afhankelijke variabele en <strong>${x}</strong> als onafhankelijke variabele.</p>
      <ul>
        <li>Gebruik <strong>${x}</strong>${xUnit} als X-variabele.</li>
        <li>Gebruik <strong>${y}</strong>${yUnit} als Y-variabele.</li>
        <li>Bereken de voorbereidende correlatiematen: gemiddelden, afwijkingen, varianties, standaarddeviaties, covariantie en r.</li>
        <li>Bereken daarna de regressiecoefficienten, voorspelde waarden, R2, vervreemding, F en model-p-waarde.</li>
      </ul>
      <p><strong>Rond af:</strong> gebruik <strong>4 decimalen</strong> voor alle handmatige berekeningen. Wanneer alles correct is, verschijnen de visualisaties automatisch.</p>
    `;
}

function setScenarioText(sc, names) {
  const title = document.getElementById('scenario-title');
  const text = document.getElementById('scenario-text');
  const meta = document.getElementById('scenario-meta');

  if (title) title.textContent = sc.title;
  if (text) text.textContent = sc.vignette;
  if (meta) {
    const xUnit = sc.vars?.x?.unit ? ` (${sc.vars.x.unit})` : '';
    const yUnit = sc.vars?.y?.unit ? ` (${sc.vars.y.unit})` : '';
    meta.innerHTML = `X = <b>${names.x}</b>${xUnit} | Y = <b>${names.y}</b>${yUnit}`;
  }
  renderTaskDetail();
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  const info = document.getElementById('dataset-info');
  tbl.className = 'dataset-table';
  tbl.innerHTML = '';

  const { x, y } = state.names;
  if (info) {
    info.innerHTML = `<strong>N = ${state.rows.length}</strong> waarnemingen. X = <strong>${x}</strong>; Y = <strong>${y}</strong>.`;
  }

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x}</th><th>${y}</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r2(Number(r[x])).toFixed(2)}</td><td>${r2(Number(r[y])).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}


function clearStatuses() {
  const clearHotCol = (hot, col) => {
    if (!hot) return;
    const changes = hot.getData().map((_, i) => [i, col, null]);
    hot.setDataAtCell(changes, 'loadData');
  };
  clearHotCol(state.hotMeans, 1);
  clearHotCol(state.hotStats, 1);
  clearHotCol(state.hotReg, 1);
  clearHotCol(state.hotFit, 1);
  clearHotCol(state.hotPred, 3);
  if (state.hotDev) {
    const changes = [];
    state.hotDev.getData().forEach((_, i) => {
      [3, 4, 5, 6, 7].forEach(c => changes.push([i, c, null]));
    });
    state.hotDev.setDataAtCell(changes, 'loadData');
  }
  state.hotMeansCellClasses = {};
  state.hotDevCellClasses = {};
  state.hotStatsCellClasses = {};
  state.hotRegCellClasses = {};
  state.hotPredCellClasses = {};
  state.hotFitCellClasses = {};
  [state.hotMeans, state.hotDev, state.hotStats, state.hotReg, state.hotPred, state.hotFit]
    .forEach(h => { if (h) h.render(); });
  Object.keys(feedbackStore).forEach(k => delete feedbackStore[k]);
  ['feedback-deel2', 'feedback-deel3', 'feedback-deel4', 'feedback-deel5', 'feedback-deel6', 'feedback-deel7'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.className = 'section-summary'; }
  });
  ['feedback-detail-deel2', 'feedback-detail-deel3', 'feedback-detail-deel4', 'feedback-detail-deel5', 'feedback-detail-deel6', 'feedback-detail-deel7'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.className = 'feedback-panel'; }
  });
  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('interpretation').innerHTML = '';
  state.unlocked = false;
  destroyCharts();
  setVizNavLock(false);
  updateProgress(0, 0);
}

const FIELD_HINTS = {
  mean_X: 'gem(X) = som(X) / n',
  mean_Y: 'gem(Y) = som(Y) / n',
  tot_X1_2: 'Variatie X = som((Xi - Xbar)^2)',
  tot_Y2: 'Variatie Y = som((Yi - Ybar)^2)',
  var_X: 'Var(X) = Variatie(X) / (n - 1)',
  sd_X: 'SD(X) = sqrt(Var(X))',
  var_Y: 'Var(Y) = Variatie(Y) / (n - 1)',
  sd_Y: 'SD(Y) = sqrt(Var(Y))',
  cross_product_sum: 'KPS = som((Xi - Xbar)(Yi - Ybar))',
  covariance: 'Cov = KPS / (n - 1)',
  sd_product: 'SD(X) * SD(Y)',
  correlation: 'r = Cov(X,Y) / (SD(X) * SD(Y))',
  slope: 'b = Cov(X,Y) / Var(X)',
  intercept: 'a = Ybar - b * Xbar',
  r_squared: 'R2 = r^2',
  alienation: 'Vervreemding = 1 - R2',
  f_stat: 'F = (R2 / k) / ((1 - R2) / (n - k - 1))',
  model_p_value: 'p = P(F = f-waarde)',
};

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
  state.charts.scatter = null;
  state.charts.calibration = null;
  state.charts.residual = null;
}

function renderCharts() {
  const corrMode = state.mode === 'Correlation';
  const { x, y } = state.names;
  const t = state.truth;
  const X = state.rows.map(r => r2(Number(r[x])));
  const Y = state.rows.map(r => r2(Number(r[y])));
  const calWrap = document.getElementById('calibration-wrap');
  const resWrap = document.getElementById('residual-wrap');

  const smin = Math.min(...X);
  const smax = Math.max(...X);
  const y1 = t.intercept + t.slope * smin;
  const y2 = t.intercept + t.slope * smax;

  state.charts.scatter = new Chart(document.getElementById('scatter-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Observaties', data: X.map((xv, i) => ({ x: xv, y: Y[i] })), backgroundColor: '#334155', pointRadius: 4 },
        { type: 'line', label: 'Regressielijn', data: [{ x: smin, y: y1 }, { x: smax, y: y2 }], borderColor: '#0f766e', pointRadius: 0 }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Scatterplot met regressielijn' } }, scales: { x: { type: 'linear', title: { display: true, text: x } }, y: { title: { display: true, text: y } } } }
  });

  if (corrMode) {
    if (calWrap) calWrap.classList.add('hidden');
    if (resWrap) resWrap.classList.add('hidden');
    document.getElementById('interpretation').innerHTML = `
      <b>Interpretatie</b>
      <ul>
        <li>r = ${t.correlation.toFixed(4)}</li>
        <li>Sterkte en richting van de lineaire samenhang tussen X en Y.</li>
      </ul>
    `;
    return;
  }

  if (calWrap) calWrap.classList.remove('hidden');
  if (resWrap) resWrap.classList.remove('hidden');

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

  const pText = Number.isFinite(t.model_p) ? (t.model_p < 0.0001 ? '< 0.0001' : t.model_p.toFixed(4)) : 'n.v.t.';
  const sig = Number.isFinite(t.model_p) && t.model_p < 0.05;
  document.getElementById('interpretation').innerHTML = `
    <b>Interpretatie</b>
    <ul>
      <li>r = ${t.correlation.toFixed(4)}, b = ${t.slope.toFixed(4)}, a = ${t.intercept.toFixed(4)}</li>
      <li>R2 = ${t.r_squared.toFixed(4)}; onverklaard = ${t.alienation.toFixed(4)}</li>
      <li>F(1, ${t.n - 2}) = ${t.f_stat.toFixed(4)}, p = ${pText}</li>
      <li>${sig ? 'Model is statistisch significant op 5%-niveau.' : 'Model is niet statistisch significant op 5%-niveau.'}</li>
    </ul>
  `;
}

function evaluateAll() {
  if (!state.truth) return;
  const t = state.truth;
  const n = state.rows.length;
  let totalCorrect = 0, totalCount = 0;

  // -- Deel II: Means --------------------------------------------
  const d2data = state.hotMeans ? state.hotMeans.getData() : [];
  const newMeansCls = {};
  let d2c = 0;
  const meansFields = [
    { row: 0, expected: t.mean_X, id: 'mean_X', label: 'Gemiddelde X', hint: FIELD_HINTS.mean_X },
    { row: 1, expected: t.mean_Y, id: 'mean_Y', label: 'Gemiddelde Y', hint: FIELD_HINTS.mean_Y }
  ];
  meansFields.forEach(f => {
    const raw = d2data[f.row] ? d2data[f.row][1] : null;
    const st = chkHot(newMeansCls, f.row, 1, f.expected, raw, f.id, f.hint);
    totalCount++;
    if (st === 'correct') { d2c++; totalCorrect++; }
  });
  state.hotMeansCellClasses = newMeansCls;
  if (state.hotMeans) state.hotMeans.render();
  updateSectionSummary('feedback-deel2', d2c, meansFields.length, 'Gemiddelden correct', 'controleer gemiddelden');
  renderFeedbackPanel('feedback-detail-deel2', Object.fromEntries(meansFields.map(f => [f.label, f.id])));

  // -- Deel III: Deviations --------------------------------------
  const d3data = state.hotDev ? state.hotDev.getData() : [];
  const newDevCls = {};
  let d3c = 0, d3total = 0;
  const devColSpecs = [
    { col: 3, values: t.dX },
    { col: 4, values: t.dY },
    { col: 5, values: t.dX2 },
    { col: 6, values: t.dY2 },
    { col: 7, values: t.dXdY }
  ];
  devColSpecs.forEach(dc => {
    for (let i = 0; i < n; i++) {
      const raw = d3data[i] ? d3data[i][dc.col] : null;
      const st = chkHot(newDevCls, i, dc.col, dc.values[i], raw, `dev-${dc.col}-${i}`, null);
      d3total++; totalCount++;
      if (st === 'correct') { d3c++; totalCorrect++; }
    }
  });
  const sumFields = [
    { col: 5, expected: t.sum_dX2, id: 'tot_X1_2', label: '\u03a3(x\u2212x\u0304)\u00b2', hint: FIELD_HINTS.tot_X1_2 },
    { col: 6, expected: t.sum_dY2, id: 'tot_Y2', label: '\u03a3(y\u2212\u0233)\u00b2', hint: FIELD_HINTS.tot_Y2 },
    { col: 7, expected: t.cross_product_sum, id: 'cross_product_sum', label: '\u03a3(x\u2212x\u0304)(y\u2212\u0233)', hint: FIELD_HINTS.cross_product_sum }
  ];
  sumFields.forEach(sf => {
    const raw = d3data[n] ? d3data[n][sf.col] : null;
    const st = chkHot(newDevCls, n, sf.col, sf.expected, raw, sf.id, sf.hint);
    d3total++; totalCount++;
    if (st === 'correct') { d3c++; totalCorrect++; }
  });
  state.hotDevCellClasses = newDevCls;
  if (state.hotDev) state.hotDev.render();
  updateSectionSummary('feedback-deel3', d3c, d3total, 'Afwijkingtabel correct', 'controleer afwijkingen en kolomsommen');
  renderFeedbackPanel('feedback-detail-deel3', Object.fromEntries(sumFields.map(f => [f.label, f.id])));

  // -- Deel IV: Stats --------------------------------------------
  const d4data = state.hotStats ? state.hotStats.getData() : [];
  const newStatsCls = {};
  let d4c = 0;
  const statsFields = [
    { row: 0, expected: t.var_X, id: 'var_X', label: 'Var(X)', hint: FIELD_HINTS.var_X },
    { row: 1, expected: t.sd_X, id: 'sd_X', label: 'SD(X)', hint: FIELD_HINTS.sd_X },
    { row: 2, expected: t.var_Y, id: 'var_Y', label: 'Var(Y)', hint: FIELD_HINTS.var_Y },
    { row: 3, expected: t.sd_Y, id: 'sd_Y', label: 'SD(Y)', hint: FIELD_HINTS.sd_Y },
    { row: 4, expected: t.covariance, id: 'covariance', label: 'Cov(X,Y)', hint: FIELD_HINTS.covariance },
    { row: 5, expected: t.sd_product, id: 'sd_product', label: 'SD(X)\u00d7SD(Y)', hint: FIELD_HINTS.sd_product },
    { row: 6, expected: t.correlation, id: 'correlation', label: 'Correlatie r', hint: FIELD_HINTS.correlation }
  ];
  statsFields.forEach(f => {
    const raw = d4data[f.row] ? d4data[f.row][1] : null;
    const st = chkHot(newStatsCls, f.row, 1, f.expected, raw, f.id, f.hint);
    totalCount++;
    if (st === 'correct') { d4c++; totalCorrect++; }
  });
  state.hotStatsCellClasses = newStatsCls;
  if (state.hotStats) state.hotStats.render();
  updateSectionSummary('feedback-deel4', d4c, statsFields.length, 'Statistieken correct', 'controleer variantie, SD, covariantie en r');
  renderFeedbackPanel('feedback-detail-deel4', Object.fromEntries(statsFields.map(f => [f.label, f.id])));

  // -- Deel V-VIII: Bivariate only -------------------------------
  const corrMode = state.mode === 'Correlation';
  if (!corrMode) {
    // Deel V: Regression coefficients
    const d5data = state.hotReg ? state.hotReg.getData() : [];
    const newRegCls = {};
    let d5c = 0;
    const regFields = [
      { row: 0, expected: t.slope, id: 'slope', label: 'Helling b', hint: FIELD_HINTS.slope },
      { row: 1, expected: t.intercept, id: 'intercept', label: 'Intercept a', hint: FIELD_HINTS.intercept }
    ];
    regFields.forEach(f => {
      const raw = d5data[f.row] ? d5data[f.row][1] : null;
      const st = chkHot(newRegCls, f.row, 1, f.expected, raw, f.id, f.hint);
      totalCount++;
      if (st === 'correct') { d5c++; totalCorrect++; }
    });
    state.hotRegCellClasses = newRegCls;
    if (state.hotReg) state.hotReg.render();
    updateSectionSummary('feedback-deel5', d5c, regFields.length, 'Regressiecoefficienten correct', 'controleer helling en intercept');
    renderFeedbackPanel('feedback-detail-deel5', Object.fromEntries(regFields.map(f => [f.label, f.id])));

    // Deel VI: Predictions
    const d6data = state.hotPred ? state.hotPred.getData() : [];
    const newPredCls = {};
    let d6c = 0;
    for (let i = 0; i < n; i++) {
      const raw = d6data[i] ? d6data[i][3] : null;
      const st = chkHot(newPredCls, i, 3, t.predictions[i], raw, `pred-${i}`, null);
      totalCount++;
      if (st === 'correct') { d6c++; totalCorrect++; }
    }
    state.hotPredCellClasses = newPredCls;
    if (state.hotPred) state.hotPred.render();
    updateSectionSummary('feedback-deel6', d6c, n, 'Voorspellingen correct', 'controleer Y\u0302 = a + b\u00d7X');

    // Deel VII: Model fit
    const d7data = state.hotFit ? state.hotFit.getData() : [];
    const newFitCls = {};
    let d7c = 0;
    const fitFields = [
      { row: 0, expected: t.r_squared, id: 'r_squared', label: 'R\u00b2', hint: FIELD_HINTS.r_squared },
      { row: 1, expected: t.alienation, id: 'alienation', label: 'Vervreemdingsco\u00ebffici\u00ebnt', hint: FIELD_HINTS.alienation },
      { row: 2, expected: t.f_stat, id: 'f_stat', label: 'F-statistiek', hint: FIELD_HINTS.f_stat },
      { row: 3, expected: t.model_p, id: 'model_p_value', label: 'Model p-waarde', hint: FIELD_HINTS.model_p_value }
    ];
    fitFields.forEach(f => {
      const raw = d7data[f.row] ? d7data[f.row][1] : null;
      const st = chkHot(newFitCls, f.row, 1, f.expected, raw, f.id, f.hint);
      totalCount++;
      if (st === 'correct') { d7c++; totalCorrect++; }
    });
    state.hotFitCellClasses = newFitCls;
    if (state.hotFit) state.hotFit.render();
    updateSectionSummary('feedback-deel7', d7c, fitFields.length, 'Modelfit correct', 'controleer R\u00b2, F en p-waarde');
    renderFeedbackPanel('feedback-detail-deel7', Object.fromEntries(fitFields.map(f => [f.label, f.id])));
  }

  updateProgress(totalCorrect, totalCount);
  const allDone = totalCount > 0 && totalCorrect === totalCount;
  if (allDone !== state.unlocked) {
    state.unlocked = allDone;
    setVizNavLock(allDone);
    if (allDone) {
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

function applyModeUI() {
  const corrMode = state.mode === 'Correlation';
  const howtoList = document.getElementById('howto-list');
  const stepsList = document.getElementById('steps-list');
  const successTitle = document.getElementById('success-title');
  const nav4 = document.getElementById('nav-deel4');
  const nav5 = document.getElementById('nav-deel5');
  const nav6 = document.getElementById('nav-deel6');
  const nav7 = document.getElementById('nav-deel7');
  const hdr4 = document.getElementById('hdr-deel4');
  const hdr5 = document.getElementById('hdr-deel5');
  const hdr6 = document.getElementById('hdr-deel6');
  const hdr7 = document.getElementById('hdr-deel7');
  const sec5 = document.getElementById('deel5');
  const sec6 = document.getElementById('deel6');
  const sec7 = document.getElementById('deel7');

  if (howtoList) {
    howtoList.innerHTML = corrMode
      ? `
      <li>Oefen <b>correlatieanalyse</b> met criminologiedatasets (gebruik <b>4 decimalen</b>).</li>
      <li>Voltooi <b>4 delen</b> om handmatig Pearson r te berekenen:
        <ul>
          <li><b>Deel I:</b> Dataset bekijken</li>
          <li><b>Deel II:</b> Rekenkundige gemiddelden (X&#772; en Y&#772;)</li>
          <li><b>Deel III:</b> Afwijkingen, kwadraten en kruisproducten</li>
          <li><b>Deel IV:</b> Variantie, SD, covariantie en correlatie r</li>
        </ul>
      </li>
      <li>Cellen worden <span class="text-ok">groen</span> bij correct en <span class="text-err">rood</span> bij fout.</li>
      <li>Wanneer alles correct is, verschijnt de <b>visualisatie</b> automatisch.</li>
      `
      : `
      <li>Oefen <b>bivariate regressie</b> met criminologiedatasets (gebruik <b>4 decimalen</b>).</li>
      <li>Voltooi <b>8 delen</b> om handmatig correlatie- en regressieanalyse uit te voeren:
        <ul>
          <li><b>Deel I:</b> Dataset bekijken</li>
          <li><b>Deel II:</b> Rekenkundige gemiddelden (X&#772; en Y&#772;)</li>
          <li><b>Deel III:</b> Afwijkingen, kwadraten en kruisproducten</li>
          <li><b>Deel IV:</b> Variantie, SD, covariantie en correlatie r</li>
          <li><b>Deel V&ndash;VI:</b> Helling b en intercept a</li>
          <li><b>Deel VII:</b> Voorspelde waarden Y&#770;</li>
          <li><b>Deel VIII:</b> R&#178;, vervreemding, F en model p</li>
        </ul>
      </li>
      <li>Cellen worden <span class="text-ok">groen</span> bij correct en <span class="text-err">rood</span> bij fout.</li>
      <li>Wanneer alles correct is, verschijnen de <b>visualisaties</b> automatisch.</li>
      `;
  }

  if (stepsList) {
    stepsList.innerHTML = corrMode
      ? `
      <li>Bereken X&#772; en Y&#772; (Deel II).</li>
      <li>Bereken (x&minus;x&#772;), (y&minus;y&#772;), kwadraten en kruisproducten per rij (Deel III).</li>
      <li>Bereken Var, SD, Cov(X,Y) en r (Deel IV).</li>
      `
      : `
      <li>Bereken X&#772; en Y&#772; (Deel II).</li>
      <li>Bereken (x&minus;x&#772;), (y&minus;y&#772;), kwadraten en kruisproducten per rij (Deel III).</li>
      <li>Bereken Var, SD, Cov(X,Y) en r (Deel IV).</li>
      <li>Bereken helling b en intercept a (Deel V&ndash;VI).</li>
      <li>Bereken voorspellingen Y&#770; = a + b&#183;X (Deel VII).</li>
      <li>Bereken R&#178;, vervreemding, F en model p (Deel VIII).</li>
      `;
  }

  if (nav4) nav4.textContent = 'IV. Stappen 5-9';
  if (hdr4) hdr4.textContent = 'Deel IV - Stappen 5-9: Covariatie en Voorbereiding';
  if (hdr5) hdr5.textContent = 'Deel VI - Stappen 10-12: Correlatie en regressiecoefficienten';
  if (hdr6) hdr6.textContent = 'Deel VII - Stap 13: Voorspellingen Yhat';
  if (hdr7) hdr7.textContent = 'Deel VIII - Stappen 14-17: Model Fit en F-toets';

  [nav5, nav6, nav7, sec5, sec6, sec7].forEach(el => {
    if (!el) return;
    el.classList.toggle('hidden', corrMode);
  });

  if (successTitle) {
    successTitle.textContent = corrMode
      ? 'Correlatieanalyse correct uitgewerkt'
      : 'Volledige bivariate regressie correct uitgewerkt';
  }

  renderTaskDetail();

  const active = document.querySelector('#section-nav .nav-item.active');
  if (active && active.classList.contains('hidden')) {
    active.classList.remove('active');
    const fallback = document.querySelector('#section-nav .nav-item[data-target="deel4"]');
    if (fallback) fallback.classList.add('active');
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
    const layoutEl = sidebarEl.closest('.layout');
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
      if (layoutEl) layoutEl.style.gridTemplateColumns = `${newWidth}px 8px 1fr`;
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
  const sel = document.getElementById('scenario');
  const nEl = document.getElementById('n');
  const seedEl = document.getElementById('seed');

  let sc;
  if (random) sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  else sc = SCENARIOS.find(s => s.id === sel.value) || SCENARIOS[0];

  sel.value = sc.id;
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
  buildFields();
  clearStatuses();
  evaluateAll();
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
  document.getElementById('mode').addEventListener('change', (e) => {
    state.mode = e.target.value === 'Correlation' ? 'Correlation' : 'Bivariate';
    applyModeUI();
    clearStatuses();
    evaluateAll();
  });
}

function init() {
  const modeEl = document.getElementById('mode');
  state.mode = modeEl && modeEl.value === 'Correlation' ? 'Correlation' : 'Bivariate';
  fillScenarioSelect();
  buildFields();
  applyModeUI();
  setupNav();
  setupSidebarChrome();
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
