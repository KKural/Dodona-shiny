'use strict';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
    vignette: 'Een stad heeft een preventieprogramma geimplementeerd in verschillende buurten. Onderzoek of een hogere blootstelling samenhangt met lagere inbraakcijfers.',
    vars: { x: { name: 'ProgrammaBlootstelling', unit: '%' }, y: { name: 'InbraakCijfer', unit: 'per 1.000' } },
    gen: { r_target: -0.45 },
    entity: 'Buurt'
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Straten varieren in aantal voetpatrouille-uren op criminele hotspots. Beoordeel de relatie met het aantal meldingen aan de politie.',
    vars: { x: { name: 'VoetPatrouilleUren', unit: 'uren/week' }, y: { name: 'MeldingenAanPolitie', unit: 'per week' } },
    gen: { r_target: -0.25 },
    entity: 'Straat'
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'Ondervraagde bewoners beoordelen fysieke/sociale wanorde en angst voor criminaliteit.',
    vars: { x: { name: 'WanordeIndex', unit: '0-10' }, y: { name: 'AngstScore', unit: '0-100' } },
    gen: { r_target: 0.55 },
    entity: 'Buurt'
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'Percepties van procedurale rechtvaardigheid versus vertrouwen in politie per district.',
    vars: { x: { name: 'ProcedureleRechtvaardigheid', unit: '1-7' }, y: { name: 'VertrouwenInPolitie', unit: '1-7' } },
    gen: { r_target: 0.70 },
    entity: 'District'
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'Toezichtscores van huishoudens versus slachtofferschapincidenten.',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' } },
    gen: { r_target: -0.40 },
    entity: 'Huishouden'
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'Impulsiviteit versus agressieve incidenten onder jongeren.',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'AgressieveIncidenten', unit: 'schoolmeldingen/trimester' } },
    gen: { r_target: 0.45 },
    entity: 'Student'
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Begeleiding na vrijlating (in uren per maand) versus gevalideerde recidiverisicoscore.',
    vars: { x: { name: 'OndersteuningsUren', unit: 'per maand' }, y: { name: 'RecidiveRisico', unit: '0-100' } },
    gen: { r_target: -0.35 },
    entity: 'Deelnemer'
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'Phishing-trainingsuren versus gesimuleerde klikratio.',
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
  predInputs: [],
  unlocked: false,
  charts: { scatter: null, calibration: null, residual: null }
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

function tableInput(id, width = 120) {
  return `<input id="${id}" class="table-input" type="number" step="any" placeholder="0.0000" style="width:${width}px" />`;
}

function tableMsg(id) {
  return `<div id="${id}_msg" class="msg table-msg"></div>`;
}

function wireTableInputs(container) {
  container.querySelectorAll('input.table-input').forEach((input) => {
    input.addEventListener('input', evaluateAll);
  });
}

function makePasteBlock(id, fields) {
  return `
    <div class="section-paste" id="${id}">
      <div class="paste-hint">Plakken uit Excel voor deze tabel:</div>
      <div class="paste-format-wrap">
        <table class="paste-cols-table">
          <thead><tr>${fields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead>
          <tbody><tr>${fields.map(() => '<td>...</td>').join('')}</tr></tbody>
        </table>
      </div>
      <textarea class="excel-paste-area" rows="2" placeholder="Plak hier de Excel-waarden voor deze tabel"></textarea>
      <button type="button" class="btn-secondary btn-section-paste">Vul tabel in</button>
      <div class="paste-status"></div>
    </div>`;
}

function attachPasteBlock(block, fields) {
  if (!block) return;
  const area = block.querySelector('.excel-paste-area');
  const button = block.querySelector('.btn-section-paste');
  const status = block.querySelector('.paste-status');
  const fill = () => {
    const values = parseExcelPasteValues(area.value);
    let filled = 0;
    fields.forEach((field, i) => {
      if (i < values.length && setExcelPasteTarget(field.target, values[i])) filled += 1;
    });
    evaluateAll();
    status.textContent = values.length < fields.length
      ? `${filled}/${fields.length} waarden ingevuld. Er ontbreken nog waarden.`
      : `${filled}/${fields.length} waarden ingevuld.`;
  };
  button.addEventListener('click', fill);
  area.addEventListener('paste', () => window.setTimeout(fill, 0));
}

function renderMeansTable() {
  const container = document.getElementById('means-grid');
  if (!container) return;
  container.className = 'table-wrap';
  const fields = [
    { label: 'Gemiddelde X', target: 'mean_X' },
    { label: 'Gemiddelde Y', target: 'mean_Y' }
  ];
  container.innerHTML = `
    <table class="calc-input-table">
      <thead><tr><th>Grootheid</th><th>Jouw antwoord</th><th>Feedback</th></tr></thead>
      <tbody>
        <tr><td>Gemiddelde X</td><td>${tableInput('mean_X')}</td><td>${tableMsg('mean_X')}</td></tr>
        <tr><td>Gemiddelde Y</td><td>${tableInput('mean_Y')}</td><td>${tableMsg('mean_Y')}</td></tr>
      </tbody>
    </table>
    ${makePasteBlock('paste-means', fields)}`;
  wireTableInputs(container);
  attachPasteBlock(document.getElementById('paste-means'), fields);
}

function renderDeviationCalcTable() {
  const container = document.getElementById('totals-grid');
  if (!container) return;
  container.className = 'table-wrap';
  const { x, y } = state.names;
  const fields = [];
  const rows = state.rows.map((row, i) => {
    const ids = [`dev-dx-${i}`, `dev-dy-${i}`, `dev-dx2-${i}`, `dev-dy2-${i}`, `dev-dxdy-${i}`];
    fields.push(
      { label: `Rij ${i + 1} x-xbar`, target: ids[0] },
      { label: `Rij ${i + 1} y-ybar`, target: ids[1] },
      { label: `Rij ${i + 1} (x-xbar)^2`, target: ids[2] },
      { label: `Rij ${i + 1} (y-ybar)^2`, target: ids[3] },
      { label: `Rij ${i + 1} product`, target: ids[4] }
    );
    return `
      <tr>
        <td>${row.entity}</td>
        <td>${r2(Number(row[x])).toFixed(2)}</td>
        <td>${r2(Number(row[y])).toFixed(2)}</td>
        <td>${tableInput(ids[0], 110)}</td>
        <td>${tableInput(ids[1], 110)}</td>
        <td>${tableInput(ids[2], 110)}</td>
        <td>${tableInput(ids[3], 110)}</td>
        <td>${tableInput(ids[4], 120)}</td>
      </tr>`;
  }).join('');
  fields.push(
    { label: 'Som (x-xbar)^2', target: 'tot_X1_2' },
    { label: 'Som (y-ybar)^2', target: 'tot_Y2' },
    { label: 'Kruisproductsom', target: 'cross_product_sum' }
  );
  container.innerHTML = `
    <p class="instruction">Bereken afwijkingen, kwadraten en kruisproducten. De onderste rij bevat de kolomsommen.</p>
    <table class="calc-input-table wide-calc-table">
      <thead>
        <tr>
          <th>Eenheid</th><th>${x || 'X'}</th><th>${y || 'Y'}</th>
          <th>x - xbar</th><th>y - ybar</th><th>(x - xbar)^2</th><th>(y - ybar)^2</th><th>(x - xbar)(y - ybar)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="sum-row">
          <td colspan="5"><strong>Kolomsommen</strong></td>
          <td>${tableInput('tot_X1_2', 120)}${tableMsg('tot_X1_2')}</td>
          <td>${tableInput('tot_Y2', 120)}${tableMsg('tot_Y2')}</td>
          <td>${tableInput('cross_product_sum', 130)}${tableMsg('cross_product_sum')}</td>
        </tr>
      </tbody>
    </table>
    <div id="dev-table-msg" class="status"></div>
    ${makePasteBlock('paste-deviations', fields)}`;
  wireTableInputs(container);
  attachPasteBlock(document.getElementById('paste-deviations'), fields);
}

function renderStatsTable() {
  const container = document.getElementById('stats-grid');
  if (!container) return;
  container.className = 'table-wrap';
  const fields = [
    { label: 'Var(X)', target: 'var_X' }, { label: 'SD(X)', target: 'sd_X' },
    { label: 'Var(Y)', target: 'var_Y' }, { label: 'SD(Y)', target: 'sd_Y' },
    { label: 'Cov(X,Y)', target: 'covariance' }, { label: 'SD(X)*SD(Y)', target: 'sd_product' },
    { label: 'r', target: 'correlation' }
  ];
  container.innerHTML = `
    <table class="calc-input-table">
      <thead><tr><th>Grootheid</th><th>Jouw antwoord</th><th>Feedback</th></tr></thead>
      <tbody>
        <tr><td>Var(X)</td><td>${tableInput('var_X')}</td><td>${tableMsg('var_X')}</td></tr>
        <tr><td>SD(X)</td><td>${tableInput('sd_X')}</td><td>${tableMsg('sd_X')}</td></tr>
        <tr><td>Var(Y)</td><td>${tableInput('var_Y')}</td><td>${tableMsg('var_Y')}</td></tr>
        <tr><td>SD(Y)</td><td>${tableInput('sd_Y')}</td><td>${tableMsg('sd_Y')}</td></tr>
        <tr><td>Cov(X,Y)</td><td>${tableInput('covariance')}</td><td>${tableMsg('covariance')}</td></tr>
        <tr><td>SD(X) * SD(Y)</td><td>${tableInput('sd_product')}</td><td>${tableMsg('sd_product')}</td></tr>
        <tr><td>Correlatie r</td><td>${tableInput('correlation')}</td><td>${tableMsg('correlation')}</td></tr>
      </tbody>
    </table>
    ${makePasteBlock('paste-stats', fields)}`;
  wireTableInputs(container);
  attachPasteBlock(document.getElementById('paste-stats'), fields);
}

function renderRegressionTable() {
  const container = document.getElementById('reg-grid');
  if (!container) return;
  container.className = 'table-wrap';
  const fields = [
    { label: 'Helling b', target: 'slope' },
    { label: 'Intercept a', target: 'intercept' }
  ];
  container.innerHTML = `
    <table class="calc-input-table">
      <thead><tr><th>Grootheid</th><th>Jouw antwoord</th><th>Feedback</th></tr></thead>
      <tbody>
        <tr><td>Helling b</td><td>${tableInput('slope')}</td><td>${tableMsg('slope')}</td></tr>
        <tr><td>Intercept a</td><td>${tableInput('intercept')}</td><td>${tableMsg('intercept')}</td></tr>
      </tbody>
    </table>
    ${makePasteBlock('paste-reg', fields)}`;
  wireTableInputs(container);
  attachPasteBlock(document.getElementById('paste-reg'), fields);
}

function renderFitTable() {
  const container = document.getElementById('fit-grid');
  if (!container) return;
  container.className = 'table-wrap';
  const fields = [
    { label: 'R2', target: 'r_squared' },
    { label: 'Vervreemding', target: 'alienation' },
    { label: 'F-statistiek', target: 'f_stat' },
    { label: 'Model p-waarde', target: 'model_p_value' }
  ];
  container.innerHTML = `
    <table class="calc-input-table">
      <thead><tr><th>Grootheid</th><th>Jouw antwoord</th><th>Feedback</th></tr></thead>
      <tbody>
        <tr><td>R2</td><td>${tableInput('r_squared')}</td><td>${tableMsg('r_squared')}</td></tr>
        <tr><td>Vervreemdingscoefficient</td><td>${tableInput('alienation')}</td><td>${tableMsg('alienation')}</td></tr>
        <tr><td>F-statistiek</td><td>${tableInput('f_stat')}</td><td>${tableMsg('f_stat')}</td></tr>
        <tr><td>Model p-waarde</td><td>${tableInput('model_p_value')}</td><td>${tableMsg('model_p_value')}</td></tr>
      </tbody>
    </table>
    ${makePasteBlock('paste-fit', fields)}`;
  wireTableInputs(container);
  attachPasteBlock(document.getElementById('paste-fit'), fields);
}

function buildFields() {
  renderMeansTable();
  renderDeviationCalcTable();
  renderStatsTable();
  renderRegressionTable();
  renderFitTable();
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
  document.getElementById('scenario-text').innerHTML = `<b>${sc.title}</b><br>${sc.vignette}<br><br>X = <b>${names.x}</b> | Y = <b>${names.y}</b>`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  tbl.innerHTML = '';

  const { x, y } = state.names;
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

function renderPredictionTable() {
  const tbl = document.getElementById('pred-table');
  tbl.innerHTML = '';
  state.predInputs = [];
  if (!state.truth) return;

  const { x, y } = state.names;
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x}</th><th>${y}</th><th>Yhat = a + b*X</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r2(Number(r[x])).toFixed(2)}</td><td>${r2(Number(r[y])).toFixed(2)}</td>`;
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

function setExcelPasteTarget(target, value) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
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
  document.querySelectorAll('#totals-grid input.table-input').forEach((inp) => {
    if (FIELD_TRUTH_KEY[inp.id]) return;
    inp.value = '';
    inp.classList.remove('valid', 'invalid');
  });
  const devMsg = document.getElementById('dev-table-msg');
  if (devMsg) {
    devMsg.textContent = '';
    devMsg.className = 'status';
  }

  document.getElementById('pred-msg').textContent = '';
  document.getElementById('pred-msg').className = 'status';
  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('interpretation').innerHTML = '';
  state.unlocked = false;
  destroyCharts();
  setVizNavLock(false);
  updateProgress(0, getRequiredCount());
}

const FIELD_HINTS = {
  mean_X: 'gem(X) = ΣX / n',
  mean_Y: 'gem(Y) = ΣY / n',
  tot_X1_2: 'Variatie = Σ(Xi − X̄)²',
  tot_Y2: 'Variatie = Σ(Yi − Y̅)²',
  var_X: 's²(X) = Variatie(X) / (n−1)',
  sd_X: 's(X) = √Var(X)',
  var_Y: 's²(Y) = Variatie(Y) / (n−1)',
  sd_Y: 's(Y) = √Var(Y)',
  cross_product_sum: 'KPS = Σ(Xi−X̄)(Yi−Y̅)',
  covariance: 'Cov = KPS / (n−1)',
  sd_product: 's(X) × s(Y)',
  correlation: 'r = Cov(X,Y) / (s(X)·s(Y))',
  slope: 'b = Cov(X,Y) / Var(X)',
  intercept: 'a = Y̅ − b·X̄',
  r_squared: 'R² = r²',
  alienation: 'Vervreemding = 1 − R²',
  f_stat: 'F = (R²/k) / ((1−R²)/(n−k−1))',
  model_p_value: 'p = P(F ≥ f-waarde)',
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

function markTableInput(input, ok, attempted) {
  if (!input) return;
  input.classList.remove('valid', 'invalid');
  if (!attempted) return;
  input.classList.add(ok ? 'valid' : 'invalid');
}

function evaluateDeviationInputs() {
  if (!state.truth || !state.rows.length) return { allEntered: false, allCorrect: false, correctCount: 0, totalCount: 0 };
  const msg = document.getElementById('dev-table-msg');
  const specs = [
    { prefix: 'dev-dx', values: state.truth.dX },
    { prefix: 'dev-dy', values: state.truth.dY },
    { prefix: 'dev-dx2', values: state.truth.dX2 },
    { prefix: 'dev-dy2', values: state.truth.dY2 },
    { prefix: 'dev-dxdy', values: state.truth.dXdY }
  ];
  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  specs.forEach((spec) => {
    state.rows.forEach((_, i) => {
      const input = document.getElementById(`${spec.prefix}-${i}`);
      if (!input) return;
      totalCount += 1;
      const value = parseNum(input.value);
      const attempted = Number.isFinite(value);
      const ok = attempted && check4(value, spec.values[i]);
      if (!attempted) allEntered = false;
      if (!ok) allCorrect = false;
      if (ok) correctCount += 1;
      markTableInput(input, ok, attempted);
    });
  });

  if (msg) {
    if (!allEntered) {
      msg.textContent = '';
      msg.className = 'status';
    } else if (allCorrect) {
      msg.textContent = 'Afwijkingtabel OK';
      msg.className = 'status ok';
    } else {
      msg.textContent = 'Sommige cellen in de afwijkingtabel zijn fout.';
      msg.className = 'status err';
    }
  }
  return { allEntered, allCorrect, correctCount, totalCount };
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

  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  const dev = evaluateDeviationInputs();
  totalCount += dev.totalCount;
  correctCount += dev.correctCount;
  if (!dev.allEntered) allEntered = false;
  if (!dev.allCorrect) allCorrect = false;

  REQUIRED_FIELDS.forEach(id => {
    const required = isRequiredField(id);
    if (required) totalCount += 1;
    const inp = document.getElementById(id);
    const attempted = Number.isFinite(parseNum(inp.value));
    const val = parseNum(inp.value);
    const ref = state.truth[FIELD_TRUTH_KEY[id]];
    const ok = attempted && check4(val, ref);

    if (required) {
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
      <li>Oefen correlatieanalyse met criminologische datasets.</li>
      <li>Voltooi 9 stappen verdeeld over Delen I-V (gebruik 4 decimalen).</li>
      <li>Wanneer alle stappen kloppen, verschijnt visualisatie in Deel VI.</li>
      `
      : `
      <li>Oefen bivariate regressieanalyse met criminologische datasets.</li>
      <li>Voltooi 17 stappen verdeeld over Delen I-VIII (gebruik 4 decimalen).</li>
      <li>F-toets en model p-waarde horen bij de verplichte model-fitstappen.</li>
      `;
  }

  if (stepsList) {
    stepsList.innerHTML = corrMode
      ? `
      <li>Deel II: Stap 1 (rekenkundige gemiddelden).</li>
      <li>Deel III: Stappen 2-4 (afwijkingen en sommen).</li>
      <li>Deel IV: Stappen 5-9 (varianties, SD, covariantie en r).</li>
      `
      : `
      <li>Deel II: Stap 1 (rekenkundige gemiddelden).</li>
      <li>Deel III: Stappen 2-4 (afwijkingen en sommen).</li>
      <li>Deel IV: Stappen 5-9 (varianties, SD, covariantie en r).</li>
      <li>Deel VI-VIII: Stappen 10-17 (b, a, voorspellingen en model fit).</li>
      `;
  }

  if (nav4) nav4.textContent = 'IV. Stappen 5-9';
  if (hdr4) hdr4.textContent = 'Deel IV - Stappen 5-9: Covariatie en Voorbereiding';
  if (hdr5) hdr5.textContent = 'Deel VI - Stappen 10-12: Correlatie en Regressiecoëfficiënten';
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
  renderPredictionTable();
  buildFields();
  clearStatuses();
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
