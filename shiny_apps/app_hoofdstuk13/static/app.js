'use strict';

// ─── SCENARIOS ────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'adolescent_morality',
    title: 'Adolescenten & moraliteit',
    vignette: 'Op basis van een steekproef van adolescenten werden data verzameld over geslacht, impulsiviteit (X1), geanticipeerde schuld (X2) en moraliteit (Y) — de mate waarin respondenten kleine delicten al dan niet goedkeuren.',
    group: { name: 'Geslacht', cat1: 'Jongen', cat2: 'Meisje' },
    x1: { name: 'Impulsiviteit', unit: '0–20' },
    x2: { name: 'GeanticiipeerdeSculd', unit: '0–20' },
    y:  { name: 'Moraliteit', unit: '0–20' },
    gen: { r_x1y: -0.25, r_x2y: 0.45, r_x1x2: -0.30 },
    center: { x1: 11, x2: 9, y: 12 },
    scale:  { x1: 3.2, x2: 3.5, y: 3.0 },
    pred: { x1: 15, x2: 12, label: 'X1 = 15, X2 = 12' }
  },
  {
    id: 'recidivism',
    title: 'Recidive & re-integratie',
    vignette: 'Een steekproef van ex-gedetineerden werd gevolgd na vrijlating. Variabelen: geslacht, ondersteuningsuren per maand (X1), sociale bindingsindex (X2) en recidiverisicoscore (Y, laag = minder risico).',
    group: { name: 'Geslacht', cat1: 'Man', cat2: 'Vrouw' },
    x1: { name: 'OndersteuningsUren', unit: '0–30' },
    x2: { name: 'SocialeBinding', unit: '0–20' },
    y:  { name: 'RecidiveRisico', unit: '0–20' },
    gen: { r_x1y: -0.50, r_x2y: -0.40, r_x1x2: 0.35 },
    center: { x1: 14, x2: 10, y: 13 },
    scale:  { x1: 5, x2: 3.5, y: 3.5 },
    pred: { x1: 20, x2: 14, label: 'X1 = 20, X2 = 14' }
  },
  {
    id: 'police_trust',
    title: 'Politievertrouwen & slachtofferschap',
    vignette: 'Een buurtsurvey verzamelde gegevens over geslacht, slachtofferschapervaring (X1), angst voor criminaliteit (X2) en vertrouwen in de politie (Y, 0–20 schaal).',
    group: { name: 'Geslacht', cat1: 'Man', cat2: 'Vrouw' },
    x1: { name: 'SlachtofferschapIncidenten', unit: '0–10' },
    x2: { name: 'AngstScore', unit: '0–20' },
    y:  { name: 'VertrouwenPolitie', unit: '0–20' },
    gen: { r_x1y: -0.45, r_x2y: -0.55, r_x1x2: 0.60 },
    center: { x1: 4, x2: 10, y: 13 },
    scale:  { x1: 2, x2: 4, y: 3.5 },
    pred: { x1: 6, x2: 14, label: 'X1 = 6, X2 = 14' }
  },
  {
    id: 'hotspot',
    title: 'Hotspot policing & meldingen',
    vignette: 'Straten variëren in de inzet van voetpatrouilles (X1, uren/week), zichtbaar toezicht (X2, 0–20) en het aantal misdaadmeldingen per week (Y). Straten worden opgesplitst in hoog- en laagrisico-zone.',
    group: { name: 'Zone', cat1: 'Laagrisico', cat2: 'Hoogrisico' },
    x1: { name: 'PatrouilleUren', unit: '0–30' },
    x2: { name: 'ToezichtIndex', unit: '0–20' },
    y:  { name: 'MisdaadMeldingen', unit: '0–20' },
    gen: { r_x1y: -0.55, r_x2y: -0.45, r_x1x2: 0.50 },
    center: { x1: 12, x2: 10, y: 11 },
    scale:  { x1: 5, x2: 3.5, y: 3.5 },
    pred: { x1: 18, x2: 15, label: 'X1 = 18, X2 = 15' }
  },
  {
    id: 'school_delinquency',
    title: 'School & delinquentie',
    vignette: 'Leerlingen werden ondervraagd over geslacht, zelfbeheersing (X1, 0–20), schoolbetrokkenheid (X2, 0–20) en zelfgerapporteerde delinquentie (Y, 0–20). Hogere X1 en X2 weerspiegelen sterkere binding.',
    group: { name: 'Geslacht', cat1: 'Jongen', cat2: 'Meisje' },
    x1: { name: 'Zelfbeheersing', unit: '0–20' },
    x2: { name: 'SchoolBetrokkenheid', unit: '0–20' },
    y:  { name: 'Delinquentie', unit: '0–20' },
    gen: { r_x1y: -0.50, r_x2y: -0.45, r_x1x2: 0.55 },
    center: { x1: 12, x2: 13, y: 8 },
    scale:  { x1: 3.5, x2: 3, y: 3 },
    pred: { x1: 8, x2: 8, label: 'X1 = 8, X2 = 8' }
  }
];

const state = { scenario: null, rows: [], truth: null };

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
    if (sc?.x1?.name) sc.x1.name = humanizeLabel(sc.x1.name);
    if (sc?.x2?.name) sc.x2.name = humanizeLabel(sc.x2.name);
    if (sc?.y?.name) sc.y.name = humanizeLabel(sc.y.name);
    if (sc?.group?.name) sc.group.name = humanizeLabel(sc.group.name);
  });
}

normalizeScenarioLabels();

function safeSeed(seedRaw) {
  const s = Number(seedRaw);
  if (!Number.isFinite(s) || s <= 0) return null;
  return Math.floor(Math.abs(s)) % 2147483647;
}

function nextRandomSeed() {
  return Math.floor(Math.random() * 1000000000) + 1;
}

function r4(v) { return Math.round(v * 10000) / 10000; }
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
function sampleVariance(arr) { const m = mean(arr); return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1); }
function sampleSD(arr) { return Math.sqrt(sampleVariance(arr)); }
function variation(arr) { const m = mean(arr); return arr.reduce((s, v) => s + (v - m) ** 2, 0); }
function covariation(a, b) { const ma = mean(a), mb = mean(b); return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0); }
function covariance(a, b) { return covariation(a, b) / (a.length - 1); }
function correlation(a, b) { const cov = covariation(a, b), va = variation(a), vb = variation(b); if (va === 0 || vb === 0) return NaN; return cov / Math.sqrt(va * vb); }
function linReg(x, y) { const b = covariation(x, y) / variation(x), a = mean(y) - b * mean(x); return { a: r4(a), b: r4(b) }; }
function multiReg(x1, x2, y) {
  const S11 = variation(x1), S22 = variation(x2), S12 = covariation(x1, x2);
  const S1y = covariation(x1, y), S2y = covariation(x2, y);
  const det = S11 * S22 - S12 * S12;
  const b1 = (S22 * S1y - S12 * S2y) / det, b2 = (S11 * S2y - S12 * S1y) / det;
  return { a: r4(mean(y) - b1 * mean(x1) - b2 * mean(x2)), b1: r4(b1), b2: r4(b2) };
}
function partialCorr(x, y, z) {
  const rxy = correlation(x, y), rxz = correlation(x, z), ryz = correlation(y, z);
  return r4((rxy - rxz * ryz) / Math.sqrt((1 - rxz ** 2) * (1 - ryz ** 2)));
}
function tTest(a, b) {
  const na = a.length, nb = b.length, ma = mean(a), mb = mean(b), va = sampleVariance(a), vb = sampleVariance(b);
  const se = Math.sqrt(va / na + vb / nb), t = (ma - mb) / se;
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  return { t: r4(t), df: r4(df) };
}
function ci95(arr) {
  const n = arr.length, m = mean(arr), se = sampleSD(arr) / Math.sqrt(n), tc = tCritical(0.975, n - 1), margin = r4(tc * se);
  return { lower: r4(m - margin), upper: r4(m + margin) };
}
function tCritical(p, df) {
  let lo = 0, hi = 20;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (pFromT(mid, df) < p) lo = mid; else hi = mid; }
  return r4((lo + hi) / 2);
}
function pFromT(t, df) { return 1 - 0.5 * betaInc(df / (df + t * t), df / 2, 0.5); }
function betaInc(x, a, b) {
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  return Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a * cf(x, a, b);
}
function cf(x, a, b) {
  const EPS = 1e-12; let f = 1, C = 1, D = 1 - (a + b) * x / (a + 1);
  if (Math.abs(D) < EPS) D = EPS; D = 1 / D; f = D;
  for (let m = 1; m <= 200; m++) {
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    D = 1 + num * D; if (Math.abs(D) < EPS) D = EPS; D = 1 / D; C = 1 + num / C; if (Math.abs(C) < EPS) C = EPS; f *= C * D;
    num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    D = 1 + num * D; if (Math.abs(D) < EPS) D = EPS; D = 1 / D; C = 1 + num / C; if (Math.abs(C) < EPS) C = EPS; f *= C * D;
    if (Math.abs(C * D - 1) < EPS) break;
  }
  return f;
}
function lgamma(z) {
  const g = 7, p = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1; let x = p[0]; for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// ─── RNG ─────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randN(rng) {
  let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── DATA GENERATION ─────────────────────────────────────────────────────────
// Cholesky decomposition ensures target correlations are met in the population structure
function generateData(sc, n, seedRaw) {
  n = Math.max(10, Math.min(40, Math.round(n / 2) * 2));
  const seed = (Number.isFinite(Number(seedRaw)) && Number(seedRaw) > 0)
    ? Math.floor(Math.abs(Number(seedRaw))) % 2147483647
    : Math.floor(Math.random() * 1e9);
  const rng = mulberry32(seed);

  const { r_x1y, r_x2y, r_x1x2 } = sc.gen;
  // Cholesky of correlation matrix (x1, x2, y)
  const L11 = 1, L21 = r_x1x2, L22 = Math.sqrt(Math.max(1e-9, 1 - r_x1x2 ** 2));
  const L31 = r_x1y, L32 = (r_x2y - r_x1x2 * r_x1y) / L22;
  const L33 = Math.sqrt(Math.max(1e-9, 1 - L31 ** 2 - L32 ** 2));

  const raw = Array.from({ length: n }, () => {
    const z = [randN(rng), randN(rng), randN(rng)];
    return { cx1: L11*z[0], cx2: L21*z[0]+L22*z[1], cy: L31*z[0]+L32*z[1]+L33*z[2] };
  });

  function scaleArr(arr, center, scale) {
    const m = mean(arr), sd = sampleSD(arr);
    return arr.map(v => sd === 0 ? center : (v - m) / sd * scale + center);
  }

  const x1s = scaleArr(raw.map(r => r.cx1), sc.center.x1, sc.scale.x1);
  const x2s = scaleArr(raw.map(r => r.cx2), sc.center.x2, sc.scale.x2);
  const ys  = scaleArr(raw.map(r => r.cy),  sc.center.y,  sc.scale.y);
  const cap = v => Math.round(Math.max(0, Math.min(30, v)));

  const half = n / 2;
  return raw.map((_, i) => ({
    nr: i + 1, grp: i < half ? 1 : 2,
    x1: cap(x1s[i]), x2: cap(x2s[i]), y: cap(ys[i])
  }));
}

function isGoodDataset(rows) {
  const x1 = rows.map(r => r.x1), x2 = rows.map(r => r.x2), y = rows.map(r => r.y);
  return Math.abs(correlation(x2, y)) > 0.10 && variation(x1) > 5 && variation(x2) > 5 && variation(y) > 5;
}

// ─── COMPUTE TRUTH ────────────────────────────────────────────────────────────
function computeTruth(rows, sc) {
  const x1 = rows.map(d => d.x1), x2 = rows.map(d => d.x2), y = rows.map(d => d.y);
  const g1 = rows.filter(d => d.grp === 1), g2 = rows.filter(d => d.grp === 2);
  const bx1=g1.map(d=>d.x1),bx2=g1.map(d=>d.x2),by=g1.map(d=>d.y);
  const gx1=g2.map(d=>d.x1),gx2=g2.map(d=>d.x2),gy=g2.map(d=>d.y);

  const meanX1=r4(mean(x1)),meanX2=r4(mean(x2)),meanY=r4(mean(y));
  const bMeanX1=r4(mean(bx1)),bMeanX2=r4(mean(bx2)),bMeanY=r4(mean(by));
  const gMeanX1=r4(mean(gx1)),gMeanX2=r4(mean(gx2)),gMeanY=r4(mean(gy));
  const ttX1=tTest(bx1,gx1),ttX2=tTest(bx2,gx2),ttY=tTest(by,gy);
  const varX1=r4(variation(x1)),varncX1=r4(sampleVariance(x1)),sdX1=r4(sampleSD(x1));
  const varX2=r4(variation(x2)),varncX2=r4(sampleVariance(x2)),sdX2=r4(sampleSD(x2));
  const varY=r4(variation(y)),varncY=r4(sampleVariance(y)),sdY=r4(sampleSD(y));
  const bVarX1=r4(variation(bx1)),bVarncX1=r4(sampleVariance(bx1)),bSDX1=r4(sampleSD(bx1));
  const bVarX2=r4(variation(bx2)),bVarncX2=r4(sampleVariance(bx2)),bSDX2=r4(sampleSD(bx2));
  const bVarY=r4(variation(by)),bVarncY=r4(sampleVariance(by)),bSDY=r4(sampleSD(by));
  const gVarX1=r4(variation(gx1)),gVarncX1=r4(sampleVariance(gx1)),gSDX1=r4(sampleSD(gx1));
  const gVarX2=r4(variation(gx2)),gVarncX2=r4(sampleVariance(gx2)),gSDX2=r4(sampleSD(gx2));
  const gVarY=r4(variation(gy)),gVarncY=r4(sampleVariance(gy)),gSDY=r4(sampleSD(gy));
  const covtnX1Y=r4(covariation(x1,y)),covncX1Y=r4(covariance(x1,y)),corrX1Y=r4(correlation(x1,y));
  const covtnX2Y=r4(covariation(x2,y)),covncX2Y=r4(covariance(x2,y)),corrX2Y=r4(correlation(x2,y));
  const covtnX1X2=r4(covariation(x1,x2)),covncX1X2=r4(covariance(x1,x2)),corrX1X2=r4(correlation(x1,x2));
  const bCovtnX1Y=r4(covariation(bx1,by)),bCovncX1Y=r4(covariance(bx1,by)),bCorrX1Y=r4(correlation(bx1,by));
  const bCovtnX2Y=r4(covariation(bx2,by)),bCovncX2Y=r4(covariance(bx2,by)),bCorrX2Y=r4(correlation(bx2,by));
  const bCovtnX1X2=r4(covariation(bx1,bx2)),bCovncX1X2=r4(covariance(bx1,bx2)),bCorrX1X2=r4(correlation(bx1,bx2));
  const gCovtnX1Y=r4(covariation(gx1,gy)),gCovncX1Y=r4(covariance(gx1,gy)),gCorrX1Y=r4(correlation(gx1,gy));
  const gCovtnX2Y=r4(covariation(gx2,gy)),gCovncX2Y=r4(covariance(gx2,gy)),gCorrX2Y=r4(correlation(gx2,gy));
  const gCovtnX1X2=r4(covariation(gx1,gx2)),gCovncX1X2=r4(covariance(gx1,gx2)),gCorrX1X2=r4(correlation(gx1,gx2));
  const regYX1=linReg(x1,y),r2YX1=r4(corrX1Y**2);
  const regYX2=linReg(x2,y),r2YX2=r4(corrX2Y**2);
  const regX1Y=linReg(y,x1);
  const yHatX1=x1.map(v=>regYX1.a+regYX1.b*v), corrYhatY=r4(correlation(yHatX1,y));
  const ciX1=ci95(x1),ciX2=ci95(x2),ciY=ci95(y);
  const partX1Y_X2=partialCorr(x1,y,x2);
  const mreg=multiReg(x1,x2,y);
  const yHatMR=x1.map((v,i)=>mreg.a+mreg.b1*v+mreg.b2*x2[i]), r2MR=r4(correlation(yHatMR,y)**2);
  const betaStar1=r4(mreg.b1*(sdX1/sdY)), betaStar2=r4(mreg.b2*(sdX2/sdY));
  const predVal=r4(mreg.a+mreg.b1*sc.pred.x1+mreg.b2*sc.pred.x2);

  return {
    meanX1,meanX2,meanY, bMeanX1,bMeanX2,bMeanY, gMeanX1,gMeanX2,gMeanY,
    ttX1,ttX2,ttY,
    varX1,varncX1,sdX1, varX2,varncX2,sdX2, varY,varncY,sdY,
    bVarX1,bVarncX1,bSDX1, bVarX2,bVarncX2,bSDX2, bVarY,bVarncY,bSDY,
    gVarX1,gVarncX1,gSDX1, gVarX2,gVarncX2,gSDX2, gVarY,gVarncY,gSDY,
    covtnX1Y,covncX1Y,corrX1Y, covtnX2Y,covncX2Y,corrX2Y, covtnX1X2,covncX1X2,corrX1X2,
    bCovtnX1Y,bCovncX1Y,bCorrX1Y, bCovtnX2Y,bCovncX2Y,bCorrX2Y, bCovtnX1X2,bCovncX1X2,bCorrX1X2,
    gCovtnX1Y,gCovncX1Y,gCorrX1Y, gCovtnX2Y,gCovncX2Y,gCorrX2Y, gCovtnX1X2,gCovncX1X2,gCorrX1X2,
    regA_YX1:regYX1.a, regB_YX1:regYX1.b, r2YX1,
    regA_YX2:regYX2.a, regB_YX2:regYX2.b, r2YX2,
    regA_X1Y:regX1Y.a, regB_X1Y:regX1Y.b, corrYhatY,
    ciX1,ciX2,ciY, partX1Y_X2,
    mregA:mreg.a, mregB1:mreg.b1, mregB2:mreg.b2, r2MR, betaStar1, betaStar2, predVal
  };
}

function buildFieldMap(t) {
  return {
    'inp-mean-x1':t.meanX1,'inp-mean-x2':t.meanX2,'inp-mean-y':t.meanY,
    'inp-b-mean-x1':t.bMeanX1,'inp-b-mean-x2':t.bMeanX2,'inp-b-mean-y':t.bMeanY,
    'inp-g-mean-x1':t.gMeanX1,'inp-g-mean-x2':t.gMeanX2,'inp-g-mean-y':t.gMeanY,
    'inp-t-x1':t.ttX1.t,'inp-t-x2':t.ttX2.t,'inp-t-y':t.ttY.t,
    'inp-var-x1':t.varX1,'inp-varnc-x1':t.varncX1,'inp-sd-x1':t.sdX1,
    'inp-var-x2':t.varX2,'inp-varnc-x2':t.varncX2,'inp-sd-x2':t.sdX2,
    'inp-var-y':t.varY,'inp-varnc-y':t.varncY,'inp-sd-y':t.sdY,
    'inp-b-var-x1':t.bVarX1,'inp-b-varnc-x1':t.bVarncX1,'inp-b-sd-x1':t.bSDX1,
    'inp-b-var-x2':t.bVarX2,'inp-b-varnc-x2':t.bVarncX2,'inp-b-sd-x2':t.bSDX2,
    'inp-b-var-y':t.bVarY,'inp-b-varnc-y':t.bVarncY,'inp-b-sd-y':t.bSDY,
    'inp-g-var-x1':t.gVarX1,'inp-g-varnc-x1':t.gVarncX1,'inp-g-sd-x1':t.gSDX1,
    'inp-g-var-x2':t.gVarX2,'inp-g-varnc-x2':t.gVarncX2,'inp-g-sd-x2':t.gSDX2,
    'inp-g-var-y':t.gVarY,'inp-g-varnc-y':t.gVarncY,'inp-g-sd-y':t.gSDY,
    'inp-covtn-x1y':t.covtnX1Y,'inp-covnc-x1y':t.covncX1Y,'inp-corr-x1y':t.corrX1Y,
    'inp-covtn-x2y':t.covtnX2Y,'inp-covnc-x2y':t.covncX2Y,'inp-corr-x2y':t.corrX2Y,
    'inp-covtn-x1x2':t.covtnX1X2,'inp-covnc-x1x2':t.covncX1X2,'inp-corr-x1x2':t.corrX1X2,
    'inp-b-covtn-x1y':t.bCovtnX1Y,'inp-b-covnc-x1y':t.bCovncX1Y,'inp-b-corr-x1y':t.bCorrX1Y,
    'inp-b-covtn-x2y':t.bCovtnX2Y,'inp-b-covnc-x2y':t.bCovncX2Y,'inp-b-corr-x2y':t.bCorrX2Y,
    'inp-b-covtn-x1x2':t.bCovtnX1X2,'inp-b-covnc-x1x2':t.bCovncX1X2,'inp-b-corr-x1x2':t.bCorrX1X2,
    'inp-g-covtn-x1y':t.gCovtnX1Y,'inp-g-covnc-x1y':t.gCovncX1Y,'inp-g-corr-x1y':t.gCorrX1Y,
    'inp-g-covtn-x2y':t.gCovtnX2Y,'inp-g-covnc-x2y':t.gCovncX2Y,'inp-g-corr-x2y':t.gCorrX2Y,
    'inp-g-covtn-x1x2':t.gCovtnX1X2,'inp-g-covnc-x1x2':t.gCovncX1X2,'inp-g-corr-x1x2':t.gCorrX1X2,
    'inp-a-yx1':t.regA_YX1,'inp-b-yx1':t.regB_YX1,'inp-r2-yx1':t.r2YX1,
    'inp-a-yx2':t.regA_YX2,'inp-b-yx2':t.regB_YX2,'inp-r2-yx2':t.r2YX2,
    'inp-a-x1y':t.regA_X1Y,'inp-b-x1y':t.regB_X1Y,'inp-corr-yhat-y':t.corrYhatY,
    'inp-ci-x1-lower':t.ciX1.lower,'inp-ci-x1-upper':t.ciX1.upper,
    'inp-ci-x2-lower':t.ciX2.lower,'inp-ci-x2-upper':t.ciX2.upper,
    'inp-ci-y-lower':t.ciY.lower,'inp-ci-y-upper':t.ciY.upper,
    'inp-partial-x1y-x2':t.partX1Y_X2,
    'inp-mr-a':t.mregA,'inp-mr-b1':t.mregB1,'inp-mr-b2':t.mregB2,'inp-mr-r2':t.r2MR,
    'inp-beta1':t.betaStar1,'inp-beta2':t.betaStar2,'inp-pred':t.predVal
  };
}

// ─── RENDER DATASET TABLE ─────────────────────────────────────────────────────
function renderDataTable(rows, sc) {
  const n = rows.length, half = n / 2;
  const cat1 = sc.group.cat1, cat2 = sc.group.cat2;
  document.getElementById('dataset-title').textContent =
    `Dataset — ${n} respondenten (${half} ${cat1.toLowerCase()}s, ${half} ${cat2.toLowerCase()}s)`;

  let tbody = '';
  rows.forEach(row => {
    const cls = row.grp === 2 ? ' class="grp2-row"' : '';
    tbody += `<tr${cls}><td>${row.nr}</td><td>${row.grp === 1 ? `1 (${cat1})` : `2 (${cat2})`}</td><td>${row.x1}</td><td>${row.x2}</td><td>${row.y}</td></tr>\n`;
  });
  document.getElementById('dataset-table-body').innerHTML = tbody;
}

function updateLabels(sc) {
  const x1n = sc.x1.name.replace(/([A-Z])/g, ' $1').trim();
  const x2n = sc.x2.name.replace(/([A-Z])/g, ' $1').trim();
  const yn  = sc.y.name.replace(/([A-Z])/g, ' $1').trim();
  const cat1 = sc.group.cat1, cat2 = sc.group.cat2;
  const half = state.rows.length / 2;

  const ths = document.querySelectorAll('#dataset-header th');
  if (ths.length >= 5) {
    ths[1].innerHTML = `${sc.group.name}<br><small>(1=${cat1}, 2=${cat2})</small>`;
    ths[2].innerHTML = `X1<br><small>${x1n}</small>`;
    ths[3].innerHTML = `X2<br><small>${x2n}</small>`;
    ths[4].innerHTML = `Y<br><small>${yn}</small>`;
  }
  document.querySelectorAll('.grp1-label').forEach(el => el.textContent = `${cat1}s (n = ${half})`);
  document.querySelectorAll('.grp2-label').forEach(el => el.textContent = `${cat2}s (n = ${half})`);
  document.querySelectorAll('.var-x1-label').forEach(el => el.textContent = x1n);
  document.querySelectorAll('.var-x2-label').forEach(el => el.textContent = x2n);
  document.querySelectorAll('.var-y-label').forEach(el => el.textContent = yn);
  const pl = document.getElementById('pred-values-label');
  if (pl) pl.textContent = sc.pred.label;
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────
function checkField(inputId, expected) {
  const el = document.getElementById(inputId);
  const le = document.getElementById(inputId.replace('inp-', 'light-'));
  const me = document.getElementById(inputId.replace('inp-', 'msg-'));
  if (!el) return;
  const raw = el.value.trim();
  if (raw === '') {
    el.classList.remove('correct','incorrect');
    if (le) le.className = 'light';
    if (me) me.innerHTML = '';
    return;
  }
  const val = parseFloat(raw.replace(',','.'));
  const ok = Number.isFinite(val) && Math.abs(r4(val) - r4(expected)) <= 0.0051;
  el.classList.toggle('correct', ok); el.classList.toggle('incorrect', !ok);
  if (le) { le.classList.toggle('green', ok); le.classList.toggle('red', !ok); }
  if (me) me.innerHTML = ok
    ? '<span class="msg-ok">\u2713 Correct</span>'
    : (Number.isFinite(val)
        ? `<span class="msg-wrong">\u2717 Fout (verwacht \u2248 ${r4(expected)})</span>`
        : '<span class="msg-wrong">Ongeldige invoer.</span>');
}

function updateProgress(fm) {
  const total = Object.keys(fm).length;
  const correct = Object.keys(fm).filter(id => { const el=document.getElementById(id); return el&&el.classList.contains('correct'); }).length;
  const bar = document.getElementById('progress-bar'), text = document.getElementById('progress-text');
  if (bar) bar.style.width = (correct/total*100)+'%';
  if (text) text.textContent = `${correct} / ${total} correct`;
}

// ─── GENERATE ────────────────────────────────────────────────────────────────
function generate() {
  const scIdx = parseInt(document.getElementById('scenario').value, 10);
  const n = parseInt(document.getElementById('n-input').value, 10) || 20;
  const seedEl = document.getElementById('seed');
  const enteredSeed = safeSeed(seedEl.value);
  const manualSeed = seedEl.dataset.seedManual === '1';
  const forceRandom = seedEl.dataset.nextRandom === '1';
  let seedStart;
  if (manualSeed && enteredSeed != null && !forceRandom) {
    seedStart = enteredSeed;
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '1';
  } else {
    seedStart = nextRandomSeed();
    seedEl.value = String(seedStart);
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  const sc = SCENARIOS[scIdx];
  state.scenario = sc;

  let rows;
  let seedUsed = seedStart;
  for (let i = 0; i < 50; i++) {
    rows = generateData(sc, n, seedUsed);
    if (isGoodDataset(rows)) break;
    seedUsed = (seedUsed + 1) % 2147483647;
  }

  state.rows = rows;
  state.truth = computeTruth(rows, sc);
  const fm = buildFieldMap(state.truth);

  document.getElementById('scenario-text').textContent = sc.vignette;
  document.getElementById('dataset-info').textContent = `Scenario: ${sc.title} | N = ${rows.length} | Seed: ${seedUsed}`;

  renderDataTable(rows, sc);
  updateLabels(sc);
  clearAllFields(fm);

  Object.keys(fm).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // Remove old listener by cloning
    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    fresh.addEventListener('input', () => { checkField(id, fm[id]); updateProgress(fm); });
  });

  updateProgress(fm);
  document.getElementById('main-sections').style.display = '';
  document.getElementById('no-data-msg').style.display = 'none';

  document.getElementById('btn-reset').onclick = () => clearAllFields(fm);
  document.getElementById('btn-answers').onclick = () => {
    if (confirm('Weet je zeker dat je de antwoorden wil zien?')) showAnswers(fm);
  };
  document.getElementById('btn-print').onclick = () => printQuestionPaper(sc, rows);
}

function clearAllFields(fm) {
  Object.keys(fm).forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value=''; el.classList.remove('correct','incorrect'); }
    const l = document.getElementById(id.replace('inp-','light-'));
    if (l) l.className = 'light';
    const m = document.getElementById(id.replace('inp-','msg-'));
    if (m) m.innerHTML = '';
  });
  updateProgress(fm);
}

function showAnswers(fm) {
  Object.keys(fm).forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value=r4(fm[id]); el.classList.add('correct'); el.classList.remove('incorrect'); }
    const l = document.getElementById(id.replace('inp-','light-'));
    if (l) { l.classList.add('green'); l.classList.remove('red'); }
    const m = document.getElementById(id.replace('inp-','msg-'));
    if (m) m.innerHTML = '<span class="msg-ok">\u2713 Correct</span>';
  });
  updateProgress(fm);
}

// ─── PRINT QUESTION PAPER ────────────────────────────────────────────────────
function printQuestionPaper(sc, rows) {
  const n = rows.length, half = n / 2;
  const cat1 = sc.group.cat1, cat2 = sc.group.cat2;
  const x1n = sc.x1.name.replace(/([A-Z])/g,' $1').trim();
  const x2n = sc.x2.name.replace(/([A-Z])/g,' $1').trim();
  const yn  = sc.y.name.replace(/([A-Z])/g,' $1').trim();

  const tRows = rows.map(r =>
    `<tr${r.grp===2?' class="g2"':''}><td>${r.nr}</td><td>${r.grp===1?`1 (${cat1})`:`2 (${cat2})`}</td><td>${r.x1}</td><td>${r.x2}</td><td>${r.y}</td></tr>`
  ).join('');

  const bl = '<span class="bl"></span>';

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">
<title>Vragenblad – ${sc.title}</title>
<style>
body{font-family:Arial,sans-serif;font-size:11.5pt;margin:18mm 16mm;color:#111}
h1{font-size:14pt;margin-bottom:3px}
.sub{font-size:10.5pt;color:#444;margin-bottom:12px}
table{border-collapse:collapse;width:100%;margin-bottom:12px;font-size:10.5pt}
th{background:#1e3a8a;color:#fff;padding:4px 7px;text-align:center}
td{padding:3px 7px;text-align:center;border:1px solid #bbb}
tr.g2 td{background:#fdf4ff}
.sec{margin-top:12px;page-break-inside:avoid}
.sec h2{font-size:11.5pt;background:#1e3a8a;color:#fff;padding:4px 10px;margin-bottom:5px}
.q{margin:4px 0 4px 10px;font-size:10.5pt}
.bl{display:inline-block;border-bottom:1.5px solid #333;width:100px;margin-left:4px;vertical-align:bottom}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 18px;margin-left:10px}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 18px;margin-left:10px}
.note{font-size:10pt;color:#444;margin:3px 0 5px 0}
@media print{button{display:none}}
</style></head><body>
<h1>Vragenblad &mdash; ${sc.title}</h1>
<p class="sub">${sc.vignette}</p>
<p class="sub"><strong>N = ${n}</strong> &nbsp;|&nbsp; Alle antwoorden op <strong>4 decimalen</strong> &nbsp;|&nbsp; Tolerantie &plusmn;0.005</p>
<table><thead><tr>
<th>Nr</th><th>${sc.group.name}<br><small>(1=${cat1}, 2=${cat2})</small></th>
<th>X1<br><small>${x1n}</small></th><th>X2<br><small>${x2n}</small></th><th>Y<br><small>${yn}</small></th>
</tr></thead><tbody>${tRows}</tbody></table>

<div class="sec"><h2>A &mdash; Gemiddelden (n = ${n})</h2>
<div class="grid3"><div class="q">Gem. X1 ${bl}</div><div class="q">Gem. X2 ${bl}</div><div class="q">Gem. Y ${bl}</div></div></div>

<div class="sec"><h2>B &mdash; Groepsgemiddelden</h2>
<p class="note">${cat1}s (n=${half}) en ${cat2}s (n=${half})</p>
<div class="grid3">
<div class="q">${cat1} X1 ${bl}</div><div class="q">${cat1} X2 ${bl}</div><div class="q">${cat1} Y ${bl}</div>
<div class="q">${cat2} X1 ${bl}</div><div class="q">${cat2} X2 ${bl}</div><div class="q">${cat2} Y ${bl}</div>
</div></div>

<div class="sec"><h2>C &mdash; Welch t-test (${cat1}s vs ${cat2}s)</h2>
<div class="grid3"><div class="q">t X1 ${bl}</div><div class="q">t X2 ${bl}</div><div class="q">t Y ${bl}</div></div></div>

<div class="sec"><h2>D &mdash; Spreiding totale steekproef (n = ${n})</h2>
<table><thead><tr><th>Variabele</th><th>Variatie (&sum;dx&sup2;)</th><th>Variantie (s&sup2;)</th><th>SD (s)</th></tr></thead>
<tbody><tr><td><b>X1</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
<tr><td><b>X2</b></td><td></td><td></td><td></td></tr><tr><td><b>Y</b></td><td></td><td></td><td></td></tr></tbody></table></div>

<div class="sec"><h2>E &mdash; Spreiding per groep</h2>
<table><thead><tr><th>Variabele</th><th>Variatie</th><th>Variantie (s&sup2;)</th><th>SD (s)</th></tr></thead>
<tbody>
<tr><td colspan="4" style="background:#e0f0ff;font-weight:700;text-align:left">${cat1}s (n=${half})</td></tr>
<tr><td><b>X1</b></td><td></td><td></td><td></td></tr><tr><td><b>X2</b></td><td></td><td></td><td></td></tr><tr><td><b>Y</b></td><td></td><td></td><td></td></tr>
<tr><td colspan="4" style="background:#fce7f3;font-weight:700;text-align:left">${cat2}s (n=${half})</td></tr>
<tr><td><b>X1</b></td><td></td><td></td><td></td></tr><tr><td><b>X2</b></td><td></td><td></td><td></td></tr><tr><td><b>Y</b></td><td></td><td></td><td></td></tr>
</tbody></table></div>

<div class="sec"><h2>F &mdash; Covariatie, covariantie, correlatie (totaal, n=${n})</h2>
<table><thead><tr><th>Paar</th><th>Covariatie</th><th>Covariantie</th><th>Correlatie r</th></tr></thead>
<tbody><tr><td><b>X1 &amp; Y</b></td><td></td><td></td><td></td></tr>
<tr><td><b>X2 &amp; Y</b></td><td></td><td></td><td></td></tr>
<tr><td><b>X1 &amp; X2</b></td><td></td><td></td><td></td></tr></tbody></table></div>

<div class="sec"><h2>G &mdash; Bivariate maten per groep</h2>
<table><thead><tr><th>Paar</th><th>Covariatie</th><th>Covariantie</th><th>Correlatie r</th></tr></thead>
<tbody>
<tr><td colspan="4" style="background:#e0f0ff;font-weight:700;text-align:left">${cat1}s (n=${half})</td></tr>
<tr><td>X1 &amp; Y</td><td></td><td></td><td></td></tr><tr><td>X2 &amp; Y</td><td></td><td></td><td></td></tr><tr><td>X1 &amp; X2</td><td></td><td></td><td></td></tr>
<tr><td colspan="4" style="background:#fce7f3;font-weight:700;text-align:left">${cat2}s (n=${half})</td></tr>
<tr><td>X1 &amp; Y</td><td></td><td></td><td></td></tr><tr><td>X2 &amp; Y</td><td></td><td></td><td></td></tr><tr><td>X1 &amp; X2</td><td></td><td></td><td></td></tr>
</tbody></table></div>

<div class="sec"><h2>H &mdash; Regressieanalyse (bivariaat)</h2>
<table><thead><tr><th>Regressie</th><th>Intercept (a)</th><th>Helling (b)</th><th>R&sup2;</th></tr></thead>
<tbody>
<tr><td><b>Y = a + b&middot;X1</b></td><td></td><td></td><td></td></tr>
<tr><td><b>Y = a + b&middot;X2</b></td><td></td><td></td><td></td></tr>
<tr><td><b>X1 = a + b&middot;Y</b></td><td></td><td></td><td style="color:#888">n.v.t.</td></tr>
</tbody></table>
<p class="note">r(Y&#772;, Y) &mdash; verwachte vs. geobserveerde Y: ${bl}</p></div>

<div class="sec"><h2>I &mdash; 95% Betrouwbaarheidsintervallen voor de gemiddelden</h2>
<table><thead><tr><th>Variabele</th><th>BI onder</th><th>BI boven</th></tr></thead>
<tbody><tr><td><b>X1</b></td><td></td><td></td></tr><tr><td><b>X2</b></td><td></td><td></td></tr><tr><td><b>Y</b></td><td></td><td></td></tr></tbody></table></div>

<div class="sec"><h2>J &mdash; Parti&euml;le correlatie X1 &amp; Y (controle X2)</h2>
<div class="q">r<sub>X1Y&middot;X2</sub> = ${bl} &nbsp;&nbsp; Wat besluit je?</div>
<div style="margin-top:28px;margin-left:10px;border-bottom:1px solid #bbb;width:80%"></div></div>

<div class="sec"><h2>K &mdash; Meervoudige regressie Y = a + b1&middot;X1 + b2&middot;X2</h2>
<table><thead><tr><th>Parameter</th><th>Waarde</th><th>Parameter</th><th>Waarde</th></tr></thead>
<tbody>
<tr><td>Intercept (a)</td><td></td><td>R&sup2;</td><td></td></tr>
<tr><td>b1 (X1)</td><td></td><td>&beta;* voor X1</td><td></td></tr>
<tr><td>b2 (X2)</td><td></td><td>&beta;* voor X2</td><td></td></tr>
</tbody></table>
<p class="note">Verwachte Y voor ${sc.pred.label}: ${bl}</p></div>

<p style="margin-top:18px;font-size:9.5pt;color:#888">Gegenereerd via Hfst. 13 Synthese Oefening &mdash; ${new Date().toLocaleDateString('nl-BE')}</p>
<script>window.onload=function(){window.print();}<\/script></body></html>`;

  const w = window.open('','_blank');
  if (!w) { alert('Schakel pop-ups in.'); return; }
  w.document.write(html); w.document.close();
}

// ─── SIDEBAR RESIZE ───────────────────────────────────────────────────────────
function initSidebarResize() {
  const sb = document.querySelector('.sidebar'), h = document.getElementById('sidebar-resize-handle');
  if (!h || !sb) return;
  let startX=0, startW=0;
  h.addEventListener('mousedown', e=>{startX=e.clientX;startW=sb.getBoundingClientRect().width;h.classList.add('dragging');document.body.style.cursor='col-resize';document.body.style.userSelect='none';e.preventDefault();});
  document.addEventListener('mousemove', e=>{if(!h.classList.contains('dragging'))return;sb.style.width=Math.min(560,Math.max(200,startW+(e.clientX-startX)))+'px';});
  document.addEventListener('mouseup', ()=>{if(!h.classList.contains('dragging'))return;h.classList.remove('dragging');document.body.style.cursor='';document.body.style.userSelect='';});
}

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const el = document.getElementById(item.dataset.target);
      if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function fillScenarioSelect() {
  const sel = document.getElementById('scenario');
  SCENARIOS.forEach((sc,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=sc.title; sel.appendChild(o); });
}

function init() {
  fillScenarioSelect(); setupNav(); initSidebarResize();
  document.getElementById('btn-generate').addEventListener('click', generate);
  document.getElementById('btn-random').addEventListener('click', ()=>{
    document.getElementById('scenario').value = Math.floor(Math.random()*SCENARIOS.length);
    generate();
  });
  const seedEl = document.getElementById('seed');
  if (seedEl) {
    const markManual = () => {
      seedEl.dataset.seedManual = '1';
      seedEl.dataset.nextRandom = '0';
    };
    seedEl.addEventListener('input', markManual);
    seedEl.addEventListener('change', markManual);
    seedEl.value = String(nextRandomSeed());
    seedEl.dataset.seedManual = '0';
    seedEl.dataset.nextRandom = '0';
  }
  const sb=document.querySelector('.sidebar'),ov=document.getElementById('sidebar-overlay');
  const bt=document.getElementById('btn-sidebar-toggle'),bc=document.getElementById('btn-sidebar-close');
  const close=()=>{if(sb)sb.classList.remove('open');if(ov)ov.classList.remove('visible');};
  if(bt) bt.addEventListener('click',()=>{if(sb)sb.classList.add('open');if(ov)ov.classList.add('visible');});
  if(bc) bc.addEventListener('click',close);
  if(ov) ov.addEventListener('click',close);
}

document.addEventListener('DOMContentLoaded', init);
