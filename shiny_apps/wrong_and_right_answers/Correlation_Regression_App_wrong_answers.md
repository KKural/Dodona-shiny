# Correlatie & Regressie App — Wrong Answer Mappings
**File:** `20260120_Correlation_and_Regression_App_NL.R`  
**Topic:** Correlatie en enkelvoudige regressie — handmatige 15-stappen berekening  
**Modes:** Correlation | Bivariate Regression

This document lists every wrong-answer trap that is explicitly detected and the feedback shown to the student.

---

## STAP 1: Gemiddelden (X̄ en Ȳ)

### X̄ (gemiddelde van X)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣX (som zonder deling) | Summed X but forgot to divide by n | "Waarom fout: U vulde de som ΣX in, maar deelde niet door n. Correctie: X̄ = ΣX / n — deel de som door n." |
| Ȳ | Entered the Y mean instead | "Waarom fout: U vulde Ȳ in bij X̄ — controleer welke kolom X is." |

### Ȳ (gemiddelde van Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣY (som zonder deling) | Summed Y but forgot to divide by n | "Waarom fout: U vulde de som ΣY in, maar deelde niet door n. Correctie: Ȳ = ΣY / n — deel de som door n." |
| X̄ | Entered the X mean instead | "Waarom fout: U vulde X̄ in bij Ȳ — controleer welke kolom Y is." |

---

## STAP 2 (Regression mode): Gemiddelde en SD per predictor

### X̄ per predictor (meervoudige modus)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| ΣX (som zonder deling) | Summed but forgot to divide | "Waarom fout: U vulde de som in zonder te delen door n. Correctie: X̄ = ΣX / n — deel de som door n." |

---

## STAP 4: Kwadraat- en kruisproductsommen (totaalrij)

### Σ(y−ȳ)² (kwadraatsom Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Σ(y−ȳ)² / (n−1) — variantie | Divided by n−1 instead of summing | "Waarom fout: U deelde de kwadraatsom door n−1 (= variantie). Dit veld vraagt de ruwe kwadraatsom. Correctie: Tel de kolom (y−ȳ)² direct op — deel niet door n−1." |
| Σ(x−x̄)² | Entered the X² sum instead of Y² sum | "Waarom fout: U vulde Σ(x−x̄)² in bij Σ(y−ȳ)². Controleer welke kolom Y is." |

### Σ(x−x̄)² (kwadraatsom X)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Σ(x−x̄)² / (n−1) — variantie | Divided by n−1 instead of summing | "Waarom fout: U deelde de kwadraatsom door n−1 (= variantie). Dit veld vraagt de ruwe kwadraatsom. Correctie: Tel de kolom (x−x̄)² direct op — deel niet door n−1." |
| Σ(y−ȳ)² | Entered Y² sum instead of X² sum | "Waarom fout: U vulde Σ(y−ȳ)² in bij Σ(x−x̄)². Controleer welke kolom X is." |

---

## STAP 5 (Regression mode): Variantie en Standaarddeviatie

### Var(X)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Σ(X−X̄)² / n (populatievariantie) | Divided by n instead of n−1 | "Waarom fout: U deelde door n in plaats van n−1. Oorzaak: Steekproefvariantie vereist de Bessel-correctie (n−1). Correctie: Var(X) = Σ(X−X̄)² / (n−1)." |
| SD(X) | Entered standard deviation instead of variance | "Waarom fout: U vulde SD(X) in — dit veld vraagt de variantie. Correctie: Var(X) = SD(X)² — kwadrateer uw SD." |
| Var(Y) | Swapped Var(X) and Var(Y) | "Waarom fout: U vulde Var(Y) in bij Var(X) — controleer welke kolom X is." |

### Var(Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Σ(Y−Ȳ)² / n (populatievariantie) | Divided by n instead of n−1 | "Waarom fout: U deelde door n in plaats van n−1. Correctie: Var(Y) = Σ(Y−Ȳ)² / (n−1)." |
| SD(Y) | Entered standard deviation instead of variance | "Waarom fout: U vulde SD(Y) in — dit veld vraagt de variantie. Correctie: Var(Y) = SD(Y)² — kwadrateer uw SD." |
| Var(X) | Swapped Var(X) and Var(Y) | "Waarom fout: U vulde Var(X) in bij Var(Y) — controleer welke kolom Y is." |

### SD(X) = √Var(X)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Var(X) | Entered variance instead of SD | "Waarom fout: U vulde Var(X) in — dit veld vraagt de standaarddeviatie. Correctie: SD(X) = √Var(X) — neem de vierkantswortel." |
| Populatie-SD (÷ n) | Divided by n, not n−1 | "Waarom fout: U gebruikte de populatie-SD (deelde door n). Correctie: Gebruik de steekproef-SD: √(Σ(X−X̄)² / (n−1))." |
| SD(Y) | Swapped SD(X) and SD(Y) | "Waarom fout: U vulde SD(Y) in bij SD(X) — controleer welke kolom X is." |

### SD(Y) = √Var(Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Var(Y) | Entered variance instead of SD | "Waarom fout: U vulde Var(Y) in — dit veld vraagt de standaarddeviatie. Correctie: SD(Y) = √Var(Y) — neem de vierkantswortel." |
| Populatie-SD (÷ n) | Divided by n, not n−1 | "Waarom fout: U gebruikte de populatie-SD (deelde door n). Correctie: Gebruik de steekproef-SD: √(Σ(Y−Ȳ)² / (n−1))." |
| SD(X) | Swapped SD(X) and SD(Y) | "Waarom fout: U vulde SD(X) in bij SD(Y) — controleer welke kolom Y is." |

---

## STAP 6: Kruisproductsom Σ(X−X̄)(Y−Ȳ)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Covariantie (÷ n−1) | Divided by n−1 instead of summing raw | "Waarom fout: U vulde de covariantie in — dit veld vraagt de kruisproductsom vóór deling door n−1. Correctie: Tel de kolom (X−X̄)(Y−Ȳ) op — deel niet door n−1." |
| Σ(X−X̄)² | Entered X quadratic sum instead | "Waarom fout: U vulde Σ(X−X̄)² in — dit veld vraagt het kruisproduct Σ(X−X̄)(Y−Ȳ)." |
| Σ(Y−Ȳ)² | Entered Y quadratic sum instead | "Waarom fout: U vulde Σ(Y−Ȳ)² in — dit veld vraagt het kruisproduct Σ(X−X̄)(Y−Ȳ)." |

---

## STAP 7: Covariantie Cov(X,Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Kruisproductsom (niet gedeeld) | Forgot to divide by n−1 | "Waarom fout: U vulde de kruisproductsom in — deel nog door n−1. Correctie: Cov(X,Y) = Σ(X−X̄)(Y−Ȳ) / (n−1)." |
| Kruisproductsom / n (÷ n i.p.v. n−1) | Divided by n instead of n−1 | "Waarom fout: U deelde door n in plaats van n−1. Correctie: Cov(X,Y) = Σ(X−X̄)(Y−Ȳ) / (n−1)." |
| Correlatie r | Entered r instead of covariance | "Waarom fout: U vulde de correlatie r in — covariantie is r × SD(X) × SD(Y), niet hetzelfde als r." |

---

## STAP 8: SD-product SD(X) × SD(Y)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SD(X) + SD(Y) (optelling) | Added instead of multiplied | "Waarom fout: U berekende SD(X) + SD(Y) — gebruik vermenigvuldiging. Correctie: SD(X) × SD(Y)." |
| Var(X) × Var(Y) (varianties) | Used variances instead of SDs | "Waarom fout: U gebruikte varianties (Var(X) × Var(Y)). Correctie: Gebruik de standaarddeviaties: SD(X) × SD(Y), niet de varianties." |

---

## STAP 9: Correlatie r = Cov(X,Y) / (SD(X) × SD(Y))

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Regressiehelling b | Entered b instead of r | "Waarom fout: U vulde de regressiehelling b in — dat is Cov/Var(X), niet Cov/(SD(X)×SD(Y)). Correctie: r = Cov(X,Y) / (SD(X) × SD(Y))." |
| Kruisproductsom / SD-product | Skipped the ÷(n−1) step | "Waarom fout: U deelde de kruisproductsom rechtstreeks door het SD-product. Oorzaak: U sloeg de deling door n−1 over. Correctie: Bereken eerst Cov = kruisproductsom / (n−1), deel dan door SD(X)×SD(Y)." |

---

## STAP 10: Regressiehelling b = Cov(X,Y) / Var(X)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SD(Y) / SD(X) | Used SD ratio instead of Cov/Var | "Waarom fout: U gebruikte SD(Y)/SD(X) — de correcte formule gebruikt covariantie en variantie. Correctie: b = Cov(X,Y) / Var(X)." |
| Correlatie r | Entered r instead of b | "Waarom fout: U vulde de correlatie r in — de helling b ≠ r. Correctie: b = Cov(X,Y) / Var(X)." |
| Cov / Var(Y) (verkeerde variantie) | Divided by Var(Y) instead of Var(X) | "Waarom fout: U deelde door Var(Y) in plaats van Var(X). Correctie: b = Cov(X,Y) / Var(X) — controleer door welke variantie u deelt." |

---

## STAP 11: Intercept a = Ȳ − b × X̄

| Wrong input | What student did | Feedback shown |
|---|---|---|
| X̄ − b × Ȳ | Swapped X̄ and Ȳ in the formula | "Waarom fout: U gebruikte a = X̄ − b×Ȳ — de formule vereist Ȳ links. Correctie: a = Ȳ − b×X̄ — zet de Y-waarden links in de formule." |

---

## STAP 12: R² (determinatiecoëfficiënt)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| r (correlatie, niet gekwadrateerd) | Forgot to square r | "Waarom fout: U vulde r in — R² is het kwadraat van r. Correctie: R² = r²." |
| Vervreemdingscoëfficiënt (1 − R²) | Entered the alienation coefficient | "Waarom fout: U vulde de vervreemdingscoëfficiënt (1−R² = [waarde]) in — dat is het omgekeerde. Correctie: R² = r², niet 1−r²." |

---

## STAP 13: Vervreemdingscoëfficiënt = 1 − R²

| Wrong input | What student did | Feedback shown |
|---|---|---|
| R² | Entered R² instead of 1 − R² | "Waarom fout: U vulde R² in — vervreemding = 1 − R², niet R² zelf. Correctie: Trek R² af van 1: 1 − R²." |
| r (correlatie) | Entered r instead of 1 − r² | "Waarom fout: U vulde r in — vervreemding = 1 − r². Correctie: Kwadrateer eerst r, trek dan af van 1: 1 − r²." |

---

## Correct answers (formulas)

| Field | Formula | Notes |
|---|---|---|
| X̄ | ΣX / n | |
| Ȳ | ΣY / n | |
| Σ(x−x̄)² | Σ(X_i − X̄)² | Ruwe som, NIET gedeeld door n−1 |
| Σ(y−ȳ)² | Σ(Y_i − Ȳ)² | Ruwe som, NIET gedeeld door n−1 |
| Var(X) | Σ(X−X̄)² / (n−1) | Bessel-correctie! |
| Var(Y) | Σ(Y−Ȳ)² / (n−1) | Bessel-correctie! |
| SD(X) | √Var(X) | Steekproef, n−1 |
| SD(Y) | √Var(Y) | Steekproef, n−1 |
| Kruisproductsom | Σ(X−X̄)(Y−Ȳ) | Ruwe som |
| Cov(X,Y) | kruisproductsom / (n−1) | |
| SD-product | SD(X) × SD(Y) | Vermenigvuldigen, niet optellen |
| r | Cov(X,Y) / (SD(X) × SD(Y)) | |
| b (helling) | Cov(X,Y) / Var(X) | |
| a (intercept) | Ȳ − b × X̄ | Let op volgorde |
| R² | r² | |
| Vervreemding | 1 − R² | |
