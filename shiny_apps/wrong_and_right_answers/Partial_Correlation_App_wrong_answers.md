# Partiële Correlatie App — Wrong Answer Mappings
**File:** `20260120_Partial_Correlation_App_NL.R`  
**Topic:** Partiële correlatie — handmatige berekening in 4 stappen  
**Formula:** r_xy.z = (r_xy − r_xz × r_yz) / √((1 − r_xz²)(1 − r_yz²))

This document lists every wrong-answer trap that is explicitly detected and the feedback shown to the student.

---

## STAP 1: Gemiddelden (X̄, Ȳ, Z̄)

### X̄

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣX (som zonder deling) | Summed X but forgot to divide by n | "Waarom fout: U vulde de som ΣX in, maar deelde niet door n. Correctie: X̄ = ΣX / n — deel de som door n." |
| Ȳ | Entered Ȳ instead of X̄ | "Waarom fout: U vulde Ȳ in bij X̄ — controleer welke kolom X is." |
| Z̄ | Entered Z̄ instead of X̄ | "Waarom fout: U vulde Z̄ in bij X̄ — controleer welke kolom X is." |

### Ȳ

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣY (som zonder deling) | Summed Y but forgot to divide by n | "Waarom fout: U vulde de som ΣY in, maar deelde niet door n. Correctie: Ȳ = ΣY / n — deel de som door n." |
| X̄ | Entered X̄ instead of Ȳ | "Waarom fout: U vulde X̄ in bij Ȳ — controleer welke kolom Y is." |
| Z̄ | Entered Z̄ instead of Ȳ | "Waarom fout: U vulde Z̄ in bij Ȳ — controleer welke kolom Y is." |

### Z̄

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣZ (som zonder deling) | Summed Z but forgot to divide by n | "Waarom fout: U vulde de som ΣZ in, maar deelde niet door n. Correctie: Z̄ = ΣZ / n — deel de som door n." |
| X̄ | Entered X̄ instead of Z̄ | "Waarom fout: U vulde X̄ in bij Z̄ — controleer welke kolom Z is." |
| Ȳ | Entered Ȳ instead of Z̄ | "Waarom fout: U vulde Ȳ in bij Z̄ — controleer welke kolom Z is." |

---

## STAP 2: Teller (r_xy − r_xz × r_yz)

The numerator is `r_xy − (r_xz × r_yz)`.

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Noemer (√((1−r_xz²)(1−r_yz²))) | Entered the denominator in the numerator field | "Waarom fout: U vulde de noemer in bij de teller. Controleer uw formule: teller = r_xy − r_xz × r_yz." |
| r_xy (zonder aftrekking) | Forgot to subtract r_xz × r_yz | "Waarom fout: U vulde enkel r_xy in — u vergat r_xz × r_yz af te trekken. Correctie: teller = r_xy − r_xz × r_yz." |
| r_xz × r_yz (product, zonder r_xy) | Entered only the product term, forgot r_xy | "Waarom fout: U vulde enkel r_xz × r_yz in — u vergat r_xy. Correctie: teller = r_xy − r_xz × r_yz." |
| r_xy + r_xz × r_yz (optelling i.p.v. aftrekking) | Added instead of subtracted | "Waarom fout: U telde op in plaats van af te trekken. Correctie: teller = r_xy − r_xz × r_yz (minteken, geen plusteken)." |

---

## STAP 3: Noemer (√((1 − r_xz²)(1 − r_yz²)))

The denominator is `√((1 − r_xz²) × (1 − r_yz²))`.

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Teller (r_xy − r_xz × r_yz) | Entered the numerator in the denominator field | "Waarom fout: U vulde de teller in bij de noemer. Controleer uw formule: noemer = √((1−r_xz²)(1−r_yz²))." |
| (1 − r_xz²)(1 − r_yz²) (zonder vierkantswortel) | Forgot to take the square root | "Waarom fout: U vergat de vierkantswortel te nemen. Correctie: noemer = √((1−r_xz²)(1−r_yz²)) — neem de wortel van het product." |
| √((1 − r_xz)(1 − r_yz)) (r niet gekwadrateerd) | Forgot to square r_xz and r_yz before subtracting | "Waarom fout: U vergat r_xz en r_yz te kwadrateren. Correctie: noemer = √((1 − r_xz²)(1 − r_yz²)) — kwadrateer de r-waarden." |
| √(1 − r_xz²) of √(1 − r_yz²) (slechts één factor) | Used only one of the two factors | "Waarom fout: U gebruikte slechts één factor. Correctie: noemer = √((1−r_xz²) × (1−r_yz²)) — beide factoren vermenigvuldigen onder de wortel." |

---

## STAP 4: Partiële correlatie r_xy.z = teller / noemer

| Wrong input | What student did | Feedback shown |
|---|---|---|
| noemer / teller (omgekeerd) | Divided denominator by numerator | "Waarom fout: U deelde noemer door teller in plaats van andersom. Correctie: r_xy.z = teller / noemer." |
| r_xy (bivariate correlatie) | Entered r_xy instead of r_xy.z | "Waarom fout: U vulde de bivariate correlatie r_xy in — dette is de partiële correlatie waarbij Z constant wordt gehouden. Correctie: r_xy.z = (r_xy − r_xz × r_yz) / √((1−r_xz²)(1−r_yz²))." |

---

## Correct answers (formulas)

| Field | Formula | Notes |
|---|---|---|
| X̄ | ΣX / n | |
| Ȳ | ΣY / n | |
| Z̄ | ΣZ / n | |
| Teller | r_xy − r_xz × r_yz | Aftrekken, niet optellen |
| Noemer | √((1 − r_xz²) × (1 − r_yz²)) | Kwadrateer r-waarden; neem wortel |
| r_xy.z | teller / noemer | Teller gedeeld door noemer |
