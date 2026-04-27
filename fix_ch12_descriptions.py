import os

b = r'C:\Users\kukumar\OneDrive - UGent\My Projects\Dodona\Statistiek-in-de-Criminologie\Hoofdstuk_12_Complexere relaties tussen variabelen'

intro = (
    "Het hieronder afgebeelde padmodel is een visualisatie van een partiële test van de "
    "Morele Fundamenten Theorie (MFT) van Jonathan Haidt en collega\u2019s. MFT werd gecreëerd "
    "om te verklaren hoe en waarom moraliteit zo sterk varieert tussen culturen en tevens zoveel "
    "overeenkomsten en terugkerende thema\u2019s vertoont. De theorie vertrekt daarbij vanuit een "
    "evolutionair kader. De centrale vraag waarop de theorie een antwoord formuleert is: "
    "**Wat zijn de determinanten van een moreel oordeel?** Volgens MFT zijn morele oordelen het "
    "resultaat van morele intuïties en morele emoties. In een recente studie (De Buck & Pauwels, 2022) "
    "werden de relaties onderzocht tussen dimensies van empathie en moreel oordelen in de context van "
    "verschillende vormen van normovertreding. In één geval werd een vignette gebruikt waarin een "
    "diefstal wordt beschreven. Aan respondenten werd gevraagd in welke mate zij stelen/diefstal als "
    "verkeerd beschouwen.\n\n"
    "Je vindt hieronder het padmodel dat om didactische redenen is vereenvoudigd."
)

# ── Oef 12.1 ─────────────────────────────────────────────────────────────────
d1 = "\n\n".join([
    intro,
    '<img src="image/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Welke variabelen in het model zijn **\u2018endogene\u2019** variabelen?",
    "1. Empathische bezorgdheid en empathische perspectiefneming\n"
    "2. Moreel oordeel (Stelen is OK)\n"
    "3. Morele intuïties, geanticipeerde schuld en morele boosheid\n"
    "4. Geanticipeerde schuld en morele boosheid",
    "**Hint:** *Een endogene variabele is de uiteindelijke uitkomstvariabele van het model \u2014 "
    "ze ontvangt pijlen maar stuurt er geen naar andere modelvariabelen.*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

# ── Oef 12.2 ─────────────────────────────────────────────────────────────────
d2 = "\n\n".join([
    intro,
    '<img src="media/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Hoeveel bedraagt de **padcoëfficiënt** tussen **\u2018morele intuïties (individualiserend)\u2019** "
    "en **\u2018geanticipeerde schuld\u2019**?",
    "1. .21\n2. .34\n3. .18\n4. .48",
    "**Hint:** *Zoek de pijl die rechtstreeks van \u2018Morele intuïties (individualiserend)\u2019 naar "
    "\u2018Geanticipeerde schuld\u2019 loopt en lees het getal naast die pijl af.*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

# ── Oef 12.3 ─────────────────────────────────────────────────────────────────
d3 = "\n\n".join([
    intro,
    '<img src="media/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Hoeveel **\u2018indirecte\u2019 effecten** van **\u2018empathische perspectiefneming\u2019** "
    "op **\u2018moreel oordeel\u2019** worden in het model weergegeven?",
    "1. Eén indirect pad\n2. Twee indirecte paden\n3. Drie indirecte paden\n4. Vier indirecte paden",
    "**Hint:** *Volg alle routes van \u2018Empathische perspectiefneming\u2019 naar \u2018Moreel oordeel\u2019 "
    "die via tussenvariabelen lopen. Een direct pad telt niet mee.*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

# ── Oef 12.4 ─────────────────────────────────────────────────────────────────
d4 = "\n\n".join([
    intro,
    '<img src="media/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Hoeveel procent van de variatie in de **uitkomstvariabele** kan **niet** verklaard worden "
    "op basis van dit model?",
    "1. 38%\n2. 43%\n3. 57%\n4. 62%",
    "**Hint:** *Zoek de R² van de uitkomstvariabele \u2018Moreel oordeel\u2019 op. "
    "Het niet-verklaarde deel = 100% \u2212 R².*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

# ── Oef 12.5 ─────────────────────────────────────────────────────────────────
d5 = "\n\n".join([
    intro,
    '<img src="media/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Hoeveel bedraagt het **totale effect** van **\u2018empathische bezorgdheid\u2019** "
    "op **\u2018geanticipeerde schuld\u2019**?",
    "1. 0.34\n2. 0.3432\n3. 0.4264\n4. 0.48",
    "**Hint:** *Totaal effect = direct effect + indirect effect via Morele intuïties (ind.). "
    "Bereken: direct pad + (padcoëff. naar MI(ind.) \u00d7 padcoëff. MI(ind.) naar Schuld).*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

# ── Oef 12.6 ─────────────────────────────────────────────────────────────────
d6 = "\n\n".join([
    intro,
    '<img src="media/padmodel.png" alt="MFT padmodel" width="750">',
    "---",
    "Hoeveel procent van de variatie in **\u2018morele intuïties (groepsgericht)\u2019** "
    "kan verklaard worden op basis van de twee dimensies van empathie?",
    "1. 2%\n2. 14%\n3. 24%\n4. 38%",
    "**Hint:** *Zoek de R² die bij de variabele \u2018Morele intuïties (groepsgericht)\u2019 "
    "vermeld staat in het padmodel.*",
    "- Typ je antwoord als één enkel getal (1-4) om je keuze aan te geven\n"
])

files = {
    r'Oef - 12.1\description\description.nl.md': d1,
    r'Oef - 12.2\description\description.nl.md': d2,
    r'Oef - 12.3\description\description.nl.md': d3,
    r'Oef - 12.4\description\description.nl.md': d4,
    r'Oef - 12.5\description\description.nl.md': d5,
    r'Oef - 12.6\description\description.nl.md': d6,
}

for rel, content in files.items():
    path = os.path.join(b, rel)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    # Verify no BOM
    with open(path, 'rb') as f:
        bom = f.read(3) == b'\xef\xbb\xbf'
    print(f"{'BOM!' if bom else 'OK  '}: {rel.split(chr(92))[0]}")
