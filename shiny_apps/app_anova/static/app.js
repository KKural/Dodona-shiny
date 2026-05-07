(function () {
    /* =============================================================
       ANOVA App \u2013 app.js
       Static, fully client-side reactive ANOVA teaching app
       Dutch language, criminological scenarios
       ============================================================= */

    // mulberry32, randNormal, pValueFromF etc. loaded globally from ../../shared/js/stats-utils.js

    // \u2500\u2500\u2500 SCENARIOS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const SCENARIOS = [
        {
            id: 'crime_program',
            title: 'Implementatie van het criminaliteitspreventie-programma (3 niveaus)',
            vignette: 'Een stad wil weten of haar criminaliteitspreventiebeleid effectief is. Twaalf vergelijkbare buurten worden willekeurig toegewezen aan drie interventieniveaus: (1) geen programma (controlegroep), (2) basispreventie (informatiepanelen en buurtwerk) of (3) intensief programma (dagelijkse surveillance en gerichte coaching). De afhankelijke variabele is het inbraakcijfer per 1.000 inwoners. Onderzoeksvraag: verschilt het gemiddeld inbraakcijfer significant tussen de drie groepen? Toets via eenweg-ANOVA (α = 0,05).',
            groups: ['GeenProgramma', 'BasisProgramma', 'IntensiefProgramma'],
            yName: 'InbraakCijfer', yUnit: 'per 1.000', entity: 'Buurt',
            means: [28, 22, 16], sdWithin: 5, subtleScale: 0.25
        },
        {
            id: 'hotspots_policing',
            title: 'Politiestrategie\u00EBn & meldingen (3 typen)',
            vignette: 'Een politiezone test drie strategie\u00EBn in vergelijkbare stedelijke straten. Standaard patrouille verloopt op vaste tijdstippen; de hot-spot aanpak concentreert politie op meldingenrijke locaties; de gemeenschapsgerichte strategie zet in op dialoog en wijkteams. De afhankelijke variabele is het aantal meldingen aan de politie per straat per week. Onderzoeksvraag: zijn er significante gemiddelde verschillen in meldingsfrequentie naargelang de gekozen politiestrategie?',
            groups: ['StandaardPatrouille', 'HotSpotAanpak', 'GemeenschapsStrategie'],
            yName: 'MeldingenAanPolitie', yUnit: 'per week', entity: 'Straat',
            means: [65, 48, 38], sdWithin: 10, subtleScale: 0.25
        },
        {
            id: 'fear_disorder',
            title: 'Wijkniveau & angst voor criminaliteit',
            vignette: 'Bewoners in een stedelijke gemeente worden bevraagd via een slachtofferenqu\u00EAte. Hun wijken zijn op basis van observatiedata ingedeeld in drie categorie\u00EBn van fysieke en sociale wanorde: laag, gemiddeld en hoog. De afhankelijke variabele is de angstschaal (0\u20130100). Onderzoeksvraag: verschilt de gemiddelde angst voor criminaliteit significant naargelang het wanordeniveau van de wijk?',
            groups: ['LaagWanorde', 'GemiddeldWanorde', 'HoogWanorde'],
            yName: 'AngstScore', yUnit: '0\u2013100', entity: 'Bewoner',
            means: [38, 55, 70], sdWithin: 10, subtleScale: 0.25
        },
        {
            id: 'police_trust',
            title: 'Politieaanpak & vertrouwen (3 condities)',
            vignette: 'In een gerandomiseerde studie worden drie politiecondities vergeleken op burgervertrouwen. Geen interventie vormt de controlegroep; standaard contact volgt een basisprotocol; de procedurele rechtvaardigheidsaanpak legt de nadruk op respectvolle communicatie en transparante besluitvorming. De afhankelijke variabele is de vertrouwensscore van burgers (1\u20137). Onderzoeksvraag: heeft de politieaanpak een significant effect op het gemiddeld vertrouwen van burgers?',
            groups: ['GeenInterventie', 'StandaardContact', 'ProcedureleAanpak'],
            yName: 'VertrouwenInPolitie', yUnit: '1\u20137', entity: 'District',
            means: [3.5, 4.5, 5.5], sdWithin: 0.8, subtleScale: 0.25
        },
        {
            id: 'guardianship',
            title: 'Toezichtsniveaus & slachtofferschap',
            vignette: 'De routineactiviteitentheorie stelt dat toezicht (\u2018guardianship\u2019) criminaliteit remt. Drie wijken met respectievelijk laag, gemiddeld en hoog toezicht (gemeten via aanwezige burgers, bewakingscamera\u2019s en buurtpreventie-activiteiten) worden vergeleken op het jaarlijkse aantal slachtofferschapincidenten per huishouden. Onderzoeksvraag: leidt een hoger toezichtsniveau tot significant minder slachtofferschap?',
            groups: ['LaagToezicht', 'GemiddeldToezicht', 'HoogToezicht'],
            yName: 'Slachtofferschap', yUnit: 'aantal', entity: 'Huishouden',
            means: [8, 5, 3], sdWithin: 2, subtleScale: 0.25
        },
        {
            id: 'biosocial',
            title: 'Risicogroepen & agressieve incidenten',
            vignette: 'Op basis van een gecombineerde biosociale risicoscore (famili\u00E4re en biologische risicofactoren) worden leerlingen ingedeeld in drie risicogroepen: laag, gemiddeld en hoog. De afhankelijke variabele is het aantal schoolmeldingen van agressieve incidenten per trimester. Onderzoeksvraag: verschilt het gemiddeld aantal agressieve incidenten significant tussen de drie risicogroepen?',
            groups: ['LaagRisico', 'GemiddeldRisico', 'HoogRisico'],
            yName: 'AgressieveIncidenten', yUnit: 'schoolmeldingen/trimester', entity: 'Student',
            means: [2, 5, 9], sdWithin: 2, subtleScale: 0.20
        },
        {
            id: 'reentry_recidivism',
            title: 'Re-integratieniveaus & recidiverisico',
            vignette: 'Na vrijlating ontvangen gedetineerden willekeurig minimale, standaard of intensieve nazorgbegeleiding. Na zes maanden wordt een gevalideerde recidiverisicoscore (0\u2013100) afgenomen. Onderzoeksvraag: is er een significant verschil in het gemiddeld recidiverisico naargelang de intensiteit van de begeleiding bij re-integratie?',
            groups: ['MinimaleBegeleiding', 'StandaardBegeleiding', 'IntensieveBegeleiding'],
            yName: 'RecidiveRisico', yUnit: '0\u2013100', entity: 'Deelnemer',
            means: [62, 48, 35], sdWithin: 10, subtleScale: 0.25
        },
        {
            id: 'cyber_training',
            title: 'Cybertrainingsniveaus & klikratio',
            vignette: 'Een overheidsorganisatie voert een gesimuleerde phishing-campagne uit bij medewerkers die willekeurig zijn ingedeeld in drie groepen: geen training (controle), basistraining (\u00E9\u00E9n uur) of intensieve training (dagworkshop). De afhankelijke variabele is het klikratio op de nep-phishingmails (%). Onderzoeksvraag: verschilt het gemiddeld klikratio significant naargelang de trainingsintensiteit?',
            groups: ['GeenTraining', 'BasisTraining', 'IntensieveTraining'],
            yName: 'Klikratio', yUnit: '%', entity: 'Medewerker',
            means: [35, 22, 12], sdWithin: 8, subtleScale: 0.20
        },
        {
            id: 'gender_fear',
            title: 'Geslacht & angst voor criminaliteit (k\u00A0=\u00A02)',
            vignette: 'Mannelijke en vrouwelijke respondenten uit een representatieve steekproef worden vergeleken op angst voor criminaliteit in de openbare ruimte, gemeten via een gevalideerde schaal (0\u2013100). Bij k\u00A0=\u00A02 is eenweg-ANOVA equivalent aan de onafhankelijke-steekproeven t-toets (F\u00A0=\u00A0t\u00B2). Onderzoeksvraag: ervaren vrouwen gemiddeld een significant hogere angst voor criminaliteit dan mannen?',
            groups: ['Man', 'Vrouw'],
            yName: 'AngstScore', yUnit: '0\u2013100', entity: 'Respondent',
            means: [42, 63], sdWithin: 12, subtleScale: 0.30
        },
        {
            id: 'nationality_victimisation',
            title: 'Nationaliteit & slachtofferschap (k\u00A0=\u00A02)',
            vignette: 'Respondenten met Belgische en niet-Belgische nationaliteit worden via een survey vergeleken op een slachtofferschapindex (0\u2013100). Bij k\u00A0=\u00A02 geldt: F\u00A0=\u00A0t\u00B2. Onderzoeksvraag: is er een significant verschil in gemiddeld slachtofferschaprisico op basis van nationaliteit?',
            groups: ['Belgisch', 'NietBelgisch'],
            yName: 'SlachtofferschapIndex', yUnit: '0\u2013100', entity: 'Respondent',
            means: [38, 52], sdWithin: 10, subtleScale: 0.30
        },
        {
            id: 'education_police_trust',
            title: 'Opleidingsniveau & vertrouwen in politie (k\u00A0=\u00A03)',
            vignette: 'Drie groepen respondenten met respectievelijk laag, gemiddeld en hoog opleidingsniveau worden vergeleken op vertrouwen in de politie (1\u20137). Sociaaleconomische positie en opleiding zijn in de criminologische literatuur gelinkt aan attitudes tegenover gezagsdragers. Onderzoeksvraag: hangt het gemiddeld politievertrouwen significant samen met het opleidingsniveau van de respondent?',
            groups: ['LaagOnderwijs', 'GemiddeldOnderwijs', 'HoogOnderwijs'],
            yName: 'VertrouwenPolitie', yUnit: '1\u20137', entity: 'Respondent',
            means: [3.8, 4.5, 5.2], sdWithin: 0.9, subtleScale: 0.30
        },
        {
            id: 'age_group_victimisation',
            title: 'Leeftijdsgroep & slachtofferschap (k\u00A0=\u00A03)',
            vignette: 'Jongeren (18\u201325), volwassenen (26\u201355) en ouderen (56+) worden via een nationale slachtofferenqu\u00EAte vergeleken op slachtofferschaprate (per 1.000 inwoners). Routineactiviteitentheorie voorspelt dat leeftijdsgebonden leefstijlverschillen de blootstelling aan criminaliteit be\u00EFnvloeden. Onderzoeksvraag: verschilt de slachtofferschaprate significant tussen de drie leeftijdsgroepen?',
            groups: ['Jongeren', 'Volwassenen', 'Ouderen'],
            yName: 'Slachtofferschaprate', yUnit: 'per 1.000', entity: 'Respondent',
            means: [62, 45, 30], sdWithin: 12, subtleScale: 0.25
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
            if (Array.isArray(sc?.groups)) sc.groups = sc.groups.map((g) => humanizeLabel(g));
            if (sc?.yName) sc.yName = humanizeLabel(sc.yName);
            if (sc?.entity) sc.entity = humanizeLabel(sc.entity);
        });
    }

    normalizeScenarioLabels();

    // mulberry32, randNormal — loaded globally from ../../shared/js/stats-utils.js


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
        hot: null,
        hotCellClasses: {},
        hot2: null,
        hot2CellClasses: {},
        hot4: null,
        hot4CellClasses: {},
        hot5: null,
        hot5CellClasses: {},
        chartBoxplot: null,
        chartSS: null,
        chartCI: null
    };

    // Feedback message store (mirrors R app feedback_store)
    const feedbackStore = {};

    function humanizeGroup(g) {
        return String(g)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .trim();
    }

    function safeSeed(seedRaw) {
        const s = Number(seedRaw);
        if (!Number.isFinite(s) || s <= 0) return null;
        return Math.floor(Math.abs(s)) % 2147483647;
    }

    function nextRandomSeed() {
        return Math.floor(Math.random() * 1000000000) + 1;
    }

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
        const devTotal = data.map(d => r4(d.y - grandMean));
        const devTotalSq = devTotal.map(v => r4(v * v));

        const SSW = r4(devWithinSq.reduce((a, b) => a + b));
        // SSB = \u03a3 nj(Yj \u2212 Y..)\u00b2 \u2014 explicit group-level formula
        let SSB = 0;
        groups.forEach(g => {
            const d = r4(grpMeans[g] - grandMean);
            SSB += nGroups[g] * r4(d * d);
        });
        SSB = r4(SSB);
        // SST = SSW + SSB — use rounded sum so student answer is always consistent with the decomposition
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

    // \u2500\u2500\u2500 t-critical (exact via F-distribution identity: t^2 ~ F(1,df)) \u2500\u2500
    function tCritical(p, df) {
        // t_{p}(df) = sqrt(F_{2(1-p)}(1, df)). E.g. p=0.975 -> alpha=0.05 F(1,df).
        if (df <= 0) return NaN;
        const alpha = 2 * (1 - p);
        return Math.sqrt(fCriticalVal(1, df, alpha));
    }

    // pValueFromF, incompleteBeta, logBeta, logGamma, betaCF — imported from ../../shared/js/stats-utils.js


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
            const nj = t.nGroups ? t.nGroups[g] : t.grpCounts[g];
            const grpSum = t.grpMeans[g] * nj;
            if (Math.abs(v - t.grandMean) <= tol(t.grandMean))
                return `<b>Waarom fout:</b> U vulde het grootgemiddelde in als groepsgemiddelde van '${g}'.<br><b>Correctie:</b> Gebruik alleen de Y-waarden binnen groep '${g}'.`;
            if (nj > 1 && Math.abs(v - grpSum) <= Math.max(0.5, tol(grpSum)))
                return `<b>Waarom fout:</b> U vulde de groepssom in zonder te delen door n.<br><b>Correctie:</b> Y&#x0305;<sub>${g}</sub> = \u03a3Y / n<sub>${g}</sub> \u2014 deel de som door n<sub>${g}</sub> = ${nj}.`;
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
        const msgRow = el.closest('tr.msg-row');
        if (!html) {
            el.innerHTML = ''; el.className = 'field-diag';
            if (msgRow) msgRow.classList.remove('active');
            return;
        }
        el.innerHTML = html;
        el.className = 'field-diag visible';
        if (msgRow) msgRow.classList.add('active');
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
        const container = document.getElementById('hot-container');
        const sc = state.scenario;
        const { data } = state;

        if (state.hot) { state.hot.destroy(); state.hot = null; }
        state.hotCellClasses = {};
        container.innerHTML = '';

        if (!sc || !data.length) return;

        // Build flat data: [entity, group, y, dW, dW2, dB, dB2]
        const tableData = data.map(row => [row.entity, humanizeGroup(row.group), row.y, null, null, null, null]);

        // Merge (Yj-Y..) and (Yj-Y..)^2 columns per group block
        const mergeCells = [];
        let rowIdx = 0;
        sc.groups.forEach(g => {
            const n = data.filter(d => d.group === g).length;
            mergeCells.push({ row: rowIdx, col: 5, rowspan: n, colspan: 1 });
            mergeCells.push({ row: rowIdx, col: 6, rowspan: n, colspan: 1 });
            rowIdx += n;
        });

        // Dynamic column widths based on scenario content
        const totalN = state.data.length;
        const entityLongest = [sc.entity + ' ' + totalN, 'Eenheid'].reduce((a, b) => a.length >= b.length ? a : b);
        const groupLongest = ['Groep', ...sc.groups].reduce((a, b) => a.length >= b.length ? a : b);
        const w0 = Math.max(70, Math.ceil(entityLongest.length * 7) + 16);
        const w1 = Math.max(90, Math.ceil(groupLongest.length * 7) + 16);
        const w2 = Math.max(65, Math.ceil(sc.yName.length * 7) + 16);
        const wF = 88;
        const hot3W = w0 + w1 + w2 + wF * 4;

        const hotValidate = debounce(validateAll, 250);

        state.hot = new Handsontable(container, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            colHeaders: [
                'Eenheid', 'Groep', sc.yName,
                '(Y&minus;&#x0232;<sub>j</sub>)',
                '(Y&minus;&#x0232;<sub>j</sub>)&sup2;',
                '(&#x0232;<sub>j</sub>&minus;&#x0232;..)',
                '(&#x0232;<sub>j</sub>&minus;&#x0232;..)&sup2;'
            ],
            columns: [
                { type: 'text', readOnly: true },
                { type: 'text', readOnly: true },
                { type: 'numeric', numericFormat: { pattern: '0.00' }, readOnly: true },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } }
            ],
            mergeCells: mergeCells,
            colWidths: [w0, w1, w2, wF, wF, wF, wF],
            rowHeaders: false, allowInsertRow: false, allowInsertColumn: false,
            width: hot3W,
            height: 'auto',
            stretchH: 'none',
            cells(row, col) {
                const key = `${row}-${col}`;
                const cls = state.hotCellClasses[key];
                const classes = [col < 2 ? 'htLeft' : 'htCenter'];
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

    // ─── RENDER GROUP MEANS TABLE (HOT2 — Deel II) ───────────────────────────────
    function renderGroupMeansTable() {
        const container = document.getElementById('hot2-container');
        if (!container) return;
        const sc = state.scenario;
        if (state.hot2) { state.hot2.destroy(); state.hot2 = null; }
        state.hot2CellClasses = {};
        container.innerHTML = '';
        if (!sc) return;

        const k = sc.groups.length;
        const toSub = n => String(n).split('').map(d => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]).join('');
        const tableData = sc.groups.map((g, i) => [`${humanizeGroup(g)} (\u0232${toSub(i + 1)})`, null]);
        tableData.push(['Grootgemiddelde (\u0232..)', null]);

        const longestLabel2 = tableData.map(r => r[0]).reduce((a, b) => a.length >= b.length ? a : b, 'Groep');
        const hot2ColW = Math.max(150, Math.ceil(longestLabel2.length * 7) + 16);
        const hot2W = hot2ColW + 150;

        const hotValidate = debounce(validateAll, 250);

        state.hot2 = new Handsontable(container, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            colHeaders: ['Groep', 'Jouw antwoord'],
            columns: [
                { type: 'text', readOnly: true },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } }
            ],
            colWidths: [hot2ColW, 150],
            rowHeaders: false, allowInsertRow: false, allowInsertColumn: false,
            width: hot2W,
            height: 'auto',
            stretchH: 'none',
            cells(row, col) {
                const key = `${row}-${col}`;
                const cls = state.hot2CellClasses[key];
                const classes = [col === 0 ? 'htLeft' : 'htCenter'];
                if (row === k) classes.push('hot-grand-mean-cell');
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

    // ─── RENDER SS TABLE (HOT4 — Deel IV) ────────────────────────────────────────
    function renderSSTable() {
        const container = document.getElementById('hot4-container');
        if (!container) return;
        if (state.hot4) { state.hot4.destroy(); state.hot4 = null; }
        state.hot4CellClasses = {};
        container.innerHTML = '';

        const tableData = [
            ['Binnen groepen (SSW)', null],
            ['Tussen groepen (SSB)', null],
            ['Totaal (SST)', null]
        ];

        const hotValidate = debounce(validateAll, 250);

        state.hot4 = new Handsontable(container, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            colHeaders: ['Bron van variatie', 'Jouw antwoord (SS)'],
            columns: [
                { type: 'text', readOnly: true },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } }
            ],
            colWidths: [220, 140],
            rowHeaders: false, allowInsertRow: false, allowInsertColumn: false,
            width: 375,
            height: 'auto',
            stretchH: 'none',
            cells(row, col) {
                const key = `${row}-${col}`;
                const cls = state.hot4CellClasses[key];
                const classes = [col === 0 ? 'htLeft' : 'htCenter'];
                if (cls === 'correct') classes.push('htCorrect');
                else if (cls === 'incorrect') classes.push('htIncorrect');
                return { className: classes.join(' ') };
            },
            afterChange(changes, source) {
                if (source === 'loadData') return;
                hotValidate();
                hotValidate(changes);
            }
        });
    }

    // ─── RENDER ANOVA TABLE (HOT5 — Deel V) ──────────────────────────────────────
    function renderANOVAHotTable() {
        const container = document.getElementById('hot5-container');
        if (!container) return;
        if (state.hot5) { state.hot5.destroy(); state.hot5 = null; }
        state.hot5CellClasses = {};
        container.innerHTML = '';

        // Dimmed (read-only, non-applicable) cells: (row-col)
        // Row 1 (Binnen): F(1-4) and η²(1-5) not applicable
        // Row 2 (Totaal): MS(2-3), F(2-4), η²(2-5) not applicable
        const DIMMED = new Set(['1-4', '1-5', '2-3', '2-4', '2-5']);

        const tableData = [
            ['Tussen groepen', '—', null, null, null, null],
            ['Binnen groepen', '—', null, null, '—', '—'],
            ['Totaal', '—', null, '—', '—', '—']
        ];

        const hotValidate = debounce(validateAll, 250);

        state.hot5 = new Handsontable(container, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            colHeaders: ['Bron', 'SS', 'df', 'MS', 'F', '\u03b7\u00b2'],
            columns: [
                { type: 'text', readOnly: true },
                { type: 'text', readOnly: true },
                { type: 'numeric', numericFormat: { pattern: '0' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } },
                { type: 'numeric', numericFormat: { pattern: '0.0000' } }
            ],
            colWidths: [160, 105, 58, 110, 110, 82],
            rowHeaders: false, allowInsertRow: false, allowInsertColumn: false,
            width: 630,
            height: 'auto',
            stretchH: 'none',
            cells(row, col) {
                const key = `${row}-${col}`;
                const classes = [col === 0 ? 'htLeft' : 'htCenter'];
                if (DIMMED.has(key)) {
                    classes.push('hot-dimmed-cell');
                    return { readOnly: true, type: 'text', className: classes.join(' ') };
                }
                if (col === 1) {
                    classes.push('hot-ss-cell');
                    return { readOnly: true, className: classes.join(' ') };
                }
                const cls = state.hot5CellClasses[key];
                if (cls === 'correct') classes.push('htCorrect');
                else if (cls === 'incorrect') classes.push('htIncorrect');
                return { className: classes.join(' ') };
            },
            afterChange(changes, source) {
                if (source === 'loadData' || source === 'displayUpdate') return;
                hotValidate();
            }
        });
    }

    // \u2500\u2500\u2500 READ ANSWERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    function readAnswers() {
        const { data } = state;
        const ans = {};

        // table (HOT3) — read from Handsontable
        const hotData = state.hot ? state.hot.getData() : [];
        const groupFirstRowMap = {};
        let lastGrp = null;
        data.forEach((d, i) => { if (d.group !== lastGrp) { groupFirstRowMap[d.group] = i; lastGrp = d.group; } });
        ans.tableRows = data.map((d, i) => {
            const rowData = hotData[i] || [];
            const isFirst = groupFirstRowMap[d.group] === i;
            return {
                dW: rowData[3] != null ? String(rowData[3]) : '',
                dW2: rowData[4] != null ? String(rowData[4]) : '',
                dB: isFirst ? (rowData[5] != null ? String(rowData[5]) : '') : null,
                dB2: isFirst ? (rowData[6] != null ? String(rowData[6]) : '') : null
            };
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
        const correct = Math.abs(num - expected) < 0.0005;
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

        // helper: validate a HOT cell (no DOM element — uses feedbackStore keyed by msgId)
        function chkHot(hotCellClasses, row, col, expected, rawVal, msgId, fieldKey) {
            totalFields++;
            const str = rawVal == null ? '' : String(rawVal).trim();
            if (!str || str === 'null') {
                delete hotCellClasses[`${row}-${col}`];
                feedbackStore[msgId] = null;
                return 'empty';
            }
            const num = parseFloat(str.replace(',', '.'));
            if (isNaN(num)) {
                hotCellClasses[`${row}-${col}`] = 'incorrect';
                feedbackStore[msgId] = 'Geen geldig getal.';
                return 'incorrect';
            }
            if (Math.abs(num - expected) < 0.0005) {
                correctFields++;
                hotCellClasses[`${row}-${col}`] = 'correct';
                feedbackStore[msgId] = null;
                return 'correct';
            }
            hotCellClasses[`${row}-${col}`] = 'incorrect';
            feedbackStore[msgId] = getFeedbackMsg(fieldKey, str, truth);
            return 'incorrect';
        }

        // Deel II: group means (HOT2)
        const hot2Data = state.hot2 ? state.hot2.getData() : [];
        const newHot2Classes = {};
        let d2correct = 0, d2total = 0;
        sc.groups.forEach((g, i) => {
            d2total++;
            const rawVal = hot2Data[i] ? hot2Data[i][1] : null;
            const st = chkHot(newHot2Classes, i, 1, truth.grpMeans[g], rawVal, `msg2-grp-${i}`, `grp_${i}`);
            if (st === 'correct') d2correct++;
        });
        d2total++;
        const grandRaw = hot2Data[sc.groups.length] ? hot2Data[sc.groups.length][1] : null;
        if (chkHot(newHot2Classes, sc.groups.length, 1, truth.grandMean, grandRaw, 'msg2-grand', 'grandMean') === 'correct') d2correct++;
        state.hot2CellClasses = newHot2Classes;
        if (state.hot2) state.hot2.render();
        updateSectionSummary('feedback-deel2', d2correct, d2total, 'Alle gemiddelden correct', 'controleer groepsgemiddelden');
        const d2map = Object.fromEntries(sc.groups.map((g, i) => [`Y̅ ${humanizeGroup(g)}`, `msg2-grp-${i}`]));
        d2map['Grootgemiddelde Y̅..'] = 'msg2-grand';
        renderFeedbackPanel('feedback-detail-deel2', d2map);

        // Deel III: table
        let tableCorrect = 0, tableTotal = 0;
        const groupFirstRow = {};
        let lastGroup = null;
        data.forEach((d, i) => {
            if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; }
        });

        function valState(expected, rawVal) {
            if (rawVal == null || rawVal === '') return 'empty';
            const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(',', '.'));
            if (isNaN(num)) return 'incorrect';
            return Math.abs(num - expected) < 0.0005 ? 'correct' : 'incorrect';
        }

        const newHotClasses = {};
        const hotRowData = state.hot ? state.hot.getData() : [];

        data.forEach((_, i) => {
            const rowData = hotRowData[i] || [];

            // dW (col 3)
            tableTotal++; totalFields++;
            const dWst = valState(truth.devWithin[i], rowData[3]);
            newHotClasses[`${i}-3`] = dWst;
            if (dWst === 'correct') { correctFields++; tableCorrect++; }

            // dW2 (col 4)
            tableTotal++; totalFields++;
            const dW2st = valState(truth.devWithinSq[i], rowData[4]);
            newHotClasses[`${i}-4`] = dW2st;
            if (dW2st === 'correct') { correctFields++; tableCorrect++; }

            // dB / dB2 — first row of each group block only
            const isFirst = groupFirstRow[data[i].group] === i;
            if (isFirst) {
                tableTotal++; totalFields++;
                const dBst = valState(truth.devBetween[i], rowData[5]);
                newHotClasses[`${i}-5`] = dBst;
                if (dBst === 'correct') { correctFields++; tableCorrect++; }

                tableTotal++; totalFields++;
                const dB2st = valState(truth.devBetweenSq[i], rowData[6]);
                newHotClasses[`${i}-6`] = dB2st;
                if (dB2st === 'correct') { correctFields++; tableCorrect++; }
            }
        });
        state.hotCellClasses = newHotClasses;
        if (state.hot) state.hot.render();
        updateSectionSummary('feedback-deel3', tableCorrect, tableTotal,
            'Afwijkingtabel volledig correct', 'controleer de afwijkingskolommen');

        // Deel IV: SS (HOT4 — row 0=SSW, 1=SSB, 2=SST)
        const hot4Data = state.hot4 ? state.hot4.getData() : [];
        const newHot4Classes = {};
        let d4correct = 0;
        if (chkHot(newHot4Classes, 0, 1, truth.SSW, hot4Data[0] ? hot4Data[0][1] : null, 'msg4-ssw', 'ssw') === 'correct') d4correct++;
        if (chkHot(newHot4Classes, 1, 1, truth.SSB, hot4Data[1] ? hot4Data[1][1] : null, 'msg4-ssb', 'ssb') === 'correct') d4correct++;
        if (chkHot(newHot4Classes, 2, 1, truth.SST, hot4Data[2] ? hot4Data[2][1] : null, 'msg4-sst', 'sst') === 'correct') d4correct++;
        state.hot4CellClasses = newHot4Classes;
        if (state.hot4) state.hot4.render();
        updateSectionSummary('feedback-deel4', d4correct, 3, 'Alle kwadratensommen correct', 'controleer SS-waarden');
        renderFeedbackPanel('feedback-detail-deel4', {
            'SSW (binnengroeps)': 'msg4-ssw',
            'SSB (tussengroeps)': 'msg4-ssb',
            'SST (totaal)': 'msg4-sst'
        });

        // Deel V: ANOVA table (HOT5)
        // Cols: 0=Bron, 1=SS(readonly), 2=df, 3=MS, 4=F, 5=η²
        const hot5Data = state.hot5 ? state.hot5.getData() : [];
        const newHot5Classes = {};
        let d5correct = 0;
        const h5 = (r, c) => hot5Data[r] ? hot5Data[r][c] : null;
        if (chkHot(newHot5Classes, 0, 2, truth.dfBetween, h5(0, 2), 'msg5-df-between', 'df-between') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 1, 2, truth.dfWithin, h5(1, 2), 'msg5-df-within', 'df-within') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 2, 2, truth.dfTotal, h5(2, 2), 'msg5-df-total', 'df-total') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 0, 3, truth.MSB, h5(0, 3), 'msg5-msb', 'msb') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 1, 3, truth.MSW, h5(1, 3), 'msg5-msw', 'msw') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 0, 4, truth.Fratio, h5(0, 4), 'msg5-f', 'f') === 'correct') d5correct++;
        if (chkHot(newHot5Classes, 0, 5, truth.etaSq, h5(0, 5), 'msg5-eta', 'eta') === 'correct') d5correct++;
        state.hot5CellClasses = newHot5Classes;
        if (state.hot5) state.hot5.render();
        if (state.hot5) state.hot5.render();
        updateSectionSummary('feedback-deel5', d5correct, 7,
            `ANOVA-tabel correct \u2014 F(${truth.dfBetween},${truth.dfWithin}) = ${truth.Fratio.toFixed(4)}`,
            'controleer vrijheidsgraden en MS-waarden');
        renderFeedbackPanel('feedback-detail-deel5', {
            'df tussen groepen': 'msg5-df-between',
            'df binnen groepen': 'msg5-df-within',
            'df totaal': 'msg5-df-total',
            'MSB': 'msg5-msb',
            'MSW': 'msg5-msw',
            'F-ratio': 'msg5-f',
            '\u03b7\u00b2': 'msg5-eta'
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
        // SS decomp display removed — HOT4 shows individual SS values
        // Keep a no-op so any remaining callers don't crash
    }

    // \u2500\u2500\u2500 ANOVA TABLE SS DISPLAY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    function updateANOVATableDisplay() {
        if (!state.hot5 || !state.truth) return;
        const t = state.truth;
        const sswOk = state.hot4CellClasses['0-1'] === 'correct';
        const ssbOk = state.hot4CellClasses['1-1'] === 'correct';
        const sstOk = state.hot4CellClasses['2-1'] === 'correct';
        state.hot5.setDataAtCell([
            [0, 1, ssbOk ? t.SSB.toFixed(4) : '\u2014'],
            [1, 1, sswOk ? t.SSW.toFixed(4) : '\u2014'],
            [2, 1, sstOk ? t.SST.toFixed(4) : '\u2014']
        ], 'displayUpdate');
    }

    // \u2500\u2500\u2500 SIGNIFICANCE NOTE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    function updateSigNote() {
        const { truth } = state;
        const el = document.getElementById('sig-note');
        if (!truth || !isFinite(truth.Fratio)) { el.classList.remove('visible'); return; }
        // Show sig note only when the F cell in HOT5 is marked correct
        const fCorrect = state.hot5CellClasses['0-4'] === 'correct';
        if (!fCorrect) { el.classList.remove('visible'); return; }
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
            sec.classList.add('hidden');
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
        document.getElementById('deel6').classList.remove('hidden');
        document.getElementById('deel6').querySelector('.lock-notice').classList.add('hidden');
        document.getElementById('deel6').querySelector('.viz-content').classList.remove('hidden');
        document.getElementById('deel7').classList.remove('hidden');
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
                ? `Er is een <b>statistisch significant</b> effect van groep op ${sc.yName} (p < .05): de gemiddelden van de groepen verschillen meer dan op basis van toeval verwacht wordt.`
                : `Er is <em>geen</em> <b>statistisch significant</b> effect van groep op ${sc.yName} (p \u2265 .05): de gevonden verschillen tussen de groepsgemiddelden kunnen op toeval berusten.`
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

        const seedEl = document.getElementById('inp-seed');
        const enteredSeed = safeSeed(seedEl.value);
        const manualSeed = seedEl.dataset.seedManual === '1';
        const forceRandom = seedEl.dataset.nextRandom === '1';
        let seed;
        if (manualSeed && enteredSeed != null && !forceRandom) {
            seed = enteredSeed;
            seedEl.dataset.seedManual = '0';
            seedEl.dataset.nextRandom = '1';
        } else {
            seed = nextRandomSeed();
            seedEl.value = String(seed);
            seedEl.dataset.seedManual = '0';
            seedEl.dataset.nextRandom = '0';
        }

        state.scenario = sc;
        state.data = generateData(sc, n, seed);
        state.truth = calculateTruth(state.data, sc);
        state.allCorrect = false;
        destroyCharts();

        // update taak & vignette section
        const scenarioTextEl = document.getElementById('scenario-text');
        if (scenarioTextEl) {
            const groupsStr = sc.groups.join(' \u2022 ');
            const titleEl = document.getElementById('scenario-title');
            if (titleEl) titleEl.textContent = sc.title;
            scenarioTextEl.textContent = sc.vignette;
            const metaEl = document.getElementById('scenario-meta');
            if (metaEl) metaEl.innerHTML = '';
        }

        // update seed display
        const seedUsedEl = document.getElementById('seed-used');
        const seedDisplay = document.getElementById('seed-display');
        if (seedUsedEl) seedUsedEl.textContent = String(seed);
        if (seedDisplay) seedDisplay.style.display = '';

        renderDataset();
        renderGroupMeansTable();
        renderDeviationTable();
        renderSSTable();
        renderANOVAHotTable();
        resetAllInputs();
        lockVisualSections();
        updateProgress(0, 0);
    }

    function resetAllInputs() {
        document.querySelectorAll('.num-input').forEach(el => {
            el.value = '';
            el.classList.remove('correct', 'incorrect');
        });
        if (state.hot) {
            const emptyData = state.data.map(row => [row.entity, humanizeGroup(row.group), row.y, null, null, null, null]);
            state.hot.loadData(emptyData);
            state.hotCellClasses = {};
            state.hot.render();
        }
        if (state.hot2 && state.scenario) {
            const toSub = n => String(n).split('').map(d => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]).join('');
            const emptyData2 = state.scenario.groups.map((g, i) => [`${humanizeGroup(g)} (\u0232${toSub(i + 1)})`, null]);
            emptyData2.push(['Grootgemiddelde (\u0232..)', null]);
            state.hot2.loadData(emptyData2);
            state.hot2CellClasses = {};
            state.hot2.render();
        }
        if (state.hot4) {
            state.hot4.loadData([
                ['Binnen groepen (SSW)', null],
                ['Tussen groepen (SSB)', null],
                ['Totaal (SST)', null]
            ]);
            state.hot4CellClasses = {};
            state.hot4.render();
        }
        if (state.hot5) {
            state.hot5.loadData([
                ['Tussen groepen', '\u2014', null, null, null, null],
                ['Binnen groepen', '\u2014', null, null, '\u2014', '\u2014'],
                ['Totaal', '\u2014', null, '\u2014', '\u2014', '\u2014']
            ]);
            state.hot5CellClasses = {};
            state.hot5.render();
        }
        document.querySelectorAll('.light').forEach(el => el.classList.remove('green', 'red'));
        document.querySelectorAll('.field-diag').forEach(el => { el.innerHTML = ''; el.className = 'field-diag'; });
        document.querySelectorAll('tr.msg-row').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.section-summary').forEach(el => { el.innerHTML = ''; el.className = 'section-summary'; });
        document.querySelectorAll('.feedback-panel').forEach(el => { el.innerHTML = ''; el.className = 'feedback-panel'; });
        Object.keys(feedbackStore).forEach(k => delete feedbackStore[k]);
        const ssDecomp = document.getElementById('ss-decomp-disp');
        if (ssDecomp) ssDecomp.textContent = 'SST = SSW + SSB';
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

        const groupFirstRow = {};
        let lastGroup = null;
        data.forEach((d, i) => { if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; } });

        if (state.hot) {
            const fillData = state.hot.getData().map(row => [...row]);
            data.forEach((_, i) => {
                fillData[i][3] = truth.devWithin[i];
                fillData[i][4] = truth.devWithinSq[i];
                if (groupFirstRow[data[i].group] === i) {
                    fillData[i][5] = truth.devBetween[i];
                    fillData[i][6] = truth.devBetweenSq[i];
                }
            });
            state.hot.loadData(fillData);
        }

        if (state.hot2) {
            const toSub = n => String(n).split('').map(d => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]).join('');
            const fillData2 = sc.groups.map((g, i) => [`${humanizeGroup(g)} (\u0232${toSub(i + 1)})`, truth.grpMeans[g]]);
            fillData2.push(['Grootgemiddelde (\u0232..)', truth.grandMean]);
            state.hot2.loadData(fillData2);
        }

        if (state.hot4) {
            state.hot4.loadData([
                ['Binnen groepen (SSW)', truth.SSW],
                ['Tussen groepen (SSB)', truth.SSB],
                ['Totaal (SST)', truth.SST]
            ]);
        }

        if (state.hot5) {
            state.hot5.setDataAtCell([
                [0, 2, truth.dfBetween], [0, 3, truth.MSB], [0, 4, truth.Fratio], [0, 5, truth.etaSq],
                [1, 2, truth.dfWithin], [1, 3, truth.MSW],
                [2, 2, truth.dfTotal]
            ], 'autoFill');
        }

        validateAll();
    }

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
            doGenerate();
        });
        const seedEl = document.getElementById('inp-seed');
        if (seedEl) {
            const markManual = () => {
                seedEl.dataset.seedManual = '1';
                seedEl.dataset.nextRandom = '0';
            };
            seedEl.addEventListener('input', markManual);
            seedEl.addEventListener('change', markManual);
        }
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

        // â”€â”€â”€ Sidebar resize drag handle â”€â”€
        const resizeHandle = document.getElementById('sidebar-resize-handle');
        if (resizeHandle && sidebarEl) {
            const layoutEl = sidebarEl.closest('.layout');
            let startX = 0, startWidth = 0;
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
                sidebarEl.style.width = newWidth + 'px';
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

    // \u2500\u2500\u2500 INIT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    function init() {
        populateScenarioDropdown();
        setupNav();
        attachGlobalListeners();
        const seedEl = document.getElementById('inp-seed');
        if (seedEl) {
            seedEl.value = String(nextRandomSeed());
            seedEl.dataset.seedManual = '0';
            seedEl.dataset.nextRandom = '0';
        }
        doGenerate();
    }

    document.addEventListener('DOMContentLoaded', init);

})();
