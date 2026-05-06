import { mulberry32, randNormal as randN, pValueFromF, incompleteBeta, logBeta, logGamma, betaCF } from '../../shared/js/stats-utils.js';

const MAX_SAMPLE_SIZE = 50;

const SCENARIOS = [
  {
    id: 'crime_program',
    title: 'Implementatie criminaliteitspreventieprogramma',
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
    ['mean_X1', 'Gemiddelde X₁ (x̄₁)'],
    ['mean_X2', 'Gemiddelde X₂ (x̄₂)'],
    ['mean_Y', 'Gemiddelde Y (ȳ)']
  ],
  totals: [
    ['tot_X1_2', 'S₁₁ = Σ(x₁−x̄₁)²'],
    ['tot_X2_2', 'S₂₂ = Σ(x₂−x̄₂)²'],
    ['tot_X1X2', 'S₁₂ = Σ(x₁−x̄₁)(x₂−x̄₂)'],
    ['tot_X1Y', 'S₁y = Σ(x₁−x̄₁)(y−ȳ)'],
    ['tot_X2Y', 'S₂y = Σ(x₂−x̄₂)(y−ȳ)'],
    ['tot_Y2', 'SST = Σ(y−ȳ)²']
  ],
  varsd: [
    ['var_X1', 's²(X₁)'], ['sd_X1', 's(X₁)'],
    ['var_X2', 's²(X₂)'], ['sd_X2', 's(X₂)'],
    ['var_Y', 's²(Y)'], ['sd_Y', 's(Y)']
  ],
  cov: [
    ['cov_x1y', 'Cov(X₁,Y)'], ['cov_x2y', 'Cov(X₂,Y)'], ['cov_x1x2', 'Cov(X₁,X₂)']
  ],
  corr: [
    ['r_x1y', 'r(X₁,Y)'], ['r_x2y', 'r(X₂,Y)'], ['r_x1x2', 'r(X₁,X₂)']
  ],
  coef: [
    ['multi_det', 'D'],
    ['multi_b1', 'b₁'],
    ['multi_b2', 'b₂'],
    ['multi_intercept', 'Intercept a']
  ],
  fit: [
    ['multi_r_squared', 'R²'],
    ['multi_alienation', '1 − R²'],
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

// mulberry32 — imported from ../../shared/js/stats-utils.js

// randN (randNormal alias) — imported from ../../shared/js/stats-utils.js

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
    { id: 'fb-deel4', fields: ['var_X1', 'sd_X1', 'var_X2', 'sd_X2', 'var_Y', 'sd_Y'], ok: 'Varianties en s correct', partial: 'controleer s² en s' },
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
