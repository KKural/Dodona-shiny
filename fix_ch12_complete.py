"""
fix_ch12_complete.py
Rewrites Chapter 12 to have 10 exercises in the correct official order:
  12.1  Exogene variabelen           (NEW)
  12.2  Endogene variabelen          (was 12.1)
  12.3  Intermediaire variabelen     (NEW)
  12.4  Correlatie MI(ind.)→Schuld   (was 12.2, fix "correlatie" wording)
  12.5  Indirecte paden tellen       (was 12.3)
  12.6  Totaal effect berekenen      (was 12.5)
  12.7  R² Morele intuities (groep.) (was 12.6)
  12.8  R-kwadraat interpreteren     (was 12.4)
  12.9  Wat betekent dit concreet?   (NEW)
  12.10 Besluit en vooruitblik       (was 12.7)
"""
import os
import shutil
import re
import json

BASE = r'C:\Users\kukumar\OneDrive - UGent\My Projects\Dodona\Statistiek-in-de-Criminologie\Hoofdstuk_12_Complexere relaties tussen variabelen'
PADMODEL = os.path.join(BASE, 'padmodel.png')


def wu8(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


# ============================================================
# STEP 1: Rename existing folders (high→low to avoid conflicts)
# ============================================================
renames = [
    ('Oef - 12.7',  'Oef - 12.10'),
    ('Oef - 12.6',  'Oef - 12.7'),
    ('Oef - 12.5',  'Oef - 12.6'),
    ('Oef - 12.4',  'Oef - 12.8'),
    ('Oef - 12.3',  'Oef - 12.5'),
    ('Oef - 12.2',  'Oef - 12.4'),
    ('Oef - 12.1',  'Oef - 12.2'),
]
for src, dst in renames:
    s = os.path.join(BASE, src)
    d = os.path.join(BASE, dst)
    if os.path.exists(s):
        os.rename(s, d)
        print(f'Renamed : {src} → {dst}')
    else:
        print(f'SKIP    : {src} not found')

# ============================================================
# STEP 2: Update config "nl" names for renamed folders
# ============================================================
cfg_names = {
    'Oef - 12.2':  'Oef - 12.2 Soorten variabelen: endogene variabelen',
    'Oef - 12.4':  'Oef - 12.4 Padcoëfficiënt aflezen',
    'Oef - 12.5':  'Oef - 12.5 Indirecte paden tellen',
    'Oef - 12.6':  'Oef - 12.6 Totaal effect berekenen',
    'Oef - 12.7':  'Oef - 12.7 R-kwadraat Morele intuïties (groepsgericht)',
    'Oef - 12.8':  'Oef - 12.8 R-kwadraat interpreteren',
    'Oef - 12.10': 'Oef - 12.10: Besluit en vooruitblik naar volgende leerpad',
}
for folder, name in cfg_names.items():
    p = os.path.join(BASE, folder, 'config.json')
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(r'"nl":\s*"[^"]+"',
                         '"nl": "' + name + '"', content, count=1)
    wu8(p, new_content)
    print(f'Config  : {folder} → {name}')

# ============================================================
# STEP 3: Fix "correlatie" wording in Oef-12.4 description
# ============================================================
desc_p = os.path.join(BASE, 'Oef - 12.4', 'description', 'description.nl.md')
with open(desc_p, 'r', encoding='utf-8') as f:
    desc = f.read()
desc_new = desc.replace('padcoëfficiënt** tussen', 'correlatie** tussen')
desc_new = desc_new.replace('padcoëfficiënt** van', 'correlatie** van')
wu8(desc_p, desc_new)
print('Fixed   : correlatie wording in Oef-12.4')

# ============================================================
# STEP 4: Build new exercises (12.1, 12.3, 12.9)
# ============================================================
INTRO = ("Het hieronder afgebeelde padmodel is een visualisatie van een partiële test van de "
         "Morele Fundamenten Theorie (MFT) van Jonathan Haidt en collega\u2019s. "
         "MFT werd gecre\u00eberd om te verklaren hoe en waarom moraliteit zo sterk varieert "
         "tussen culturen en tevens zoveel overeenkomsten en terugkerende thema\u2019s vertoont. "
         "De theorie vertrekt daarbij vanuit een evolutionair kader. De centrale vraag waarop de "
         "theorie een antwoord formuleert is: **Wat zijn de determinanten van een moreel oordeel?** "
         "Volgens MFT zijn morele oordelen het resultaat van morele intu\u00efties en morele emoties. "
         "In een recente studie (De Buck & Pauwels, 2022) werden de relaties onderzocht tussen dimensies "
         "van empathie en moreel oordelen in de context van verschillende vormen van normovertreding. "
         "In \u00e9\u00e9n geval werd een vignette gebruikt waarin een diefstal wordt beschreven. "
         "Aan respondenten werd gevraagd in welke mate zij stelen/diefstal als verkeerd beschouwen.\n\n"
         "Je vindt hieronder het padmodel dat om didactische redenen is vereenvoudigd.\n\n"
         "<img src=\"media/padmodel.png\" alt=\"MFT padmodel\" width=\"750\">\n\n---\n\n")

EXERCISES = [
    {
        'folder': 'Oef - 12.1',
        'nl':     'Oef - 12.1 Soorten variabelen: exogene variabelen',
        'labels': ['padmodel', 'begrippen', 'exogeen'],
        'desc_body': (
            "Welke variabelen in het model zijn **\u2018exogene\u2019** variabelen?\n\n"
            "1. Empathische bezorgdheid en empathische perspectiefneming\n"
            "2. Moreel oordeel (Stelen is OK)\n"
            "3. Morele intui\u00efties, geanticipeerde schuld en morele boosheid\n"
            "4. Geanticipeerde schuld en morele boosheid\n\n"
            "**Hint:** *Een exogene variabele heeft geen inkomende pijlen vanuit andere "
            "modelvariabelen \u2014 het zijn de startpunten van het model.*\n\n"
            "- Typ je antwoord als \u00e9\u00e9n enkel getal (1-4) om je keuze aan te geven\n"
        ),
        'answer': 1,
        'feedbacks': [
            ('1', True,
             "\u2705 Juist! **Empathische bezorgdheid** en **Empathische perspectiefneming** zijn "
             "de exogene variabelen. Zij ontvangen geen pijlen vanuit andere modelvariabelen \u2014 "
             "zij vormen het vertrekpunt van de verklarende keten."),
            ('2', False,
             "\u274c Fout. **Moreel oordeel** is de *endogene* uitkomstvariabele \u2014 het ontvangt "
             "pijlen van Geanticipeerde schuld en Morele boosheid.\\n\\n"
             "**Correct antwoord:** 1 (Empathische bezorgdheid en empathische perspectiefneming)"),
            ('3', False,
             "\u274c Fout. Morele intui\u00efties, Geanticipeerde schuld en Morele boosheid zijn "
             "*intermediaire* variabelen \u2014 zij ontvangen \u00e9n sturen pijlen.\\n\\n"
             "**Correct antwoord:** 1"),
            ('4', False,
             "\u274c Fout. Geanticipeerde schuld en Morele boosheid zijn *intermediaire* variabelen "
             "\u2014 zij sturen pijlen naar Moreel oordeel.\\n\\n"
             "**Correct antwoord:** 1"),
        ],
    },
    {
        'folder': 'Oef - 12.3',
        'nl':     'Oef - 12.3 Soorten variabelen: intermediaire variabelen',
        'labels': ['padmodel', 'begrippen', 'intermediair'],
        'desc_body': (
            "Welke variabelen in het model zijn **\u2018intermediaire\u2019** variabelen?\n\n"
            "1. Empathische bezorgdheid en empathische perspectiefneming\n"
            "2. Moreel oordeel (Stelen is OK)\n"
            "3. Morele intui\u00efties (individualiserend en groepsgericht), "
            "geanticipeerde schuld en morele boosheid\n"
            "4. Alleen geanticipeerde schuld en morele boosheid\n\n"
            "**Hint:** *Intermediaire variabelen ontvangen pijlen \u00e9n sturen pijlen door \u2014 "
            "zij liggen tussen exogene en endogene variabelen.*\n\n"
            "- Typ je antwoord als \u00e9\u00e9n enkel getal (1-4) om je keuze aan te geven\n"
        ),
        'answer': 3,
        'feedbacks': [
            ('1', False,
             "\u274c Fout. Empathische bezorgdheid en perspectiefneming zijn de *exogene* variabelen "
             "\u2014 zij ontvangen geen pijlen vanuit andere modelvariabelen.\\n\\n"
             "**Correct antwoord:** 3"),
            ('2', False,
             "\u274c Fout. Moreel oordeel is de *endogene* uitkomstvariabele \u2014 het ontvangt "
             "pijlen maar stuurt er geen naar andere modelvariabelen.\\n\\n"
             "**Correct antwoord:** 3"),
            ('3', True,
             "\u2705 Juist! De vier **intermediaire** variabelen zijn:\\n\\n"
             "1. Morele intui\u00efties (individualiserend)\\n"
             "2. Morele intui\u00efties (groepsgericht)\\n"
             "3. Geanticipeerde schuld\\n"
             "4. Morele boosheid\\n\\n"
             "Zij ontvangen allemaal pijlen \u00e9n sturen pijlen door naar andere variabelen in het model."),
            ('4', False,
             "\u274c Bijna! Geanticipeerde schuld en Morele boosheid zijn inderdaad intermediair, "
             "maar je vergeet ook **Morele intui\u00efties (individualiserend en groepsgericht)**.\\n\\n"
             "**Correct antwoord:** 3 (alle vier)"),
        ],
    },
    {
        'folder': 'Oef - 12.9',
        'nl':     'Oef - 12.9 R-kwadraat: betekenis onverklaarde variantie',
        'labels': ['padmodel', 'R-kwadraat', 'interpretatie', 'onverklaarde variantie'],
        'desc_body': (
            "De **R\u00b2** van de uitkomstvariabele **\u201cMoreel oordeel (Stelen is OK)\u201d** "
            "bedraagt 43%. Dit betekent dat **57%** van de variantie **niet** verklaard wordt "
            "door het model.\n\n"
            "Wat betekent dit concreet?\n\n"
            "1. Er zijn meetfouten in de gebruikte empathieschalen die de resultaten vertekenen\n"
            "2. Er zijn andere, niet-gemeten variabelen die ook het moreel oordeel be\u00efnvloeden "
            "en niet in dit model zijn opgenomen\n"
            "3. De padco\u00ebffici\u00ebnten zijn te klein om moreel oordeel te voorspellen\n"
            "4. Het model bevat te veel variabelen en is daardoor onbetrouwbaar\n\n"
            "**Hint:** *Onverklaarde variantie (1 \u2212 R\u00b2) weerspiegelt de invloed van "
            "factoren die buiten het model vallen.*\n\n"
            "- Typ je antwoord als \u00e9\u00e9n enkel getal (1-4) om je keuze aan te geven\n"
        ),
        'answer': 2,
        'feedbacks': [
            ('1', False,
             "\u274c Fout. Meetfouten zijn een mogelijke bron van variantie, maar de meest correcte "
             "interpretatie van onverklaarde variantie in een padmodel is dat relevante variabelen "
             "buiten het model vallen.\\n\\n**Correct antwoord:** 2"),
            ('2', True,
             "\u2705 Juist! De **57% onverklaarde variantie** betekent dat er andere factoren zijn "
             "die het moreel oordeel be\u00efnvloeden maar niet in dit model zijn opgenomen. "
             "Het model is een theoretisch gemotiveerde vereenvoudiging van de werkelijkheid \u2014 "
             "niet alle determinanten van moreel oordeel zijn erin opgenomen."),
            ('3', False,
             "\u274c Fout. De grootte van padco\u00ebffici\u00ebnten zegt iets over de *sterkte* van "
             "gevonden effecten, niet over wat er onverklaard blijft. Onverklaarde variantie "
             "verwijst naar variabelen buiten het model.\\n\\n**Correct antwoord:** 2"),
            ('4', False,
             "\u274c Fout. Meer variabelen zou R\u00b2 verhogen, niet verlagen. "
             "Onverklaarde variantie betekent dat er nog andere, niet-opgenomen factoren "
             "een rol spelen.\\n\\n**Correct antwoord:** 2"),
        ],
    },
]


def make_answer_r(answer_int, feedbacks):
    """Build Answer.R content from feedbacks list of (key, is_correct, text)."""
    fb_items = []
    for key, _, text in feedbacks:
        # text already contains \\n as literal backslash-n for R escape
        fb_items.append(f'            "{key}" = "{text}"')
    fb_block = ',\n'.join(fb_items)
    return (
        'context({\n'
        '  testcase(\n'
        '    "",\n'
        '    {\n'
        '      testEqual(\n'
        '        "",\n'
        '        function(env) as.numeric(env$evaluationResult),\n'
        f'        {answer_int},\n'
        '        comparator = function(generated, expected, ...) {\n'
        '          feedbacks <- list(\n'
        f'{fb_block}\n'
        '          )\n'
        '          key <- as.character(generated)\n'
        '          msg <- feedbacks[[key]] %||% "\u274c Geef een getal tussen 1 en 4 in."\n'
        '          get_reporter()$add_message(msg, type = "markdown")\n'
        '          generated == expected\n'
        '        }\n'
        '      )\n'
        '    }\n'
        '  )\n'
        '})\n'
    )


for ex in EXERCISES:
    folder = ex['folder']
    ex_path = os.path.join(BASE, folder)

    for sub in ['description/boilerplate', 'description/media', 'evaluation']:
        os.makedirs(os.path.join(ex_path, *sub.split('/')), exist_ok=True)

    shutil.copy(PADMODEL, os.path.join(
        ex_path, 'description', 'media', 'padmodel.png'))

    cfg = {
        "programming_language": "R",
        "access": "public",
        "description": {"names": {"nl": ex['nl']}},
        "evaluation": {"handler": "R"},
        "test_suite": "evaluation",
        "labels": ex['labels'],
        "internals": {
            "_info": "These fields are used for internal bookkeeping in Dodona, please do not change them."
        }
    }
    wu8(os.path.join(ex_path, 'config.json'),
        json.dumps(cfg, ensure_ascii=False, indent=2) + '\n')

    wu8(os.path.join(ex_path, 'description', 'description.nl.md'),
        INTRO + ex['desc_body'])

    wu8(os.path.join(ex_path, 'description', 'boilerplate', 'boilerplate'),
        '# Type of answer below\n')

    wu8(os.path.join(ex_path, 'evaluation', 'Answer.R'),
        make_answer_r(ex['answer'], ex['feedbacks']))

    print(f'Created : {folder}')


print('\n=== Final Chapter 12 structure ===')
for item in sorted(os.listdir(BASE)):
    if item.startswith('Oef') or item.startswith('Lees'):
        print(f'  {item}')
print('Done!')
