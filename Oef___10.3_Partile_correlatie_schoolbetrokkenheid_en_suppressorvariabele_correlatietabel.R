# https://dodona.be/en/courses/5645/series/71603/activities/694336834

# ============================================================================
# OEFENING 10.3: PartiÃ«le correlatie â€” schoolbetrokkenheid (correlatietabel)
# Suppressorvariabele: lage zelfcontrole
# ============================================================================
# Gegeven correlatietabel (n = 85 adolescenten):
#   X = Schoolbetrokkenheid,  Y = Delinquentie,  Z = Lage zelfcontrole
#
#         X       Y       Z
#   X    1       0.10   -0.65
#   Y    0.10    1      -0.55
#   Z   -0.65   -0.55    1
#
# Vul je eindresultaten in (vervang alle ???).
# Gebruik decimalen met PUNT (niet komma). Rond af op 4 decimalen.
# ============================================================================

# ----------------------------------------------------------------------------
# DEEL A: CORRELATIES AFLEZEN UIT DE TABEL
# ----------------------------------------------------------------------------

# 1) Bivariate correlatie tussen X (schoolbetrokkenheid) en Y (delinquentie)
r_XY <- ???

# 2) Bivariate correlatie tussen X (schoolbetrokkenheid) en Z (lage zelfcontrole)
r_XZ <- ???

# 3) Bivariate correlatie tussen Y (delinquentie) en Z (lage zelfcontrole)
r_YZ <- ???


# ----------------------------------------------------------------------------
# DEEL B: PARTIELE CORRELATIE
# ----------------------------------------------------------------------------
# Formule: r_XY.Z = (r_XY - r_XZ * r_YZ) / sqrt((1 - r_XZ^2) * (1 - r_YZ^2))

# 4) Teller: r_XY - r_XZ * r_YZ  (4 decimalen)
r_XY_teller <- ???

# 5) Noemer: sqrt((1 - r_XZ^2) * (1 - r_YZ^2))  (4 decimalen)
r_XY_noemer <- ???

# 6) Partiele correlatie r_XY.Z  (4 decimalen)
r_XY_Z <- ???


# ----------------------------------------------------------------------------
# DEEL C: INTERPRETATIE
# ----------------------------------------------------------------------------

# 7) Welk type effect heeft lage zelfcontrole (Z) op de relatie X-Y?
#    1 = Schijnverband: het verband verdwijnt grotendeels na controle voor Z
#    2 = Indirect verband: het verband verzwakt significant maar blijft deels aanwezig
#    3 = Suppressoreffect: een verborgen (sterker) verband wordt pas zichtbaar na controle
#    4 = Teken omgekeerd door positieve confoundering
conclusie_type <- ???

