# ANOVA App — Wrong Answer Mappings
**File:** `20260120_ANOVA_App_NL.R`  
**Topic:** Eénweg-ANOVA handmatige berekening (groepsgemiddelden → SS → df → MS → F → η²)

This document lists every wrong-answer trap that is explicitly detected and the feedback shown to the student.

---

## STAP 1: Groepsgemiddelden (Ȳ_j per groep)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Grand mean (Ȳ..) | Confused group mean with overall mean | "Waarom fout: U vulde het grootgemiddelde (Ȳ.. = [waarde]) in als groepsgemiddelde. Oorzaak: Het groepsgemiddelde gebruikt alleen de waarden bínnen groep j, niet alle N waarnemingen. Correctie: Ȳ_j = Σ(Y voor groep j) / n_j" |
| MSW | Entered Mean Square Within instead of mean | "Waarom fout: U vulde MSW in — dat is een gemiddeld kwadraat, geen rekenkundig gemiddelde. Correctie: Ȳ_j = Σ(Y_i voor groep j) / n_j" |
| Sum of Y (Σ Y zonder deling) | Summed but forgot to divide by n | "Waarom fout: U heeft de som van Y-waarden in groep j ingevuld zonder te delen door n. Correctie: Ȳ_j = ΣY / n_j — deel de som door n_j" |

---

## STAP 1: Grootgemiddelde (Ȳ..)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| Unweighted mean of group means | Averaged group means without weighting by n | "Waarom fout: U berekende het ongewogen gemiddelde van de groepsgemiddelden. Oorzaak: Bij ongelijke groepsgrootten is het gemiddelde van groepsgemiddelden ≠ ΣY/N. Correctie: Tel alle N Y-waarden op en deel door N." |
| One group's mean | Used a single group mean | "Waarom fout: U vulde het groepsgemiddelde van groep [j] in. Correctie: Het grootgemiddelde is het gemiddelde van ALLE N Y-waarden — voeg alle groepen samen en deel door N." |

---

## STAP 2: Kwadratensommen (SS)

### SSW (binnengroepse variatie)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSB | Swapped SSW and SSB | "Waarom fout: U vulde SSB in bij SSW — deze zijn verwisseld. Oorzaak: SSW = binnengroepse variatie Σ(Y−Ȳ_j)²; SSB = tussengroepse variatie. Correctie: SSW is de som van kwadraten bínnen de groepen." |
| SST | Entered total instead of within | "Waarom fout: U vulde SST in bij SSW. Oorzaak: SST = SSW + SSB; SSW is alleen de binnengroepse variatie. Correctie: Haal SSB van SST af: SSW = SST − SSB." |
| MSW | Entered MS instead of SS | "Waarom fout: U vulde MSW in bij SSW. Oorzaak: MSW = SSW / df_within; SSW is de som vóór deling door df. Correctie: Vermenigvuldig MSW met df_within om SSW te krijgen." |

### SSB (tussengroepse variatie)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSW | Swapped SSB and SSW | "Waarom fout: U vulde SSW in bij SSB — deze zijn verwisseld. Oorzaak: SSB = tussengroepse variatie Σ n_j(Ȳ_j−Ȳ..)²; SSW is binnengroeps. Correctie: Bereken voor elke groep n_j(Ȳ_j−Ȳ..)² en tel op." |
| SST | Entered total instead of between | "Waarom fout: U vulde SST in bij SSB. Oorzaak: SSB is alleen de tussengroepse variatie, niet het totaal. Correctie: Haal SSW van SST af: SSB = SST − SSW." |
| MSB | Entered MS instead of SS | "Waarom fout: U vulde MSB in bij SSB. Oorzaak: MSB = SSB / df_between; SSB is de som vóór deling door df. Correctie: Vermenigvuldig MSB met df_between om SSB te krijgen." |

### SST (totale variatie)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSW (alleen) | Entered SSW instead of total | "Waarom fout: U vulde SSW in bij SST. Correctie: SST = SSW + SSB — voeg beide kwadratensommen samen." |
| SSB (alleen) | Entered SSB instead of total | "Waarom fout: U vulde SSB in bij SST. Correctie: SST = SSW + SSB — voeg beide kwadratensommen samen." |
| SSW − SSB | Subtracted instead of added | "Waarom fout: U gebruikte SSW − SSB in plaats van SSW + SSB. Correctie: Gebruik de optelling: SST = SSW + SSB." |

---

## STAP 3: Vrijheidsgraden (df)

### df_between (= k − 1)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| k (aantal groepen) | Forgot to subtract 1 | "Waarom fout: U vulde k in. df_between = k − 1, dus trek 1 af." |
| df_within | Swapped df_between and df_within | "Waarom fout: U vulde df_within in bij df_between — verwisseld. Correctie: df_between = k − 1; df_within = N − k." |

### df_within (= N − k)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| N | Forgot to subtract k | "Waarom fout: U vulde N in. df_within = N − k — trek ook het aantal groepen k af." |
| N − 1 | Subtracted 1 instead of k | "Waarom fout: U vulde N − 1 in. df_within = N − k — trek k af, niet 1." |
| df_between | Swapped df_within and df_between | "Waarom fout: U vulde df_between in bij df_within — verwisseld. Correctie: df_within = N − k; df_between = k − 1." |

### df_total (= N − 1)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| N | Forgot to subtract 1 | "Waarom fout: U vulde N in. df_total = N − 1 — trek 1 af." |
| df_between + df_within − 1 | Extra −1 after summing | "Waarom fout: U berekende df_between + df_within − 1 — de −1 is niet nodig. Correctie: df_total = N − 1 = df_between + df_within." |

---

## STAP 4: Gemiddelde kwadraten (MS)

### MSB (= SSB / df_between)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSB | Forgot to divide by df | "Waarom fout: U vulde SSB in bij MSB — deel nog door df_between. Correctie: MSB = SSB / df_between." |
| MSW | Swapped MSB and MSW | "Waarom fout: U vulde MSW in bij MSB — verwisseld. Correctie: MSB = SSB / df_between; MSW = SSW / df_within." |
| SSB / df_within | Divided by wrong df | "Waarom fout: U deelde SSB door df_within in plaats van df_between. Correctie: MSB = SSB / df_between." |

### MSW (= SSW / df_within)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSW | Forgot to divide by df | "Waarom fout: U vulde SSW in bij MSW — deel nog door df_within. Correctie: MSW = SSW / df_within." |
| MSB | Swapped MSW and MSB | "Waarom fout: U vulde MSB in bij MSW — verwisseld. Correctie: MSW = SSW / df_within; MSB = SSB / df_between." |
| SSW / df_between | Divided by wrong df | "Waarom fout: U deelde SSW door df_between in plaats van df_within. Correctie: MSW = SSW / df_within." |

---

## STAP 5: F-ratio (= MSB / MSW)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| MSW / MSB | Inverted the ratio | "Waarom fout: U berekende MSW/MSB in plaats van MSB/MSW — draai de deling om. Correctie: F = MSB / MSW." |

---

## STAP 6: Eta-kwadraat η² (= SSB / SST)

| Wrong input | What student did | Feedback shown |
|---|---|---|
| SSB / SSW | Used SSW as denominator instead of SST | "Waarom fout: U gebruikte SSB/SSW in plaats van SSB/SST. Oorzaak: De noemer van η² is SST (= SSW + SSB), niet SSW. Correctie: η² = SSB / SST — gebruik het totaal als noemer." |

---

## Correct answers (formulas)

| Field | Formula | Notes |
|---|---|---|
| Ȳ_j | Σ(Y_i voor groep j) / n_j | Alleen waarden binnen de groep |
| Ȳ.. | ΣY_all / N | Alle waarden samen |
| SSW | Σ_j Σ_i (Y_ij − Ȳ_j)² | Binnengroeps |
| SSB | Σ_j n_j (Ȳ_j − Ȳ..)² | Tussengroeps |
| SST | SSW + SSB | Totaal |
| df_between | k − 1 | k = aantal groepen |
| df_within | N − k | N = totale steekproefgrootte |
| df_total | N − 1 | = df_between + df_within |
| MSB | SSB / df_between | |
| MSW | SSW / df_within | |
| F | MSB / MSW | |
| η² | SSB / SST | Effectgrootte |
