'use strict';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'delinquency_age',
    title: 'Delictpleging, slachtofferschap en leeftijd',
    vignette: 'Onderzoek het verband tussen delicten gepleegd (X) en slachtofferschap (Y), gecontroleerd voor leeftijd (Z).',
    vars: { x: { name: 'DelictenGepleegd', unit: 'aantal' }, y: { name: 'DelictenSlachtoffer', unit: 'aantal' }, z: { name: 'Leeftijd', unit: 'jaar' } },
    entity: 'Scholier',
    r_xy_target: 0.65, r_xz_target: 0.60, r_yz_target: 0.55,
    x_range: [0, 8], y_range: [0, 6], z_range: [14, 18]
  },
  {
    id: 'fitness_salary_service',
    title: 'Fysieke bekwaamheid, salaris en dienstjaren',
    vignette: 'Onderzoek het verband tussen fysieke bekwaamheid (X) en salaris (Y), gecontroleerd voor dienstjaren (Z).',
    vars: { x: { name: 'FysiekeBekwaamheid', unit: 'score' }, y: { name: 'Salaris', unit: 'index' }, z: { name: 'DienstJaren', unit: 'jaar' } },
    entity: 'Agent',
    r_xy_target: -0.44, r_xz_target: -0.68, r_yz_target: 0.82,
    x_range: [40, 100], y_range: [30, 90], z_range: [1, 30]
  },
  {
    id: 'disorder_fear_income',
    title: 'Wanorde, angst en inkomensniveau',
    vignette: 'Onderzoek het verband tussen wanorde (X) en angst (Y), gecontroleerd voor inkomensniveau (Z).',
    vars: { x: { name: 'WanordeIndex', unit: '0-10' }, y: { name: 'AngstScore', unit: '0-100' }, z: { name: 'InkomenNiveau', unit: 'index' } },
    entity: 'Buurt',
    r_xy_target: 0.65, r_xz_target: -0.55, r_yz_target: -0.50,
    x_range: [1, 10], y_range: [20, 90], z_range: [20, 80]
  },
  {
    id: 'recidivism_support_age',
    title: 'Recidive, ondersteuning en leeftijd bij aanvang',
    vignette: 'Onderzoek het verband tussen ondersteuningsuren (X) en recidiverisico (Y), gecontroleerd voor leeftijd bij aanvang (Z).',
    vars: { x: { name: 'OndersteuningsUren', unit: 'per maand' }, y: { name: 'RecidiveRisico', unit: '0-100' }, z: { name: 'LeeftijdAanvang', unit: 'jaar' } },
    entity: 'Deelnemer',
    r_xy_target: -0.50, r_xz_target: 0.40, r_yz_target: -0.45,
    x_range: [0, 40], y_range: [20, 90], z_range: [18, 55]
  },
  {
    id: 'training_clicks_experience',
    title: 'Cybertraining, klikratio en werkervaring',
    vignette: 'Onderzoek het verband tussen trainingsuren (X) en klikratio (Y), gecontroleerd voor werkervaring (Z).',
    vars: { x: { name: 'TrainingsUren', unit: 'uren' }, y: { name: 'Klikratio', unit: '%' }, z: { name: 'WerkErvaring', unit: 'jaren' } },
    entity: 'Medewerker',
    r_xy_target: -0.55, r_xz_target: 0.45, r_yz_target: -0.40,
    x_range: [0, 30], y_range: [5, 60], z_range: [1, 25]
  },
  {
    id: 'guardianship_victimization_density',
    title: 'Toezicht, slachtofferschap en bevolkingsdichtheid',
    vignette: 'Onderzoek het verband tussen toezicht (X) en slachtofferschap (Y), gecontroleerd voor bevolkingsdichtheid (Z).',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' }, z: { name: 'BevolkingsDichtheid', unit: 'per km2' } },
    entity: 'Buurt',
    r_xy_target: -0.45, r_xz_target: -0.35, r_yz_target: 0.50,
    x_range: [1, 10], y_range: [0, 15], z_range: [200, 5000]
  },
  {
    id: 'impulsivity_aggression_parental',
    title: 'Impulsiviteit, agressie en ouderlijk toezicht',
    vignette: 'Onderzoek het verband tussen impulsiviteit (X) en agressie-incidenten (Y), gecontroleerd voor ouderlijk toezicht (Z).',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'AgressieIncidenten', unit: 'meldingen' }, z: { name: 'OuderlijkToezicht', unit: '0-10' } },
    entity: 'Student',
    r_xy_target: 0.55, r_xz_target: -0.50, r_yz_target: -0.45,
    x_range: [-3, 3], y_range: [0, 12], z_range: [1, 10]
  },
  {
    id: 'police_trust_contact_ethnicity',
    title: 'Politiecontact, vertrouwen en minderheidspositie',
    vignette: 'Onderzoek het verband tussen positief politiecontact (X) en vertrouwen in politie (Y), gecontroleerd voor minderheidspositie (Z).',
    vars: { x: { name: 'PositiefContact', unit: 'score' }, y: { name: 'VertrouwenInPolitie', unit: '1-7' }, z: { name: 'MinderheidsScore', unit: '0-1' } },
    entity: 'Respondent',
    r_xy_target: 0.60, r_xz_target: -0.40, r_yz_target: -0.35,
    x_range: [1, 10], y_range: [1, 7], z_range: [0, 1]
  }
];

const FIELD_GROUPS = {
  means: [['x_bar', 'Gemiddelde X'], ['y_bar', 'Gemiddelde Y'], ['z_bar', 'Gemiddelde Z']],
  stats: [
    ['SS_x', 'SS_x'], ['SS_y', 'SS_y'], ['SS_z', 'SS_z'],
    ['SCP_xy', 'SCP_xy'], ['SCP_xz', 'SCP_xz'], ['SCP_yz', 'SCP_yz'],
    ['Var_x', 'Var_x'], ['Var_y', 'Var_y'], ['Var_z', 'Var_z'],
    ['SD_x', 'SD_x'], ['SD_y', 'SD_y'], ['SD_z', 'SD_z'],
    ['Cov_xy', 'Cov_xy'], ['Cov_xz', 'Cov_xz'], ['Cov_yz', 'Cov_yz'],
    ['r_xy', 'r_xy'], ['r_xz', 'r_xz'], ['r_yz', 'r_yz']
  ],
  partial: [['partial_num', 'Teller'], ['partial_denom', 'Noemer'], ['r_xy_z', 'r_xy.z']]
};

const FIELD_TRUTH_KEY = {
  x_bar: 'x_bar', y_bar: 'y_bar', z_bar: 'z_bar',
  SS_x: 'SS_x', SS_y: 'SS_y', SS_z: 'SS_z',
  SCP_xy: 'SCP_xy', SCP_xz: 'SCP_xz', SCP_yz: 'SCP_yz',
  Var_x: 'Var_x', Var_y: 'Var_y', Var_z: 'Var_z',
  SD_x: 'SD_x', SD_y: 'SD_y', SD_z: 'SD_z',
  Cov_xy: 'Cov_xy', Cov_xz: 'Cov_xz', Cov_yz: 'Cov_yz',
  r_xy: 'r_xy', r_xz: 'r_xz', r_yz: 'r_yz',
  partial_num: 'num_partial', partial_denom: 'denom_partial', r_xy_z: 'r_xy_z'
};

const REQUIRED_FIELDS = Object.keys(FIELD_TRUTH_KEY);

const CONCLUSION_LABELS = {
  1: 'Schijnverband',
  2: 'Indirect/confounding',
  3: 'Suppressie',
  4: 'Direct effect blijft',
  5: 'Tekenwisseling'
};

const state = {
  scenario: null,
  rows: [],
  names: { x: '', y: '', z: '' },
  truth: null,
  unlocked: false,
  chart: null
};

function r2(v) { return Math.round(v * 100) / 100; }
function r4(v) { return Math.round(v * 10000) / 10000; }

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

function cholesky3(S) {
  const L = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const v = S[i][i] - sum;
        if (v <= 0) return null;
        L[i][j] = Math.sqrt(v);
      } else {
        if (L[j][j] === 0) return null;
        L[i][j] = (S[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

function generateCorrelatedXYZ(sc, n, rng) {
  const SigmaBase = [
    [1, sc.r_xy_target, sc.r_xz_target],
    [sc.r_xy_target, 1, sc.r_yz_target],
    [sc.r_xz_target, sc.r_yz_target, 1]
  ];

  let jitter = 0;
  let L = null;
  while (jitter <= 0.5 && !L) {
    const S = [
      [SigmaBase[0][0] + jitter, SigmaBase[0][1], SigmaBase[0][2]],
      [SigmaBase[1][0], SigmaBase[1][1] + jitter, SigmaBase[1][2]],
      [SigmaBase[2][0], SigmaBase[2][1], SigmaBase[2][2] + jitter]
    ];
    L = cholesky3(S);
    jitter += 0.05;
  }

  if (!L) L = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  const U = [
    [L[0][0], L[1][0], L[2][0]],
    [L[0][1], L[1][1], L[2][1]],
    [L[0][2], L[1][2], L[2][2]]
  ];

  const out = [];
  for (let i = 0; i < n; i++) {
    const z = [randN(rng), randN(rng), randN(rng)];
    out.push([
      z[0] * U[0][0] + z[1] * U[1][0] + z[2] * U[2][0],
      z[0] * U[0][1] + z[1] * U[1][1] + z[2] * U[2][1],
      z[0] * U[0][2] + z[1] * U[1][2] + z[2] * U[2][2]
    ]);
  }

  return out;
}

function scaleToRange(values, lo, hi) {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const den = (mx - mn) + 1e-9;
  return values.map(v => r2(lo + ((v - mn) / den) * (hi - lo)));
}

function makePartialData(sc, nRaw, seedRaw) {
  const n = Math.max(4, Math.min(MAX_SAMPLE_SIZE, Number.isFinite(Number(nRaw)) ? Math.floor(Number(nRaw)) : 15));
  const ss = safeSeed(seedRaw);
  const rng = mulberry32(ss == null ? Math.floor(Math.random() * 1e9) : ss);

  const xyz = generateCorrelatedXYZ(sc, n, rng);
  const xVals = scaleToRange(xyz.map(v => v[0]), sc.x_range[0], sc.x_range[1]);
  const yVals = scaleToRange(xyz.map(v => v[1]), sc.y_range[0], sc.y_range[1]);
  const zVals = scaleToRange(xyz.map(v => v[2]), sc.z_range[0], sc.z_range[1]);

  const names = { x: sc.vars.x.name, y: sc.vars.y.name, z: sc.vars.z.name };
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      entity: `${sc.entity} ${i + 1}`,
      [names.x]: xVals[i],
      [names.y]: yVals[i],
      [names.z]: zVals[i]
    });
  }

  return { rows, names };
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function calcTruth(rows, names) {
  if (!rows.length) return null;

  const X = rows.map(r => r2(Number(r[names.x])));
  const Y = rows.map(r => r2(Number(r[names.y])));
  const Z = rows.map(r => r2(Number(r[names.z])));
  const n = X.length;

  const x_bar = r4(mean(X));
  const y_bar = r4(mean(Y));
  const z_bar = r4(mean(Z));

  const dx = X.map(v => r4(v - x_bar));
  const dy = Y.map(v => r4(v - y_bar));
  const dz = Z.map(v => r4(v - z_bar));

  const dx2 = dx.map(v => r4(v * v));
  const dy2 = dy.map(v => r4(v * v));
  const dz2 = dz.map(v => r4(v * v));
  const dxdy = dx.map((v, i) => r4(v * dy[i]));
  const dxdz = dx.map((v, i) => r4(v * dz[i]));
  const dydz = dy.map((v, i) => r4(v * dz[i]));

  const SS_x = r4(dx2.reduce((s, v) => s + v, 0));
  const SS_y = r4(dy2.reduce((s, v) => s + v, 0));
  const SS_z = r4(dz2.reduce((s, v) => s + v, 0));
  const SCP_xy = r4(dxdy.reduce((s, v) => s + v, 0));
  const SCP_xz = r4(dxdz.reduce((s, v) => s + v, 0));
  const SCP_yz = r4(dydz.reduce((s, v) => s + v, 0));

  const Var_x = r4(SS_x / (n - 1));
  const Var_y = r4(SS_y / (n - 1));
  const Var_z = r4(SS_z / (n - 1));
  const SD_x = r4(Math.sqrt(Var_x));
  const SD_y = r4(Math.sqrt(Var_y));
  const SD_z = r4(Math.sqrt(Var_z));

  const Cov_xy = r4(SCP_xy / (n - 1));
  const Cov_xz = r4(SCP_xz / (n - 1));
  const Cov_yz = r4(SCP_yz / (n - 1));

  const r_xy = r4(Cov_xy / (SD_x * SD_y));
  const r_xz = r4(Cov_xz / (SD_x * SD_z));
  const r_yz = r4(Cov_yz / (SD_y * SD_z));

  const num_partial = r4(r_xy - r_xz * r_yz);
  const denom_partial = r4(Math.sqrt((1 - r_xz * r_xz) * (1 - r_yz * r_yz)));
  const r_xy_z = Number.isFinite(denom_partial) && denom_partial > 0 ? r4(num_partial / denom_partial) : NaN;

  let conclusie_type = NaN;
  if (Number.isFinite(r_xy_z) && Number.isFinite(r_xy)) {
    if (Math.abs(r_xy_z) < 0.08) conclusie_type = 1;
    else if (r_xy !== 0 && r_xy_z !== 0 && Math.sign(r_xy) !== Math.sign(r_xy_z)) conclusie_type = 5;
    else if (Math.abs(r_xy_z) < Math.abs(r_xy) - 0.05) conclusie_type = 2;
    else if (Math.abs(r_xy_z) > Math.abs(r_xy) + 0.05) conclusie_type = 3;
    else conclusie_type = 4;
  }

  return {
    n,
    x_bar, y_bar, z_bar,
    SS_x, SS_y, SS_z,
    SCP_xy, SCP_xz, SCP_yz,
    Var_x, Var_y, Var_z,
    SD_x, SD_y, SD_z,
    Cov_xy, Cov_xz, Cov_yz,
    r_xy, r_xz, r_yz,
    num_partial, denom_partial, r_xy_z,
    conclusie_type
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
  FIELD_GROUPS.stats.forEach(([id, label]) => makeField(document.getElementById('stats-grid'), id, label));
  FIELD_GROUPS.partial.forEach(([id, label]) => makeField(document.getElementById('partial-grid'), id, label));

  document.getElementById('conclusie_type').addEventListener('change', evaluateAll);
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
  document.getElementById('scenario-text').innerHTML = `<b>${sc.title}</b><br>${sc.vignette}<br><br>X = <b>${names.x}</b> | Y = <b>${names.y}</b> | Z = <b>${names.z}</b>`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  tbl.innerHTML = '';
  const { x, y, z } = state.names;

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x}</th><th>${y}</th><th>${z}</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${r2(Number(r[x])).toFixed(2)}</td><td>${r2(Number(r[y])).toFixed(2)}</td><td>${r2(Number(r[z])).toFixed(2)}</td>`;
    tbody.appendChild(tr);
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

  const sel = document.getElementById('conclusie_type');
  sel.value = '';
  sel.classList.remove('valid', 'invalid');
  const sm = document.getElementById('conclusie_type_msg');
  sm.textContent = '';
  sm.className = 'msg';

  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('interpretation').innerHTML = '';
  state.unlocked = false;
  destroyChart();
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

function markConclusion(ok, attempted) {
  const sel = document.getElementById('conclusie_type');
  const msg = document.getElementById('conclusie_type_msg');
  sel.classList.remove('valid', 'invalid');
  msg.textContent = '';
  msg.className = 'msg';

  if (!attempted) return;

  if (ok) {
    sel.classList.add('valid');
    msg.classList.add('ok');
    msg.textContent = 'OK';
  } else {
    sel.classList.add('invalid');
    msg.classList.add('err');
    msg.textContent = 'Type conclusie is onjuist.';
  }
}

function destroyChart() {
  if (state.chart) state.chart.destroy();
  state.chart = null;
}

function renderChart() {
  const { x, y, z } = state.names;
  const zVals = state.rows.map(r => Number(r[z]));
  const zMin = Math.min(...zVals);
  const zMax = Math.max(...zVals);
  const color = (v) => {
    const t = (v - zMin) / ((zMax - zMin) + 1e-9);
    const r = Math.round(30 + 200 * t);
    const b = Math.round(220 - 170 * t);
    return `rgba(${r},80,${b},0.8)`;
  };

  const points = state.rows.map(r => ({ x: Number(r[x]), y: Number(r[y]), z: Number(r[z]) }));

  state.chart = new Chart(document.getElementById('scatter-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${x} vs ${y} (kleur = ${z})`,
        data: points,
        pointRadius: 5,
        pointBackgroundColor: points.map(p => color(p.z))
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Scatterplot X-Y (gekleurd naar Z)' } },
      scales: {
        x: { type: 'linear', title: { display: true, text: x } },
        y: { title: { display: true, text: y } }
      }
    }
  });

  const t = state.truth;
  const typeLabel = Number.isFinite(t.conclusie_type) ? CONCLUSION_LABELS[t.conclusie_type] : 'onbekend';
  document.getElementById('interpretation').innerHTML = `
    <b>Interpretatie</b>
    <ul>
      <li>r_xy = ${t.r_xy.toFixed(4)}, r_xz = ${t.r_xz.toFixed(4)}, r_yz = ${t.r_yz.toFixed(4)}</li>
      <li>r_xy.z = ${Number.isFinite(t.r_xy_z) ? t.r_xy_z.toFixed(4) : 'n.v.t.'}</li>
      <li>Classificatie: ${Number.isFinite(t.conclusie_type) ? t.conclusie_type : '-'} - ${typeLabel}</li>
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

  const conclusionSel = document.getElementById('conclusie_type');
  const cAttempted = conclusionSel.value !== '';
  const cVal = Number(conclusionSel.value);
  const cRef = Number(state.truth.conclusie_type);
  const cOk = cAttempted && Number.isFinite(cRef) && cVal === cRef;
  markConclusion(cOk, cAttempted);

  if (!cAttempted) allEntered = false;
  if (!cOk) allCorrect = false;

  const unlock = allEntered && allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    if (unlock) {
      document.getElementById('success-card').classList.remove('hidden');
      document.getElementById('viz-card').classList.remove('locked');
      renderChart();
    } else {
      document.getElementById('success-card').classList.add('hidden');
      document.getElementById('viz-card').classList.add('locked');
      document.getElementById('interpretation').innerHTML = '';
      destroyChart();
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

  const made = makePartialData(sc, nEl.value, seedEl.value);
  state.scenario = sc;
  state.rows = made.rows;
  state.names = made.names;
  state.truth = calcTruth(state.rows, state.names);

  setScenarioText(sc, state.names);
  renderDatasetTable();
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
