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
    if (sc?.vars?.z?.name) sc.vars.z.name = humanizeLabel(sc.vars.z.name);
    if (sc?.entity) sc.entity = humanizeLabel(sc.entity);
  });
}

normalizeScenarioLabels();

const FIELD_GROUPS = {
  means: [['x_bar', 'Gemiddelde X'], ['y_bar', 'Gemiddelde Y'], ['z_bar', 'Gemiddelde Z']],
  partial: [['partial_num', 'Teller'], ['partial_denom', 'Noemer'], ['r_xy_z', 'r_xy.z']]
};

const FIELD_TRUTH_KEY = {
  x_bar: 'x_bar',
  y_bar: 'y_bar',
  z_bar: 'z_bar',
  partial_num: 'num_partial',
  partial_denom: 'denom_partial',
  r_xy_z: 'r_xy_z'
};

const DEV_COLUMNS = [
  { key: 'dx', label: '(X-X̄)' },
  { key: 'dy', label: '(Y-Ȳ)' },
  { key: 'dz', label: '(Z-Z̄)' },
  { key: 'dx2', label: '(X-X̄)^2' },
  { key: 'dy2', label: '(Y-Ȳ)^2' },
  { key: 'dz2', label: '(Z-Z̄)^2' },
  { key: 'dxdy', label: '(X-X̄)(Y-Ȳ)' },
  { key: 'dxdz', label: '(X-X̄)(Z-Z̄)' },
  { key: 'dydz', label: '(Y-Ȳ)(Z-Z̄)' }
];

const VARSD_FIELDS = [
  { id: 'vs_SS_X', truth: 'SS_x' }, { id: 'vs_SS_Y', truth: 'SS_y' }, { id: 'vs_SS_Z', truth: 'SS_z' },
  { id: 'vs_Var_X', truth: 'Var_x' }, { id: 'vs_Var_Y', truth: 'Var_y' }, { id: 'vs_Var_Z', truth: 'Var_z' },
  { id: 'vs_SD_X', truth: 'SD_x' }, { id: 'vs_SD_Y', truth: 'SD_y' }, { id: 'vs_SD_Z', truth: 'SD_z' }
];

const COVR_FIELDS = [
  { id: 'cv_SCP_XY', truth: 'SCP_xy' }, { id: 'cv_SCP_XZ', truth: 'SCP_xz' }, { id: 'cv_SCP_YZ', truth: 'SCP_yz' },
  { id: 'cv_Cov_XY', truth: 'Cov_xy' }, { id: 'cv_Cov_XZ', truth: 'Cov_xz' }, { id: 'cv_Cov_YZ', truth: 'Cov_yz' },
  { id: 'cv_r_XY', truth: 'r_xy' }, { id: 'cv_r_XZ', truth: 'r_xz' }, { id: 'cv_r_YZ', truth: 'r_yz' }
];

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
  chart: null,
  devInputs: [],
  varsdInputs: [],
  covrInputs: []
};

function r2(v) { return Math.round(v * 100) / 100; }
function r4(v) { return Math.round(v * 10000) / 10000; }

function parseNum(s) {
  if (s == null) return NaN;
  const txt = String(s).trim().replace(',', '.');
  if (!txt) return NaN;
  const n = Number(txt);
  return Number.isFinite(n) ? n : NaN;
}

function check4(userVal, trueVal) {
  if (!Number.isFinite(userVal) || !Number.isFinite(trueVal)) return false;
  return r4(userVal) === r4(trueVal);
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

function cholesky3(S) {
  const L = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
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

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

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
    dx, dy, dz, dx2, dy2, dz2, dxdy, dxdz, dydz,
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
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const lab = document.createElement('label');
  lab.setAttribute('for', id);
  lab.textContent = label;
  const input = document.createElement('input');
  input.id = id;
  input.type = 'number';
  input.step = 'any';
  input.placeholder = '0.0000';
  input.addEventListener('input', evaluateAll);
  const msg = document.createElement('div');
  msg.id = `${id}_msg`;
  msg.className = 'msg';

  wrap.appendChild(lab);
  wrap.appendChild(input);
  wrap.appendChild(msg);
  container.appendChild(wrap);
}

function buildFixedFields() {
  FIELD_GROUPS.means.forEach(([id, label]) => makeField(document.getElementById('means-grid'), id, label));
  FIELD_GROUPS.partial.forEach(([id, label]) => makeField(document.getElementById('partial-grid'), id, label));
  document.getElementById('conclusie_type').addEventListener('change', evaluateAll);
}

function fillScenarioSelect() {
  const select = document.getElementById('scenario');
  select.innerHTML = '';
  SCENARIOS.forEach(sc => {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.title;
    select.appendChild(opt);
  });
}

function setScenarioText(sc, names) {
  const el = document.getElementById('scenario-text');
  el.innerHTML = `<b>${sc.title}</b><br>${sc.vignette}<br><br>X = <b>${names.x}</b> | Y = <b>${names.y}</b> | Z = <b>${names.z}</b>`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  tbl.innerHTML = '';
  const { x, y, z } = state.names;

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x}</th><th>${y}</th><th>${z}</th></tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.entity}</td><td>${r2(Number(row[x])).toFixed(2)}</td><td>${r2(Number(row[y])).toFixed(2)}</td><td>${r2(Number(row[z])).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

function renderDeviationTable() {
  const wrap = document.getElementById('dev-table-wrap');
  wrap.innerHTML = '';
  state.devInputs = [];

  const { x, y, z } = state.names;
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th>Eenheid</th>
    <th>${x}</th>
    <th>${y}</th>
    <th>${z}</th>
    ${DEV_COLUMNS.map(c => `<th>${c.label}</th>`).join('')}
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.entity}</td><td>${Number(row[x]).toFixed(2)}</td><td>${Number(row[y]).toFixed(2)}</td><td>${Number(row[z]).toFixed(2)}</td>`;
    DEV_COLUMNS.forEach(col => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.placeholder = '0.0000';
      input.className = 'pred-input';
      input.style.width = '110px';
      input.addEventListener('input', evaluateAll);
      td.appendChild(input);
      tr.appendChild(td);
      state.devInputs.push({ input, key: col.key, row: rowIndex });
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
}

function renderVarSdTable() {
  const wrap = document.getElementById('varsd-table-wrap');
  wrap.innerHTML = '';
  state.varsdInputs = [];

  const rows = [
    { label: 'SS', cells: ['vs_SS_X', 'vs_SS_Y', 'vs_SS_Z'] },
    { label: 'Var', cells: ['vs_Var_X', 'vs_Var_Y', 'vs_Var_Z'] },
    { label: 'SD', cells: ['vs_SD_X', 'vs_SD_Y', 'vs_SD_Z'] }
  ];
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th></th><th>X</th><th>Y</th><th>Z</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const first = document.createElement('td');
    first.textContent = row.label;
    tr.appendChild(first);
    row.cells.forEach(id => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.placeholder = '0.0000';
      input.className = 'pred-input';
      input.style.width = '110px';
      input.dataset.id = id;
      input.addEventListener('input', evaluateAll);
      td.appendChild(input);
      tr.appendChild(td);
      state.varsdInputs.push({ input, id });
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function renderCovRTable() {
  const wrap = document.getElementById('covr-table-wrap');
  wrap.innerHTML = '';
  state.covrInputs = [];

  const rows = [
    { label: 'SCP', cells: ['cv_SCP_XY', 'cv_SCP_XZ', 'cv_SCP_YZ'] },
    { label: 'Cov', cells: ['cv_Cov_XY', 'cv_Cov_XZ', 'cv_Cov_YZ'] },
    { label: 'r', cells: ['cv_r_XY', 'cv_r_XZ', 'cv_r_YZ'] }
  ];
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th></th><th>XY</th><th>XZ</th><th>YZ</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const first = document.createElement('td');
    first.textContent = row.label;
    tr.appendChild(first);
    row.cells.forEach(id => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.placeholder = '0.0000';
      input.className = 'pred-input';
      input.style.width = '110px';
      input.dataset.id = id;
      input.addEventListener('input', evaluateAll);
      td.appendChild(input);
      tr.appendChild(td);
      state.covrInputs.push({ input, id });
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
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
  const fields = [];
  FIELD_GROUPS.means.forEach(([id, label]) => fields.push({ label, target: id }));
  state.devInputs.forEach((entry) => {
    fields.push({ label: `Rij ${entry.row + 1} ${entry.key}`, target: entry.input });
  });
  state.varsdInputs.forEach((entry) => {
    fields.push({ label: entry.id.replace(/^vs_/, ''), target: entry.input });
  });
  state.covrInputs.forEach((entry) => {
    fields.push({ label: entry.id.replace(/^cv_/, ''), target: entry.input });
  });
  FIELD_GROUPS.partial.forEach(([id, label]) => fields.push({ label: labelMap.get(id) || label, target: id }));
  fields.push({ label: 'Conclusietype (1-5)', target: 'conclusie_type', eventType: 'change' });
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

function setExcelPasteTarget(field, value) {
  const el = typeof field.target === 'string' ? document.getElementById(field.target) : field.target;
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event(field.eventType || 'input', { bubbles: true }));
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
    if (i < values.length && setExcelPasteTarget(field, values[i])) filled += 1;
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

function clearFixedStatuses() {
  Object.keys(FIELD_TRUTH_KEY).forEach(id => {
    const input = document.getElementById(id);
    const msg = document.getElementById(`${id}_msg`);
    if (input) {
      input.value = '';
      input.classList.remove('valid', 'invalid');
    }
    if (msg) {
      msg.textContent = '';
      msg.className = 'msg';
    }
  });

  const sel = document.getElementById('conclusie_type');
  const selMsg = document.getElementById('conclusie_type_msg');
  sel.value = '';
  sel.classList.remove('valid', 'invalid');
  selMsg.textContent = '';
  selMsg.className = 'msg';

  document.getElementById('dev-msg').textContent = '';
  document.getElementById('dev-msg').className = 'status';
  document.getElementById('varsd-msg').textContent = '';
  document.getElementById('varsd-msg').className = 'status';
  document.getElementById('covr-msg').textContent = '';
  document.getElementById('covr-msg').className = 'status';

  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('locked');
  document.getElementById('interpretation').innerHTML = '';
  state.unlocked = false;
  destroyChart();
  setVizNavLock(false);

  const total = (state.rows.length * DEV_COLUMNS.length) + VARSD_FIELDS.length + COVR_FIELDS.length + Object.keys(FIELD_TRUTH_KEY).length + 1;
  updateProgress(0, total);
}

const FIELD_HINTS = {
  x_bar: 'gem(X) = ΣX / n',
  y_bar: 'gem(Y) = ΣY / n',
  z_bar: 'gem(Z) = ΣZ / n',
  vs_SS_X: 'SS(X) = Σ(Xi − X̄)²',
  vs_SS_Y: 'SS(Y) = Σ(Yi − Y̅)²',
  vs_SS_Z: 'SS(Z) = Σ(Zi − Z̅)²',
  vs_Var_X: 's²(X) = SS(X) / (n−1)',
  vs_Var_Y: 's²(Y) = SS(Y) / (n−1)',
  vs_Var_Z: 's²(Z) = SS(Z) / (n−1)',
  vs_SD_X: 's(X) = √Var(X)',
  vs_SD_Y: 's(Y) = √Var(Y)',
  vs_SD_Z: 's(Z) = √Var(Z)',
  cv_SCP_XY: 'SCP(X,Y) = Σ(Xi−X̄)(Yi−Y̅)',
  cv_SCP_XZ: 'SCP(X,Z) = Σ(Xi−X̄)(Zi−Z̅)',
  cv_SCP_YZ: 'SCP(Y,Z) = Σ(Yi−Y̅)(Zi−Z̅)',
  cv_Cov_XY: 'Cov(X,Y) = SCP(X,Y) / (n−1)',
  cv_Cov_XZ: 'Cov(X,Z) = SCP(X,Z) / (n−1)',
  cv_Cov_YZ: 'Cov(Y,Z) = SCP(Y,Z) / (n−1)',
  cv_r_XY: 'r(X,Y) = Cov(X,Y) / (s(X)·s(Y))',
  cv_r_XZ: 'r(X,Z) = Cov(X,Z) / (s(X)·s(Z))',
  cv_r_YZ: 'r(Y,Z) = Cov(Y,Z) / (s(Y)·s(Z))',
  partial_num: 'teller = r_xy − r_xz·r_yz',
  partial_denom: 'noemer = √((1−r_xz²)·(1−r_yz²))',
  r_xy_z: 'r_xy.z = teller / noemer',
};

function markField(id, ok, attempted) {
  const input = document.getElementById(id);
  const msg = document.getElementById(`${id}_msg`);
  if (!input || !msg) return;

  input.classList.remove('valid', 'invalid');
  msg.textContent = '';
  msg.className = 'msg';
  if (!attempted) return;

  if (ok) {
    input.classList.add('valid');
    msg.classList.add('ok');
    msg.textContent = 'OK';
  } else {
    input.classList.add('invalid');
    msg.classList.add('err');
    const hint = FIELD_HINTS[id];
    msg.textContent = hint ? `Fout — formule: ${hint}` : `${id} is onjuist.`;
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
    msg.textContent = 'Type conclusie is onjuist — vergelijk r_xy en r_xy.z (richting en grootte).';
  }
}

function markTableInput(input, ok, attempted) {
  input.classList.remove('valid', 'invalid');
  if (!attempted) return;
  input.classList.add(ok ? 'valid' : 'invalid');
}

function evaluateTableGroup(inputs, refGetter, statusId, okTextPrefix) {
  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  let totalCount = 0;

  inputs.forEach(entry => {
    totalCount += 1;
    const attempted = Number.isFinite(parseNum(entry.input.value));
    const val = parseNum(entry.input.value);
    const ref = refGetter(entry);
    const ok = attempted && check4(val, ref);

    if (!attempted) allEntered = false;
    if (!ok) allCorrect = false;
    if (ok) correctCount += 1;

    markTableInput(entry.input, ok, attempted);
  });

  const msg = document.getElementById(statusId);
  if (!allEntered) {
    msg.textContent = `${correctCount}/${totalCount} correct`;
    msg.className = 'status';
  } else if (allCorrect) {
    msg.textContent = `${okTextPrefix} (${correctCount}/${totalCount})`;
    msg.className = 'status ok';
  } else {
    msg.textContent = `${correctCount}/${totalCount} correct`;
    msg.className = 'status err';
  }

  return { allEntered, allCorrect, correctCount, totalCount };
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
    const red = Math.round(30 + 200 * t);
    const blue = Math.round(220 - 170 * t);
    return `rgba(${red},80,${blue},0.8)`;
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
  let correctCount = 0;
  let totalCount = 0;

  Object.keys(FIELD_TRUTH_KEY).forEach(id => {
    totalCount += 1;
    const input = document.getElementById(id);
    const attempted = Number.isFinite(parseNum(input.value));
    const val = parseNum(input.value);
    const ref = state.truth[FIELD_TRUTH_KEY[id]];
    const ok = attempted && check4(val, ref);

    if (!attempted) allEntered = false;
    if (!ok) allCorrect = false;
    if (ok) correctCount += 1;
    markField(id, ok, attempted);
  });

  const devRes = evaluateTableGroup(
    state.devInputs,
    entry => state.truth[entry.key][entry.row],
    'dev-msg',
    'Afwijkingtabel correct'
  );
  totalCount += devRes.totalCount;
  correctCount += devRes.correctCount;
  if (!devRes.allEntered) allEntered = false;
  if (!devRes.allCorrect) allCorrect = false;

  const varRes = evaluateTableGroup(
    state.varsdInputs,
    entry => {
      const cfg = VARSD_FIELDS.find(f => f.id === entry.id);
      return state.truth[cfg.truth];
    },
    'varsd-msg',
    'Var/SD tabel correct'
  );
  totalCount += varRes.totalCount;
  correctCount += varRes.correctCount;
  if (!varRes.allEntered) allEntered = false;
  if (!varRes.allCorrect) allCorrect = false;

  const covRes = evaluateTableGroup(
    state.covrInputs,
    entry => {
      const cfg = COVR_FIELDS.find(f => f.id === entry.id);
      return state.truth[cfg.truth];
    },
    'covr-msg',
    'Cov/r tabel correct'
  );
  totalCount += covRes.totalCount;
  correctCount += covRes.correctCount;
  if (!covRes.allEntered) allEntered = false;
  if (!covRes.allCorrect) allCorrect = false;

  totalCount += 1;
  const sel = document.getElementById('conclusie_type');
  const cAttempted = sel.value !== '';
  const cVal = Number(sel.value);
  const cRef = Number(state.truth.conclusie_type);
  const cOk = cAttempted && Number.isFinite(cRef) && cVal === cRef;
  markConclusion(cOk, cAttempted);
  if (!cAttempted) allEntered = false;
  if (!cOk) allCorrect = false;
  if (cOk) correctCount += 1;

  updateProgress(correctCount, totalCount);

  const unlock = allEntered && allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    setVizNavLock(unlock);
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

  let sc = null;
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

  const made = makePartialData(sc, nEl.value, seedToUse);
  state.scenario = sc;
  state.rows = made.rows;
  state.names = made.names;
  state.truth = calcTruth(state.rows, state.names);

  setScenarioText(sc, state.names);
  renderDatasetTable();
  renderDeviationTable();
  renderVarSdTable();
  renderCovRTable();
  clearFixedStatuses();
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
  buildFixedFields();
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
