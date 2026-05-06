/**
 * stats-utils.js — shared statistical math utilities
 *
 * Exports: mulberry32, randNormal, pValueFromF,
 *          incompleteBeta, logBeta, logGamma, betaCF
 *
 * Load as an ES6 module:
 *   import { mulberry32, randNormal, pValueFromF } from '../../shared/js/stats-utils.js';
 */

// ─── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Normal random variate (Box-Muller) ───────────────────────────────────
function randNormal(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── p-value from F statistic (regularised incomplete beta) ───────────────
function pValueFromF(F, d1, d2) {
    if (!Number.isFinite(F) || F < 0 || d1 <= 0 || d2 <= 0) return NaN;
    const x = d2 / (d2 + d1 * F);
    return incompleteBeta(x, d2 / 2, d1 / 2);
}

// ─── Regularised incomplete beta I_x(a,b) ─────────────────────────────────
function incompleteBeta(x, a, b) {
    if (x < 0 || x > 1) return NaN;
    if (x === 0) return 0;
    if (x === 1) return 1;
    const lb = logBeta(a, b);
    const bt = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lb);
    // Use symmetry for numerical stability
    if (x < (a + 1) / (a + b + 2)) {
        return bt * betaCF(x, a, b) / a;
    }
    return 1 - (bt * betaCF(1 - x, b, a) / b);
}

// ─── Log beta function ─────────────────────────────────────────────────────
function logBeta(a, b) {
    return logGamma(a) + logGamma(b) - logGamma(a + b);
}

// ─── Log gamma (Lanczos approximation, g=7) ────────────────────────────────
function logGamma(z) {
    const g = 7;
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// ─── Continued fraction for incomplete beta (Lentz's method) ──────────────
function betaCF(x, a, b) {
    const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}
