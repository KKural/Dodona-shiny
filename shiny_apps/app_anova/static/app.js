/* =============================================================
   ANOVA App \u2013 app.js
   Static, fully client-side reactive ANOVA teaching app
   Dutch language, criminological scenarios
   ============================================================= */

'use strict';

// \u2500\u2500\u2500 SCENARIOS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const SCENARIOS = [
    {
        id: 'crime_program',
        title: 'Criminaliteitspreventieprogramma (3 niveaus)',
        vignette: 'Een stad test drie interventieniveaus in buurten: geen programma, basispreventie en intensief programma. Onderzoek of het interventieniveau samenhangt met het inbraakcijfer.',
        groups: ['GeenProgramma', 'BasisProgramma', 'IntensiefProgramma'],
        yName: 'InbraakCijfer', yUnit: 'per 1.000', entity: 'Buurt',
        means: [28, 22, 16], sdWithin: 5, subtleScale: 0.25
    },
    {
        id: 'hotspots_policing',
        title: 'Politiestrategieën & meldingen (3 typen)',
        vignette: 'Drie typen politiestrategie worden vergeleken in stedelijke straten: standaard patrouille, hot-spot aanpak, en gemeenschapsgerichte strategie. Uitkomst: meldingen aan de politie per week.',
        groups: ['StandaardPatrouille', 'HotSpotAanpak', 'GemeenschapsStrategie'],
        yName: 'MeldingenAanPolitie', yUnit: 'per week', entity: 'Straat',
        means: [65, 48, 38], sdWithin: 10, subtleScale: 0.25
    },
    {
        id: 'fear_disorder',
        title: 'Wijkniveau & angst voor criminaliteit',
        vignette: 'Bewoners van drie typen wijken (lage, gemiddelde en hoge wanorde) worden vergeleken op angstscores. Uitkomst: angstschaal (0\u2013100).',
        groups: ['LaagWanorde', 'GemiddeldWanorde', 'HoogWanorde'],
        yName: 'AngstScore', yUnit: '0\u2013100', entity: 'Bewoner',
        means: [38, 55, 70], sdWithin: 10, subtleScale: 0.25
    },
    {
        id: 'police_trust',
        title: 'Politieaanpak & vertrouwen (3 condities)',
        vignette: 'Drie politiecondities worden vergeleken op vertrouwen van burgers: geen interventie, standaard contact, en procedurale rechtvaardigheidsaanpak. Uitkomst: vertrouwensscore (1\u20137).',
        groups: ['GeenInterventie', 'StandaardContact', 'ProcedureleAanpak'],
        yName: 'VertrouwenInPolitie', yUnit: '1\u20137', entity: 'District',
        means: [3.5, 4.5, 5.5], sdWithin: 0.8, subtleScale: 0.25
    },
    {
        id: 'guardianship',
        title: 'Toezichtsniveaus & slachtofferschap',
        vignette: 'Drie niveaus van buurttoezicht worden vergeleken op slachtofferschapincidenten: laag, gemiddeld en hoog toezicht. Uitkomst: aantal slachtofferschapincidenten.',
        groups: ['LaagToezicht', 'GemiddeldToezicht', 'HoogToezicht'],
        yName: 'Slachtofferschap', yUnit: 'aantal', entity: 'Huishouden',
        means: [8, 5, 3], sdWithin: 2, subtleScale: 0.25
    },
    {
        id: 'biosocial',
        title: 'Risicogroepen & agressieve incidenten',
        vignette: 'Drie risicogroepen onder jongeren (laag, gemiddeld en hoog risico) worden vergeleken op agressieve incidenten op school. Uitkomst: schoolmeldingen per trimester.',
        groups: ['LaagRisico', 'GemiddeldRisico', 'HoogRisico'],
        yName: 'AgressieveIncidenten', yUnit: 'schoolmeldingen/trimester', entity: 'Student',
        means: [2, 5, 9], sdWithin: 2, subtleScale: 0.20
    },
    {
        id: 'reentry_recidivism',
        title: 'Re-integratieniveaus & recidiverisico',
        vignette: 'Drie typen begeleiding worden vergeleken op recidiverisico na vrijlating: minimaal, standaard en intensief. Uitkomst: recidiverisicoScore (0\u2013100).',
        groups: ['MinimaleBegeleiding', 'StandaardBegeleiding', 'IntensieveBegeleiding'],
        yName: 'RecidiveRisico', yUnit: '0\u2013100', entity: 'Deelnemer',
        means: [62, 48, 35], sdWithin: 10, subtleScale: 0.25
    },
    {
        id: 'cyber_training',
        title: 'Cybertrainingsniveaus & klikratio',
        vignette: 'Drie trainingsintensiteiten worden vergeleken op het klikratio bij gesimuleerde phishingaanvallen: geen training, basistraining en intensieve training. Uitkomst: klikratio (%).',
        groups: ['GeenTraining', 'BasisTraining', 'IntensieveTraining'],
        yName: 'Klikratio', yUnit: '%', entity: 'Medewerker',
        means: [35, 22, 12], sdWithin: 8, subtleScale: 0.20
    },
    {
        id: 'gender_fear',
        title: 'Geslacht & angst voor criminaliteit (k = 2)',
        vignette: 'Ervaren mannen en vrouwen een verschillende mate van angst voor criminaliteit in de openbare ruimte? Twee groepen worden vergeleken op angstscore (0\u2013100). Bij k = 2 is ANOVA equivalent aan de onafhankelijke t-toets.',
        groups: ['Man', 'Vrouw'],
        yName: 'AngstScore', yUnit: '0\u2013100', entity: 'Respondent',
        means: [42, 63], sdWithin: 12, subtleScale: 0.30
    },
    {
        id: 'nationality_victimisation',
        title: 'Nationaliteit & slachtofferschap (k = 2)',
        vignette: 'Worden personen met Belgische en niet-Belgische nationaliteit even vaak slachtoffer van vermogenscriminaliteit? Twee groepen worden vergeleken op slachtofferschapindex (0\u2013100). Bij k = 2 geldt: F = t\u00b2.',
        groups: ['Belgisch', 'NietBelgisch'],
        yName: 'SlachtofferschapIndex', yUnit: '0\u2013100', entity: 'Respondent',
        means: [38, 52], sdWithin: 10, subtleScale: 0.30
    },
    {
        id: 'education_police_trust',
        title: 'Opleidingsniveau & vertrouwen in politie (k = 3)',
        vignette: 'Verschilt het vertrouwen in de politie naargelang het opleidingsniveau van de respondent? Drie onderwijsgroepen worden vergeleken op vertrouwensscore (1\u20137).',
        groups: ['LaagOnderwijs', 'GemiddeldOnderwijs', 'HoogOnderwijs'],
        yName: 'VertrouwenPolitie', yUnit: '1\u20137', entity: 'Respondent',
        means: [3.8, 4.5, 5.2], sdWithin: 0.9, subtleScale: 0.30
    },
    {
        id: 'age_group_victimisation',
        title: 'Leeftijdsgroep & slachtofferschap (k = 3)',
        vignette: 'Worden bepaalde leeftijdsgroepen vaker slachtoffer van criminaliteit? Jongeren, volwassenen en ouderen worden vergeleken op slachtofferschaprate (per 1.000).',
        groups: ['Jongeren', 'Volwassenen', 'Ouderen'],
        yName: 'Slachtofferschaprate', yUnit: 'per 1.000', entity: 'Respondent',
        means: [62, 45, 30], sdWithin: 12, subtleScale: 0.25
    }
];

// \u2500\u2500\u2500 SEEDED PRNG (Mulberry32) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randNormal(rng) {
    // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// \u2500\u2500\u2500 CLAMP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function clampVal(v, unit) {
    if (/1-7|1\u20137/.test(unit)) return Math.max(1, Math.min(7, v));
    if (/0-100|0\u2013100|%|score|Score|Risico|Ratio|Cijfer/i.test(unit)) return Math.max(0, Math.min(100, v));
    return Math.max(0, v);
}

// \u2500\u2500\u2500 STATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const state = {
    scenario: null,
    data: [],      // [{entity, group, y}]
    truth: null,
    allCorrect: false,
    chartBoxplot: null,
    chartSS: null,
    chartCI: null
};

// Feedback message store (mirrors R app feedback_store)
const feedbackStore = {};

// \u2500\u2500\u2500 DEBOUNCE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

// \u2500\u2500\u2500 ROUND helper \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const r4 = v => Math.round(v * 10000) / 10000;
const r2 = v => Math.round(v * 100) / 100;

// \u2500\u2500\u2500 GENERATE DATA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function generateData(sc, nPerGroup, seed) {
    const rng = mulberry32(seed);

    // pick effect scale
    const effectScale = rng() < 0.6 ? sc.subtleScale : 1.0;
    const center = sc.means.reduce((a, b) => a + b) / sc.means.length;
    const profileMeans = sc.means.map(m => center + effectScale * (m - center));

    const rows = [];
    sc.groups.forEach((grp, gi) => {
        for (let i = 0; i < nPerGroup; i++) {
            const raw = profileMeans[gi] + randNormal(rng) * sc.sdWithin;
            const y = r2(clampVal(raw, sc.yUnit));
            rows.push({ entity: `${sc.entity} ${gi * nPerGroup + i + 1}`, group: grp, y });
        }
    });
    return rows;
}

// \u2500\u2500\u2500 CALCULATE TRUTH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function calculateTruth(data, sc) {
    if (!data || data.length === 0) return null;
    const groups = sc.groups;
    const k = groups.length;
    const N = data.length;

    const Y = data.map(d => d.y);
    const G = data.map(d => d.group);

    const nGroups = {};
    const sumGroups = {};
    groups.forEach(g => { nGroups[g] = 0; sumGroups[g] = 0; });
    data.forEach(d => { nGroups[d.group]++; sumGroups[d.group] += d.y; });

    const grpMeans = {};
    groups.forEach(g => { grpMeans[g] = r4(sumGroups[g] / nGroups[g]); });

    const grandMean = r4(Y.reduce((a, b) => a + b) / N);

    const devWithin = data.map(d => r4(d.y - grpMeans[d.group]));
    const devWithinSq = devWithin.map(v => r4(v * v));
    const devBetween = data.map(d => r4(grpMeans[d.group] - grandMean));
    const devBetweenSq = devBetween.map(v => r4(v * v));

    const SSW = r4(devWithinSq.reduce((a, b) => a + b));
    // SSB = \u03a3 nj(Yj \u2212 Y..)\u00b2 \u2014 explicit group-level formula
    let SSB = 0;
    groups.forEach(g => {
        const d = r4(grpMeans[g] - grandMean);
        SSB += nGroups[g] * r4(d * d);
    });
    SSB = r4(SSB);
    // SST = \u03a3(Y \u2212 \u0232..)\u00b2 \u2014 computed directly; also confirms SST = SSW + SSB
    const devTotal = data.map(d => r4(d.y - grandMean));
    const devTotalSq = devTotal.map(v => r4(v * v));
    const SST = r4(devTotalSq.reduce((a, b) => a + b, 0));

    const dfBetween = k - 1;
    const dfWithin = N - k;
    const dfTotal = N - 1;

    const MSB = r4(SSB / dfBetween);
    const MSW = r4(SSW / dfWithin);
    const Fratio = MSW > 0 ? r4(MSB / MSW) : NaN;
    const etaSq = SST > 0 ? r4(SSB / SST) : NaN;

    // t-critical for 95% CI
    const tCrit = tCritical(0.975, dfWithin);

    const ciMargin = {};
    const ciLower = {};
    const ciUpper = {};
    groups.forEach(g => {
        const marg = r4(tCrit * Math.sqrt(MSW / nGroups[g]));
        ciMargin[g] = marg;
        ciLower[g] = r4(grpMeans[g] - marg);
        ciUpper[g] = r4(grpMeans[g] + marg);
    });

    return {
        groups, k, N, nGroups,
        grpMeans, grandMean,
        devWithin, devWithinSq, devBetween, devBetweenSq,
        devTotal, devTotalSq,
        SSW, SSB, SST,
        dfBetween, dfWithin, dfTotal,
        MSB, MSW, Fratio, etaSq,
        tCrit, ciMargin, ciLower, ciUpper,
        // Approximate p-value for teaching interpretation only \u2014 not used for student validation.
        pValue: pValueFromF(Fratio, dfBetween, dfWithin),
        // F-critical at alpha=0.05 for teaching (binary search via pValueFromF)
        fCritical: fCriticalVal(dfBetween, dfWithin)
    };
}

// \u2500\u2500\u2500 F-critical at alpha=0.05 (binary search using pValueFromF) \u2500\u2500
function fCriticalVal(df1, df2, alpha = 0.05) {
    if (df1 <= 0 || df2 <= 0) return NaN;
    let lo = 0, hi = 100, mid = 1;
    for (let i = 0; i < 80; i++) {
        mid = (lo + hi) / 2;
        const p = pValueFromF(mid, df1, df2);
        if (p > alpha) lo = mid; else hi = mid;
    }
    return r4(mid);
}

// \u2500\u2500\u2500 t-critical approximation (simple lookup or Abramowitz) \u2500\u2500
function tCritical(p, df) {
    // For typical df, use Wilson-Hilferty approximation
    if (df <= 0) return NaN;
    // Inverse normal Z for p = 0.975 ≈ 1.96
    // Use polynomial approximation for t-distribution
    if (df >= 200) return 1.9600;
    const table = {
        1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
        8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145,
        15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
        25: 2.060, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990,
        100: 1.984, 120: 1.980
    };
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    // interpolate
    if (df <= keys[0]) return table[keys[0]];
    for (let i = 0; i < keys.length - 1; i++) {
        if (df >= keys[i] && df <= keys[i + 1]) {
            const frac = (df - keys[i]) / (keys[i + 1] - keys[i]);
            return table[keys[i]] + frac * (table[keys[i + 1]] - table[keys[i]]);
        }
    }
    return 1.9600;
}

// \u2500\u2500\u2500 p-value from F (incomplete beta approx) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function pValueFromF(F, d1, d2) {
    if (!isFinite(F) || F < 0) return NaN;
    // Use regularized incomplete beta I_x(a,b) where x = d2/(d2+d1*F)
    const x = d2 / (d2 + d1 * F);
    return incompleteBeta(x, d2 / 2, d1 / 2);
}

function incompleteBeta(x, a, b) {
    if (x < 0 || x > 1) return NaN;
    if (x === 0) return 0;
    if (x === 1) return 1;
    // Use continued fraction (Lentz's method) for regularised incomplete beta
    const lbeta = logBeta(a, b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
    return front * betaCF(x, a, b);
}

function logBeta(a, b) {
    return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function logGamma(z) {
    // Lanczos approximation
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
    // Continued fraction for incomplete beta via Lentz's method
    const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1.0, d = 1.0 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1.0 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1.0 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1.0 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1.0 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1.0 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1.0 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1.0 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1.0) < EPS) break;
    }
    return h;
}

// \u2500\u2500\u2500 FIELD FEEDBACK MESSAGES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Returns an HTML diagnostic string or null for each field
function getFeedbackMsg(fieldKey, userVal, t) {
    const v = parseFloat(userVal);
    if (isNaN(v)) return null;
    const tol = (ref) => Math.max(0.005, 0.01 * Math.abs(ref));
    const bigTol = (ref) => Math.max(0.5, 0.01 * Math.abs(ref));

    if (fieldKey === 'grandMean') {
        const unweighted = r4(t.groups.reduce((s, g) => s + t.grpMeans[g], 0) / t.groups.length);
        if (Math.abs(v - unweighted) <= tol(unweighted) && Math.abs(v - t.grandMean) > 0.005)
            return `<b>Waarom fout:</b> U berekende het ongewogen gemiddelde van de groepsgemiddelden (= ${unweighted.toFixed(4)}) in plaats van het grootgemiddelde.<br><b>Oorzaak:</b> Bij ongelijke groepsgrootten is het gemiddelde van groepsgemiddelden \u2260 \u03a3Y/N.<br><b>Correctie:</b> Tel alle N = ${t.N} Y-waarden op en deel door N.`;
        for (const g of t.groups) {
            if (Math.abs(v - t.grpMeans[g]) <= tol(t.grpMeans[g]))
                return `<b>Waarom fout:</b> U vulde het groepsgemiddelde van groep '${g}' (= ${t.grpMeans[g].toFixed(4)}) in.<br><b>Correctie:</b> Het grootgemiddelde is het gemiddelde van ALLE N = ${t.N} Y-waarden \u2014 Y&#x0305;.. = \u03a3Y / N.`;
        }
        return `Grootgemiddelde onjuist. Y&#x0305;.. = \u03a3(alle Y-waarden) / N. Gebruik alle N = ${t.N} waarnemingen.`;
    }

    if (fieldKey.startsWith('grp_')) {
        const gi = parseInt(fieldKey.split('_')[1], 10);
        const g = t.groups[gi];
        if (!g) return null;
        const nj = t.nGroups[g];
        const grpSum = r4(t.grpMeans[g] * nj);
        if (Math.abs(v - t.grandMean) <= tol(t.grandMean))
            return `<b>Waarom fout:</b> U vulde het grootgemiddelde (Y&#x0305;.. = ${t.grandMean.toFixed(4)}) in als groepsgemiddelde van '${g}'.<br><b>Oorzaak:</b> Het groepsgemiddelde gebruikt alleen de waarden bínnen groep '${g}', niet alle N = ${t.N} waarnemingen.<br><b>Correctie:</b> Y&#x0305;<sub>${g}</sub> = \u03a3(Y voor groep ${g}) / n<sub>${g}</sub>.`;
        if (Math.abs(v - t.MSW) <= tol(t.MSW))
            return `<b>Waarom fout:</b> U vulde MSW (${t.MSW.toFixed(4)}) in \u2014 dat is een gemiddeld kwadraat, geen rekenkundig gemiddelde.<br><b>Correctie:</b> Y&#x0305;<sub>${g}</sub> = \u03a3(Y voor groep ${g}) / n<sub>${g}</sub>.`;
        if (nj > 1 && Math.abs(v - grpSum) <= Math.max(0.5, tol(grpSum)))
            return `<b>Waarom fout:</b> U vulde de groepssom (${grpSum.toFixed(4)}) in zonder te delen door n.<br><b>Correctie:</b> Y&#x0305;<sub>${g}</sub> = \u03a3Y / n<sub>${g}</sub> \u2014 deel de som door n<sub>${g}</sub> = ${nj}.`;
        return `Groepsgemiddelde onjuist. Y&#x0305;<sub>${g}</sub> = \u03a3(Y voor groep ${g}) / n<sub>${g}</sub> (n<sub>${g}</sub> = ${nj}).`;
    }

    if (fieldKey === 'ssw') {
        if (Math.abs(v - t.SSB) <= bigTol(t.SSB))
            return `<b>Verwisseld:</b> U vulde SSB (${t.SSB.toFixed(4)}) in bij SSW \u2014 deze zijn verwisseld.<br><b>Oorzaak:</b> SSW = <em>binnengroepse</em> variatie \u03a3(Y\u2212Y&#x0305;<sub>j</sub>)\u00b2; SSB = <em>tussengroepse</em> variatie.<br><b>Correctie:</b> Gebruik de juiste kolomsom uit de afwijkingtabel.`;
        if (Math.abs(v - t.SST) <= bigTol(t.SST))
            return `<b>Fout:</b> U vulde SST (${t.SST.toFixed(4)}) in bij SSW.<br><b>Oorzaak:</b> SST = SSW + SSB; SSW is alleen de binnengroepse variatie.<br><b>Correctie:</b> Haal SSB van SST af: SSW = SST \u2212 SSB = ${t.SST.toFixed(4)} \u2212 ${t.SSB.toFixed(4)}.`;
        if (Math.abs(v - t.MSW) <= bigTol(t.MSW))
            return `<b>Fout:</b> U vulde MSW (${t.MSW.toFixed(4)}) in bij SSW.<br><b>Oorzaak:</b> MSW = SSW / df<sub>binnen</sub> \u2014 SSW is de som vóór deling door df.<br><b>Correctie:</b> Vermenigvuldig MSW met df<sub>binnen</sub>: SSW = ${t.MSW.toFixed(4)} \u00d7 ${t.dfWithin}.`;
        return 'SSW onjuist. SSW = som van alle (Y\u2212Y&#x0305;<sub>j</sub>)\u00b2 uit de afwijkingtabel.';
    }
    if (fieldKey === 'ssb') {
        if (Math.abs(v - t.SSW) <= bigTol(t.SSW))
            return `<b>Verwisseld:</b> U vulde SSW (${t.SSW.toFixed(4)}) in bij SSB \u2014 deze zijn verwisseld.<br><b>Oorzaak:</b> SSB = <em>tussengroepse</em> variatie \u03a3 n<sub>j</sub>(Y&#x0305;<sub>j</sub>\u2212Y&#x0305;..)\u00b2; SSW is binnengroeps.<br><b>Correctie:</b> Gebruik de tussengroepse kwadratenkolom.`;
        if (Math.abs(v - t.SST) <= bigTol(t.SST))
            return `<b>Fout:</b> U vulde SST (${t.SST.toFixed(4)}) in bij SSB.<br><b>Oorzaak:</b> SSB is alleen de tussengroepse variatie, niet het totaal.<br><b>Correctie:</b> Haal SSW van SST af: SSB = SST \u2212 SSW = ${t.SST.toFixed(4)} \u2212 ${t.SSW.toFixed(4)}.`;
        if (Math.abs(v - t.MSB) <= bigTol(t.MSB))
            return `<b>Fout:</b> U vulde MSB (${t.MSB.toFixed(4)}) in bij SSB.<br><b>Oorzaak:</b> MSB = SSB / df<sub>tussen</sub> \u2014 SSB is de som vóór deling door df.<br><b>Correctie:</b> Vermenigvuldig MSB met df<sub>tussen</sub>: SSB = ${t.MSB.toFixed(4)} \u00d7 ${t.dfBetween}.`;
        return 'SSB onjuist. SSB = \u03a3 n<sub>j</sub>(Y&#x0305;<sub>j</sub>\u2212Y&#x0305;..)\u00b2 (tussengroepse variatie).';
    }
    if (fieldKey === 'sst') {
        if (Math.abs(v - t.SSW) <= bigTol(t.SSW))
            return `<b>Fout:</b> U vulde SSW (${t.SSW.toFixed(4)}) in bij SST.<br><b>Correctie:</b> SST = SSW + SSB = ${t.SSW.toFixed(4)} + ${t.SSB.toFixed(4)}.`;
        if (Math.abs(v - t.SSB) <= bigTol(t.SSB))
            return `<b>Fout:</b> U vulde SSB (${t.SSB.toFixed(4)}) in bij SST.<br><b>Correctie:</b> SST = SSW + SSB = ${t.SSW.toFixed(4)} + ${t.SSB.toFixed(4)}.`;
        return `SST onjuist. SST = SSW + SSB = ${t.SSW.toFixed(4)} + ${t.SSB.toFixed(4)}.`;
    }
    if (fieldKey === 'df-between') {
        if (v === t.k) return `<b>Fout:</b> U vulde k (= ${t.k}) in. df<sub>tussen</sub> = k \u2212 1, dus trek 1 af.<br><b>Correctie:</b> df<sub>tussen</sub> = ${t.k} \u2212 1 = ${t.dfBetween}.`;
        if (v === t.k + 1) return `<b>Fout:</b> U telde 1 op bij k in plaats van af te trekken.<br><b>Correctie:</b> df<sub>tussen</sub> = k \u2212 1 = ${t.k} \u2212 1 = ${t.dfBetween}.`;
        if (v === t.dfWithin) return `<b>Verwisseld:</b> U vulde df<sub>binnen</sub> (= ${t.dfWithin}) in bij df<sub>tussen</sub>.<br><b>Correctie:</b> df<sub>tussen</sub> = k \u2212 1 = ${t.dfBetween}; df<sub>binnen</sub> = N \u2212 k = ${t.dfWithin}.`;
        if (v === t.dfTotal) return `<b>Fout:</b> U vulde df<sub>totaal</sub> (= ${t.dfTotal}) in bij df<sub>tussen</sub>.<br><b>Correctie:</b> df<sub>tussen</sub> = k \u2212 1 = ${t.dfBetween}.`;
        return `df<sub>tussen</sub> onjuist. df<sub>tussen</sub> = k \u2212 1 = ${t.k} \u2212 1 = ${t.dfBetween}.`;
    }
    if (fieldKey === 'df-within') {
        if (v === t.N) return `<b>Fout:</b> U vulde N (= ${t.N}) in. df<sub>binnen</sub> = N \u2212 k \u2014 trek ook het aantal groepen k = ${t.k} af.<br><b>Correctie:</b> df<sub>binnen</sub> = ${t.N} \u2212 ${t.k} = ${t.dfWithin}.`;
        if (v === t.N - 1) return `<b>Fout:</b> U vulde N \u2212 1 (= ${t.N - 1}) in. df<sub>binnen</sub> = N \u2212 k \u2014 trek k af, niet 1.<br><b>Correctie:</b> df<sub>binnen</sub> = ${t.N} \u2212 ${t.k} = ${t.dfWithin}.`;
        if (v === t.dfBetween) return `<b>Verwisseld:</b> U vulde df<sub>tussen</sub> (= ${t.dfBetween}) in bij df<sub>binnen</sub>.<br><b>Correctie:</b> df<sub>binnen</sub> = N \u2212 k = ${t.dfWithin}; df<sub>tussen</sub> = k \u2212 1 = ${t.dfBetween}.`;
        return `df<sub>binnen</sub> onjuist. df<sub>binnen</sub> = N \u2212 k = ${t.N} \u2212 ${t.k} = ${t.dfWithin}.`;
    }
    if (fieldKey === 'df-total') {
        if (v === t.N) return `<b>Fout:</b> U vulde N (= ${t.N}) in. df<sub>totaal</sub> = N \u2212 1 \u2014 trek 1 af.<br><b>Correctie:</b> df<sub>totaal</sub> = ${t.N} \u2212 1 = ${t.dfTotal}.`;
        if (v === t.dfBetween) return `<b>Fout:</b> U vulde df<sub>tussen</sub> (= ${t.dfBetween}) in bij df<sub>totaal</sub>.<br><b>Correctie:</b> df<sub>totaal</sub> = N \u2212 1 = ${t.dfTotal}.`;
        if (v === t.dfWithin) return `<b>Fout:</b> U vulde df<sub>binnen</sub> (= ${t.dfWithin}) in bij df<sub>totaal</sub>.<br><b>Correctie:</b> df<sub>totaal</sub> = N \u2212 1 = ${t.dfTotal}.`;
        if (v === t.dfWithin + t.dfBetween - 1) return `<b>Fout:</b> U berekende df<sub>tussen</sub> + df<sub>binnen</sub> \u2212 1 (= ${t.dfWithin + t.dfBetween - 1}) \u2014 de \u22121 is niet nodig.<br><b>Correctie:</b> df<sub>totaal</sub> = df<sub>tussen</sub> + df<sub>binnen</sub> = ${t.dfTotal}.`;
        return `df<sub>totaal</sub> onjuist. df<sub>totaal</sub> = N \u2212 1 = ${t.N} \u2212 1 = ${t.dfTotal}.`;
    }
    if (fieldKey === 'msb') {
        if (Math.abs(v - t.SSB) <= bigTol(t.SSB))
            return `<b>Fout:</b> U vulde SSB (${t.SSB.toFixed(4)}) in bij MSB \u2014 deel nog door df<sub>tussen</sub>.<br><b>Correctie:</b> MSB = SSB / df<sub>tussen</sub> = ${t.SSB.toFixed(4)} / ${t.dfBetween}.`;
        if (Math.abs(v - t.MSW) <= bigTol(t.MSW))
            return `<b>Verwisseld:</b> U vulde MSW (${t.MSW.toFixed(4)}) in bij MSB.<br><b>Correctie:</b> MSB = SSB / df<sub>tussen</sub> = ${t.SSB.toFixed(4)} / ${t.dfBetween}.`;
        if (t.dfWithin > 0 && Math.abs(v - r4(t.SSB / t.dfWithin)) <= bigTol(r4(t.SSB / t.dfWithin)))
            return `<b>Fout:</b> U deelde SSB door df<sub>binnen</sub> (= ${t.dfWithin}) in plaats van df<sub>tussen</sub> (= ${t.dfBetween}).<br><b>Correctie:</b> MSB = SSB / df<sub>tussen</sub>.`;
        return `MSB onjuist. MSB = SSB / df<sub>tussen</sub> = ${t.SSB.toFixed(4)} / ${t.dfBetween}.`;
    }
    if (fieldKey === 'msw') {
        if (Math.abs(v - t.SSW) <= bigTol(t.SSW))
            return `<b>Fout:</b> U vulde SSW (${t.SSW.toFixed(4)}) in bij MSW \u2014 deel nog door df<sub>binnen</sub>.<br><b>Correctie:</b> MSW = SSW / df<sub>binnen</sub> = ${t.SSW.toFixed(4)} / ${t.dfWithin}.`;
        if (Math.abs(v - t.MSB) <= bigTol(t.MSB))
            return `<b>Verwisseld:</b> U vulde MSB (${t.MSB.toFixed(4)}) in bij MSW.<br><b>Correctie:</b> MSW = SSW / df<sub>binnen</sub> = ${t.SSW.toFixed(4)} / ${t.dfWithin}.`;
        if (t.dfBetween > 0 && Math.abs(v - r4(t.SSW / t.dfBetween)) <= bigTol(r4(t.SSW / t.dfBetween)))
            return `<b>Fout:</b> U deelde SSW door df<sub>tussen</sub> (= ${t.dfBetween}) in plaats van df<sub>binnen</sub> (= ${t.dfWithin}).<br><b>Correctie:</b> MSW = SSW / df<sub>binnen</sub>.`;
        return `MSW onjuist. MSW = SSW / df<sub>binnen</sub> = ${t.SSW.toFixed(4)} / ${t.dfWithin}.`;
    }
    if (fieldKey === 'f') {
        if (isFinite(t.Fratio) && t.Fratio > 0 && Math.abs(v - r4(1 / t.Fratio)) < Math.max(0.01, 0.02 / t.Fratio))
            return `<b>Omgekeerd:</b> U berekende MSW/MSB (= ${r4(1 / t.Fratio).toFixed(4)}) in plaats van MSB/MSW \u2014 draai de deling om.<br><b>Correctie:</b> F = MSB / MSW = ${t.MSB.toFixed(4)} / ${t.MSW.toFixed(4)}.`;
        return `F-ratio onjuist. F = MSB / MSW = ${t.MSB.toFixed(4)} / ${t.MSW.toFixed(4)} (tussengroeps gedeeld door binnengroeps).`;
    }
    if (fieldKey === 'eta') {
        if (t.SSW > 0 && Math.abs(v - r4(t.SSB / t.SSW)) < Math.max(0.01, 0.02 * Math.abs(t.SSB / t.SSW)))
            return `<b>Fout:</b> U gebruikte SSB/SSW (= ${r4(t.SSB / t.SSW).toFixed(4)}) in plaats van SSB/SST.<br><b>Oorzaak:</b> De noemer van \u03b7\u00b2 is SST (= SSW + SSB), niet SSW.<br><b>Correctie:</b> \u03b7\u00b2 = SSB / SST = ${t.SSB.toFixed(4)} / ${t.SST.toFixed(4)}.`;
        return `\u03b7\u00b2 onjuist. \u03b7\u00b2 = SSB / SST = ${t.SSB.toFixed(4)} / ${t.SST.toFixed(4)} (gebruik SST in de noemer, niet SSW).`;
    }
    return null;
}

// set / clear a field diagnostic message \u2014 also mirrors into feedbackStore
function setFieldMsg(id, html) {
    feedbackStore[id] = html || null;
    const el = document.getElementById(id);
    if (!el) return;
    if (!html) { el.innerHTML = ''; el.className = 'field-diag'; return; }
    el.innerHTML = html;
    el.className = 'field-diag visible';
}

// render a R-style detailed feedback panel (red border, all wrong fields listed)
function renderFeedbackPanel(panelId, fieldMap) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const items = [];
    Object.entries(fieldMap).forEach(([label, msgId]) => {
        const msg = feedbackStore[msgId];
        if (msg) items.push({ label, html: msg });
    });
    if (!items.length) {
        panel.innerHTML = '';
        panel.className = 'feedback-panel';
        return;
    }
    let html = '<div class="feedback-panel-title">Uitgebreide feedback:</div>';
    items.forEach(item => {
        html += `<div class="feedback-detail-item"><div class="feedback-detail-label">${item.label}</div><div>${item.html}</div></div>`;
    });
    panel.innerHTML = html;
    panel.className = 'feedback-panel visible';
}

// update per-section summary feedback div
function updateSectionSummary(divId, correct, total, labelOk, labelPartial) {
    const el = document.getElementById(divId);
    if (!el) return;
    if (total === 0) { el.innerHTML = ''; el.className = 'section-summary'; return; }
    if (correct === total) {
        el.innerHTML = `\u2705 ${labelOk} (${correct}/${total})`;
        el.className = 'section-summary ok';
    } else {
        const pct = Math.round(correct / total * 100);
        el.innerHTML = `${correct}/${total} correct${labelPartial ? ' \u2014 ' + labelPartial : ''}`;
        el.className = 'section-summary partial';
    }
}

// \u2500\u2500\u2500 RENDER SCENARIO DROPDOWN \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function populateScenarioDropdown() {
    const sel = document.getElementById('sel-scenario');
    SCENARIOS.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.title;
        sel.appendChild(opt);
    });
}

// \u2500\u2500\u2500 RENDER DATASET TABLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderDataset() {
    const wrap = document.getElementById('dataset-table-wrap');
    const info = document.getElementById('dataset-info');
    const { data, scenario: sc } = state;
    if (!data.length) { wrap.innerHTML = ''; return; }

    const nPerGroup = data.length / sc.groups.length;
    info.textContent = `N = ${data.length} waarnemingen (${sc.groups.length} groepen \u00d7 ${nPerGroup} per groep). Afhankelijke variabele: ${sc.yName} (${sc.yUnit}).`;

    // Side-by-side group tables (matches R app layout)
    let html = '<div class="group-tables-row">';
    sc.groups.forEach(g => {
        const rows = data.filter(d => d.group === g);
        html += `<div class="group-table-col">
            <div class="group-table-title">${g}</div>
            <table class="dataset-table">
                <thead><tr><th>Eenheid</th><th>${sc.yName} (${sc.yUnit})</th></tr></thead>
                <tbody>`;
        rows.forEach(row => {
            html += `<tr><td>${row.entity}</td><td>${row.y.toFixed(2)}</td></tr>`;
        });
        html += '</tbody></table></div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
}

// \u2500\u2500\u2500 RENDER GROUP MEANS INPUTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderGroupMeansInputs() {
    const container = document.getElementById('group-means-inputs');
    const sc = state.scenario;
    if (!sc) { container.innerHTML = ''; return; }
    let html = '';
    sc.groups.forEach((g, i) => {
        html += `
      <div class="field-row">
        <label>Groepsgemiddelde ${g} (\u0232<sub>${i + 1}</sub>)</label>
        <input type="number" step="any" id="inp-grp-${i}" class="num-input" placeholder="0.0000" />
        <span class="light" id="light-grp-${i}"></span>
      </div>
      <div class="field-diag" id="msg-grp-${i}"></div>`;
    });
    container.innerHTML = html;
}

// \u2500\u2500\u2500 RENDER DEVIATION TABLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderDeviationTable() {
    const table = document.getElementById('calc-table');
    const sc = state.scenario;
    const { data, truth } = state;
    if (!sc || !data.length) { table.querySelector('thead').innerHTML = ''; table.querySelector('tbody').innerHTML = ''; return; }

    const yName = sc.yName;
    // header
    table.querySelector('thead').innerHTML = `
    <tr>
      <th>Eenheid</th><th>Groep</th><th>${yName}</th>
      <th>(Y\u2212Yj)</th><th>(Y\u2212Yj)\u00b2</th><th>(Yj\u2212\u0232..)</th><th>(Yj\u2212\u0232..)\u00b2</th>
    </tr>`;

    // figure out group start rows
    const groupStart = {};
    let lastGroup = null;
    data.forEach((d, i) => {
        if (d.group !== lastGroup) { groupStart[i] = true; lastGroup = d.group; }
    });

    let html = '';
    data.forEach((row, i) => {
        const isBetweenFirst = groupStart[i] === true;
        const dBInput = isBetweenFirst
            ? `<input type="number" step="any" id="tbl-dB-${i}" class="tbl-input" placeholder="?" data-row="${i}" data-col="dB" />`
            : `<span class="readonly-cell muted" id="tbl-dB-${i}-disp">\u2014</span>`;
        const dB2Input = isBetweenFirst
            ? `<input type="number" step="any" id="tbl-dB2-${i}" class="tbl-input" placeholder="?" data-row="${i}" data-col="dB2" />`
            : `<span class="readonly-cell muted" id="tbl-dB2-${i}-disp">\u2014</span>`;

        html += `<tr>
      <td>${row.entity}</td>
      <td class="group-cell">${row.group}</td>
      <td class="y-cell">${row.y.toFixed(2)}</td>
      <td><input type="number" step="any" id="tbl-dW-${i}" class="tbl-input" placeholder="?" data-row="${i}" data-col="dW" /></td>
      <td><input type="number" step="any" id="tbl-dW2-${i}" class="tbl-input" placeholder="?" data-row="${i}" data-col="dW2" /></td>
      <td>${dBInput}</td>
      <td>${dB2Input}</td>
    </tr>`;
    });
    table.querySelector('tbody').innerHTML = html;
}

// \u2500\u2500\u2500 READ ANSWERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function readAnswers() {
    const sc = state.scenario;
    const { data } = state;
    const ans = {};

    if (sc) {
        sc.groups.forEach((_, i) => {
            const el = document.getElementById(`inp-grp-${i}`);
            ans[`grp_${i}`] = el ? el.value.trim() : '';
        });
    }
    const grandEl = document.getElementById('inp-grand-mean');
    ans.grandMean = grandEl ? grandEl.value.trim() : '';

    // table
    ans.tableRows = data.map((_, i) => {
        const dW = document.getElementById(`tbl-dW-${i}`);
        const dW2 = document.getElementById(`tbl-dW2-${i}`);
        const dB = document.getElementById(`tbl-dB-${i}`);
        const dB2 = document.getElementById(`tbl-dB2-${i}`);
        return {
            dW: dW ? dW.value.trim() : null,
            dW2: dW2 ? dW2.value.trim() : null,
            dB: dB ? dB.value.trim() : null,
            dB2: dB2 ? dB2.value.trim() : null
        };
    });

    const ids = ['ssw', 'ssb', 'sst', 'df-between', 'df-within', 'df-total', 'msb', 'msw', 'f', 'eta'];
    ids.forEach(id => {
        const el = document.getElementById(`inp-${id}`);
        ans[id] = el ? el.value.trim() : '';
    });

    return ans;
}

// \u2500\u2500\u2500 VALIDATE FIELD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function validateField(inputEl, lightEl, expected, value) {
    if (!inputEl) return { state: 'empty' };
    if (value === '') {
        inputEl.classList.remove('correct', 'incorrect');
        if (lightEl) { lightEl.classList.remove('green', 'red'); }
        return { state: 'empty' };
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        inputEl.classList.remove('correct');
        inputEl.classList.add('incorrect');
        if (lightEl) { lightEl.classList.remove('green'); lightEl.classList.add('red'); }
        return { state: 'incorrect' };
    }
    const correct = Math.abs(r4(num) - r4(expected)) < 0.0001;
    if (correct) {
        inputEl.classList.add('correct'); inputEl.classList.remove('incorrect');
        if (lightEl) { lightEl.classList.add('green'); lightEl.classList.remove('red'); }
        return { state: 'correct' };
    } else {
        inputEl.classList.add('incorrect'); inputEl.classList.remove('correct');
        if (lightEl) { lightEl.classList.remove('green'); lightEl.classList.add('red'); }
        return { state: 'incorrect' };
    }
}

// \u2500\u2500\u2500 VALIDATE ALL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function validateAll() {
    const { truth, scenario: sc, data } = state;
    if (!truth || !sc) return;

    const ans = readAnswers();
    let totalFields = 0, correctFields = 0;

    // helper: validate one field and set its diagnostic message
    function chk(inputId, lightId, msgId, fieldKey, expected, ansValue) {
        totalFields++;
        const inp = document.getElementById(inputId);
        const light = lightId ? document.getElementById(lightId) : null;
        const res = validateField(inp, light, expected, ansValue);
        if (res.state === 'correct') correctFields++;
        if (msgId) {
            if (res.state === 'incorrect') {
                setFieldMsg(msgId, getFeedbackMsg(fieldKey, ansValue, truth));
            } else {
                setFieldMsg(msgId, '');
            }
        }
        return res.state;
    }

    // Deel II: group means
    let d2correct = 0, d2total = 0;
    sc.groups.forEach((g, i) => {
        d2total++;
        const st = chk(`inp-grp-${i}`, `light-grp-${i}`, `msg-grp-${i}`, `grp_${i}`, truth.grpMeans[g], ans[`grp_${i}`]);
        if (st === 'correct') d2correct++;
    });
    d2total++;
    if (chk('inp-grand-mean', 'light-grand-mean', 'msg-grand-mean', 'grandMean', truth.grandMean, ans.grandMean) === 'correct') d2correct++;
    updateSectionSummary('feedback-deel2', d2correct, d2total, 'Alle gemiddelden correct', 'controleer groepsgemiddelden');
    const d2map = Object.fromEntries(sc.groups.map((g, i) => [`Y&#x0305;_${g}`, `msg-grp-${i}`]));
    d2map['Grootgemiddelde Y&#x0305;..'] = 'msg-grand-mean';
    renderFeedbackPanel('feedback-detail-deel2', d2map);

    // Deel III: table
    let tableCorrect = 0, tableTotal = 0;
    const groupFirstRow = {};
    let lastGroup = null;
    data.forEach((d, i) => {
        if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; }
    });

    data.forEach((_, i) => {
        const row = ans.tableRows[i];

        // dW
        tableTotal++; totalFields++;
        if (row.dW !== null) {
            const res = validateField(document.getElementById(`tbl-dW-${i}`), null, truth.devWithin[i], row.dW);
            if (res.state === 'correct') { correctFields++; tableCorrect++; }
        }

        // dW2
        tableTotal++; totalFields++;
        if (row.dW2 !== null) {
            const res = validateField(document.getElementById(`tbl-dW2-${i}`), null, truth.devWithinSq[i], row.dW2);
            if (res.state === 'correct') { correctFields++; tableCorrect++; }
        }

        // dB / dB2 (first row of group only)
        const d = data[i];
        const isFirst = groupFirstRow[d.group] === i;
        if (isFirst) {
            tableTotal++; totalFields++;
            const res = validateField(document.getElementById(`tbl-dB-${i}`), null, truth.devBetween[i], row.dB || '');
            if (res.state === 'correct') { correctFields++; tableCorrect++; }

            tableTotal++; totalFields++;
            const res2 = validateField(document.getElementById(`tbl-dB2-${i}`), null, truth.devBetweenSq[i], row.dB2 || '');
            if (res2.state === 'correct') { correctFields++; tableCorrect++; }
        }
    });
    // Table summary feedback
    const tableFeedbackEl = document.getElementById('table-feedback');
    if (tableFeedbackEl) {
        if (tableTotal === 0) {
            tableFeedbackEl.innerHTML = '';
        } else if (tableCorrect === tableTotal) {
            tableFeedbackEl.innerHTML = '<span class="ok-inline">\u2705 Afwijkingtabel volledig correct!</span>';
        } else {
            tableFeedbackEl.innerHTML = `<span class="partial-inline">${tableCorrect}/${tableTotal} cellen correct \u2014 controleer de afwijkingskolommen.</span>`;
        }
    }
    updateSectionSummary('feedback-deel3', tableCorrect, tableTotal,
        'Afwijkingtabel volledig correct', 'controleer de afwijkingskolommen');

    // Deel IV: SS
    let d4correct = 0;
    if (chk('inp-ssw', 'light-ssw', 'msg-ssw', 'ssw', truth.SSW, ans.ssw) === 'correct') d4correct++;
    if (chk('inp-ssb', 'light-ssb', 'msg-ssb', 'ssb', truth.SSB, ans.ssb) === 'correct') d4correct++;
    if (chk('inp-sst', 'light-sst', 'msg-sst', 'sst', truth.SST, ans.sst) === 'correct') d4correct++;
    updateSectionSummary('feedback-deel4', d4correct, 3, 'Alle kwadratensommen correct', 'controleer SS-waarden');
    renderFeedbackPanel('feedback-detail-deel4', {
        'SSW (binnengroeps)': 'msg-ssw',
        'SSB (tussengroeps)': 'msg-ssb',
        'SST (totaal)': 'msg-sst'
    });

    // SS decomp display
    updateSSDecompDisplay();

    // Deel V: ANOVA table
    let d5correct = 0;
    if (chk('inp-df-between', 'light-df-between', 'msg-df-between', 'df-between', truth.dfBetween, ans['df-between']) === 'correct') d5correct++;
    if (chk('inp-df-within', 'light-df-within', 'msg-df-within', 'df-within', truth.dfWithin, ans['df-within']) === 'correct') d5correct++;
    if (chk('inp-df-total', 'light-df-total', 'msg-df-total', 'df-total', truth.dfTotal, ans['df-total']) === 'correct') d5correct++;
    if (chk('inp-msb', 'light-msb', 'msg-msb', 'msb', truth.MSB, ans.msb) === 'correct') d5correct++;
    if (chk('inp-msw', 'light-msw', 'msg-msw', 'msw', truth.MSW, ans.msw) === 'correct') d5correct++;
    if (chk('inp-f', 'light-f', 'msg-f', 'f', truth.Fratio, ans.f) === 'correct') d5correct++;
    if (chk('inp-eta', 'light-eta', 'msg-eta', 'eta', truth.etaSq, ans.eta) === 'correct') d5correct++;
    updateSectionSummary('feedback-deel5', d5correct, 7,
        `ANOVA-tabel correct \u2014 F(${truth.dfBetween},${truth.dfWithin}) = ${truth.Fratio.toFixed(4)}`,
        'controleer vrijheidsgraden en MS-waarden');
    renderFeedbackPanel('feedback-detail-deel5', {
        'df tussen groepen': 'msg-df-between',
        'df binnen groepen': 'msg-df-within',
        'df totaal': 'msg-df-total',
        'MSB': 'msg-msb',
        'MSW': 'msg-msw',
        'F-ratio': 'msg-f',
        '\u03b7\u00b2': 'msg-eta'
    });

    updateProgress(correctFields, totalFields);
    updateANOVATableDisplay();
    updateSigNote();

    const wasCorrect = state.allCorrect;
    const allCorrect = correctFields === totalFields && totalFields > 0;
    state.allCorrect = allCorrect;

    if (allCorrect && !wasCorrect) {
        unlockVisualSections();
    } else if (!allCorrect && wasCorrect) {
        lockVisualSections();
    }

    const successEl = document.getElementById('success-msg');
    if (allCorrect) {
        successEl.textContent = '\u2705 Alle antwoorden zijn correct! Visualisaties zijn nu beschikbaar.';
        successEl.classList.add('visible');
    } else {
        successEl.textContent = '';
        successEl.classList.remove('visible');
    }
}

// \u2500\u2500\u2500 SS DECOMP DISPLAY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function updateSSDecompDisplay() {
    const { truth } = state;
    const el = document.getElementById('ss-decomp-disp');
    if (!truth) { el.textContent = ''; return; }
    const sswEl = document.getElementById('inp-ssw');
    const ssbEl = document.getElementById('inp-ssb');
    const sstEl = document.getElementById('inp-sst');
    const sswOk = sswEl && sswEl.classList.contains('correct');
    const ssbOk = ssbEl && ssbEl.classList.contains('correct');
    const sstOk = sstEl && sstEl.classList.contains('correct');
    if (sswOk && ssbOk) {
        const sum = r4(parseFloat(sswEl.value) + parseFloat(ssbEl.value));
        el.innerHTML = `SSW + SSB = ${parseFloat(sswEl.value).toFixed(4)} + ${parseFloat(ssbEl.value).toFixed(4)} = <strong>${sum.toFixed(4)}</strong>`;
    } else {
        el.textContent = 'SST = SSW + SSB';
    }
}

// \u2500\u2500\u2500 ANOVA TABLE SS DISPLAY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function updateANOVATableDisplay() {
    const { truth } = state;
    const setBetween = document.getElementById('disp-ssb');
    const setWithin = document.getElementById('disp-ssw');
    const setTotal = document.getElementById('disp-sst');
    if (truth) {
        const sswEl = document.getElementById('inp-ssw');
        const ssbEl = document.getElementById('inp-ssb');
        const sstEl = document.getElementById('inp-sst');
        if (sswEl && sswEl.classList.contains('correct')) setWithin.textContent = truth.SSW.toFixed(4);
        else setWithin.textContent = '\u2014';
        if (ssbEl && ssbEl.classList.contains('correct')) setBetween.textContent = truth.SSB.toFixed(4);
        else setBetween.textContent = '\u2014';
        if (sstEl && sstEl.classList.contains('correct')) setTotal.textContent = truth.SST.toFixed(4);
        else setTotal.textContent = '\u2014';
    }
}

// \u2500\u2500\u2500 SIGNIFICANCE NOTE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function updateSigNote() {
    const { truth } = state;
    const el = document.getElementById('sig-note');
    if (!truth || !isFinite(truth.Fratio)) { el.classList.remove('visible'); return; }
    const fEl = document.getElementById('inp-f');
    if (!fEl || !fEl.classList.contains('correct')) { el.classList.remove('visible'); return; }
    const fCrit = isFinite(truth.fCritical) ? truth.fCritical.toFixed(2) : '?';
    const sig = isFinite(truth.fCritical) && truth.Fratio > truth.fCritical;
    const p = truth.pValue;
    const pStr = isFinite(p) ? (p < 0.001 ? '&lt; .001' : p.toFixed(3)) : 'N.v.t.';
    el.innerHTML = `
        <b>Significantie:</b> zoek de kritieke F-waarde op in een
        <a href="https://www.statology.org/f-distribution-table/" target="_blank" rel="noopener noreferrer">F-tabel</a>
        bij &alpha; = 0,05 met tellerdf <b>df<sub>tussen</sub> = ${truth.dfBetween}</b>
        en noemerdf <b>df<sub>binnen</sub> = ${truth.dfWithin}</b>.
        <ul style="margin:6px 0 0 16px;">
            <li>F<sub>krit</sub>(${truth.dfBetween}, ${truth.dfWithin}) &asymp; ${fCrit}</li>
            <li>F<sub>berekend</sub> = ${truth.Fratio.toFixed(4)}</li>
            <li>${sig
            ? `<b style="color:#166534;">F &gt; F<sub>krit</sub> &rarr; significant (p = ${pStr})</b>`
            : `<b style="color:#991b1b;">F &le; F<sub>krit</sub> &rarr; niet significant (p = ${pStr})</b>`
        }</li>
        </ul>`;
    el.classList.add('visible');
}

// \u2500\u2500\u2500 PROGRESS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function updateProgress(correct, total) {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    bar.style.width = pct + '%';
    text.textContent = `${correct} / ${total} correct`;
}

// \u2500\u2500\u2500 DESTROY CHARTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function destroyCharts() {
    if (state.chartBoxplot) { state.chartBoxplot.destroy(); state.chartBoxplot = null; }
    if (state.chartSS) { state.chartSS.destroy(); state.chartSS = null; }
    if (state.chartCI) { state.chartCI.destroy(); state.chartCI = null; }
}

// \u2500\u2500\u2500 LOCK / UNLOCK VIZ SECTIONS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function lockVisualSections() {
    ['deel6', 'deel7'].forEach(id => {
        const sec = document.getElementById(id);
        sec.querySelector('.lock-notice').classList.remove('hidden');
        const content = sec.querySelector('.viz-content') || sec.querySelector('.ci-content');
        if (content) content.classList.add('hidden');
    });
    // update nav
    document.querySelectorAll('.nav-item[data-target="deel6"], .nav-item[data-target="deel7"]')
        .forEach(el => el.classList.add('locked'));
    destroyCharts();
}

function unlockVisualSections() {
    document.getElementById('deel6').querySelector('.lock-notice').classList.add('hidden');
    document.getElementById('deel6').querySelector('.viz-content').classList.remove('hidden');
    document.getElementById('deel7').querySelector('.lock-notice').classList.add('hidden');
    document.getElementById('deel7').querySelector('.ci-content').classList.remove('hidden');
    document.querySelectorAll('.nav-item[data-target="deel6"], .nav-item[data-target="deel7"]')
        .forEach(el => el.classList.remove('locked'));
    renderPlots();
    renderCI();
}

// \u2500\u2500\u2500 RENDER PLOTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const GROUP_COLORS = [
    'rgba(59,130,246,0.75)', 'rgba(239,68,68,0.75)', 'rgba(34,197,94,0.75)',
    'rgba(168,85,247,0.75)', 'rgba(249,115,22,0.75)', 'rgba(20,184,166,0.75)'
];

function renderPlots() {
    const { truth, scenario: sc, data } = state;
    if (!truth || !sc) return;

    // Boxplot-like: scatter of data points per group
    renderBoxplotChart();
    renderSSChart();
    renderInterpretation();
}

function deterministicJitter(index, width = 0.20) {
    const pattern = [-0.08, -0.04, 0, 0.04, 0.08];
    return pattern[index % pattern.length] * (width / 0.08);
}

function renderBoxplotChart() {
    const { truth, scenario: sc, data } = state;
    const ctx = document.getElementById('chart-boxplot').getContext('2d');

    if (state.chartBoxplot) { state.chartBoxplot.destroy(); state.chartBoxplot = null; }

    const datasets = sc.groups.map((g, gi) => {
        const points = data
            .filter(d => d.group === g)
            .map((d, j) => ({ x: gi + 1 + deterministicJitter(j), y: d.y }));
        return {
            label: g,
            data: points,
            backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length],
            pointRadius: 5,
            type: 'scatter'
        };
    });

    // add grand mean line as annotation via dataset
    const grandMeanDS = {
        label: 'Grootgemiddelde',
        data: [{ x: 0.5, y: truth.grandMean }, { x: sc.groups.length + 0.5, y: truth.grandMean }],
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        type: 'line',
        fill: false,
        showLine: true
    };

    // group means as horizontal short lines
    const groupMeanDS = {
        label: 'Groepsgemiddelden',
        data: sc.groups.map((g, gi) => ({ x: gi + 1, y: truth.grpMeans[g] })),
        backgroundColor: '#1e3a5f',
        pointRadius: 9,
        pointStyle: 'line',
        pointBorderWidth: 3,
        type: 'scatter'
    };

    state.chartBoxplot = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [...datasets, grandMeanDS, groupMeanDS] },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: `${sc.yName} per groep`, font: { size: 13 } },
                legend: { display: false }
            },
            scales: {
                x: {
                    min: 0.3, max: sc.groups.length + 0.7, ticks: {
                        callback: (val) => {
                            const i = Math.round(val) - 1;
                            return sc.groups[i] || '';
                        }, stepSize: 1
                    }
                },
                y: { title: { display: true, text: `${sc.yName} (${sc.yUnit})` } }
            }
        }
    });
}

function renderSSChart() {
    const { truth, scenario: sc } = state;
    const ctx = document.getElementById('chart-ss').getContext('2d');
    if (state.chartSS) { state.chartSS.destroy(); state.chartSS = null; }

    state.chartSS = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['SSB (tussen groepen)', 'SSW (binnen groepen)'],
            datasets: [{
                data: [truth.SSB, truth.SSW],
                backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(239,68,68,0.8)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: `Kwadratensommen: SST = ${truth.SST.toFixed(4)}`, font: { size: 13 } },
                legend: { position: 'bottom', labels: { font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const pct = (ctx.raw / truth.SST * 100).toFixed(1);
                            return `${ctx.label}: ${ctx.raw.toFixed(4)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderInterpretation() {
    const { truth, scenario: sc } = state;
    const el = document.getElementById('interpretation-block');
    const p = truth.pValue;
    const sig = isFinite(p) && p < 0.05;
    const pStr = isFinite(p) ? (p < 0.001 ? '< .001' : p.toFixed(3)) : 'N.v.t.';
    const etaPct = (truth.etaSq * 100).toFixed(1);
    const effectSize = truth.etaSq < 0.01 ? 'verwaarloosbaar' : truth.etaSq < 0.06 ? 'klein' : truth.etaSq < 0.14 ? 'medium' : 'groot';

    // find highest/lowest group
    let highGrp = sc.groups[0], lowGrp = sc.groups[0];
    sc.groups.forEach(g => {
        if (truth.grpMeans[g] > truth.grpMeans[highGrp]) highGrp = g;
        if (truth.grpMeans[g] < truth.grpMeans[lowGrp]) lowGrp = g;
    });

    el.innerHTML = `
    <strong>Interpretatie</strong><br>
    F(${truth.dfBetween}, ${truth.dfWithin}) = ${truth.Fratio.toFixed(4)}, p = ${pStr}.<br>
    ${sig
            ? `Er is een statistisch significant effect van groep op ${sc.yName} (p < .05).`
            : `Er is <em>geen</em> statistisch significant effect van groep op ${sc.yName} (p \u2265 .05).`
        }<br>
    \u03b7\u00b2 = ${truth.etaSq.toFixed(4)} (${etaPct}% verklaarde variantie \u2014 ${effectSize} effect).<br>
    De hoogste gemiddelde score is gevonden in ${highGrp} (M = ${truth.grpMeans[highGrp].toFixed(4)}),
    de laagste in ${lowGrp} (M = ${truth.grpMeans[lowGrp].toFixed(4)}).
  `;
}

// \u2500\u2500\u2500 RENDER CI TABLE & CHART \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderCI() {
    const { truth, scenario: sc } = state;
    if (!truth || !sc) return;

    const tbody = document.querySelector('#ci-table tbody');
    let html = '';
    sc.groups.forEach((g, gi) => {
        html += `<tr>
      <td>${g}</td>
      <td>${truth.nGroups[g]}</td>
      <td>${truth.grpMeans[g].toFixed(4)}</td>
      <td>\u00b1 ${truth.ciMargin[g].toFixed(4)}</td>
      <td>${truth.ciLower[g].toFixed(4)}</td>
      <td>${truth.ciUpper[g].toFixed(4)}</td>
    </tr>`;
    });
    tbody.innerHTML = html;

    // CI chart
    const ctx = document.getElementById('chart-ci').getContext('2d');
    if (state.chartCI) { state.chartCI.destroy(); state.chartCI = null; }

    const labels = sc.groups;
    const means = sc.groups.map(g => truth.grpMeans[g]);
    const errors = sc.groups.map(g => truth.ciMargin[g]);

    state.chartCI = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `Groepsgemiddelde \u00b1 95% BI (${sc.yUnit})`,
                data: means,
                backgroundColor: GROUP_COLORS.slice(0, sc.groups.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: '95%-betrouwbaarheidsintervallen per groep', font: { size: 13 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const g = sc.groups[ctx.dataIndex];
                            return [`M = ${truth.grpMeans[g].toFixed(4)}`, `95% BI: [${truth.ciLower[g].toFixed(4)}, ${truth.ciUpper[g].toFixed(4)}]`];
                        }
                    }
                }
            },
            scales: {
                y: { title: { display: true, text: `${sc.yName} (${sc.yUnit})` } }
            }
        }
    });
}

// \u2500\u2500\u2500 GENERATE + RESET \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function doGenerate() {
    const scId = document.getElementById('sel-scenario').value;
    const sc = SCENARIOS.find(s => s.id === scId);
    if (!sc) return;

    let n = parseInt(document.getElementById('inp-n').value, 10);
    if (isNaN(n) || n < 3) n = 3;
    const maxN = Math.floor(50 / sc.groups.length);
    n = Math.min(n, maxN);

    let seed = parseInt(document.getElementById('inp-seed').value, 10);
    if (isNaN(seed) || seed < 1) seed = 42;

    state.scenario = sc;
    state.data = generateData(sc, n, seed);
    state.truth = calculateTruth(state.data, sc);
    state.allCorrect = false;
    destroyCharts();

    // update vignette
    document.getElementById('vignette-text').textContent = sc.vignette;

    renderDataset();
    renderGroupMeansInputs();
    renderDeviationTable();
    resetAllInputs();
    lockVisualSections();
    updateProgress(0, 0);
}

function resetAllInputs() {
    document.querySelectorAll('.num-input, .tbl-input').forEach(el => {
        el.value = '';
        el.classList.remove('correct', 'incorrect');
    });
    document.querySelectorAll('.light').forEach(el => el.classList.remove('green', 'red'));
    document.querySelectorAll('.field-diag').forEach(el => { el.innerHTML = ''; el.className = 'field-diag'; });
    document.querySelectorAll('.section-summary').forEach(el => { el.innerHTML = ''; el.className = 'section-summary'; });
    document.querySelectorAll('.feedback-panel').forEach(el => { el.innerHTML = ''; el.className = 'feedback-panel'; });
    Object.keys(feedbackStore).forEach(k => delete feedbackStore[k]);
    document.getElementById('ss-decomp-disp').textContent = 'SST = SSW + SSB';
    document.getElementById('sig-note').classList.remove('visible');
    document.getElementById('success-msg').classList.remove('visible');
    ['anova-table-feedback', 'table-feedback'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    ['disp-ssb', 'disp-ssw', 'disp-sst'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '\u2014';
    });
}

// \u2500\u2500\u2500 AUTO-FILL ANSWERS (testing) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function autoFillAnswers() {
    const { truth, scenario: sc, data } = state;
    if (!truth || !sc) return;

    sc.groups.forEach((g, i) => {
        const el = document.getElementById(`inp-grp-${i}`);
        if (el) el.value = truth.grpMeans[g].toFixed(4);
    });
    const gm = document.getElementById('inp-grand-mean');
    if (gm) gm.value = truth.grandMean.toFixed(4);

    const groupFirstRow = {};
    let lastGroup = null;
    data.forEach((d, i) => { if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; } });

    data.forEach((_, i) => {
        const dW = document.getElementById(`tbl-dW-${i}`);
        const dW2 = document.getElementById(`tbl-dW2-${i}`);
        if (dW) dW.value = truth.devWithin[i].toFixed(4);
        if (dW2) dW2.value = truth.devWithinSq[i].toFixed(4);
        if (groupFirstRow[data[i].group] === i) {
            const dB = document.getElementById(`tbl-dB-${i}`); if (dB) dB.value = truth.devBetween[i].toFixed(4);
            const dB2 = document.getElementById(`tbl-dB2-${i}`); if (dB2) dB2.value = truth.devBetweenSq[i].toFixed(4);
        }
    });

    document.getElementById('inp-ssw').value = truth.SSW.toFixed(4);
    document.getElementById('inp-ssb').value = truth.SSB.toFixed(4);
    document.getElementById('inp-sst').value = truth.SST.toFixed(4);
    document.getElementById('inp-df-between').value = truth.dfBetween;
    document.getElementById('inp-df-within').value = truth.dfWithin;
    document.getElementById('inp-df-total').value = truth.dfTotal;
    document.getElementById('inp-msb').value = truth.MSB.toFixed(4);
    document.getElementById('inp-msw').value = truth.MSW.toFixed(4);
    document.getElementById('inp-f').value = truth.Fratio.toFixed(4);
    document.getElementById('inp-eta').value = truth.etaSq.toFixed(4);
    validateAll();
}

// \u2500\u2500\u2500 PASTE-FROM-EXCEL FILL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Order: [G1mean G2mean ... grandMean  SSW SSB SST  dfB dfW dfT  MSB MSW F eta]
function parsePasteInput(raw) {
    const { truth, scenario: sc } = state;
    if (!truth || !sc) return;

    const parts = raw.trim().split(/[\t,;]+|\s{2,}/).map(s => s.trim().replace(',', '.')).filter(s => s !== '');
    const k = sc.groups.length;
    const needed = k + 11;
    const statusEl = document.getElementById('paste-status');
    if (parts.length < needed) {
        if (statusEl) statusEl.textContent = `\u26a0 Verwacht \u2265 ${needed} waarden (${parts.length} gevonden).`;
        return;
    }

    let idx = 0;
    sc.groups.forEach((_, i) => { const el = document.getElementById(`inp-grp-${i}`); if (el) el.value = parts[idx++]; });
    const grandEl = document.getElementById('inp-grand-mean'); if (grandEl) grandEl.value = parts[idx++];
    ['inp-ssw', 'inp-ssb', 'inp-sst'].forEach(id => { const el = document.getElementById(id); if (el) el.value = parts[idx++]; });
    ['inp-df-between', 'inp-df-within', 'inp-df-total'].forEach(id => { const el = document.getElementById(id); if (el) el.value = parts[idx++]; });
    ['inp-msb', 'inp-msw', 'inp-f', 'inp-eta'].forEach(id => { const el = document.getElementById(id); if (el) el.value = parts[idx++]; });

    if (statusEl) statusEl.textContent = `\u2705 ${idx} waarden ingevuld.`;
    validateAll();
}

// build the paste format hint for the sidebar
function updatePasteFormatHint() {
    const sc = state.scenario;
    const el = document.getElementById('paste-format-hint');
    if (!el || !sc) return;
    const colHeaders = [
        ...sc.groups.map((_, i) => `Y&#x0305;<sub>${i + 1}</sub>`),
        'Y&#x0305;..', 'SSW', 'SSB', 'SST',
        'df<sub>B</sub>', 'df<sub>W</sub>', 'df<sub>T</sub>',
        'MSB', 'MSW', 'F', '\u03B7\xB2'
    ];
    el.innerHTML =
        `<div class="paste-hint">Volgorde kolommen (plak tab-gescheiden uit Excel):</div>` +
        `<table class="paste-cols-table">` +
        `<thead><tr>${colHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>` +
        `<tbody><tr>${colHeaders.map(() => `<td>\u2014</td>`).join('')}</tr></tbody>` +
        `</table>`;
}

// \u2500\u2500\u2500 NAVIGATION SCROLL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function setupNav() {
    document.getElementById('section-nav').addEventListener('click', e => {
        const item = e.target.closest('.nav-item');
        if (!item || item.classList.contains('locked')) return;
        const target = item.dataset.target;
        const sec = document.getElementById(target);
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
    });
}

// \u2500\u2500\u2500 ATTACH STATIC INPUT LISTENERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function attachGlobalListeners() {
    const validateDebounced = debounce(validateAll, 250);

    // One document-level listener covers all .num-input and .tbl-input fields:
    // static fields, dynamically rendered group means, and deviation table cells.
    document.addEventListener('input', e => {
        if (e.target.matches('.num-input') || e.target.matches('.tbl-input')) {
            validateDebounced();
        }
    });

    document.getElementById('btn-generate').addEventListener('click', doGenerate);
    document.getElementById('btn-random').addEventListener('click', () => {
        const sel = document.getElementById('sel-scenario');
        const idx = Math.floor(Math.random() * SCENARIOS.length);
        sel.value = SCENARIOS[idx].id;
        document.getElementById('inp-seed').value = Math.floor(Math.random() * 9000) + 1000;
        doGenerate();
    });
    // Sidebar mobile toggle
    const sidebarEl = document.querySelector('.sidebar');
    const overlayEl = document.getElementById('sidebar-overlay');
    function closeSidebar() {
        if (sidebarEl) sidebarEl.classList.remove('open');
        if (overlayEl) overlayEl.classList.remove('visible');
    }
    const btnToggle = document.getElementById('btn-sidebar-toggle');
    const btnClose = document.getElementById('btn-sidebar-close');
    if (btnToggle) btnToggle.addEventListener('click', () => {
        if (sidebarEl) sidebarEl.classList.add('open');
        if (overlayEl) overlayEl.classList.add('visible');
    });
    if (btnClose) btnClose.addEventListener('click', closeSidebar);
    if (overlayEl) overlayEl.addEventListener('click', closeSidebar);
}

// \u2500\u2500\u2500 INIT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function init() {
    populateScenarioDropdown();
    setupNav();
    attachGlobalListeners();
    doGenerate();
}

document.addEventListener('DOMContentLoaded', init);
