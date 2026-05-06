'use strict';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
    vignette: 'Een stad heeft een criminaliteitspreventieprogramma uitgerold in tien vergelijkbare buurten. De blootstelling aan het programma en een tweede buurtkarakteristiek worden als onafhankelijke variabelen ingezet. De afhankelijke variabele is het inbraakcijfer per 1.000 inwoners. Onderzoeksvraag: welke combinatie van voorspellers verklaart inbraakcijfers het best? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'ProgrammaBlootstelling', unit: '%' }, y: { name: 'InbraakCijfer', unit: 'per 1.000' } },
    gen: { r_target: -0.45 },
    extras: ['PolitieZichtbaarheid', 'BuurtBijeenkomsten', 'HerhaaldSlachtofferschapPercentage', 'StraatVerlichting', 'BuurtPreventie'],
    entity: 'Buurt'
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Een stedelijke politiezone concentreert voetpatrouilles op meldingenrijke locaties. Naast het aantal patrouille-uren wordt een tweede politiegerelateerde variabele als voorspeller meegenomen. De afhankelijke variabele is het aantal meldingen aan de politie per straat per week. Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in meldingen? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'VoetPatrouilleUren', unit: 'uren/week' }, y: { name: 'MeldingenAanPolitie', unit: 'per week' } },
    gen: { r_target: -0.25 },
    extras: ['GerichtePatrouilles', 'Arrestaties', 'Reactietijd', 'ProactieveControles', 'OpenbareOrdeMeldingen'],
    entity: 'Straat'
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'Bewoners in een stedelijke gemeente worden bevraagd over omgevingswanorde en angst voor criminaliteit. Naast de wanordeindex wordt een tweede buurtkarakteristiek als voorspeller opgenomen. De afhankelijke variabele is de angstschaal (0\u2013100). Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in angstscores? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'WanordeIndex', unit: '0-10' }, y: { name: 'AngstScore', unit: '0-100' } },
    gen: { r_target: 0.55 },
    extras: ['OnbeschoftheidIncidenten', 'CollectieveEffectiviteit', 'StraatVerlichting', 'GraffitiMeldingen', 'ZwerfvuilKlachten'],
    entity: 'Buurt'
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'Burgers beoordelen hun contacten met de politie op procedurele rechtvaardigheid en een tweede kwaliteitsindicator. De afhankelijke variabele is het vertrouwen in de politie (1\u20137). Onderzoeksvraag: verklaren beide aspecten van politiecontact samen significant het vertrouwen in de politie? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'ProcedureleRechtvaardigheid', unit: '1-7' }, y: { name: 'VertrouwenInPolitie', unit: '1-7' } },
    gen: { r_target: 0.70 },
    extras: ['Eerlijkheid', 'Respect', 'Inspraak', 'Tevredenheid', 'KlachtenPercentage'],
    entity: 'District'
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'De routineactiviteitentheorie stelt dat toezicht en andere kenmerken van de woonomgeving het slachtofferschapsrisico bepalen. Twee huishoudkenmerken worden als voorspellers opgenomen. De afhankelijke variabele is het aantal slachtofferschapincidenten per jaar. Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in slachtofferschap? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' } },
    gen: { r_target: -0.40 },
    extras: ['SlotKwaliteit', 'BuitenVerlichting', 'AlarmBezit', 'RoutineActiviteiten', 'BekwaamToezicht'],
    entity: 'Huishouden'
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'Jongeren worden gescoord op impulsiviteit en een tweede biosociale risicofactor. Het aantal schoolmeldingen van agressieve incidenten per trimester wordt als uitkomst geregistreerd. Onderzoeksvraag: verklaren beide risicofactoren samen significant de variantie in agressieve incidenten? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'AgressieveIncidenten', unit: 'schoolmeldingen/trimester' } },
    gen: { r_target: 0.45 },
    extras: ['Zelfbeheersing', 'LeeftijdgenotenAfwijkendGedrag', 'DocentenOndersteuning', 'OuderlijkToezicht', 'SchoolBetrokkenheid'],
    entity: 'Student'
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Na vrijlating ontvangen deelnemers re-integratiebegeleiding van variabele intensiteit. Naast de ondersteuningsuren wordt een tweede indicator van de begeleidingskwaliteit als voorspeller opgenomen. Na zes maanden wordt een gevalideerde recidiverisicoscore (0\u2013100) afgenomen. Onderzoeksvraag: verklaren beide voorspellers samen significant het recidiverisico? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'OndersteuningsUren', unit: 'per maand' }, y: { name: 'RecidiveRisico', unit: '0-100' } },
    gen: { r_target: -0.35 },
    extras: ['HuisvestingsOndersteuning', 'WerkgelegenheidsWorkshops', 'IdentiteitsdocumentenHulp', 'DossierContacten', 'VerslavingsBegeleiding'],
    entity: 'Deelnemer'
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'Een overheidsorganisatie evalueert het effect van cyberveiligheidstraining op phishinggevoeligheid. Naast het aantal trainingsuren wordt een tweede kenmerk van de cyberbeveiliging meegenomen als voorspeller. De afhankelijke variabele is het klikratio op nep-phishingmails (%). Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in klikratio? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
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
    if (sc?.vignette) {
      sc.vignette = sc.vignette.replace(/\b([A-Za-z][a-z]+(?:[A-Z][a-z]+)+)\b/g, (m) => humanizeLabel(m));
    }
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

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const state = {
  scenario: null,
  rows: [],
  names: { x1: '', x2: '', y: '' },
  truth: null,
  unlocked: false,
  charts: { calibration: null, residual: null, predictor: null },
  hotMeans: null, hotMeansCellClasses: {},
  hotTotals: null, hotTotalsCellClasses: {},
  hotVarSd: null, hotVarSdCellClasses: {},
  hotCov: null, hotCovCellClasses: {},
  hotCorr: null, hotCorrCellClasses: {},
  hotCoef: null, hotCoefCellClasses: {},
  hotFit: null, hotFitCellClasses: {},
  hotPred: null, hotPredCellClasses: {}
};

const FIELD_HOT_MAP = {
  mean_X1: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 0, col: 1 },
  mean_X2: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 1, col: 1 },
  mean_Y: { hotKey: 'hotMeans', classKey: 'hotMeansCellClasses', row: 2, col: 1 },
  tot_X1_2: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 0, col: 1 },
  tot_X2_2: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 1, col: 1 },
  tot_X1X2: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 2, col: 1 },
  tot_X1Y: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 3, col: 1 },
  tot_X2Y: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 4, col: 1 },
  tot_Y2: { hotKey: 'hotTotals', classKey: 'hotTotalsCellClasses', row: 5, col: 1 },
  var_X1: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 0, col: 1 },
  sd_X1: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 1, col: 1 },
  var_X2: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 0, col: 2 },
  sd_X2: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 1, col: 2 },
  var_Y: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 0, col: 3 },
  sd_Y: { hotKey: 'hotVarSd', classKey: 'hotVarSdCellClasses', row: 1, col: 3 },
  cov_x1y: { hotKey: 'hotCov', classKey: 'hotCovCellClasses', row: 0, col: 1 },
  cov_x2y: { hotKey: 'hotCov', classKey: 'hotCovCellClasses', row: 1, col: 1 },
  cov_x1x2: { hotKey: 'hotCov', classKey: 'hotCovCellClasses', row: 2, col: 1 },
  r_x1y: { hotKey: 'hotCorr', classKey: 'hotCorrCellClasses', row: 0, col: 1 },
  r_x2y: { hotKey: 'hotCorr', classKey: 'hotCorrCellClasses', row: 1, col: 1 },
  r_x1x2: { hotKey: 'hotCorr', classKey: 'hotCorrCellClasses', row: 2, col: 1 },
  multi_det: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 0, col: 1 },
  multi_b1: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 1, col: 1 },
  multi_b2: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 2, col: 1 },
  multi_intercept: { hotKey: 'hotCoef', classKey: 'hotCoefCellClasses', row: 3, col: 1 },
  multi_r_squared: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 0, col: 1 },
  multi_alienation: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 1, col: 1 },
  multi_f_stat: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 2, col: 1 },
  multi_model_p: { hotKey: 'hotFit', classKey: 'hotFitCellClasses', row: 3, col: 1 }
};

function getFieldValue(id) {
  const m = FIELD_HOT_MAP[id];
  if (!m) return NaN;
  const hot = state[m.hotKey];
  if (!hot) return NaN;
  const data = hot.getData();
  if (!data || !data[m.row]) return NaN;
  return parseNum(data[m.row][m.col]);
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

function renderHotMeans() {
  const container = document.getElementById('hot-means-container');
  if (!container) return;
  if (state.hotMeans) { state.hotMeans.destroy(); state.hotMeans = null; }
  state.hotMeansCellClasses = {};
  container.innerHTML = '';
  const { x1, x2, y } = state.names;
  const tableData = [
    [`Gemiddelde x1 (${x1})`, null],
    [`Gemiddelde x2 (${x2})`, null],
    [`Gemiddelde Y (${y})`, null]
  ];
  const longest = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Grootheid');
  const w0 = Math.max(160, Math.ceil(longest.length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotMeans = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 150],
    rowHeaders: false,
    width: w0 + 150,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotMeansCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotTotals() {
  const container = document.getElementById('hot-totals-container');
  if (!container) return;
  if (state.hotTotals) { state.hotTotals.destroy(); state.hotTotals = null; }
  state.hotTotalsCellClasses = {};
  container.innerHTML = '';
  const { x1, x2, y } = state.names;
  const tableData = [
    [`S\u2081\u2081 = \u03a3(${x1}\u2212x\u0305\u2081)\u00b2`, null],
    [`S\u2082\u2082 = \u03a3(${x2}\u2212x\u0305\u2082)\u00b2`, null],
    [`S\u2081\u2082 = \u03a3(${x1}\u2212x\u0305\u2081)(${x2}\u2212x\u0305\u2082)`, null],
    [`S\u2081y = \u03a3(${x1}\u2212x\u0305\u2081)(${y}\u2212\u0232)`, null],
    [`S\u2082y = \u03a3(${x2}\u2212x\u0305\u2082)(${y}\u2212\u0232)`, null],
    [`SST = \u03a3(${y}\u2212\u0232)\u00b2`, null]
  ];
  const longest = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Grootheid');
  const w0 = Math.max(200, Math.ceil(longest.length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotTotals = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 150],
    rowHeaders: false,
    width: w0 + 150,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotTotalsCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotVarSd() {
  const container = document.getElementById('hot-varsd-container');
  if (!container) return;
  if (state.hotVarSd) { state.hotVarSd.destroy(); state.hotVarSd = null; }
  state.hotVarSdCellClasses = {};
  container.innerHTML = '';
  const { x1, x2, y } = state.names;
  const tableData = [
    ['Var (s²)', null, null, null],
    ['SD (s)', null, null, null]
  ];
  const colWidths = [80, 160, 160, 160];
  const hotValidate = debounce(evaluateAll, 250);
  state.hotVarSd = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['', x1, x2, y],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths,
    rowHeaders: false,
    width: colWidths.reduce((s, w) => s + w, 0) + colWidths.length + 1,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotVarSdCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotCov() {
  const container = document.getElementById('hot-cov-container');
  if (!container) return;
  if (state.hotCov) { state.hotCov.destroy(); state.hotCov = null; }
  state.hotCovCellClasses = {};
  container.innerHTML = '';
  const { x1, x2, y } = state.names;
  const tableData = [
    [`Cov(${x1}, ${y})`, null],
    [`Cov(${x2}, ${y})`, null],
    [`Cov(${x1}, ${x2})`, null]
  ];
  const longest = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Paar');
  const w0 = Math.max(160, Math.ceil(longest.length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotCov = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Paar', 'Covariantie'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 150],
    rowHeaders: false,
    width: w0 + 150,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotCovCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotCorr() {
  const container = document.getElementById('hot-corr-container');
  if (!container) return;
  if (state.hotCorr) { state.hotCorr.destroy(); state.hotCorr = null; }
  state.hotCorrCellClasses = {};
  container.innerHTML = '';
  const { x1, x2, y } = state.names;
  const tableData = [
    [`r(${x1}, ${y})`, null],
    [`r(${x2}, ${y})`, null],
    [`r(${x1}, ${x2})`, null]
  ];
  const longest = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Paar');
  const w0 = Math.max(160, Math.ceil(longest.length * 7) + 16);
  const hotValidate = debounce(evaluateAll, 250);
  state.hotCorr = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Paar', 'Correlatieco\u00ebffici\u00ebnt r'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 150],
    rowHeaders: false,
    width: w0 + 150,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotCorrCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function renderHotCoef() {
  const container = document.getElementById('hot-coef-container');
  if (!container) return;
  if (state.hotCoef) { state.hotCoef.destroy(); state.hotCoef = null; }
  state.hotCoefCellClasses = {};
  container.innerHTML = '';
  const tableData = [
    ['Determinant', null],
    ['Regressieco\u00ebffici\u00ebnt b\u2081', null],
    ['Regressieco\u00ebffici\u00ebnt b\u2082', null],
    ['Intercept a', null]
  ];
  const hotValidate = debounce(evaluateAll, 250);
  state.hotCoef = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Co\u00ebffici\u00ebnt', 'Waarde'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [230, 150],
    rowHeaders: false,
    width: 380,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotCoefCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
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
  const hotValidate = debounce(evaluateAll, 250);
  state.hotFit = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Grootheid', 'Waarde'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [250, 150],
    rowHeaders: false,
    width: 400,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotFitCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
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
  const titleEl = document.getElementById('scenario-title');
  if (titleEl) titleEl.textContent = sc.title;
  const el = document.getElementById('scenario-text');
  el.textContent = sc.vignette;
  const metaEl = document.getElementById('scenario-meta');
  if (metaEl) metaEl.innerHTML = `x1 = <b>${names.x1}</b> | x2 = <b>${names.x2}</b> | Y = <b>${names.y}</b>`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  tbl.className = 'dataset-table';
  tbl.innerHTML = '';
  const { x1, x2, y } = state.names;

  const info = document.getElementById('dataset-info');
  if (info) info.innerHTML = `<strong>N = ${state.rows.length}</strong> waarnemingen. x1 = <strong>${x1}</strong> | x2 = <strong>${x2}</strong> | Y = <strong>${y}</strong>.`;

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

function renderHotPred() {
  const container = document.getElementById('pred-table-container');
  if (!container) return;
  if (state.hotPred) { state.hotPred.destroy(); state.hotPred = null; }
  state.hotPredCellClasses = {};
  container.innerHTML = '';
  if (!state.truth || !state.rows.length) return;
  const { x1, x2, y } = state.names;
  const tableData = state.rows.map(r => [
    r.entity,
    r2(Number(r[x1])),
    r2(Number(r[x2])),
    r2(Number(r[y])),
    null
  ]);
  const longestEntity = state.rows.map(r => r.entity).reduce((a, b) => a.length >= b.length ? a : b, 'Eenheid');
  const w0 = Math.max(100, Math.ceil(longestEntity.length * 7) + 16);
  const colWidths = [w0, 80, 80, 80, 130];
  const hotValidate = debounce(evaluateAll, 250);
  state.hotPred = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Eenheid', x1, x2, y, 'Y\u0302 (voorspeld)'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths,
    rowHeaders: false,
    width: colWidths.reduce((s, w) => s + w, 0) + colWidths.length + 1,
    height: 'auto',
    stretchH: 'none',
    cells(row, col) {
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      const cls = state.hotPredCellClasses[`${row}-${col}`];
      if (cls === 'correct') classes.push('htCorrect');
      else if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
      if (source === 'loadData') return;
      hotValidate();
    }
  });
}

function clearStatuses() {
  const hotKeys = ['hotMeans', 'hotTotals', 'hotVarSd', 'hotCov', 'hotCorr', 'hotCoef', 'hotFit', 'hotPred'];
  hotKeys.forEach(key => {
    if (state[key]) { state[key].destroy(); state[key] = null; }
    state[key + 'CellClasses'] = {};
    const containerId = {
      hotMeans: 'hot-means-container', hotTotals: 'hot-totals-container',
      hotVarSd: 'hot-varsd-container', hotCov: 'hot-cov-container',
      hotCorr: 'hot-corr-container', hotCoef: 'hot-coef-container', hotFit: 'hot-fit-container',
      hotPred: 'pred-table-container'
    }[key];
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  });

  ['fb-deel2', 'fb-deel3', 'fb-deel4', 'fb-deel4a', 'fb-deel4b', 'fb-deel5', 'fb-deel6', 'fb-deel7'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.className = 'section-summary'; }
  });
  document.getElementById('success-card').classList.add('hidden');
  document.getElementById('viz-card').classList.add('hidden');
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
  const m = FIELD_HOT_MAP[id];
  if (!m) return;
  const key = `${m.row}-${m.col}`;
  if (!attempted) {
    delete state[m.classKey][key];
  } else {
    state[m.classKey][key] = ok ? 'correct' : 'incorrect';
  }
  const hot = state[m.hotKey];
  if (hot) hot.render();
}

function evaluatePredictions() {
  if (!state.hotPred || !state.truth) {
    updateSectionSummary('fb-deel6', 0, 0, '', '');
    return { allEntered: false, allCorrect: false, correctCount: 0, totalCount: 0 };
  }
  const data = state.hotPred.getData();
  const n = data.length;
  let allEntered = true;
  let allCorrect = true;
  let correctCount = 0;
  state.hotPredCellClasses = {};
  for (let i = 0; i < n; i++) {
    const v = data[i][4];
    const parsed = typeof v === 'number' ? v : parseNum(String(v ?? ''));
    if (!Number.isFinite(parsed)) {
      allEntered = false;
      allCorrect = false;
    } else {
      const ok = check4(parsed, state.truth.predictions[i]);
      state.hotPredCellClasses[`${i}-4`] = ok ? 'correct' : 'incorrect';
      if (ok) correctCount++;
      else allCorrect = false;
    }
  }
  state.hotPred.render();
  updateSectionSummary('fb-deel6', correctCount, n, 'Voorspellingen correct', 'controleer voorspellingen');
  return { allEntered, allCorrect, correctCount, totalCount: n };
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
    const isCore = CORE_REQUIRED_SET.has(id);
    if (isCore) totalCount += 1;
    const val = getFieldValue(id);
    const attempted = Number.isFinite(val);
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

  const predResult = evaluatePredictions();

  const SECTION_GROUPS = [
    { id: 'fb-deel2', fields: ['mean_X1', 'mean_X2', 'mean_Y'], ok: 'Gemiddelden correct', partial: 'controleer gemiddelden' },
    { id: 'fb-deel3', fields: ['tot_X1_2', 'tot_X2_2', 'tot_X1X2', 'tot_X1Y', 'tot_X2Y', 'tot_Y2'], ok: 'Afwijkingen correct', partial: 'controleer kwadraten en kruisproducten' },
    { id: 'fb-deel4', fields: ['var_X1', 'sd_X1', 'var_X2', 'sd_X2', 'var_Y', 'sd_Y'], ok: 'Varianties en SD correct', partial: 'controleer varianties en SD' },
    { id: 'fb-deel4a', fields: ['cov_x1y', 'cov_x2y', 'cov_x1x2'], ok: 'Covarianties correct', partial: 'controleer covarianties' },
    { id: 'fb-deel4b', fields: ['r_x1y', 'r_x2y', 'r_x1x2'], ok: 'Correlaties correct', partial: 'controleer correlatiecoëfficiënten' },
    { id: 'fb-deel5', fields: ['multi_det', 'multi_b1', 'multi_b2', 'multi_intercept'], ok: 'Regressiecoëfficiënten correct', partial: 'controleer determinant en coëfficiënten' },
    { id: 'fb-deel7', fields: ['multi_r_squared', 'multi_alienation', 'multi_f_stat', 'multi_model_p'], ok: 'Model fit correct', partial: 'controleer R\u00b2, F en p' },
  ];
  SECTION_GROUPS.forEach(sg => {
    let sc = 0;
    sg.fields.forEach(fid => {
      const val = getFieldValue(fid);
      const ok = Number.isFinite(val) && check4(val, state.truth[FIELD_TRUTH_KEY[fid]]);
      if (ok) sc++;
    });
    updateSectionSummary(sg.id, sc, sg.fields.length, sg.ok, sg.partial);
  });

  updateProgress(correctCount, totalCount);

  const unlock = allEntered && allCorrect && predResult.allEntered && predResult.allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    setVizNavLock(unlock);
    if (unlock) {
      document.getElementById('success-card').classList.remove('hidden');
      document.getElementById('viz-card').classList.remove('hidden');
      renderCharts();
    } else {
      document.getElementById('success-card').classList.add('hidden');
      document.getElementById('viz-card').classList.add('hidden');
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
  renderHotPred();
  clearStatuses();
  renderHotMeans();
  renderHotTotals();
  renderHotVarSd();
  renderHotCov();
  renderHotCorr();
  renderHotCoef();
  renderHotFit();
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
}

function init() {
  fillScenarioSelect();
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

