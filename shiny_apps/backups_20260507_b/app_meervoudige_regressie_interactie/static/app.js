(function () {
'use strict';

const MAX_SAMPLE_SIZE = 40;

const SCENARIOS = [
  {
    id: 'program_collective',
    title: 'Programma-intensiteit x collectieve effectiviteit',
    vignette: 'Een stad implementeerde een criminaliteitspreventie-programma in buurten met uiteenlopende niveaus van collectieve effectiviteit. Onderzocht wordt of het effect van programma-intensiteit op inbraakcijfers groter is in buurten met hogere collectieve effectiviteit. Onderzoeksvraag: is er een significant interactie-effect tussen programma-intensiteit (x1) en collectieve effectiviteit (x2) bij de verklaring van inbraakcijfer (Y)? Gebruik alpha = 0,05.',
    entity: 'Buurt',
    vars: { x1: 'Programma-intensiteit', x2: 'Collectieve effectiviteit', y: 'Inbraakcijfer' },
    design: { x1_center: 50, x1_scale: 14, x1_bounds: [0, 100], x2_center: 5.2, x2_scale: 2.0, x2_bounds: [0, 10], y_base: 26, b1: -0.20, b2: -1.05, b3: -0.10, rho: 0.30, noise: 3.4, y_bounds: [0, 100] }
  },
  {
    id: 'policing_disorder',
    title: 'Politie-aanwezigheid x buurtwanorde',
    vignette: 'In stedelijke straten met uiteenlopende wanordeniveaus wordt de effectiviteit van politie-aanwezigheid onderzocht. De verwachting is dat verhoogde politie-aanwezigheid sterker samenhangt met een daling van het aantal meldingen in straten met hogere wanorde. Onderzoeksvraag: is er een significant interactie-effect tussen politie-aanwezigheid (x1) en wanorde-index (x2) bij de verklaring van meldingen aan de politie (Y)? Gebruik alpha = 0,05.',
    entity: 'Straat',
    vars: { x1: 'Politie-aanwezigheid', x2: 'Wanorde-index', y: 'Meldingen' },
    design: { x1_center: 22, x1_scale: 7, x1_bounds: [0, 40], x2_center: 5.5, x2_scale: 2.2, x2_bounds: [0, 10], y_base: 58, b1: -0.55, b2: 2.20, b3: -0.09, rho: 0.20, noise: 5.5, y_bounds: [0, 120] }
  },
  {
    id: 'school_peers',
    title: 'Schoolbinding x delinquente peers',
    vignette: 'Bij middelbare scholieren met variabele schoolbinding en blootstelling aan delinquente leeftijdsgenoten wordt onderzocht of schoolbinding als beschermende factor sterker werkt wanneer het contact met delinquente peers lager is. Onderzoeksvraag: is er een significant interactie-effect tussen schoolbinding (x1) en delinquente peers (x2) bij de verklaring van delictscore (Y)? Gebruik alpha = 0,05.',
    entity: 'Student',
    vars: { x1: 'Schoolbinding', x2: 'Delinquente peers', y: 'Delictscore' },
    design: { x1_center: 4.2, x1_scale: 1.1, x1_bounds: [1, 7], x2_center: 4.8, x2_scale: 2.1, x2_bounds: [0, 10], y_base: 46, b1: -3.60, b2: 2.10, b3: 0.45, rho: -0.15, noise: 6.0, y_bounds: [0, 100] }
  },
  {
    id: 'reentry_support',
    title: 'Nazorg x werkhervatting',
    vignette: 'Ex-gedetineerden ontvangen variabele hoeveelheden nazorgondersteuning en bereiken uiteenlopende niveaus van werkhervatting. Onderzocht wordt of nazorgbegeleiding meer bijdraagt aan recidivevermindering wanneer de persoon erin slaagt opnieuw aan het werk te gaan. Onderzoeksvraag: is er een significant interactie-effect tussen nazorguren (x1) en werkhervatting (x2) bij de verklaring van recidiverisico (Y)? Gebruik alpha = 0,05.',
    entity: 'Deelnemer',
    vars: { x1: 'Nazorguren', x2: 'Werkhervatting', y: 'Recidiverisico' },
    design: { x1_center: 16, x1_scale: 5.5, x1_bounds: [0, 35], x2_center: 5.1, x2_scale: 2.0, x2_bounds: [0, 10], y_base: 54, b1: -0.85, b2: -1.50, b3: -0.12, rho: 0.25, noise: 5.2, y_bounds: [0, 100] }
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
    if (sc?.vars?.x1) sc.vars.x1 = humanizeLabel(sc.vars.x1);
    if (sc?.vars?.x2) sc.vars.x2 = humanizeLabel(sc.vars.x2);
    if (sc?.vars?.y) sc.vars.y = humanizeLabel(sc.vars.y);
    if (sc?.entity) sc.entity = humanizeLabel(sc.entity);
    if (sc?.vignette) {
      sc.vignette = sc.vignette.replace(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g, (m) => humanizeLabel(m));
    }
  });
}

normalizeScenarioLabels();

const FIELD_MAP = {
  mean_X1: { label: 'Gemiddelde X₁ (x̄₁)', truth: 'x1_bar' },
  mean_X2: { label: 'Gemiddelde X₂ (x̄₂)', truth: 'x2_bar' },
  mean_Y: { label: 'Gemiddelde Y', truth: 'y_bar' },

  tot_S11: { label: 'S₁₁', truth: 'S11' },
  tot_S22: { label: 'S₂₂', truth: 'S22' },
  tot_S33: { label: 'S₃₃', truth: 'S33' },
  tot_S12: { label: 'S₁₂', truth: 'S12' },
  tot_S13: { label: 'S₁₃', truth: 'S13' },
  tot_S23: { label: 'S₂₃', truth: 'S23' },
  tot_S1Y: { label: 'S₁Y', truth: 'S1y' },
  tot_S2Y: { label: 'S₂Y', truth: 'S2y' },
  tot_S3Y: { label: 'S₃Y', truth: 'S3y' },
  tot_SST: { label: 'SST', truth: 'SST' },

  coef_a: { label: 'Intercept a', truth: 'a' },
  coef_b1: { label: 'b₁', truth: 'b1' },
  coef_b2: { label: 'b₂', truth: 'b2' },
  coef_b3: { label: 'b₃', truth: 'b3' },

  fit_R2: { label: 'R²', truth: 'R2' },
  fit_delta_R2: { label: 'ΔR²', truth: 'delta_R2' },
  fit_alienation: { label: '1 − R²', truth: 'alienation' }
};

const STEP_GROUPS = {
  step1: ['mean_X1', 'mean_X2', 'mean_Y'],
  step2: ['tot_S11', 'tot_S22', 'tot_S33', 'tot_S12', 'tot_S13', 'tot_S23', 'tot_S1Y', 'tot_S2Y', 'tot_S3Y', 'tot_SST'],
  step3: ['coef_a', 'coef_b1', 'coef_b2', 'coef_b3'],
  step5: ['fit_R2', 'fit_delta_R2', 'fit_alienation']
};

const REQUIRED_FIELDS = Object.keys(FIELD_MAP);

const state = {
  scenario: null,
  data: [],
  truth: null,
  unlocked: false,
  hotMeans: null,
  hotTotals: null,
  hotCoef: null,
  hotFit: null,
  hotPred: null,
  hotMeansCellClasses: {},
  hotTotalsCellClasses: {},
  hotCoefCellClasses: {},
  hotFitCellClasses: {},
  hotPredCellClasses: {},
  charts: {
    interaction: null,
    calibration: null,
    residual: null
  }
};

const FIELD_HOT_MAP = {
  mean_X1: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 0, col: 1 },
  mean_X2: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 1, col: 1 },
  mean_Y: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 2, col: 1 },
  tot_S11: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 0, col: 1 },
  tot_S22: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 1, col: 1 },
  tot_S33: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 2, col: 1 },
  tot_S12: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 3, col: 1 },
  tot_S13: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 4, col: 1 },
  tot_S23: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 5, col: 1 },
  tot_S1Y: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 6, col: 1 },
  tot_S2Y: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 7, col: 1 },
  tot_S3Y: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 8, col: 1 },
  tot_SST: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 9, col: 1 },
  coef_a: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 0, col: 1 },
  coef_b1: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 1, col: 1 },
  coef_b2: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 2, col: 1 },
  coef_b3: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 3, col: 1 },
  fit_R2: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 0, col: 1 },
  fit_delta_R2: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 1, col: 1 },
  fit_alienation: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 2, col: 1 }
};

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getFieldValue(id) {
  const m = FIELD_HOT_MAP[id];
  if (!m) return NaN;
  const hot = state[m.hotKey];
  if (!hot) return NaN;
  const data = hot.getData();
  if (!data || !data[m.row]) return NaN;
  return parseNum(data[m.row][m.col]);
}

function r2(v) {
  return Math.round(v * 100) / 100;
}

function r4(v) {
  return Math.round(v * 10000) / 10000;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function safeSeed(seedRaw) {
  const s = Number(seedRaw);
  if (!Number.isFinite(s) || s <= 0) return null;
  const maxInt = 2147483647;
  return Math.floor(Math.abs(s)) % maxInt;
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

function randNormal(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleMean(arr) {
  if (!arr.length) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sampleSD(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const m = sampleMean(arr);
  const ss = arr.reduce((acc, v) => acc + (v - m) * (v - m), 0);
  return Math.sqrt(ss / (n - 1));
}

function scaleLatent(z, center, spread, bounds) {
  const mu = sampleMean(z);
  const sd = sampleSD(z);
  const zz = (!Number.isFinite(sd) || sd === 0) ? z.slice() : z.map(v => (v - mu) / sd);
  return zz.map(v => r2(clamp(center + spread * v, bounds[0], bounds[1])));
}

function parseNum(str) {
  if (str == null) return NaN;
  const txt = String(str).trim().replace(',', '.');
  if (!txt) return NaN;
  const n = Number(txt);
  return Number.isFinite(n) ? n : NaN;
}

function checkDecimals(userVal, trueVal, digits = 4) {
  if (!Number.isFinite(userVal) || !Number.isFinite(trueVal)) return false;
  const p = 10 ** digits;
  return Math.round(userVal * p) === Math.round(trueVal * p);
}

function getScenarioById(id) {
  return SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
}

function randomScenario() {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

function makeData(sc, nRaw, seedRaw) {
  const n = Math.max(5, Math.min(MAX_SAMPLE_SIZE, Number.isFinite(Number(nRaw)) ? Math.floor(Number(nRaw)) : 12));
  const ss = safeSeed(seedRaw);
  const rng = mulberry32(ss == null ? Math.floor(Math.random() * 1e9) : ss);

  const rho = sc.design.rho;
  const z1 = Array.from({ length: n }, () => randNormal(rng));
  const z2 = z1.map(v => rho * v + Math.sqrt(Math.max(0, 1 - rho * rho)) * randNormal(rng));

  const x1 = scaleLatent(z1, sc.design.x1_center, sc.design.x1_scale, sc.design.x1_bounds);
  const x2 = scaleLatent(z2, sc.design.x2_center, sc.design.x2_scale, sc.design.x2_bounds);

  const x1m = sampleMean(x1);
  const x2m = sampleMean(x2);

  const rows = [];
  for (let i = 0; i < n; i++) {
    const x1c = x1[i] - x1m;
    const x2c = x2[i] - x2m;
    const intTerm = x1c * x2c;
    const rawY = sc.design.y_base + sc.design.b1 * x1c + sc.design.b2 * x2c + sc.design.b3 * intTerm + randNormal(rng) * sc.design.noise;
    const y = r2(clamp(rawY, sc.design.y_bounds[0], sc.design.y_bounds[1]));
    rows.push({
      entity: `${sc.entity} ${i + 1}`,
      x1: x1[i],
      x2: x2[i],
      y
    });
  }

  return rows;
}

function transpose(M) {
  return M[0].map((_, c) => M.map(r => r[c]));
}

function matMul(A, B) {
  const rows = A.length;
  const cols = B[0].length;
  const kLen = B.length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < kLen; k++) {
      for (let j = 0; j < cols; j++) {
        out[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return out;
}

function matVecMul(A, v) {
  return A.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
}

function solveLinearSystem(Ain, bin) {
  const n = Ain.length;
  const A = Ain.map(r => r.slice());
  const b = bin.slice();

  for (let i = 0; i < n; i++) {
    let pivot = i;
    let maxVal = Math.abs(A[i][i]);
    for (let r = i + 1; r < n; r++) {
      const val = Math.abs(A[r][i]);
      if (val > maxVal) {
        maxVal = val;
        pivot = r;
      }
    }
    if (maxVal < 1e-12) return null;

    if (pivot !== i) {
      [A[i], A[pivot]] = [A[pivot], A[i]];
      [b[i], b[pivot]] = [b[pivot], b[i]];
    }

    const div = A[i][i];
    for (let c = i; c < n; c++) A[i][c] /= div;
    b[i] /= div;

    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = A[r][i];
      for (let c = i; c < n; c++) A[r][c] -= factor * A[i][c];
      b[r] -= factor * b[i];
    }
  }

  return b;
}

function regressionBetas(X, y) {
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const Xty = matVecMul(Xt, y);
  const sol = solveLinearSystem(XtX, Xty);
  return sol;
}

function calcTruth(data) {
  if (!data.length) return null;

  const X1 = data.map(d => r2(d.x1));
  const X2 = data.map(d => r2(d.x2));
  const Y = data.map(d => r2(d.y));

  const x1_bar = r4(sampleMean(X1));
  const x2_bar = r4(sampleMean(X2));
  const y_bar = r4(sampleMean(Y));

  const x1c = X1.map(v => r4(v - x1_bar));
  const x2c = X2.map(v => r4(v - x2_bar));
  const yc = Y.map(v => r4(v - y_bar));
  const int_term = x1c.map((v, i) => r4(v * x2c[i]));

  const S11 = r4(x1c.reduce((s, v) => s + r4(v * v), 0));
  const S22 = r4(x2c.reduce((s, v) => s + r4(v * v), 0));
  const S33 = r4(int_term.reduce((s, v) => s + r4(v * v), 0));
  const S12 = r4(x1c.reduce((s, v, i) => s + r4(v * x2c[i]), 0));
  const S13 = r4(x1c.reduce((s, v, i) => s + r4(v * int_term[i]), 0));
  const S23 = r4(x2c.reduce((s, v, i) => s + r4(v * int_term[i]), 0));
  const S1y = r4(x1c.reduce((s, v, i) => s + r4(v * yc[i]), 0));
  const S2y = r4(x2c.reduce((s, v, i) => s + r4(v * yc[i]), 0));
  const S3y = r4(int_term.reduce((s, v, i) => s + r4(v * yc[i]), 0));
  const SST = r4(yc.reduce((s, v) => s + r4(v * v), 0));

  const Xfull = x1c.map((v, i) => [1, v, x2c[i], int_term[i]]);
  const betaFull = regressionBetas(Xfull, Y);
  if (!betaFull) return null;

  const a = r4(betaFull[0]);
  const b1 = r4(betaFull[1]);
  const b2 = r4(betaFull[2]);
  const b3 = r4(betaFull[3]);

  const yhat = Xfull.map(row => r4(row[0] * a + row[1] * b1 + row[2] * b2 + row[3] * b3));
  const SSE = r4(Y.reduce((s, v, i) => s + r4((v - yhat[i]) ** 2), 0));
  const R2 = SST === 0 ? 0 : r4(1 - r4(SSE / SST));

  const Xadd = x1c.map((v, i) => [1, v, x2c[i]]);
  const betaAdd = regressionBetas(Xadd, Y);
  if (!betaAdd) return null;
  const yhatAdd = Xadd.map(row => r4(row[0] * betaAdd[0] + row[1] * betaAdd[1] + row[2] * betaAdd[2]));
  const SSEadd = r4(Y.reduce((s, v, i) => s + r4((v - yhatAdd[i]) ** 2), 0));
  const R2_add = SST === 0 ? 0 : r4(1 - r4(SSEadd / SST));
  const delta_R2 = r4(R2 - R2_add);

  let x2_sd = r4(sampleSD(x2c));
  if (!Number.isFinite(x2_sd) || x2_sd === 0) x2_sd = 1;

  return {
    x1_bar, x2_bar, y_bar,
    S11, S22, S33, S12, S13, S23, S1y, S2y, S3y, SST,
    a, b1, b2, b3,
    yhat,
    R2,
    R2_add,
    delta_R2,
    alienation: r4(1 - R2),
    x1c,
    x2c,
    int_term,
    x2_sd,
    slope_low: r4(b1 + b3 * (-x2_sd)),
    slope_mean: r4(b1),
    slope_high: r4(b1 + b3 * x2_sd)
  };
}

function makeHotCells(classKey) {
  return function cells(row, col) {
    const key = `${row}-${col}`;
    const cls = state[classKey][key];
    const classes = [col === 0 ? 'htLeft' : 'htCenter'];
    if (cls === 'correct') classes.push('htCorrect');
    if (cls === 'incorrect') classes.push('htIncorrect');
    return { className: classes.join(' ') };
  };
}

function renderHotMeans() {
  const container = document.getElementById('hot-means-container');
  if (!container) return;
  if (state.hotMeans) { state.hotMeans.destroy(); state.hotMeans = null; }
  state.hotMeansCellClasses = {};
  container.innerHTML = '';
  if (!state.data.length) return;

  const sc = state.scenario;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    [`Gemiddelde X₁ — ${sc.vars.x1}`, null],
    [`Gemiddelde X₂ — ${sc.vars.x2}`, null],
    [`Gemiddelde Y — ${sc.vars.y}`, null]
  ];

  state.hotMeans = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [300, 140],
    rowHeaders: false,
    allowInsertRow: false,
    allowInsertColumn: false,
    width: 440,
    height: 'auto',
    stretchH: 'none',
    cells: makeHotCells('hotMeansCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotTotals() {
  const container = document.getElementById('hot-totals-container');
  if (!container) return;
  if (state.hotTotals) { state.hotTotals.destroy(); state.hotTotals = null; }
  state.hotTotalsCellClasses = {};
  container.innerHTML = '';
  if (!state.data.length) return;

  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['S₁₁', null],
    ['S₂₂', null],
    ['S₃₃', null],
    ['S₁₂', null],
    ['S₁₃', null],
    ['S₂₃', null],
    ['S₁Y', null],
    ['S₂Y', null],
    ['S₃Y', null],
    ['SST', null]
  ];

  state.hotTotals = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [260, 140],
    rowHeaders: false,
    allowInsertRow: false,
    allowInsertColumn: false,
    width: 400,
    height: 'auto',
    stretchH: 'none',
    cells: makeHotCells('hotTotalsCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotCoef() {
  const container = document.getElementById('hot-coef-container');
  if (!container) return;
  if (state.hotCoef) { state.hotCoef.destroy(); state.hotCoef = null; }
  state.hotCoefCellClasses = {};
  container.innerHTML = '';
  if (!state.data.length) return;

  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['Intercept a', null],
    ['b₁', null],
    ['b₂', null],
    ['b₃', null]
  ];

  state.hotCoef = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [260, 140],
    rowHeaders: false,
    allowInsertRow: false,
    allowInsertColumn: false,
    width: 400,
    height: 'auto',
    stretchH: 'none',
    cells: makeHotCells('hotCoefCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotFit() {
  const container = document.getElementById('hot-fit-container');
  if (!container) return;
  if (state.hotFit) { state.hotFit.destroy(); state.hotFit = null; }
  state.hotFitCellClasses = {};
  container.innerHTML = '';
  if (!state.data.length) return;

  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['R²', null],
    ['ΔR²', null],
    ['1 − R²', null]
  ];

  state.hotFit = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [260, 140],
    rowHeaders: false,
    allowInsertRow: false,
    allowInsertColumn: false,
    width: 400,
    height: 'auto',
    stretchH: 'none',
    cells: makeHotCells('hotFitCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function setScenarioText(sc) {
  const titleEl = document.getElementById('scenario-title');
  if (titleEl) titleEl.textContent = sc.title;
  const el = document.getElementById('scenario-text');
  el.textContent = sc.vignette;
  const metaEl = document.getElementById('scenario-meta');
  if (metaEl) metaEl.innerHTML = '';
}

function renderDatasetTable() {
  const sc = state.scenario;
  const tbl = document.getElementById('dataset-table');
  tbl.className = 'dataset-table';
  const rows = state.data;
  tbl.innerHTML = '';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${sc.vars.x1}</th><th>${sc.vars.x2}</th><th>${sc.vars.y}</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r.x1.toFixed(2)}</td><td>${r.x2.toFixed(2)}</td><td>${r.y.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

function renderHotPred() {
  const container = document.getElementById('pred-table-container');
  if (!container) return;
  if (state.hotPred) { state.hotPred.destroy(); state.hotPred = null; }
  state.hotPredCellClasses = {};
  container.innerHTML = '';
  if (!state.data.length || !state.truth) return;

  const sc = state.scenario;
  const t = state.truth;
  const hotValidate = debounce(evaluateAll, 250);

  const tableData = state.data.map((r, i) => ([
    r.entity,
    t.x1c[i],
    t.x2c[i],
    t.int_term[i],
    r.y,
    null
  ]));

  const w0 = Math.max(70, Math.ceil(state.data[0].entity.length * 7) + 16);
  state.hotPred = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Eenheid', 'X₁c', 'X₂c', 'INT', sc.vars.y, 'Ŷ = a + b₁X₁c + b₂X₂c + b₃INT'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 110, 110, 110, 120, 260],
    rowHeaders: false,
    allowInsertRow: false,
    allowInsertColumn: false,
    width: w0 + 710,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotPredCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (col >= 1 && col <= 4) classes.push('htDimmed');
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function resetInputs() {
  state.hotMeansCellClasses = {};
  state.hotTotalsCellClasses = {};
  state.hotCoefCellClasses = {};
  state.hotFitCellClasses = {};
  state.hotPredCellClasses = {};
  ['fb-deel2', 'fb-deel3', 'fb-deel4', 'fb-deel5', 'fb-deel6'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.className = 'section-summary'; }
  });
  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('viz-card').classList.add('hidden');
  state.unlocked = false;
  setVizNavLock(false);
  updateProgress(0, REQUIRED_FIELDS.length);
}

function markField(id, ok, attempted) {
  const m = FIELD_HOT_MAP[id];
  if (!m) return;
  const key = `${m.row}-${m.col}`;
  if (!attempted) {
    delete state[m.classKey][key];
  } else if (ok) {
    state[m.classKey][key] = 'correct';
  } else {
    state[m.classKey][key] = 'incorrect';
  }
}

function evaluatePredictions() {
  if (!state.truth || !state.data.length) return { allEntered: false, allCorrect: false };
  const t = state.truth;
  const d = state.hotPred ? state.hotPred.getData() : [];
  const n = state.data.length;
  const newCls = {};
  let correct = 0;
  let entered = 0;

  for (let i = 0; i < n; i++) {
    const raw = d[i] ? d[i][5] : null;
    const str = raw == null ? '' : String(raw).trim();
    if (!str) continue;
    entered += 1;

    const num = parseNum(str);
    if (!Number.isFinite(num)) {
      newCls[`${i}-5`] = 'incorrect';
      continue;
    }
    if (checkDecimals(num, t.yhat[i], 4)) {
      newCls[`${i}-5`] = 'correct';
      correct += 1;
    } else {
      newCls[`${i}-5`] = 'incorrect';
    }
  }

  state.hotPredCellClasses = newCls;
  if (state.hotPred) state.hotPred.render();
  updateSectionSummary('fb-deel5', correct, n, 'Voorspellingen correct', 'controleer voorspellingen');
  return { allEntered: entered === n, allCorrect: correct === n };
}

function simpleLine(points) {
  if (!points.length) return null;
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sx2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sx2 - sx * sx;
  if (Math.abs(denom) < 1e-12) return { b0: sy / n, b1: 0 };
  const b1 = (n * sxy - sx * sy) / denom;
  const b0 = (sy - b1 * sx) / n;
  return { b0, b1 };
}

function destroyCharts() {
  Object.values(state.charts).forEach(ch => {
    if (ch) ch.destroy();
  });
  state.charts.interaction = null;
  state.charts.calibration = null;
  state.charts.residual = null;
}

function renderInteractionChart() {
  const sc = state.scenario;
  const t = state.truth;
  const X1 = state.data.map(d => d.x1);
  const Y = state.data.map(d => d.y);

  const minX = Math.min(...X1);
  const maxX = Math.max(...X1);
  const seq = Array.from({ length: 80 }, (_, i) => minX + (i * (maxX - minX) / 79));

  const lines = [
    { label: 'Lage X2 (-1 s)', x2c: -t.x2_sd, color: '#2563eb' },
    { label: 'Gemiddelde X2', x2c: 0, color: '#16a34a' },
    { label: 'Hoge X2 (+1 s)', x2c: t.x2_sd, color: '#dc2626' }
  ];

  const datasets = [
    {
      type: 'scatter',
      label: 'Observaties',
      data: X1.map((x, i) => ({ x, y: Y[i] })),
      backgroundColor: '#475569',
      pointRadius: 4
    }
  ];

  lines.forEach(l => {
    datasets.push({
      type: 'line',
      label: l.label,
      data: seq.map(x => {
        const x1c = x - t.x1_bar;
        const yhat = t.a + t.b1 * x1c + t.b2 * l.x2c + t.b3 * (x1c * l.x2c);
        return { x, y: yhat };
      }),
      borderColor: l.color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0
    });
  });

  const ctx = document.getElementById('interaction-chart').getContext('2d');
  state.charts.interaction = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Interactieplot' }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: sc.vars.x1 } },
        y: { title: { display: true, text: sc.vars.y } }
      }
    }
  });
}

function renderCalibrationChart() {
  const sc = state.scenario;
  const t = state.truth;
  const Y = state.data.map(d => d.y);
  const pts = t.yhat.map((p, i) => ({ x: p, y: Y[i] }));

  const minV = Math.min(...pts.map(p => Math.min(p.x, p.y)));
  const maxV = Math.max(...pts.map(p => Math.max(p.x, p.y)));

  const lineFit = simpleLine(pts);
  const ctx = document.getElementById('calibration-chart').getContext('2d');
  state.charts.calibration = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Observaties',
          data: pts,
          backgroundColor: '#2563eb',
          pointRadius: 4
        },
        {
          type: 'line',
          label: 'Perfecte calibratie',
          data: [{ x: minV, y: minV }, { x: maxV, y: maxV }],
          borderColor: '#dc2626',
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0
        },
        {
          type: 'line',
          label: 'Lineaire trend',
          data: [{ x: minV, y: lineFit.b0 + lineFit.b1 * minV }, { x: maxV, y: lineFit.b0 + lineFit.b1 * maxV }],
          borderColor: '#16a34a',
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Kalibratieplot' }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Voorspeld' } },
        y: { title: { display: true, text: 'Geobserveerd' } }
      }
    }
  });
}

function renderResidualChart() {
  const t = state.truth;
  const Y = state.data.map(d => d.y);
  const pts = t.yhat.map((p, i) => ({ x: p, y: r4(Y[i] - p) }));

  const minX = Math.min(...pts.map(p => p.x));
  const maxX = Math.max(...pts.map(p => p.x));

  const fit = simpleLine(pts);

  const ctx = document.getElementById('residual-chart').getContext('2d');
  state.charts.residual = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Residuen',
          data: pts,
          backgroundColor: '#7c3aed',
          pointRadius: 4
        },
        {
          type: 'line',
          label: 'Nul-lijn',
          data: [{ x: minX, y: 0 }, { x: maxX, y: 0 }],
          borderColor: '#dc2626',
          pointRadius: 0,
          tension: 0
        },
        {
          type: 'line',
          label: 'Lineaire trend',
          data: [{ x: minX, y: fit.b0 + fit.b1 * minX }, { x: maxX, y: fit.b0 + fit.b1 * maxX }],
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Residuenplot' }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Voorspeld' } },
        y: { title: { display: true, text: 'Residuen' } }
      }
    }
  });
}

function renderInterpretation() {
  const t = state.truth;
  const sc = state.scenario;
  const direction = t.b3 > 0 ? 'positief' : (t.b3 < 0 ? 'negatief' : 'nagenoeg nul');
  const el = document.getElementById('interpretation');
  el.innerHTML = `
    <b>Interpretatie</b>
    <ul>
      <li>Model: ${sc.vars.y} ~ X1c + X2c + INT</li>
      <li>b1 = ${t.b1.toFixed(4)}, b2 = ${t.b2.toFixed(4)}, b3 = ${t.b3.toFixed(4)}</li>
      <li>De interactie is <b>${direction}</b>: het effect van X\u2081 op Y verandert naargelang het niveau van X\u2082.</li>
      <li>Simple slopes tonen het effect van X\u2081 bij drie niveaus van X\u2082:</li>
      <li style="padding-left:1.2em">Laag X\u2082: ${t.slope_low.toFixed(4)} &nbsp;|&nbsp; Gemiddeld X\u2082: ${t.slope_mean.toFixed(4)} &nbsp;|&nbsp; Hoog X\u2082: ${t.slope_high.toFixed(4)}</li>
      <li>R\u00b2 = ${t.R2.toFixed(4)}, \u0394R\u00b2 = ${t.delta_R2.toFixed(4)} (extra verklaarde variantie door de interactieterm), 1 \u2212 R\u00b2 = ${t.alienation.toFixed(4)}</li>
    </ul>
  `;
}

function renderUnlockedViews() {
  destroyCharts();
  renderInteractionChart();
  renderCalibrationChart();
  renderResidualChart();
  renderInterpretation();
}

function updateSectionSummary(divId, correct, total, labelOk, labelPartial) {
  const el = document.getElementById(divId);
  if (!el) return;
  if (total === 0) { el.innerHTML = ''; el.className = 'section-summary'; return; }
  if (correct === total) {
    el.innerHTML = `\u2705 ${labelOk} (${correct}/${total})`;
    el.className = 'section-summary ok';
  } else {
    el.innerHTML = `${correct}/${total} correct \u2014 ${labelPartial}`;
    el.className = 'section-summary partial';
  }
}

function evaluateAll() {
  if (!state.truth) return;

  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  REQUIRED_FIELDS.forEach(id => {
    totalCount += 1;
    const val = getFieldValue(id);
    const attempted = Number.isFinite(val);
    const truthKey = FIELD_MAP[id].truth;
    const truthVal = state.truth[truthKey];
    const ok = attempted && checkDecimals(val, truthVal, 4);

    if (!attempted) allEntered = false;
    if (!ok) allCorrect = false;
    if (ok) correctCount += 1;

    markField(id, ok, attempted);
  });

  [state.hotMeans, state.hotTotals, state.hotCoef, state.hotFit].forEach((hot) => {
    if (hot) hot.render();
  });
  const predResult = evaluatePredictions();

  const SECTION_GROUPS = [
    { id: 'fb-deel2', fields: STEP_GROUPS.step1, ok: 'Gemiddelden correct', partial: 'controleer gemiddelden' },
    { id: 'fb-deel3', fields: STEP_GROUPS.step2, ok: 'Totalen correct', partial: 'controleer S-waarden' },
    { id: 'fb-deel4', fields: STEP_GROUPS.step3, ok: 'Co\u00ebffici\u00ebnten correct', partial: 'controleer co\u00ebffici\u00ebnten' },
    { id: 'fb-deel6', fields: STEP_GROUPS.step5, ok: 'Model fit correct', partial: 'controleer R2 en Delta R2' },
  ];
  SECTION_GROUPS.forEach(sg => {
    let sc = 0;
    sg.fields.forEach(fid => {
      const val = getFieldValue(fid);
      const attempted = Number.isFinite(val);
      const truthKey = FIELD_MAP[fid].truth;
      const ok = attempted && checkDecimals(val, state.truth[truthKey], 4);
      if (ok) sc++;
    });
    updateSectionSummary(sg.id, sc, sg.fields.length, sg.ok, sg.partial);
  });

  updateProgress(correctCount, totalCount);

  const unlock = allEntered && allCorrect && predResult.allEntered && predResult.allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    setVizNavLock(unlock);

    const successCard = document.getElementById('success-card');
    const vizCard = document.getElementById('viz-card');

    if (unlock) {
      successCard.classList.remove('hidden');
      vizCard.classList.remove('locked');
      vizCard.classList.remove('hidden');
      renderUnlockedViews();
    } else {
      successCard.classList.add('hidden');
      vizCard.classList.add('locked');
      vizCard.classList.add('hidden');
      destroyCharts();
      document.getElementById('interpretation').innerHTML = '';
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
      if (layoutEl) layoutEl.style.gridTemplateColumns = `${newWidth}px 6px 1fr`;
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
  const scenarioSelect = document.getElementById('scenario');
  const nEl = document.getElementById('n');
  const seedEl = document.getElementById('seed');

  const sc = random ? randomScenario() : getScenarioById(scenarioSelect.value);
  scenarioSelect.value = sc.id;
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

  state.scenario = sc;
  state.data = makeData(sc, nEl.value, seedToUse);
  state.truth = calcTruth(state.data);

  setScenarioText(sc);
  renderDatasetTable();
  resetInputs();
  renderHotMeans();
  renderHotTotals();
  renderHotCoef();
  renderHotPred();
  renderHotFit();
  evaluateAll();
  destroyCharts();
  document.getElementById('interpretation').innerHTML = '';
}

function initScenarioSelect() {
  const sel = document.getElementById('scenario');
  sel.innerHTML = '';
  SCENARIOS.forEach(sc => {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.title;
    sel.appendChild(opt);
  });
}

function bindControls() {
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
  initScenarioSelect();
  setupNav();
  setupSidebarChrome();
  bindControls();
  const seedEl = document.getElementById('seed');
  if (seedEl) {
    seedEl.value = String(nextRandomSeed());
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  generate(false);
}

document.addEventListener('DOMContentLoaded', init);


})();

