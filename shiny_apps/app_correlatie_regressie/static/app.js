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

const state = {
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
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lb) / a;
  return front * betaCF(x, a, b);
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

  const sum_dX2 = r4(dX.reduce((s, v) => s + v * v, 0));
  const sum_dY2 = r4(dY.reduce((s, v) => s + v * v, 0));
  const cross_product_sum = r4(dX.reduce((s, v, i) => s + v * dY[i], 0));

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
    dX, dY,
    sum_dX2, sum_dY2,
    var_X, var_Y, sd_X, sd_Y,
    cross_product_sum, covariance, sd_product,
    correlation, slope, intercept,
    predictions,
    r_squared, alienation, f_stat, model_p
  };
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
  FIELD_GROUPS.stats.forEach(([id, label]) => makeField(document.getElementById('stats-grid'), id, label));
  FIELD_GROUPS.reg.forEach(([id, label]) => makeField(document.getElementById('reg-grid'), id, label));
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
}

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
    msg.textContent = `${id} is onjuist.`;
  }
}

function evaluatePredictions() {
  const msg = document.getElementById('pred-msg');
  if (!state.truth || !state.predInputs.length) {
    msg.textContent = '';
    msg.className = 'status';
    return { allEntered: false, allCorrect: false };
  }

  let allEntered = true;
  let allCorrect = true;

  state.predInputs.forEach((inp, i) => {
    inp.classList.remove('valid', 'invalid');
    const v = parseNum(inp.value);
    if (!Number.isFinite(v)) {
      allEntered = false;
      allCorrect = false;
      return;
    }

    const ok = check4(v, state.truth.predictions[i]);
    if (ok) inp.classList.add('valid');
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

  return { allEntered, allCorrect };
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
  const { x, y } = state.names;
  const t = state.truth;
  const X = state.rows.map(r => r2(Number(r[x])));
  const Y = state.rows.map(r => r2(Number(r[y])));

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

  REQUIRED_FIELDS.forEach(id => {
    const inp = document.getElementById(id);
    const attempted = Number.isFinite(parseNum(inp.value));
    const val = parseNum(inp.value);
    const ref = state.truth[FIELD_TRUTH_KEY[id]];
    const ok = attempted && check4(val, ref);

    if (!attempted) allEntered = false;
    if (!ok) allCorrect = false;
    markField(id, ok, attempted);
  });

  const predStatus = evaluatePredictions();
  if (!predStatus.allEntered || !predStatus.allCorrect) allCorrect = false;
  if (!predStatus.allEntered) allEntered = false;

  const unlock = allEntered && allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
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

function generate(random = false) {
  const sel = document.getElementById('scenario');
  const nEl = document.getElementById('n');
  const seedEl = document.getElementById('seed');

  let sc;
  if (random) sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  else sc = SCENARIOS.find(s => s.id === sel.value) || SCENARIOS[0];

  sel.value = sc.id;

  const made = makeScenarioData(sc, nEl.value, seedEl.value);
  state.scenario = sc;
  state.rows = made.rows;
  state.names = made.names;
  state.truth = calcTruth(state.rows, state.names);

  setScenarioText(sc, state.names);
  renderDatasetTable();
  renderPredictionTable();
  clearStatuses();
}

function bindEvents() {
  document.getElementById('btn-generate').addEventListener('click', () => generate(false));
  document.getElementById('btn-random').addEventListener('click', () => generate(true));
  document.getElementById('scenario').addEventListener('change', () => generate(false));
}

function init() {
  fillScenarioSelect();
  buildFields();
  bindEvents();
  generate(false);
}

document.addEventListener('DOMContentLoaded', init);
