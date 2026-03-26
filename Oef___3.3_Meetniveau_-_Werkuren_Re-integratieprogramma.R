# https://dodona.be/en/courses/5645/series/67292/activities/950615965

# Vul de ontbrekende stukken code in door ??? te vervangen.
# Let op:
# - Gebruik decimale PUNTEN in R (33.55), geen komma.

# Data: 24, 36, 35, 28, 24, 28, 24, 36, 32, 36, 40, 38, 36, 34, 40, 36, 32, 36, 40, 36

# STAP 1 – Frequentietabel en centraliteit

# a. Bereken de frequenties en percentages voor elke waarde
# 1. Frequentie
freq_24 <- ???
freq_28 <- ???
freq_32 <- ???
freq_34 <- ???
freq_35 <- ???
freq_36 <- ???
freq_38 <- ???
freq_40 <- ???

# 2. Percentage
percent_24 <- ???
percent_28 <- ???
percent_32 <- ???
percent_34 <- ???
percent_35 <- ???
percent_36 <- ???
percent_38 <- ???
percent_40 <- ???

# b. Bereken de modus, mediaan en het gemiddelde
# 3. Wat is de modus van de werkuren? (meest voorkomende waarde)
modus <- ???

# 4. Wat is de mediaan van de werkuren? (middelste waarde)
mediaan <- ???

# 5. Wat is het gemiddelde van de werkuren? (gebruik decimale punt)
gemiddelde <- ???

# STAP 2 – Spreidingsmaten en parameter keuzes

# a. Bereken de variatiebreedte en de interkwartielafstand
# 6. Wat is de variatiebreedte (range) van de werkuren? (hoogste - laagste waarde)
variatiebreedte <- ???

# 7. Wat is het eerste kwartiel (Q1) van de werkuren?
q1 <- ???

# 8. Wat is het derde kwartiel (Q3) van de werkuren?
q3 <- ???

# 9. Wat is de interkwartielafstand (IKA) van de werkuren? (Q3 - Q1)
ika <- ???

# b. Welke parameter zou je kiezen?
# 10. Welke maat van centraliteit is het meest relevant voor interval data?
# Kies uit: "modus", "mediaan", "gemiddelde"
meest_relevante_centraliteit <- "???"

# 11. Welke maat van spreiding zou je kiezen?
# Kies uit: "variatiebreedte", "interkwartielafstand"
meest_relevante_spreiding <- "???"

# 12. Waarom zijn deze maten het meest geschikt?
# Kies uit: "geen uitbijters", "robuust voor uitbijters", "gebruikt alle informatie"
reden <- "???"

# STAP 3 – Geavanceerde spreidingsberekeningen
# a. Bereken afwijkingen van het gemiddelde voor elke waarde: (X - gemiddelde waarde)
# Data: 24, 36, 35, 28, 24, 28, 24, 36, 32, 36, 40, 38, 36, 34, 40, 36, 32, 36, 40, 36
# 13. Afwijkingen van het gemiddelde (gebruik 4 decimalen: bijv. -9.5500)
# Data: 24, 36, 35, 28, 24, 28, 24, 36, 32, 36, 40, 38, 36, 34, 40, 36, 32, 36, 40, 36
afwijking_24_1 <- ??? # 24 - 33.55 = ?
afwijking_36_1 <- ??? # 36 - 33.55 = ?
afwijking_35 <- ??? # 35 - 33.55 = ?
afwijking_28_1 <- ??? # 28 - 33.55 = ?
afwijking_24_2 <- ??? # 24 - 33.55 = ?
afwijking_28_2 <- ??? # 28 - 33.55 = ?
afwijking_24_3 <- ??? # 24 - 33.55 = ?
afwijking_36_2 <- ??? # 36 - 33.55 = ?
afwijking_32_1 <- ??? # 32 - 33.55 = ?
afwijking_36_3 <- ??? # 36 - 33.55 = ?
afwijking_40_1 <- ??? # 40 - 33.55 = ?
afwijking_38 <- ??? # 38 - 33.55 = ?
afwijking_36_4 <- ??? # 36 - 33.55 = ?
afwijking_34 <- ??? # 34 - 33.55 = ?
afwijking_40_2 <- ??? # 40 - 33.55 = ?
afwijking_36_5 <- ??? # 36 - 33.55 = ?
afwijking_32_2 <- ??? # 32 - 33.55 = ?
afwijking_36_6 <- ??? # 36 - 33.55 = ?
afwijking_40_3 <- ??? # 40 - 33.55 = ?
afwijking_36_7 <- ??? # 36 - 33.55 = ?

# 14. Bereken gekwadrateerde afwijkingen: (X - gemiddelde waarde)²
# Kwadrateer elke afwijking uit de vorige vraag
gekw_afwijking_24_1 <- ??? # (-9.5500)² = ?
gekw_afwijking_36_1 <- ??? # (2.4500)² = ?
gekw_afwijking_35 <- ??? # (1.4500)² = ?
gekw_afwijking_28_1 <- ??? # (-5.5500)² = ?
gekw_afwijking_24_2 <- ??? # (-9.5500)² = ?
gekw_afwijking_28_2 <- ??? # (-5.5500)² = ?
gekw_afwijking_24_3 <- ??? # (-9.5500)² = ?
gekw_afwijking_36_2 <- ??? # (2.4500)² = ?
gekw_afwijking_32_1 <- ??? # (-1.5500)² = ?
gekw_afwijking_36_3 <- ??? # (2.4500)² = ?
gekw_afwijking_40_1 <- ??? # (6.4500)² = ?
gekw_afwijking_38 <- ??? # (4.4500)² = ?
gekw_afwijking_36_4 <- ??? # (2.4500)² = ?
gekw_afwijking_34 <- ??? # (0.4500)² = ?
gekw_afwijking_40_2 <- ??? # (6.4500)² = ?
gekw_afwijking_36_5 <- ??? # (2.4500)² = ?
gekw_afwijking_32_2 <- ??? # (-1.5500)² = ?
gekw_afwijking_36_6 <- ??? # (2.4500)² = ?
gekw_afwijking_40_3 <- ??? # (6.4500)² = ?
gekw_afwijking_36_7 <- ??? # (2.4500)² = ?

# b. Variantie en standaardafwijking
# 15. Bereken de som van gekwadrateerde afwijkingen (Sum of Squares)
sum_of_squares <- ???

# 16. Bereken de variantie (sum of squares / (n-1))
variantie <- ???

# 17. Bereken de standaardafwijking (wortel van variantie)
standaardafwijking <- ???

# 18. Bereken de variatiecoëfficiënt (standaardafwijking / gemiddelde)
variatiecoefficient <- ???
