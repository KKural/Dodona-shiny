path = r'C:\Users\kukumar\OneDrive - UGent\My Projects\Dodona\shiny_apps\app_anova\ANOVA_App_NL.R'
with open(path, encoding='utf-8') as f:
    txt = f.read()
before = txt.count('"#888"') + txt.count('"#555"')
txt = txt.replace('"#888"', '"#888888"').replace('"#555"', '"#555555"')
with open(path, 'w', encoding='utf-8') as f:
    f.write(txt)
print(f'Replaced {before} occurrences')
