(function () {
// mulberry32, randNormal as randN, pValueFromF, incompleteBeta, logBeta, logGamma, betaCF
// are loaded globally from ../../shared/js/stats-utils.js
const randN = randNormal;

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie van het criminaliteitspreventie-programma',
    vignette: 'Een stad heeft een criminaliteitspreventieprogramma uitgerold in tien vergelijkbare buurten. De blootstelling aan het programma en een tweede buurtkarakteristiek worden als onafhankelijke variabelen ingezet. De afhankelijke variabele is het inbraakcijfer per 1.000 inwoners. Onderzoeksvraag: welke combinatie van voorspellers verklaart inbraakcijfers het best? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Programma-blootstelling', unit: '%' }, y: { name: 'Inbraakcijfer', unit: 'per 1.000' } },
    gen: { r_target: -0.45 },
    extras: ['Politie-zichtbaarheid', 'Buurtbijeenkomsten', 'Herhaald slachtofferschap %', 'Straatverlichting', 'Buurtpreventie'],
    entity: 'Buurt'
  },
  {
    id: 'hotspots_policing',
    title: 'Hot-spot politiestrategie',
    vignette: 'Een stedelijke politiezone concentreert voetpatrouilles op meldingenrijke locaties. Naast het aantal patrouille-uren wordt een tweede politiegerelateerde variabele als voorspeller meegenomen. De afhankelijke variabele is het aantal meldingen aan de politie per straat per week. Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in meldingen? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Voetpatrouille-uren', unit: 'uren/week' }, y: { name: 'Meldingen aan politie', unit: 'per week' } },
    gen: { r_target: -0.25 },
    extras: ['Gerichte patrouilles', 'Arrestaties', 'Reactietijd', 'Proactieve controles', 'Openbare-orde meldingen'],
    entity: 'Straat'
  },
  {
    id: 'fear_disorder',
    title: 'Angst voor criminaliteit en buurtwanorde',
    vignette: 'Bewoners in een stedelijke gemeente worden bevraagd over omgevingswanorde en angst voor criminaliteit. Naast de wanordeindex wordt een tweede buurtkarakteristiek als voorspeller opgenomen. De afhankelijke variabele is de angstschaal (0\u2013100). Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in angstscores? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Wanorde-index', unit: '0-10' }, y: { name: 'Angstscore', unit: '0-100' } },
    gen: { r_target: 0.55 },
    extras: ['Onbeschoftheid incidenten', 'Collectieve effectiviteit', 'Straatverlichting', 'Graffiti meldingen', 'Zwerfvuil klachten'],
    entity: 'Buurt'
  },
  {
    id: 'police_public_relations',
    title: 'Politie-publiek relaties',
    vignette: 'Burgers beoordelen hun contacten met de politie op procedurele rechtvaardigheid en een tweede kwaliteitsindicator. De afhankelijke variabele is het vertrouwen in de politie (1\u20137). Onderzoeksvraag: verklaren beide aspecten van politiecontact samen significant het vertrouwen in de politie? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Procedurele rechtvaardigheid', unit: '1-7' }, y: { name: 'Vertrouwen in politie', unit: '1-7' } },
    gen: { r_target: 0.70 },
    extras: ['Eerlijkheid', 'Respect', 'Inspraak', 'Tevredenheid', 'Klachten %'],
    entity: 'District'
  },
  {
    id: 'guardianship_victimization',
    title: 'Toezicht en slachtofferschap',
    vignette: 'De routineactiviteitentheorie stelt dat toezicht en andere kenmerken van de woonomgeving het slachtofferschapsrisico bepalen. Twee huishoudkenmerken worden als voorspellers opgenomen. De afhankelijke variabele is het aantal slachtofferschapincidenten per jaar. Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in slachtofferschap? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Toezicht', unit: '0-10' }, y: { name: 'Slachtofferschap', unit: 'aantal' } },
    gen: { r_target: -0.40 },
    extras: ['Slotkwaliteit', 'Buitenverlichting', 'Alarmbezit', 'Routineactiviteiten', 'Bekwaam toezicht'],
    entity: 'Huishouden'
  },
  {
    id: 'biosocial',
    title: 'Biosociaal risico',
    vignette: 'Jongeren worden gescoord op impulsiviteit en een tweede biosociale risicofactor. Het aantal schoolmeldingen van agressieve incidenten per trimester wordt als uitkomst geregistreerd. Onderzoeksvraag: verklaren beide risicofactoren samen significant de variantie in agressieve incidenten? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Impulsiviteit', unit: 'z-score' }, y: { name: 'Agressieve incidenten', unit: 'schoolmeldingen/trimester' } },
    gen: { r_target: 0.45 },
    extras: ['Zelfbeheersing', 'Leeftijdgenoten afwijkend gedrag', 'Docentenondersteuning', 'Ouderlijk toezicht', 'Schoolbetrokkenheid'],
    entity: 'Student'
  },
  {
    id: 'reentry_recidivism',
    title: 'Re-integratiebegeleiding en recidiverisico',
    vignette: 'Na vrijlating ontvangen deelnemers re-integratiebegeleiding van variabele intensiteit. Naast de ondersteuningsuren wordt een tweede indicator van de begeleidingskwaliteit als voorspeller opgenomen. Na zes maanden wordt een gevalideerde recidiverisicoscore (0\u2013100) afgenomen. Onderzoeksvraag: verklaren beide voorspellers samen significant het recidiverisico? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Ondersteuningsuren', unit: 'per maand' }, y: { name: 'Recidiverisico', unit: '0-100' } },
    gen: { r_target: -0.35 },
    extras: ['Huisvestingsondersteuning', 'Werkgelegenheidsworkshops', 'Identiteitsdocumenten hulp', 'Dossiercontacten', 'Verslavingsbegeleiding'],
    entity: 'Deelnemer'
  },
  {
    id: 'cyber_training',
    title: 'Cybercrime-bewustmakingstraining',
    vignette: 'Een overheidsorganisatie evalueert het effect van cyberveiligheidstraining op phishinggevoeligheid. Naast het aantal trainingsuren wordt een tweede kenmerk van de cyberbeveiliging meegenomen als voorspeller. De afhankelijke variabele is het klikratio op nep-phishingmails (%). Onderzoeksvraag: verklaren beide voorspellers samen significant de variantie in klikratio? Schat het meervoudige regressiemodel en toets de significantie ervan (\u03b1\u00a0=\u00a00,05).',
    vars: { x: { name: 'Trainingsuren', unit: 'uren' }, y: { name: 'Klikratio', unit: '%' } },
    gen: { r_target: -0.55 },
    extras: ['Quizscores', 'Gesimuleerde meldingen', 'Bewustzijnsindex', 'Meldingstijd', 'Beleidkennis'],
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
    ['mean_X1', 'Gemiddelde Xâ‚ (xÌ„â‚)'],
    ['mean_X2', 'Gemiddelde Xâ‚‚ (xÌ„â‚‚)'],
    ['mean_Y', 'Gemiddelde Y (È³)']
  ],
  totals: [
    ['tot_X1_2', 'Sâ‚â‚ = Î£(xâ‚âˆ’xÌ„â‚)Â²'],
    ['tot_X2_2', 'Sâ‚‚â‚‚ = Î£(xâ‚‚âˆ’xÌ„â‚‚)Â²'],
    ['tot_X1X2', 'Sâ‚â‚‚ = Î£(xâ‚âˆ’xÌ„â‚)(xâ‚‚âˆ’xÌ„â‚‚)'],
    ['tot_X1Y', 'Sâ‚y = Î£(xâ‚âˆ’xÌ„â‚)(yâˆ’È³)'],
    ['tot_X2Y', 'Sâ‚‚y = Î£(xâ‚‚âˆ’xÌ„â‚‚)(yâˆ’È³)'],
    ['tot_Y2', 'SST = Î£(yâˆ’È³)Â²']
  ],
  varsd: [
    ['var_X1', 'sÂ²(Xâ‚)'], ['sd_X1', 's(Xâ‚)'],
    ['var_X2', 'sÂ²(Xâ‚‚)'], ['sd_X2', 's(Xâ‚‚)'],
    ['var_Y', 'sÂ²(Y)'], ['sd_Y', 's(Y)']
  ],
  cov: [
    ['cov_x1y', 'Cov(Xâ‚,Y)'], ['cov_x2y', 'Cov(Xâ‚‚,Y)'], ['cov_x1x2', 'Cov(Xâ‚,Xâ‚‚)']
  ],
  corr: [
    ['r_x1y', 'r(Xâ‚,Y)'], ['r_x2y', 'r(Xâ‚‚,Y)'], ['r_x1x2', 'r(Xâ‚,Xâ‚‚)']
  ],
  coef: [
    ['multi_det', 'D'],
    ['multi_b1', 'bâ‚'],
    ['multi_b2', 'bâ‚‚'],
    ['multi_intercept', 'Intercept a']
  ],
  fit: [
    ['multi_r_squared', 'RÂ²'],
    ['multi_alienation', '1 âˆ’ RÂ²'],
    ['multi_f_stat', 'F'],
    ['multi_model_p', 'p']
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
  return Math.abs(u - t) < 0.0005;
}

function safeSeed(seedRaw) {
  const s = Number(seedRaw);
  if (!Number.isFinite(s) || s <= 0) return null;
  return Math.floor(Math.abs(s)) % 2147483647;
}

function nextRandomSeed() {
  return Math.floor(Math.random() * 1000000000) + 1;
}

// mulberry32, randN â€” loaded globally from stats-utils.js

function unitParams(unit, axis) {
  if (/1-7|1â€“7/.test(unit)) return [4, 1.2];
  if (/%|score|Score|Risico|Ratio|Cijfer|klikratio/i.test(unit)) return [50, 15];
  if (/uren\/week|per week|uren/i.test(unit)) return [40, 12];
  if (/per 1\.000|per maand|per jaar/i.test(unit)) return [30, 10];
  if (/z-score/i.test(unit)) return [0, 1];
  if (/schoolmeldingen/i.test(unit)) return [5, 3];
  return [50, 15];
}

function scaleByUnit(Zvals, center, scale) {
  return Zvals.map(z => Math.round((center + z * scale) * 100) / 100);
}

function makeScenarioData(sc, nRaw, seedRaw) {
  const n = Math.max(5, Math.min(MAX_SAMPLE_SIZE,
    Number.isFinite(Number(nRaw)) ? Math.floor(Number(nRaw)) : 10));
  const ss = safeSeed(seedRaw);
  const rng = mulberry32(ss == null ? Math.floor(Math.random() * 1e9) : ss);

  const extras = sc.extras || [];
  const x2Name = extras[Math.floor(rng() * extras.length)] || 'Extra variabele';
  const x1Name = sc.vars.x.name;
  const yName = sc.vars.y.name;

  const rho = 0.3 + rng() * 0.3;
  const z1 = Array.from({ length: n }, () => randN(rng));
  const z2 = z1.map(v => rho * v + Math.sqrt(Math.max(0, 1 - rho * rho)) * randN(rng));
  const eps = Array.from({ length: n }, () => randN(rng));

  const [x1c, x1s] = unitParams(sc.vars.x.unit, 'x1');
  const [x2c, x2s] = unitParams('', 'x2');
  const [yc, ys] = unitParams(sc.vars.y.unit, 'y');

  const x1jitter = (rng() * 0.4 - 0.2);
  const x2jitter = (rng() * 0.4 - 0.2);
  const yjitter = (rng() * 0.4 - 0.2);

  const X1 = scaleByUnit(z1, x1c * (1 + x1jitter), x1s * (0.8 + rng() * 0.4));
  const X2 = scaleByUnit(z2, x2c * (1 + x2jitter), x2s * (0.8 + rng() * 0.4));
  const Y = scaleByUnit(z1.map((v, i) => 0.5 * v + 0.4 * z2[i] + 0.3 * eps[i]),
    yc * (1 + yjitter), ys * (0.8 + rng() * 0.4));

  const entity = sc.entity || 'Eenheid';
  const rows = X1.map((x1v, i) => ({
    entity: `${entity} ${i + 1}`,
    [x1Name]: x1v,
    [x2Name]: X2[i],
    [yName]: Y[i]
  }));

  return { rows, names: { x1: x1Name, x2: x2Name, y: yName } };
}

function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }

function calcTruth(rows, names) {
  if (!rows || !rows.length) return null;
  const n = rows.length;
  if (n < 3) return null;

  const X1 = rows.map(r => r2(Number(r[names.x1])));
  const X2 = rows.map(r => r2(Number(r[names.x2])));
  const Y = rows.map(r => r2(Number(r[names.y])));

  const x1_bar = r4(mean(X1));
  const x2_bar = r4(mean(X2));
  const y_bar = r4(mean(Y));

  const dx1 = X1.map(v => v - x1_bar);
  const dx2 = X2.map(v => v - x2_bar);
  const dy = Y.map(v => v - y_bar);

  const S11 = r4(dx1.reduce((s, v) => s + v * v, 0));
  const S22 = r4(dx2.reduce((s, v) => s + v * v, 0));
  const S12 = r4(dx1.reduce((s, v, i) => s + v * dx2[i], 0));
  const S1y = r4(dx1.reduce((s, v, i) => s + v * dy[i], 0));
  const S2y = r4(dx2.reduce((s, v, i) => s + v * dy[i], 0));
  const SST = r4(dy.reduce((s, v) => s + v * v, 0));

  const var_X1 = r4(S11 / (n - 1));
  const var_X2 = r4(S22 / (n - 1));
  const var_Y = r4(SST / (n - 1));
  const sd_X1 = r4(Math.sqrt(var_X1));
  const sd_X2 = r4(Math.sqrt(var_X2));
  const sd_Y = r4(Math.sqrt(var_Y));

  const cov_x1y = r4(S1y / (n - 1));
  const cov_x2y = r4(S2y / (n - 1));
  const cov_x1x2 = r4(S12 / (n - 1));

  const r_x1y = r4(sd_X1 * sd_Y > 0 ? cov_x1y / (sd_X1 * sd_Y) : 0);
  const r_x2y = r4(sd_X2 * sd_Y > 0 ? cov_x2y / (sd_X2 * sd_Y) : 0);
  const r_x1x2 = r4(sd_X1 * sd_X2 > 0 ? cov_x1x2 / (sd_X1 * sd_X2) : 0);

  // Regression coefficients via Cramer's rule
  const det = r4(S11 * S22 - S12 * S12);
  const b1 = det !== 0 ? r4((S1y * S22 - S2y * S12) / det) : 0;
  const b2 = det !== 0 ? r4((S2y * S11 - S1y * S12) / det) : 0;
  const intercept = r4(y_bar - b1 * x1_bar - b2 * x2_bar);

  const Y_hat = X1.map((x1v, i) => intercept + b1 * x1v + b2 * X2[i]);
  const SSR = Y_hat.reduce((s, yh, i) => s + (yh - y_bar) ** 2, 0);
  const R_squared = r4(SST > 0 ? SSR / SST : 0);
  const alienation = r4(1 - R_squared);
  const F_stat = r4((SSR / 2) / ((SST - SSR) / (n - 3)));
  const model_p = r4(pValueFromF(F_stat, 2, n - 3));

  return {
    x1_bar, x2_bar, y_bar,
    S11, S22, S12, S1y, S2y, SST,
    var_X1, var_X2, var_Y, sd_X1, sd_X2, sd_Y,
    cov_x1y, cov_x2y, cov_x1x2,
    r_x1y, r_x2y, r_x1x2,
    det, b1, b2, intercept,
    R_squared, alienation, F_stat, model_p
  };
}

// â”€â”€â”€ Helper functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fillScenarioSelect() {
  const sel = document.getElementById('scenario');
  if (!sel) return;
  sel.innerHTML = '';
  SCENARIOS.forEach(sc => {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.title;
    sel.appendChild(opt);
  });
}

function setScenarioText(sc, names) {
  const titleEl = document.getElementById('scenario-title');
  if (titleEl) titleEl.textContent = sc.title;
  const textEl = document.getElementById('scenario-text');
  if (textEl) textEl.textContent = sc.vignette;
  const metaEl = document.getElementById('scenario-meta');
  if (metaEl) metaEl.innerHTML = '';
  const infoEl = document.getElementById('dataset-info');
  if (infoEl) infoEl.textContent = `Dataset: N\u00a0=\u00a0${state.rows.length} | Datasetcode: ${document.getElementById('seed').value}`;
}

function renderDatasetTable() {
  const tbl = document.getElementById('dataset-table');
  if (!tbl) return;
  tbl.innerHTML = '';
  const { x1, x2, y } = state.names;
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Eenheid</th><th>${x1}</th><th>${x2}</th><th>${y}</th></tr>`;
  tbl.appendChild(thead);
  const tbody = document.createElement('tbody');
  state.rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.entity}</td><td>${Number(r[x1]).toFixed(2)}</td><td>${Number(r[x2]).toFixed(2)}</td><td>${Number(r[y]).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

function updateSectionSummary(divId, correct, total, labelOk, labelPartial) {
  const el = document.getElementById(divId);
  if (!el) return;
  if (total === 0) { el.innerHTML = ''; el.className = 'section-summary'; return; }
  if (correct === total) {
    el.innerHTML = `\u2713 ${labelOk} (${correct}/${total})`;
    el.className = 'section-summary ok';
  } else {
    el.innerHTML = `${correct}/${total} correct \u2014 ${labelPartial}`;
    el.className = 'section-summary partial';
  }
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

function clearStatuses() {
  state.hotMeansCellClasses = {};
  state.hotTotalsCellClasses = {};
  state.hotVarSdCellClasses = {};
  state.hotCovCellClasses = {};
  state.hotCorrCellClasses = {};
  state.hotCoefCellClasses = {};
  state.hotFitCellClasses = {};
  state.hotPredCellClasses = {};
  ['fb-deel2', 'fb-deel3', 'fb-deel4', 'fb-deel4a', 'fb-deel4b', 'fb-deel5', 'fb-deel6', 'fb-deel7'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.className = 'section-summary'; }
  });
  const suc = document.getElementById('success-card');
  const viz = document.getElementById('viz-card');
  const vizLock = document.getElementById('viz-lock');
  const vizCont = document.getElementById('viz-content');
  if (suc) suc.classList.add('hidden');
  if (viz) { viz.classList.add('locked'); viz.classList.add('hidden'); }
  if (vizLock) vizLock.classList.remove('hidden');
  if (vizCont) vizCont.classList.add('hidden');
  state.unlocked = false;
  setVizNavLock(false);
  updateProgress(0, 0);
}

// â”€â”€â”€ Handsontable render functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  if (!state.rows.length) return;
  const { x1, x2, y } = state.names;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    [`Gemiddelde X\u2081 \u2014 ${x1}`, null],
    [`Gemiddelde X\u2082 \u2014 ${x2}`, null],
    [`Gemiddelde Y \u2014 ${y}`, null]
  ];
  state.hotMeans = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [280, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 420, height: 'auto', stretchH: 'none',
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
  if (!state.rows.length) return;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['S\u2081\u2081 = \u03a3(x\u2081\u2212x\u0304\u2081)\u00b2 &mdash; kolomsom kwadraten X\u2081', null],
    ['S\u2082\u2082 = \u03a3(x\u2082\u2212x\u0304\u2082)\u00b2 &mdash; kolomsom kwadraten X\u2082', null],
    ['S\u2081\u2082 = \u03a3(x\u2081\u2212x\u0304\u2081)(x\u2082\u2212x\u0304\u2082) &mdash; kruisproducten X\u2081X\u2082', null],
    ['S\u2081y = \u03a3(x\u2081\u2212x\u0304\u2081)(y\u2212\u0233) &mdash; kruisproducten X\u2081Y', null],
    ['S\u2082y = \u03a3(x\u2082\u2212x\u0304\u2082)(y\u2212\u0233) &mdash; kruisproducten X\u2082Y', null],
    ['SST = \u03a3(y\u2212\u0233)\u00b2 &mdash; totale kwadratensom Y', null]
  ];
  state.hotTotals = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true, renderer: 'html' },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [420, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 560, height: 'auto', stretchH: 'none',
    cells: makeHotCells('hotTotalsCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotVarSd() {
  const container = document.getElementById('hot-varsd-container');
  if (!container) return;
  if (state.hotVarSd) { state.hotVarSd.destroy(); state.hotVarSd = null; }
  state.hotVarSdCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length) return;
  const { x1, x2, y } = state.names;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['Variantie \u2014 s\u00b2', null, null, null],
    ['Standaardafwijking \u2014 s', null, null, null]
  ];
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
    colWidths: [200, 130, 130, 130],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 590, height: 'auto', stretchH: 'none',
    cells: makeHotCells('hotVarSdCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotCov() {
  const container = document.getElementById('hot-cov-container');
  if (!container) return;
  if (state.hotCov) { state.hotCov.destroy(); state.hotCov = null; }
  state.hotCovCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length) return;
  const { x1, x2, y } = state.names;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    [`Cov(X\u2081,Y) \u2014 covariantie ${x1} en ${y}`, null],
    [`Cov(X\u2082,Y) \u2014 covariantie ${x2} en ${y}`, null],
    [`Cov(X\u2081,X\u2082) \u2014 covariantie ${x1} en ${x2}`, null]
  ];
  state.hotCov = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [360, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 500, height: 'auto', stretchH: 'none',
    cells: makeHotCells('hotCovCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotCorr() {
  const container = document.getElementById('hot-corr-container');
  if (!container) return;
  if (state.hotCorr) { state.hotCorr.destroy(); state.hotCorr = null; }
  state.hotCorrCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length) return;
  const { x1, x2, y } = state.names;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    [`r(X\u2081,Y) \u2014 correlatie ${x1} en ${y}`, null],
    [`r(X\u2082,Y) \u2014 correlatie ${x2} en ${y}`, null],
    [`r(X\u2081,X\u2082) \u2014 correlatie ${x1} en ${x2}`, null]
  ];
  state.hotCorr = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [360, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 500, height: 'auto', stretchH: 'none',
    cells: makeHotCells('hotCorrCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotCoef() {
  const container = document.getElementById('hot-coef-container');
  if (!container) return;
  if (state.hotCoef) { state.hotCoef.destroy(); state.hotCoef = null; }
  state.hotCoefCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length) return;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['D = S\u2081\u2081\u00b7S\u2082\u2082 \u2212 S\u2081\u2082\u00b2 \u2014 determinant', null],
    ['b\u2081 \u2014 parti\u00eble regressiecoÃ«fficiÃ«nt X\u2081', null],
    ['b\u2082 \u2014 parti\u00eble regressiecoÃ«fficiÃ«nt X\u2082', null],
    ['a \u2014 intercept', null]
  ];
  state.hotCoef = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [380, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 520, height: 'auto', stretchH: 'none',
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
  if (!state.rows.length) return;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = [
    ['R\u00b2 \u2014 determinatiecoÃ«fficiÃ«nt', null],
    ['1 \u2212 R\u00b2 \u2014 vervreemding', null],
    ['F \u2014 F-statistiek (df\u2081\u00a0=\u00a02)', null],
    ['p \u2014 model p-waarde', null]
  ];
  state.hotFit = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Maat', 'Jouw antwoord'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [300, 140],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: 440, height: 'auto', stretchH: 'none',
    cells: makeHotCells('hotFitCellClasses'),
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

function renderHotPred() {
  const container = document.getElementById('pred-table-container');
  if (!container) return;
  if (state.hotPred) { state.hotPred.destroy(); state.hotPred = null; }
  state.hotPredCellClasses = {};
  container.innerHTML = '';
  if (!state.rows.length || !state.truth) return;
  const { x1, x2, y } = state.names;
  const hotValidate = debounce(evaluateAll, 250);
  const tableData = state.rows.map(r => [
    r.entity,
    r2(Number(r[x1])),
    r2(Number(r[x2])),
    r2(Number(r[y])),
    null
  ]);
  const w0 = Math.max(70, Math.ceil(state.rows[0].entity.length * 7) + 16);
  const wN = 100;
  state.hotPred = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Eenheid', x1, x2, y, 'Y\u0302 = a + b\u2081X\u2081 + b\u2082X\u2082'],
    columns: [
      { type: 'text', readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
      { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, wN, wN, wN, 160],
    rowHeaders: false, allowInsertRow: false, allowInsertColumn: false, width: w0 + wN * 3 + 160, height: 'auto', stretchH: 'none',
    cells(row, col) {
      const key = `${row}-${col}`;
      const cls = state.hotPredCellClasses[key];
      const classes = [col === 0 ? 'htLeft' : 'htCenter'];
      if (cls === 'correct') classes.push('htCorrect');
      if (cls === 'incorrect') classes.push('htIncorrect');
      return { className: classes.join(' ') };
    },
    afterChange(changes, source) { if (source === 'loadData') return; hotValidate(); }
  });
}

// â”€â”€â”€ Prediction evaluation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function evaluatePredictions() {
  if (!state.truth || !state.rows.length) return { allEntered: false, allCorrect: false };
  const t = state.truth;
  const { x1, x2 } = state.names;
  const n = state.rows.length;
  const newCls = {};
  let correct = 0, entered = 0;
  const d = state.hotPred ? state.hotPred.getData() : [];
  for (let i = 0; i < n; i++) {
    const x1v = r2(Number(state.rows[i][x1]));
    const x2v = r2(Number(state.rows[i][x2]));
    const expected = r4(t.intercept + t.b1 * x1v + t.b2 * x2v);
    const raw = d[i] ? d[i][4] : null;
    const str = raw == null ? '' : String(raw).trim();
    if (!str) continue;
    entered++;
    const num = parseFloat(str.replace(',', '.'));
    if (!Number.isFinite(num)) { newCls[`${i}-4`] = 'incorrect'; continue; }
    if (check4(num, expected)) {
      newCls[`${i}-4`] = 'correct';
      correct++;
    } else {
      newCls[`${i}-4`] = 'incorrect';
    }
  }
  state.hotPredCellClasses = newCls;
  if (state.hotPred) state.hotPred.render();
  updateSectionSummary('fb-deel6', correct, n, 'Voorspellingen correct', 'controleer Y\u0302 = a + b\u2081X\u2081 + b\u2082X\u2082');
  return { allEntered: entered === n, allCorrect: correct === n };
}

// â”€â”€â”€ Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function destroyCharts() {
  Object.values(state.charts).forEach(ch => { if (ch) ch.destroy(); });
  state.charts = { calibration: null, residual: null, predictor: null };
}

function renderCharts() {
  destroyCharts();
  const t = state.truth;
  const { x1, x2, y } = state.names;
  const X1 = state.rows.map(r => r2(Number(r[x1])));
  const X2 = state.rows.map(r => r2(Number(r[x2])));
  const Y = state.rows.map(r => r2(Number(r[y])));
  const Yhat = X1.map((v, i) => r4(t.intercept + t.b1 * v + t.b2 * X2[i]));
  const n = state.rows.length;

  // Calibration: Å¶ vs Y
  const calPts = Yhat.map((yh, i) => ({ x: yh, y: Y[i] }));
  const calMin = Math.min(...calPts.map(p => Math.min(p.x, p.y)));
  const calMax = Math.max(...calPts.map(p => Math.max(p.x, p.y)));
  state.charts.calibration = new Chart(document.getElementById('calibration-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Observaties', data: calPts, backgroundColor: '#2563eb', pointRadius: 4 },
        { type: 'line', label: 'Perfecte fit', data: [{ x: calMin, y: calMin }, { x: calMax, y: calMax }], borderColor: '#dc2626', borderDash: [6, 6], pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, plugins: { title: { display: true, text: 'Kalibratieplot (Y\u0302 vs Y)' } },
      scales: { x: { title: { display: true, text: 'Voorspeld (Y\u0302)' } }, y: { title: { display: true, text: `Geobserveerd (${y})` } } }
    }
  });

  // Residuals: Å¶ vs e
  const resPts = Yhat.map((yh, i) => ({ x: yh, y: r4(Y[i] - yh) }));
  const resMin = Math.min(...resPts.map(p => p.x));
  const resMax = Math.max(...resPts.map(p => p.x));
  state.charts.residual = new Chart(document.getElementById('residual-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Residuen', data: resPts, backgroundColor: '#7c3aed', pointRadius: 4 },
        { type: 'line', label: 'Nul-lijn', data: [{ x: resMin, y: 0 }, { x: resMax, y: 0 }], borderColor: '#dc2626', pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, plugins: { title: { display: true, text: 'Residuenplot (Y\u0302 vs e)' } },
      scales: { x: { title: { display: true, text: 'Voorspeld (Y\u0302)' } }, y: { title: { display: true, text: 'Residuen (e = Y \u2212 Y\u0302)' } } }
    }
  });

  // Predictors: X1 vs Y and X2 vs Y
  state.charts.predictor = new Chart(document.getElementById('predictor-chart').getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: x1, data: X1.map((v, i) => ({ x: v, y: Y[i] })), backgroundColor: '#0f766e', pointRadius: 4 },
        { label: x2, data: X2.map((v, i) => ({ x: v, y: Y[i] })), backgroundColor: '#f59e0b', pointRadius: 4 }
      ]
    },
    options: {
      responsive: true, plugins: { title: { display: true, text: `Voorspellers vs ${y}` }, legend: { display: true } },
      scales: { x: { title: { display: true, text: 'Voorspeller' } }, y: { title: { display: true, text: y } } }
    }
  });

  // Interpretation
  const pText = Number.isFinite(t.model_p) ? (t.model_p < 0.0001 ? '< 0,0001' : t.model_p.toFixed(4)) : 'n.v.t.';
  const sig = Number.isFinite(t.model_p) && t.model_p < 0.05;
  const x1N = state.names.x1, x2N = state.names.x2, yN = state.names.y;
  const r2pct = (t.R_squared * 100).toFixed(1);
  const alPct = (t.alienation * 100).toFixed(1);
  document.getElementById('interpretation').innerHTML = `
    <b>Interpretatie</b>
    <ul>
      <li><b>PartiÃ«le regressiecoÃ«fficiÃ«nt bâ‚</b> = ${t.b1.toFixed(4)} â€” als <em>${x1N}</em> met 1 eenheid stijgt (met ${x2N} constant), ${t.b1 >= 0 ? 'stijgt' : 'daalt'} <em>${yN}</em> met ${Math.abs(t.b1).toFixed(4)} eenheden.</li>
      <li><b>PartiÃ«le regressiecoÃ«fficiÃ«nt bâ‚‚</b> = ${t.b2.toFixed(4)} â€” als <em>${x2N}</em> met 1 eenheid stijgt (met ${x1N} constant), ${t.b2 >= 0 ? 'stijgt' : 'daalt'} <em>${yN}</em> met ${Math.abs(t.b2).toFixed(4)} eenheden.</li>
      <li><b>Intercept a</b> = ${t.intercept.toFixed(4)} â€” voorspelde waarde van <em>${yN}</em> wanneer beide voorspellers = 0.</li>
      <li><b>DeterminatiecoÃ«fficiÃ«nt RÂ²</b> = ${t.R_squared.toFixed(4)} â€” ${r2pct}% van de variantie in <em>${yN}</em> wordt verklaard door <em>${x1N}</em> en <em>${x2N}</em> samen.</li>
      <li><b>VervreemdingscoÃ«fficiÃ«nt (1 âˆ’ RÂ²)</b> = ${t.alienation.toFixed(4)} â€” ${alPct}% blijft onverklaard.</li>
      <li>F(2,\u00a0${n - 3})\u00a0=\u00a0${t.F_stat.toFixed(4)}, p\u00a0=\u00a0${pText}</li>
      <li>${sig
      ? `Model is <b>statistisch significant</b> (p&nbsp;&lt;&nbsp;.05): de combinatie van <em>${x1N}</em> en <em>${x2N}</em> verklaart statistisch aantoonbaar variantie in <em>${yN}</em>. RÂ² en de b-coÃ«fficiÃ«nten zijn betrouwbare schattingen voor de populatie.`
      : `Model is <b>niet statistisch significant</b> (p&nbsp;â‰¥&nbsp;.05): de combinatie van <em>${x1N}</em> en <em>${x2N}</em> verklaart geen statistisch aantoonbaar deel van de variantie in <em>${yN}</em>. RÂ² en de b-coÃ«fficiÃ«nten zijn <em>niet</em> betrouwbaar interpreteerbaar â€” het resultaat kan op toeval berusten.`}</li>
    </ul>`;
}

// â”€â”€â”€ Evaluation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function evaluateAll() {


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

  // Re-render all hot tables to reflect updated cell classes
  [state.hotMeans, state.hotTotals, state.hotVarSd, state.hotCov, state.hotCorr, state.hotCoef, state.hotFit]
    .forEach(hot => { if (hot) hot.render(); });

  const predResult = evaluatePredictions();

  const SECTION_GROUPS = [
    { id: 'fb-deel2', fields: ['mean_X1', 'mean_X2', 'mean_Y'], ok: 'Gemiddelden correct', partial: 'controleer gemiddelden' },
    { id: 'fb-deel3', fields: ['tot_X1_2', 'tot_X2_2', 'tot_X1X2', 'tot_X1Y', 'tot_X2Y', 'tot_Y2'], ok: 'Afwijkingen correct', partial: 'controleer kwadraten en kruisproducten' },
    { id: 'fb-deel4', fields: ['var_X1', 'sd_X1', 'var_X2', 'sd_X2', 'var_Y', 'sd_Y'], ok: 'Varianties en s correct', partial: 'controleer sÂ² en s' },
    { id: 'fb-deel4a', fields: ['cov_x1y', 'cov_x2y', 'cov_x1x2'], ok: 'Covarianties correct', partial: 'controleer covarianties' },
    { id: 'fb-deel4b', fields: ['r_x1y', 'r_x2y', 'r_x1x2'], ok: 'Correlaties correct', partial: 'controleer correlatiecoÃ«fficiÃ«nten' },
    { id: 'fb-deel5', fields: ['multi_det', 'multi_b1', 'multi_b2', 'multi_intercept'], ok: 'RegressiecoÃ«fficiÃ«nten correct', partial: 'controleer determinant en coÃ«fficiÃ«nten' },
    { id: 'fb-deel7', fields: ['multi_r_squared', 'multi_alienation', 'multi_f_stat', 'multi_model_p'], ok: 'Model fit correct', partial: 'controleer R\u00b2, F en p' },
  ];
  const sectionScores = {};
  SECTION_GROUPS.forEach(sg => {
    let sc = 0;
    sg.fields.forEach(fid => {
      const val = getFieldValue(fid);
      const ok = Number.isFinite(val) && check4(val, state.truth[FIELD_TRUTH_KEY[fid]]);
      if (ok) sc++;
    });
    sectionScores[sg.id] = { correct: sc, total: sg.fields.length };
    updateSectionSummary(sg.id, sc, sg.fields.length, sg.ok, sg.partial);
  });

  updateProgress(correctCount, totalCount);
  const isComplete = (id) => {
    const info = sectionScores[id];
    return Boolean(info && info.total > 0 && info.correct === info.total);
  };
  const stepDone = {
    2: isComplete('fb-deel2'),
    3: isComplete('fb-deel3'),
    4: isComplete('fb-deel4') && isComplete('fb-deel4a') && isComplete('fb-deel4b'),
    5: isComplete('fb-deel5'),
    6: predResult.allEntered && predResult.allCorrect,
    7: isComplete('fb-deel7')
  };
  updateStepLocks(stepDone);

  const unlock = allEntered && allCorrect && predResult.allEntered && predResult.allCorrect;
  if (unlock !== state.unlocked) {
    state.unlocked = unlock;
    setVizNavLock(unlock);
    if (unlock) {
      document.getElementById('success-card').classList.remove('hidden');
      document.getElementById('viz-card').classList.remove('locked');
      document.getElementById('viz-card').classList.remove('hidden');
      document.getElementById('viz-lock').classList.add('hidden');
      document.getElementById('viz-content').classList.remove('hidden');
      renderCharts();
    } else {
      document.getElementById('success-card').classList.add('hidden');
      document.getElementById('viz-card').classList.add('locked');
      document.getElementById('viz-card').classList.add('hidden');
      document.getElementById('viz-lock').classList.remove('hidden');
      document.getElementById('viz-content').classList.add('hidden');
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

// Step-by-step section locking
function updateStepLocks(stepDone) {
  const corrMode = state.mode === 'Correlation';
  const lastStep = corrMode ? 4 : 7;

  for (let step = 2; step <= 7; step++) {
    const sec = document.getElementById(`deel${step}`);
    const nav = document.querySelector(`.nav-item[data-target="deel${step}"]`);
    if (!sec) continue;

    const prevDone = step === 2 ? true : (stepDone[step - 1] === true);
    const locked = !prevDone;

    if (locked) {
      sec.classList.add('step-locked');
      sec.classList.add('hidden');
      if (nav) {
        nav.classList.add('step-nav-locked');
        nav.classList.add('locked');
      }
    } else {
      sec.classList.remove('step-locked');
      sec.classList.remove('hidden');
      if (nav) {
        nav.classList.remove('step-nav-locked');
        if (step <= lastStep) nav.classList.remove('locked');
      }
    }
  }
}

function lockAllSteps() {
  const done = {};
  updateStepLocks(done);
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
  clearStatuses();
  renderDatasetTable();
  renderHotMeans();
  renderHotTotals();
  renderHotVarSd();
  renderHotCov();
  renderHotCorr();
  renderHotCoef();
  renderHotPred();
  renderHotFit();
  lockAllSteps();
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

})();
