/* =============================================================
   ANOVA App – app.js
   Static, fully client-side reactive ANOVA teaching app
   Dutch language, criminological scenarios
   ============================================================= */

'use strict';

// ─── SCENARIOS ────────────────────────────────────────────────
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
        vignette: 'Bewoners van drie typen wijken (lage, gemiddelde en hoge wanorde) worden vergeleken op angstscores. Uitkomst: angstschaal (0–100).',
        groups: ['LaagWanorde', 'GemiddeldWanorde', 'HoogWanorde'],
        yName: 'AngstScore', yUnit: '0–100', entity: 'Bewoner',
        means: [38, 55, 70], sdWithin: 10, subtleScale: 0.25
    },
    {
        id: 'police_trust',
        title: 'Politieaanpak & vertrouwen (3 condities)',
        vignette: 'Drie politiecondities worden vergeleken op vertrouwen van burgers: geen interventie, standaard contact, en procedurale rechtvaardigheidsaanpak. Uitkomst: vertrouwensscore (1–7).',
        groups: ['GeenInterventie', 'StandaardContact', 'ProcedureleAanpak'],
        yName: 'VertrouwenInPolitie', yUnit: '1–7', entity: 'District',
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
        vignette: 'Drie typen begeleiding worden vergeleken op recidiverisico na vrijlating: minimaal, standaard en intensief. Uitkomst: recidiverisicoScore (0–100).',
        groups: ['MinimaleBegeleiding', 'StandaardBegeleiding', 'IntensieveBegeleiding'],
        yName: 'RecidiveRisico', yUnit: '0–100', entity: 'Deelnemer',
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
        vignette: 'Ervaren mannen en vrouwen een verschillende mate van angst voor criminaliteit in de openbare ruimte? Twee groepen worden vergeleken op angstscore (0–100). Bij k = 2 is ANOVA equivalent aan de onafhankelijke t-toets.',
        groups: ['Man', 'Vrouw'],
        yName: 'AngstScore', yUnit: '0–100', entity: 'Respondent',
        means: [42, 63], sdWithin: 12, subtleScale: 0.30
    },
    {
        id: 'nationality_victimisation',
        title: 'Nationaliteit & slachtofferschap (k = 2)',
        vignette: 'Worden personen met Belgische en niet-Belgische nationaliteit even vaak slachtoffer van vermogenscriminaliteit? Twee groepen worden vergeleken op slachtofferschapindex (0–100). Bij k = 2 geldt: F = t².',
        groups: ['Belgisch', 'NietBelgisch'],
        yName: 'SlachtofferschapIndex', yUnit: '0–100', entity: 'Respondent',
        means: [38, 52], sdWithin: 10, subtleScale: 0.30
    },
    {
        id: 'education_police_trust',
        title: 'Opleidingsniveau & vertrouwen in politie (k = 3)',
        vignette: 'Verschilt het vertrouwen in de politie naargelang het opleidingsniveau van de respondent? Drie onderwijsgroepen worden vergeleken op vertrouwensscore (1–7).',
        groups: ['LaagOnderwijs', 'GemiddeldOnderwijs', 'HoogOnderwijs'],
        yName: 'VertrouwenPolitie', yUnit: '1–7', entity: 'Respondent',
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

// ─── SEEDED PRNG (Mulberry32) ─────────────────────────────────
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

// ─── CLAMP ────────────────────────────────────────────────────
function clampVal(v, unit) {
    if (/1-7|1–7/.test(unit)) return Math.max(1, Math.min(7, v));
    if (/0-100|0–100|%|score|Score|Risico|Ratio|Cijfer/i.test(unit)) return Math.max(0, Math.min(100, v));
    return Math.max(0, v);
}

// ─── STATE ────────────────────────────────────────────────────
const state = {
    scenario: null,
    data: [],      // [{entity, group, y}]
    truth: null,
    allCorrect: false,
    chartBoxplot: null,
    chartSS: null,
    chartCI: null
};

// ─── DEBOUNCE ────────────────────────────────────────────────
function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

// ─── ROUND helper ─────────────────────────────────────────────
const r4 = v => Math.round(v * 10000) / 10000;
const r2 = v => Math.round(v * 100) / 100;

// ─── GENERATE DATA ────────────────────────────────────────────
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

// ─── CALCULATE TRUTH ─────────────────────────────────────────
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
    const SSB = r4(devBetweenSq.reduce((a, b) => a + b));
    const SST = r4(SSW + SSB);

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
        SSW, SSB, SST,
        dfBetween, dfWithin, dfTotal,
        MSB, MSW, Fratio, etaSq,
        tCrit, ciMargin, ciLower, ciUpper,
        pValue: pValueFromF(Fratio, dfBetween, dfWithin)
    };
}

// ─── t-critical approximation (simple lookup or Abramowitz) ──
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

// ─── p-value from F (incomplete beta approx) ─────────────────
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

// ─── RENDER SCENARIO DROPDOWN ────────────────────────────────
function populateScenarioDropdown() {
    const sel = document.getElementById('sel-scenario');
    SCENARIOS.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.title;
        sel.appendChild(opt);
    });
}

// ─── RENDER DATASET TABLE ─────────────────────────────────────
function renderDataset() {
    const wrap = document.getElementById('dataset-table-wrap');
    const info = document.getElementById('dataset-info');
    const { data, scenario: sc } = state;
    if (!data.length) { wrap.innerHTML = ''; return; }

    info.textContent = `N = ${data.length} waarnemingen (${sc.groups.length} groepen × ${data.length / sc.groups.length} per groep). Afhankelijke variabele: ${sc.yName} (${sc.yUnit}).`;

    let html = `<table class="dataset-table"><thead><tr><th>Eenheid</th><th>Groep</th><th>${sc.yName} (${sc.yUnit})</th></tr></thead><tbody>`;
    data.forEach(row => {
        html += `<tr><td>${row.entity}</td><td class="group-col">${row.group}</td><td>${row.y.toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
}

// ─── RENDER GROUP MEANS INPUTS ────────────────────────────────
function renderGroupMeansInputs() {
    const container = document.getElementById('group-means-inputs');
    const sc = state.scenario;
    if (!sc) { container.innerHTML = ''; return; }
    let html = '';
    sc.groups.forEach((g, i) => {
        html += `
      <div class="field-row">
        <label>Groepsgemiddelde ${g} (Ȳ<sub>${i + 1}</sub>)</label>
        <input type="number" step="any" id="inp-grp-${i}" class="num-input" placeholder="0.0000" />
        <span class="light" id="light-grp-${i}"></span>
        <span class="field-msg" id="msg-grp-${i}"></span>
      </div>`;
    });
    container.innerHTML = html;
    // attach debounced listeners
    sc.groups.forEach((_, i) => {
        document.getElementById(`inp-grp-${i}`).addEventListener('input', debounce(validateAll, 250));
    });
}

// ─── RENDER DEVIATION TABLE ──────────────────────────────────
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
      <th>(Y−Yj)</th><th>(Y−Yj)²</th><th>(Yj−Ȳ..)</th><th>(Yj−Ȳ..)²</th>
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
            : `<span class="readonly-cell muted" id="tbl-dB-${i}-disp">—</span>`;
        const dB2Input = isBetweenFirst
            ? `<input type="number" step="any" id="tbl-dB2-${i}" class="tbl-input" placeholder="?" data-row="${i}" data-col="dB2" />`
            : `<span class="readonly-cell muted" id="tbl-dB2-${i}-disp">—</span>`;

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

    // attach event delegation on tbody
    table.querySelector('tbody').addEventListener('input', debounce(onTableInput, 250));
}

function onTableInput() {
    validateAll();
}

// ─── READ ANSWERS ─────────────────────────────────────────────
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

// ─── VALIDATE FIELD ──────────────────────────────────────────
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

// ─── VALIDATE ALL ─────────────────────────────────────────────
function validateAll() {
    const { truth, scenario: sc, data } = state;
    if (!truth || !sc) return;

    const ans = readAnswers();
    let totalFields = 0, correctFields = 0;

    // helper to check one field
    function chk(inputId, lightId, expected, ansValue) {
        totalFields++;
        const inp = document.getElementById(inputId);
        const light = lightId ? document.getElementById(lightId) : null;
        const res = validateField(inp, light, expected, ansValue);
        if (res.state === 'correct') correctFields++;
        return res.state;
    }

    // Deel II: group means
    sc.groups.forEach((g, i) => {
        chk(`inp-grp-${i}`, `light-grp-${i}`, truth.grpMeans[g], ans[`grp_${i}`]);
    });
    chk('inp-grand-mean', 'light-grand-mean', truth.grandMean, ans.grandMean);

    // Deel III: table
    let tableCorrect = 0, tableFilled = 0;
    const groupFirstRow = {};
    let lastGroup = null;
    data.forEach((d, i) => {
        if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; }
    });

    data.forEach((_, i) => {
        const row = ans.tableRows[i];

        // dW
        totalFields++;
        if (row.dW !== null) {
            if (row.dW !== '') tableFilled++;
            const res = validateField(
                document.getElementById(`tbl-dW-${i}`), null, truth.devWithin[i], row.dW
            );
            if (res.state === 'correct') { correctFields++; tableCorrect++; }
        }

        // dW2
        totalFields++;
        if (row.dW2 !== null) {
            if (row.dW2 !== '') tableFilled++;
            const res = validateField(
                document.getElementById(`tbl-dW2-${i}`), null, truth.devWithinSq[i], row.dW2
            );
            if (res.state === 'correct') { correctFields++; tableCorrect++; }
        }

        // dB (first row of group only)
        const d = data[i];
        const isFirst = groupFirstRow[d.group] === i;
        if (isFirst) {
            totalFields++;
            if (row.dB !== null && row.dB !== '') tableFilled++;
            const res = validateField(
                document.getElementById(`tbl-dB-${i}`), null, truth.devBetween[i], row.dB || ''
            );
            if (res.state === 'correct') { correctFields++; tableCorrect++; }

            totalFields++;
            if (row.dB2 !== null && row.dB2 !== '') tableFilled++;
            const res2 = validateField(
                document.getElementById(`tbl-dB2-${i}`), null, truth.devBetweenSq[i], row.dB2 || ''
            );
            if (res2.state === 'correct') { correctFields++; tableCorrect++; }
        }
    });

    // Deel IV: SS
    chk('inp-ssw', 'light-ssw', truth.SSW, ans.ssw);
    chk('inp-ssb', 'light-ssb', truth.SSB, ans.ssb);
    chk('inp-sst', 'light-sst', truth.SST, ans.sst);

    // SS decomp display
    updateSSDecompDisplay();

    // Deel V: ANOVA table
    chk('inp-df-between', 'light-df-between', truth.dfBetween, ans['df-between']);
    chk('inp-df-within', 'light-df-within', truth.dfWithin, ans['df-within']);
    chk('inp-df-total', 'light-df-total', truth.dfTotal, ans['df-total']);
    chk('inp-msb', 'light-msb', truth.MSB, ans.msb);
    chk('inp-msw', 'light-msw', truth.MSW, ans.msw);
    chk('inp-f', 'light-f', truth.Fratio, ans.f);
    chk('inp-eta', 'light-eta', truth.etaSq, ans.eta);

    updateProgress(correctFields, totalFields);

    // update ANOVA table SS display
    updateANOVATableDisplay();

    // significance note
    updateSigNote();

    // check all correct
    const allCorrect = correctFields === totalFields && totalFields > 0;
    state.allCorrect = allCorrect;

    if (allCorrect) {
        unlockVisualSections();
    } else {
        lockVisualSections();
    }

    // success message
    const successEl = document.getElementById('success-msg');
    if (allCorrect) {
        successEl.textContent = '✅ Alle antwoorden zijn correct! Visualisaties zijn nu beschikbaar.';
        successEl.classList.add('visible');
    } else {
        successEl.textContent = '';
        successEl.classList.remove('visible');
    }
}

// ─── SS DECOMP DISPLAY ───────────────────────────────────────
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

// ─── ANOVA TABLE SS DISPLAY ──────────────────────────────────
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
        else setWithin.textContent = '—';
        if (ssbEl && ssbEl.classList.contains('correct')) setBetween.textContent = truth.SSB.toFixed(4);
        else setBetween.textContent = '—';
        if (sstEl && sstEl.classList.contains('correct')) setTotal.textContent = truth.SST.toFixed(4);
        else setTotal.textContent = '—';
    }
}

// ─── SIGNIFICANCE NOTE ───────────────────────────────────────
function updateSigNote() {
    const { truth } = state;
    const el = document.getElementById('sig-note');
    if (!truth || !isFinite(truth.Fratio)) { el.classList.remove('visible'); return; }
    const fEl = document.getElementById('inp-f');
    if (!fEl || !fEl.classList.contains('correct')) { el.classList.remove('visible'); return; }
    const p = truth.pValue;
    const sig = isFinite(p) && p < 0.05;
    const pStr = isFinite(p) ? (p < 0.001 ? '< .001' : p.toFixed(3)) : 'N.v.t.';
    el.textContent = `F(${truth.dfBetween}, ${truth.dfWithin}) = ${truth.Fratio.toFixed(4)}, p = ${pStr}. ${sig ? '✅ Er is een statistisch significant groepseffect (p < .05).' : '⚠️ Het groepseffect is niet statistisch significant (p ≥ .05).'}`;
    el.classList.add('visible');
}

// ─── PROGRESS ────────────────────────────────────────────────
function updateProgress(correct, total) {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    bar.style.width = pct + '%';
    text.textContent = `${correct} / ${total} correct`;
}

// ─── LOCK / UNLOCK VIZ SECTIONS ──────────────────────────────
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

// ─── RENDER PLOTS ─────────────────────────────────────────────
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

function renderBoxplotChart() {
    const { truth, scenario: sc, data } = state;
    const ctx = document.getElementById('chart-boxplot').getContext('2d');

    if (state.chartBoxplot) { state.chartBoxplot.destroy(); state.chartBoxplot = null; }

    const datasets = sc.groups.map((g, gi) => {
        const points = data
            .filter(d => d.group === g)
            .map((d, j) => ({ x: gi + 1 + (Math.random() - 0.5) * 0.2, y: d.y }));
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
            : `Er is <em>geen</em> statistisch significant effect van groep op ${sc.yName} (p ≥ .05).`
        }<br>
    η² = ${truth.etaSq.toFixed(4)} (${etaPct}% verklaarde variantie — ${effectSize} effect).<br>
    De hoogste gemiddelde score is gevonden in ${highGrp} (M = ${truth.grpMeans[highGrp].toFixed(4)}),
    de laagste in ${lowGrp} (M = ${truth.grpMeans[lowGrp].toFixed(4)}).
  `;
}

// ─── RENDER CI TABLE & CHART ──────────────────────────────────
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
      <td>± ${truth.ciMargin[g].toFixed(4)}</td>
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
                label: `Groepsgemiddelde ± 95% BI (${sc.yUnit})`,
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

// ─── GENERATE + RESET ─────────────────────────────────────────
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
    // clear all answer inputs
    document.querySelectorAll('.num-input, .tbl-input').forEach(el => {
        el.value = '';
        el.classList.remove('correct', 'incorrect');
    });
    document.querySelectorAll('.light').forEach(el => el.classList.remove('green', 'red'));
    document.querySelectorAll('.field-msg').forEach(el => el.textContent = '');
    document.getElementById('ss-decomp-disp').textContent = 'SST = SSW + SSB';
    document.getElementById('sig-note').classList.remove('visible');
    document.getElementById('success-msg').classList.remove('visible');
    document.getElementById('anova-table-feedback').textContent = '';
    document.getElementById('table-feedback').textContent = '';
    ['disp-ssb', 'disp-ssw', 'disp-sst'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}

// ─── NAVIGATION SCROLL ───────────────────────────────────────
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

// ─── ATTACH STATIC INPUT LISTENERS ───────────────────────────
function attachGlobalListeners() {
    const validateDebounced = debounce(validateAll, 250);

    ['inp-grand-mean', 'inp-ssw', 'inp-ssb', 'inp-sst',
        'inp-df-between', 'inp-df-within', 'inp-df-total',
        'inp-msb', 'inp-msw', 'inp-f', 'inp-eta']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', validateDebounced);
        });

    document.getElementById('btn-generate').addEventListener('click', doGenerate);
    document.getElementById('btn-random').addEventListener('click', () => {
        const sel = document.getElementById('sel-scenario');
        const idx = Math.floor(Math.random() * SCENARIOS.length);
        sel.value = SCENARIOS[idx].id;
        document.getElementById('inp-seed').value = Math.floor(Math.random() * 9000) + 1000;
        doGenerate();
    });
}

// ─── INIT ─────────────────────────────────────────────────────
function init() {
    populateScenarioDropdown();
    setupNav();
    attachGlobalListeners();
    // generate default on load
    doGenerate();
}

document.addEventListener('DOMContentLoaded', init);
