# ============================================================
# Partiële Correlatie — Handmatige berekening (NL)
# - Hoofdstuk 10: De partiële correlatie als introductie tot de multivariate statistiek
# - Twee modi: (1) berekening vanuit ruwe data, (2) berekening vanuit correlatietabel
# - Criminologische scenario's in het Nederlands; structuur identiek aan correlatie/regressie-apps
# - Studenten berekenen: r_xy, r_xz, r_yz → r_xy.z = (r_xy - r_xz*r_yz) / sqrt((1-r_xz²)(1-r_yz²))
# - Alle waarheidswaarden worden berekend op basis van 2-decimalen weergavedata
# - 4-decimale controle voor studentinvoer; groen/rood veldvalidatie
# ============================================================

suppressPackageStartupMessages({
  library(shiny)
  library(ggplot2)
  library(dplyr)
  library(rhandsontable)
})

MAX_SAMPLE_SIZE <- 50

`%||%` <- function(a, b) if (is.null(a)) b else a

safe_seed <- function(seed_in) {
  if (is.null(seed_in) || length(seed_in) == 0) return(NULL)
  s <- suppressWarnings(as.numeric(seed_in))
  if (is.na(s)) return(NULL)
  s <- as.integer(abs(floor(s)) %% .Machine$integer.max)
  if (is.na(s) || s <= 0) return(NULL)
  s
}

check_decimals <- function(user_val, true_val, target_decimals = 4) {
  if (is.na(user_val) || is.na(true_val) || is.null(user_val) || is.null(true_val)) return(NA)
  round(user_val, target_decimals) == round(true_val, target_decimals)
}

is_decimal_miss <- function(user_val, true_val, target_decimals = 4) {
  if (is.na(user_val) || is.na(true_val)) return(FALSE)
  if (round(user_val, target_decimals) == round(true_val, target_decimals)) return(FALSE)
  any(sapply(seq_len(target_decimals - 1), function(d)
    round(user_val, d) == round(true_val, d)
  ))
}

check_col_vec <- function(user_vec, true_vec, target_decimals = 4) {
  if (is.null(user_vec) || is.null(true_vec)) return(rep(NA, length(true_vec)))
  mapply(function(u, t) {
    if (is.na(u) || is.na(t)) return(NA)
    check_decimals(u, t, target_decimals)
  }, user_vec, true_vec)
}

has_attempted <- function(val) {
  !is.null(val) && nzchar(trimws(as.character(val))) &&
    !is.na(suppressWarnings(as.numeric(val)))
}

safe_check <- function(user_val, true_val, decimals = 4) {
  if (!has_attempted(user_val)) return(NA)
  check_decimals(suppressWarnings(as.numeric(user_val)), true_val, decimals)
}

clamp_vec <- function(v, lo, hi) {
  if (is.null(v) || length(v) == 0) return(v)
  pmin(hi, pmax(lo, v))
}

# ============================================================
# SCENARIOS  (3 variabelen: X, Y, Z)
# Z = controlevariabele
# ============================================================

scenarios <- list(
  list(
    id    = "delinquency_age",
    title = "Delictpleging, slachtofferschap & leeftijd",
    vignette = "Wie kwaad doet, kwaad ontmoet? Er wordt verondersteld dat er een verband bestaat tussen het plegen van delicten (X) en het slachtoffer worden van delicten (Y). Maar wat als we controleren voor leeftijd (Z)?",
    vars  = list(
      x = list(name = "DelictenGepleegd",    unit = "aantal"),
      y = list(name = "DelictenSlachtoffer", unit = "aantal"),
      z = list(name = "Leeftijd",            unit = "jaar")
    ),
    entity   = "Scholier",
    r_xy_target = 0.65,
    r_xz_target = 0.60,
    r_yz_target = 0.55,
    x_range = c(0, 8),
    y_range = c(0, 6),
    z_range = c(14, 18)
  ),
  list(
    id    = "fitness_salary_service",
    title = "Fysieke bekwaamheid, salaris & dienstjaren",
    vignette = "Een onderzoeker vindt een negatieve correlatie tussen fysieke bekwaamheid (X) en salaris (Y) bij politieagenten. Maar dienstjaren (Z) beïnvloedt zowel conditie als salaris. Controleer voor dienstjaren.",
    vars  = list(
      x = list(name = "FysiekeBekvaamheid", unit = "score"),
      y = list(name = "Salaris",            unit = "index"),
      z = list(name = "DienstJaren",        unit = "jaar")
    ),
    entity   = "Agent",
    r_xy_target = -0.44,
    r_xz_target = -0.68,
    r_yz_target =  0.82,
    x_range = c(40, 100),
    y_range = c(30, 90),
    z_range = c(1, 30)
  ),
  list(
    id    = "disorder_fear_income",
    title = "Wanorde, angst & inkomensniveau",
    vignette = "Buurten met meer zichtbare wanorde (X) rapporteren hogere angstscores (Y). Mogelijk is het inkomensniveau van de buurt (Z) bepalend voor zowel wanorde als angst.",
    vars  = list(
      x = list(name = "WanordeIndex",    unit = "0–10"),
      y = list(name = "AngstScore",      unit = "0–100"),
      z = list(name = "InkomenNiveau",   unit = "index")
    ),
    entity   = "Buurt",
    r_xy_target =  0.65,
    r_xz_target = -0.55,
    r_yz_target = -0.50,
    x_range = c(1, 10),
    y_range = c(20, 90),
    z_range = c(20, 80)
  ),
  list(
    id    = "recidivism_support_age",
    title = "Recidive, ondersteuning & leeftijd bij aanvang",
    vignette = "Meer ondersteuningsuren na vrijlating (X) hangen samen met lager recidiverisico (Y). Leeftijd bij aanvang van begeleiding (Z) kan echter zowel de draagkracht voor ondersteuning als recidivekansen beïnvloeden.",
    vars  = list(
      x = list(name = "OndersteuningsUren", unit = "per maand"),
      y = list(name = "RecidiveRisico",     unit = "0–100"),
      z = list(name = "LeeftijdAanvang",    unit = "jaar")
    ),
    entity   = "Deelnemer",
    r_xy_target = -0.50,
    r_xz_target =  0.40,
    r_yz_target = -0.45,
    x_range = c(0, 40),
    y_range = c(20, 90),
    z_range = c(18, 55)
  ),
  list(
    id    = "training_clicks_experience",
    title = "Cybercrime-training, klikratio & werkervaring",
    vignette = "Meer trainingsuren (X) leiden tot een lager klikratio bij phishing (Y). Maar werkervaring (Z) verhoogt zowel de kans op trainingsbereidheid als digitale waakzaamheid.",
    vars  = list(
      x = list(name = "TrainingsUren",  unit = "uren"),
      y = list(name = "Klikratio",      unit = "%"),
      z = list(name = "WerkErvaring",   unit = "jaren")
    ),
    entity   = "Medewerker",
    r_xy_target = -0.55,
    r_xz_target =  0.45,
    r_yz_target = -0.40,
    x_range = c(0, 30),
    y_range = c(5, 60),
    z_range = c(1, 25)
  ),
  list(
    id    = "guardianship_victimization_density",
    title = "Toezicht, slachtofferschap & bevolkingsdichtheid",
    vignette = "Meer buurttoezicht (X) hangt samen met minder slachtofferschap (Y). Bevolkingsdichtheid (Z) kan echter zowel toezichts­capaciteit als blootstelling aan criminaliteit beïnvloeden.",
    vars  = list(
      x = list(name = "Toezicht",              unit = "0–10"),
      y = list(name = "Slachtofferschap",      unit = "aantal"),
      z = list(name = "BevolkingsDichtheid",   unit = "per km²")
    ),
    entity   = "Buurt",
    r_xy_target = -0.45,
    r_xz_target = -0.35,
    r_yz_target =  0.50,
    x_range = c(1, 10),
    y_range = c(0, 15),
    z_range = c(200, 5000)
  ),
  list(
    id    = "impulsivity_aggression_parental",
    title = "Impulsiviteit, agressie & ouderlijk toezicht",
    vignette = "Hogere impulsiviteit (X) hangt samen met meer agressieve schoolincidenten (Y). Ouderlijk toezicht (Z) kan zowel impulsiviteit matigen als agressief gedrag direct beïnvloeden.",
    vars  = list(
      x = list(name = "Impulsiviteit",     unit = "z-score"),
      y = list(name = "AgressieIncidenten", unit = "schoolmeldingen"),
      z = list(name = "OuderlijkToezicht", unit = "0–10")
    ),
    entity   = "Student",
    r_xy_target =  0.55,
    r_xz_target = -0.50,
    r_yz_target = -0.45,
    x_range = c(-3, 3),
    y_range = c(0, 12),
    z_range = c(1, 10)
  ),
  list(
    id    = "police_trust_contact_ethnicity",
    title = "Politiecontact, vertrouwen & etnische achtergrond",
    vignette = "Meer positief politiecontact (X) hangt samen met hoger vertrouwen in politie (Y). Zelf-gerapporteerde etnische minderheids­positie (Z) kan echter zowel de aard van contact als het basisvertrouwen bepalen.",
    vars  = list(
      x = list(name = "PositiefContact",    unit = "score"),
      y = list(name = "VertrouwenInPolitie", unit = "1–7"),
      z = list(name = "MinderheidsScore",   unit = "0–1")
    ),
    entity   = "Respondent",
    r_xy_target =  0.60,
    r_xz_target = -0.40,
    r_yz_target = -0.50,
    x_range = c(1, 7),
    y_range = c(1, 7),
    z_range = c(0, 1)
  )
)

scenario_choices <- setNames(
  vapply(scenarios, `[[`, character(1), "id"),
  vapply(scenarios, `[[`, character(1), "title")
)

get_sc <- function(id) {
  for (sc in scenarios) if (identical(sc$id, id)) return(sc)
  NULL
}

# ============================================================
# DATA GENERATION (trivariate correlated data)
# ============================================================

make_partial_data <- function(sc, n = 15, seed = NULL) {
  if (is.null(sc)) return(NULL)
  n <- as.integer(n)
  if (is.na(n) || n < 4) n <- 4L
  n <- min(n, as.integer(MAX_SAMPLE_SIZE))

  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)

  # Build Sigma from target correlations
  r_xy <- sc$r_xy_target; r_xz <- sc$r_xz_target; r_yz <- sc$r_yz_target
  Sigma <- matrix(c(1, r_xy, r_xz,
                    r_xy, 1, r_yz,
                    r_xz, r_yz, 1), 3, 3)
  # Ensure positive definite
  evals <- eigen(Sigma, only.values = TRUE)$values
  if (any(evals <= 0)) { Sigma <- Sigma + diag(3) * (abs(min(evals)) + 0.05) }

  # Cholesky draw
  L   <- tryCatch(chol(Sigma), error = function(e) diag(3))
  Z   <- matrix(rnorm(n * 3), n, 3)
  XYZ <- Z %*% L

  # Scale to scenario ranges
  scale_to <- function(v, lo, hi) {
    v_s <- (v - min(v)) / (max(v) - min(v) + 1e-9)
    round(lo + v_s * (hi - lo), 2)
  }
  x_raw <- scale_to(XYZ[,1], sc$x_range[1], sc$x_range[2])
  y_raw <- scale_to(XYZ[,2], sc$y_range[1], sc$y_range[2])
  z_raw <- scale_to(XYZ[,3], sc$z_range[1], sc$z_range[2])

  data.frame(
    Eenheid = paste(sc$entity, seq_len(n)),
    setNames(data.frame(x_raw, y_raw, z_raw),
             c(sc$vars$x$name, sc$vars$y$name, sc$vars$z$name)),
    stringsAsFactors = FALSE
  )
}

# ============================================================
# TRUTH CALCULATION (from raw data, 2dp display → 4dp intermediates)
# ============================================================

calc_partial_truth <- function(df, x_name, y_name, z_name) {
  if (is.null(df) || nrow(df) < 4) return(NULL)
  X <- round(as.numeric(df[[x_name]]), 2)
  Y <- round(as.numeric(df[[y_name]]), 2)
  Z <- round(as.numeric(df[[z_name]]), 2)
  n <- length(X)

  # Means (4dp)
  x_bar <- round(mean(X), 4); y_bar <- round(mean(Y), 4); z_bar <- round(mean(Z), 4)

  # Deviations
  dx <- round(X - x_bar, 4); dy <- round(Y - y_bar, 4); dz <- round(Z - z_bar, 4)
  dx2 <- round(dx^2, 4); dy2 <- round(dy^2, 4); dz2 <- round(dz^2, 4)
  dxdy <- round(dx * dy, 4); dxdz <- round(dx * dz, 4); dydz <- round(dy * dz, 4)

  # Sums of squares and cross-products
  SS_x  <- round(sum(dx2),  4); SS_y  <- round(sum(dy2),  4); SS_z  <- round(sum(dz2),  4)
  SCP_xy <- round(sum(dxdy), 4); SCP_xz <- round(sum(dxdz), 4); SCP_yz <- round(sum(dydz), 4)

  # Variances and SDs (n-1)
  Var_x <- round(SS_x  / (n-1), 4); Var_y <- round(SS_y  / (n-1), 4); Var_z <- round(SS_z  / (n-1), 4)
  SD_x  <- round(sqrt(Var_x), 4);   SD_y  <- round(sqrt(Var_y), 4);   SD_z  <- round(sqrt(Var_z), 4)

  # Covariances
  Cov_xy <- round(SCP_xy / (n-1), 4)
  Cov_xz <- round(SCP_xz / (n-1), 4)
  Cov_yz <- round(SCP_yz / (n-1), 4)

  # Bivariate correlations
  r_xy <- round(Cov_xy / (SD_x * SD_y), 4)
  r_xz <- round(Cov_xz / (SD_x * SD_z), 4)
  r_yz <- round(Cov_yz / (SD_y * SD_z), 4)

  # Partial correlation r_xy.z
  num   <- round(r_xy - r_xz * r_yz, 4)
  denom <- round(sqrt((1 - r_xz^2) * (1 - r_yz^2)), 4)
  r_xy_z <- if (!is.na(denom) && denom > 0) round(num / denom, 4) else NA_real_

  # Conclusie type: 1=schijnverband, 2=indirect/confounding, 3=suppressor, 4=direct
  conclusie_type <- if (is.na(r_xy_z) || is.na(r_xy)) NA_integer_
    else if (abs(r_xy_z) < 0.08) 1L
    else if (abs(r_xy_z) < abs(r_xy) - 0.05) 2L
    else if (abs(r_xy_z) > abs(r_xy) + 0.05) 3L
    else 4L

  list(
    n = n,
    x_bar = x_bar, y_bar = y_bar, z_bar = z_bar,
    dx = dx, dy = dy, dz = dz,
    dx2 = dx2, dy2 = dy2, dz2 = dz2,
    dxdy = dxdy, dxdz = dxdz, dydz = dydz,
    SS_x = SS_x, SS_y = SS_y, SS_z = SS_z,
    SCP_xy = SCP_xy, SCP_xz = SCP_xz, SCP_yz = SCP_yz,
    Var_x = Var_x, Var_y = Var_y, Var_z = Var_z,
    SD_x = SD_x, SD_y = SD_y, SD_z = SD_z,
    Cov_xy = Cov_xy, Cov_xz = Cov_xz, Cov_yz = Cov_yz,
    r_xy = r_xy, r_xz = r_xz, r_yz = r_yz,
    num_partial = num, denom_partial = denom,
    r_xy_z = r_xy_z, conclusie_type = conclusie_type
  )
}

# Also: truth from a given correlation matrix (Mode 2)
calc_partial_from_r <- function(r_xy, r_xz, r_yz) {
  r_xy <- round(r_xy, 4); r_xz <- round(r_xz, 4); r_yz <- round(r_yz, 4)
  num   <- round(r_xy - r_xz * r_yz, 4)
  denom <- round(sqrt((1 - r_xz^2) * (1 - r_yz^2)), 4)
  r_xy_z <- if (!is.na(denom) && denom > 0) round(num / denom, 4) else NA_real_
  list(r_xy = r_xy, r_xz = r_xz, r_yz = r_yz,
       num = num, denom = denom, r_xy_z = r_xy_z)
}

# ============================================================
# BLANK DEVIATION TABLE (rhandsontable, Deel III)
# ============================================================

build_blank_dev_table <- function(df, x_name, y_name, z_name) {
  if (is.null(df) || nrow(df) == 0) return(NULL)
  n <- nrow(df)
  tbl <- data.frame(
    Eenheid  = df[[1]],
    X        = round(df[[x_name]], 2),
    Y        = round(df[[y_name]], 2),
    Z        = round(df[[z_name]], 2),
    dX       = rep(NA_real_, n),
    dY       = rep(NA_real_, n),
    dZ       = rep(NA_real_, n),
    dX2      = rep(NA_real_, n),
    dY2      = rep(NA_real_, n),
    dZ2      = rep(NA_real_, n),
    dXdY     = rep(NA_real_, n),
    dXdZ     = rep(NA_real_, n),
    dYdZ     = rep(NA_real_, n),
    check.names = FALSE, stringsAsFactors = FALSE
  )
  names(tbl) <- c("Eenheid", x_name, y_name, z_name,
                  paste0("(X-X\u0305)"), paste0("(Y-Y\u0305)"), paste0("(Z-Z\u0305)"),
                  "(X-X\u0305)\u00B2", "(Y-Y\u0305)\u00B2", "(Z-Z\u0305)\u00B2",
                  "(X-X\u0305)(Y-Y\u0305)", "(X-X\u0305)(Z-Z\u0305)", "(Y-Y\u0305)(Z-Z\u0305)")
  tbl
}

build_blank_var_sd_table <- function() {
  data.frame(
    Maat = c("SS = \u03A3(dev)\u00B2", "Var = SS/(n\u22121)", "SD = \u221AVar"),
    X = rep(NA_real_, 3),
    Y = rep(NA_real_, 3),
    Z = rep(NA_real_, 3),
    check.names = FALSE, stringsAsFactors = FALSE
  )
}

build_blank_cov_r_table <- function() {
  data.frame(
    Maat = c("SCP = \u03A3(dX)(dY)", "Cov = SCP/(n\u22121)", "r = Cov/(SD\u00B7SD)"),
    XY = rep(NA_real_, 3),
    XZ = rep(NA_real_, 3),
    YZ = rep(NA_real_, 3),
    check.names = FALSE, stringsAsFactors = FALSE
  )
}

build_var_sd_truth_table <- function(t) {
  data.frame(
    X = c(t$SS_x, t$Var_x, t$SD_x),
    Y = c(t$SS_y, t$Var_y, t$SD_y),
    Z = c(t$SS_z, t$Var_z, t$SD_z),
    check.names = FALSE, stringsAsFactors = FALSE
  )
}

build_cov_r_truth_table <- function(t) {
  data.frame(
    XY = c(t$SCP_xy, t$Cov_xy, t$r_xy),
    XZ = c(t$SCP_xz, t$Cov_xz, t$r_xz),
    YZ = c(t$SCP_yz, t$Cov_yz, t$r_yz),
    check.names = FALSE, stringsAsFactors = FALSE
  )
}

check_summary_table <- function(tbl, truth_tbl, cols) {
  if (is.null(tbl) || is.null(truth_tbl)) return(logical(0))
  if (!all(cols %in% names(tbl))) return(rep(NA, nrow(truth_tbl) * length(cols)))
  unlist(lapply(cols, function(col) check_col_vec(as.numeric(tbl[[col]]), truth_tbl[[col]])))
}

# ============================================================
# UI
# ============================================================

ui <- fluidPage(
  tags$head(tags$title("Partiële Correlatie - Oefeningen")),
  tags$head(tags$style(HTML('
    body{background:linear-gradient(180deg,#F6FAFF 0%,#F9F7FF 100%);}
    .card{background:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 6px 18px rgba(0,0,0,0.08);}
    .muted{color:#666;} .ok{color:#0E7C7B;font-weight:700;} .err{color:#B00020;font-weight:600;}
    .btn-wide{min-width:220px;} .disabled{opacity:.5;pointer-events:none;}
    .accent{background:#E3F2FD;border-left:4px solid #42A5F5;padding:8px 10px;border-radius:10px;}
    .title{font-weight:800;color:#3F51B5;}
    .traffic{display:flex;gap:8px;margin-top:8px}
    .light{width:12px;height:12px;border-radius:50%;display:inline-block;background:#BDBDBD;}
    .feedback{color:#B00020;font-weight:600;margin-top:4px;line-height:1.45;white-space:normal;overflow-wrap:anywhere;word-break:break-word;}
    .feedback-compact{min-height:1.6em;}
    .feedback-panel{margin-top:10px;padding:10px 12px;border-radius:10px;background:#FFF5F7;border:1px solid rgba(176,0,32,0.12);}
    .feedback-detail-item + .feedback-detail-item{margin-top:8px;padding-top:8px;border-top:1px solid rgba(176,0,32,0.10);}
    .feedback-detail-label{display:block;font-weight:700;color:#7A0019;margin-bottom:2px;}
    input.invalid{border:2px solid #D50000 !important; box-shadow:0 0 0 2px rgba(213,0,0,0.10) inset;}
    input.valid{border:2px solid #00C853 !important; box-shadow:0 0 0 2px rgba(0,200,83,0.10) inset;}
    .grid-compact{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
    .grid-compact-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
    .grid-compact-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
    .cell-invalid{background:#ffebee !important;border:2px solid #D50000 !important;}
    .cell-valid{background:#e8f5e9 !important;border:2px solid #00C853 !important;}
    .rhandsontable th,.rhandsontable td{text-align:center !important;}
    .formula-box{background:#FFF8E1;border-left:4px solid #FFC107;padding:10px 14px;border-radius:10px;font-family:monospace;font-size:1.05em;margin:8px 0;}
  '))),
  tags$head(tags$script(HTML("
    Shiny.addCustomMessageHandler('toggleViz', function(show){
      var el = document.getElementById('viz_block');
      if (!el) return;
      if (show){ el.classList.remove('disabled'); el.style.transition='opacity 0.3s ease-in-out'; el.style.opacity='1'; }
      else { el.classList.add('disabled'); el.style.opacity='0.5'; }
    });
    Shiny.addCustomMessageHandler('paintLight', function(msg){
      var el = document.getElementById(msg.id);
      if (!el) return;
      el.style.transition='background-color 0.2s ease-in-out';
      el.style.background = msg.col || '#BDBDBD';
    });
    Shiny.addCustomMessageHandler('markField', function(msg){
      var el = document.getElementById(msg.id);
      if (!el) return;
      el.classList.remove('invalid','valid');
      el.style.transition='border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out';
      if (msg.state==='invalid') el.classList.add('invalid');
      else if (msg.state==='valid') el.classList.add('valid');
    });
    document.addEventListener('DOMContentLoaded', function(){
      var cards = document.querySelectorAll('.card');
      cards.forEach(function(card){
        card.style.transition='box-shadow 0.2s ease-in-out';
        card.addEventListener('mouseenter',function(){ this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; });
        card.addEventListener('mouseleave',function(){ this.style.boxShadow='0 6px 18px rgba(0,0,0,0.08)'; });
      });
    });
  "))),

  titlePanel(div(class = "title", "Oefeningen voor Partiële Correlatie (Hoofdstuk 10)")),

  sidebarLayout(
    sidebarPanel(
      width = 4,

      div(class = "card",
          h4("Hoe deze webpagina werkt"),
          HTML("<ul style='margin:6px 0 0 0px; padding-left: 20px;'>
            <li>Oefen <b>partiële correlatie</b> met criminologische datasets (3 variabelen: X, Y en controlevariabele Z).</li>
            <li>Kies een <b>invoermodus</b>:
              <ul style='margin-top:4px;'>
                <li><b>Ruwe data:</b> bereken alle correlaties stap voor stap vanuit de dataset</li>
                <li><b>Correlatietabel:</b> bereken r_xy.z direct vanuit gegeven r_xy, r_xz en r_yz</li>
              </ul>
            </li>
            <li>Voltooi de stappen verdeeld over de Delen:
              <ul style='margin-top:4px;'>
                <li><b>Deel I:</b> Dataset bekijken</li>
                <li><b>Deel II:</b> Stap 1 (Gemiddelden)</li>
                <li><b>Deel III:</b> Stappen 2-4 (Afwijkingtabel)</li>
                <li><b>Deel IV:</b> Stap 5 (Varianties en SD)</li>
                <li><b>Deel V:</b> Stap 6 (Covarianties & bivariate correlaties)</li>
                <li><b>Deel VI:</b> Stap 7 (Partiële correlatie r_xy.z)</li>
                <li><b>Deel VII:</b> Visualisaties (vrijkomt na correcte invoer)</li>
              </ul>
            </li>
            <li>Velden worden <span style='color:#00C853;font-weight:700;'>groen</span> wanneer correct en <span style='color:#D50000;font-weight:700;'>rood</span> wanneer fout.</li>
          </ul>")
      ),
      br(),

      div(class = "card",
          h4("Scenario en dataset"),
          div(class = "muted", style = "margin-bottom: 10px;",
              HTML("<b>Twee manieren om data te verkrijgen:</b><br/>
              <b>1. Selecteer een specifiek scenario</b> uit de dropdown en klik 'Genereer dataset'<br/>
              <b>2. Kies een willekeurig scenario</b> via 'Willekeurig scenario'")),
          radioButtons("mode", "Invoermodus",
                       choices = c("Ruwe data (stap voor stap)" = "raw",
                                   "Correlatietabel (formule)" = "corrtable"),
                       selected = "raw", inline = FALSE),
          br(),
          conditionalPanel("input.mode == 'raw'",
            selectInput("scenario", "Scenario", choices = scenario_choices),
            helpText("Kies een criminologische context met 3 variabelen (X, Y, Z)."),
            numericInput("n", paste0("Steekproefgrootte N (4–", MAX_SAMPLE_SIZE, ")"),
                         value = 15, min = 4, max = MAX_SAMPLE_SIZE, step = 1),
            textInput("seed", "Datasetcode (seed, optioneel)", value = ""),
            helpText(HTML("<b>Zelfde code = elke keer dezelfde dataset.</b>")),
            fluidRow(
              column(5, actionButton("gen",      "Genereer dataset",     class = "btn btn-success btn-wide")),
              column(5, actionButton("new_same", "Willekeurig scenario", class = "btn btn-default btn-wide"))
            ),
            uiOutput("seed_echo")
          ),
          conditionalPanel("input.mode == 'corrtable'",
            helpText(HTML("<b>Voer de drie bivariate correlaties in en klik 'Bereken'.</b><br/>
              Formule: r<sub>xy.z</sub> = (r<sub>xy</sub> − r<sub>xz</sub>·r<sub>yz</sub>) /
              √((1−r<sub>xz</sub>²)(1−r<sub>yz</sub>²))")),
            numericInput("ct_rxy", "r_xy (correlatie X en Y)", value = NA, min = -1, max = 1, step = 0.01),
            numericInput("ct_rxz", "r_xz (correlatie X en Z)", value = NA, min = -1, max = 1, step = 0.01),
            numericInput("ct_ryz", "r_yz (correlatie Y en Z)", value = NA, min = -1, max = 1, step = 0.01),
            actionButton("calc_ct", "Bereken partiële correlatie", class = "btn btn-success"),
            uiOutput("ct_truth_echo")
          )
      ),
      br(),

      div(class = "card",
          h4("Stappen (NL)"),
          HTML(paste0(
            "<div class='accent'><b>Stappen voor partiële correlatie</b>",
            "<ol style='margin:6px 0 0 18px;'>",
            "<li>Bereken gemiddelden: X&#772;, Y&#772;, Z&#772;.</li>",
            "<li>Bereken afwijkingen: (X&#8722;X&#772;), (Y&#8722;Y&#772;), (Z&#8722;Z&#772;).</li>",
            "<li>Kwadrateer en bereken kruisproducten: (X&#8722;X&#772;)², (Y&#8722;Y&#772;)², (Z&#8722;Z&#772;)², en de drie kruisproducten.</li>",
            "<li>Tel de kolommen op: SS_X, SS_Y, SS_Z en SCP_XY, SCP_XZ, SCP_YZ.</li>",
            "<li>Bereken varianties Var(X/Y/Z) = SS/(n&#8722;1) en SD = &radic;Var.</li>",
            "<li>Bereken covarianties Cov = SCP/(n&#8722;1) en bivariate correlaties r = Cov/(SD·SD).</li>",
            "<li>Bereken de partiële correlatie:<br/>",
            "r<sub>xy.z</sub> = (r<sub>xy</sub> &#8722; r<sub>xz</sub>·r<sub>yz</sub>) / &#8730;((1&#8722;r<sub>xz</sub>²)(1&#8722;r<sub>yz</sub>²))</li>",
            "</ol></div>"
          ))
      )
    ),

    mainPanel(
      # MODE: Raw data steps
      conditionalPanel("input.mode == 'raw'",

        div(class = "card",
            h4("Deel I — Dataset"),
            div(class = "muted", "Bekijk de dataset met drie variabelen voordat u begint."),
            uiOutput("dataset_vignette"),
            div(style = "display: flex; justify-content: center;",
                rHandsontableOutput("data_view")),
            uiOutput("dataset_footer")
        ),
        br(),

        div(class = "card",
            h4("Deel II — Stap 1: Rekenkundige Gemiddelden (4 decimalen)"),
            div(class = "muted", "Bereken het gemiddelde voor X, Y en Z."),
            uiOutput("means_ui"),
            uiOutput("means_feedback"),
            uiOutput("means_detail_feedback")
        ),
        br(),

        div(class = "card", id = "part3_card",
            h4("Deel III — Stappen 2-4: Afwijkingtabel (4 decimalen)"),
            div(class = "muted", "Vul afwijkingen, kwadraten en kruisproducten in voor alle observaties."),
            helpText(HTML("Kolommen: <b>(X-X&#772;)</b>, <b>(Y-Y&#772;)</b>, <b>(Z-Z&#772;)</b>, hun kwadraten en de drie kruisproducten. Gebruik 4 decimalen.")),
            div(style = "display: flex; justify-content: center;",
                rHandsontableOutput("calc_table")),
            br(),
            uiOutput("table_feedback")
        ),
        br(),

        div(class = "card",
            h4("Deel IV — Stap 5: Sommen, Varianties & Standaarddeviaties (4 decimalen)"),
            div(class = "muted", "Tel de kolommen op en bereken varianties en standaarddeviaties voor X, Y en Z."),
            div(class = "muted", "Kopieer en plak desgewenst een volledig 3×3 blok uit Excel in de tabel hieronder."),
            div(style = "display: flex; justify-content: center;",
                rHandsontableOutput("var_sd_table")),
            br(),
            uiOutput("var_sd_status")
        ),
        br(),

        div(class = "card",
            h4("Deel V — Stap 6: Sommen Kruisproducten, Covarianties & Bivariate Correlaties (4 decimalen)"),
            div(class = "muted", "Bereken de som van elk kruisproduct, dan covarianties en bivariate correlaties voor alle drie variabelenparen."),
            div(class = "muted", "Ook hier kunt u een volledig 3×3 blok rechtstreeks vanuit Excel plakken."),
            div(style = "display: flex; justify-content: center;",
                rHandsontableOutput("cov_r_table")),
            br(),
            uiOutput("cov_r_status")
        ),
        br(),

        div(class = "card",
            h4("Deel VI — Stap 7: Partiële Correlatie r_xy.z (4 decimalen)"),
            div(class = "muted",
                HTML("Gebruik de drie bivariate correlaties om de partiële correlatie r<sub>xy.z</sub> te berekenen.")),
            div(class = "formula-box",
                HTML("r<sub>xy.z</sub> = (r<sub>xy</sub> \u2212 r<sub>xz</sub> &middot; r<sub>yz</sub>) &nbsp;/&nbsp; &radic;((1 \u2212 r<sub>xz</sub>&sup2;)(1 \u2212 r<sub>yz</sub>&sup2;))")),
            fluidRow(
              column(4, strong("Teller: r_xy \u2212 r_xz\u00B7r_yz"),
                     numericInput("partial_num", NULL, value = NA, step = .0001),
                     uiOutput("partial_num_light"), uiOutput("msg_partial_num")),
              column(4, strong("Noemer: \u221A((1\u2212r_xz\u00B2)(1\u2212r_yz\u00B2))"),
                     numericInput("partial_denom", NULL, value = NA, step = .0001),
                     uiOutput("partial_denom_light"), uiOutput("msg_partial_denom")),
              column(4, strong("r_xy.z (partiële correlatie)"),
                     numericInput("r_xy_z", NULL, value = NA, step = .0001, min = -1, max = 1),
                     uiOutput("r_xy_z_light"), uiOutput("msg_r_xy_z"))
            ),
            uiOutput("partial_status"),
            uiOutput("partial_detail_feedback"),
            br(),
            div(
              strong("Conclusie: wat zegt de parti\u00eble correlatie over het verband?"),
              div(class="muted", style="margin-bottom:6px;",
                  "Vergelijk r_xy.z met de ongecontroleerde r_xy en kies de beste omschrijving."),
              radioButtons("conclusie_type", NULL,
                choices = c(
                  "1 \u2014 Schijnverband: r_xy.z \u2248 0, het verband was volledig door Z verklaard" = "1",
                  "2 \u2014 Indirect verband: r_xy.z daalt maar blijft zinvol (Z is derde variabele)" = "2",
                  "3 \u2014 Suppressor: r_xy.z stijgt na controle voor Z" = "3",
                  "4 \u2014 Direct verband: r_xy.z verandert nauwelijks" = "4"
                ),
                selected = character(0)
              ),
              uiOutput("msg_conclusie")
            )
        ),
        br(),

        uiOutput("final_success_message"),

        div(class = "card",
            h4("Deel VII — Visualisaties & Conclusie (vrijkomt na correcte invoer)"),
            div(id = "viz_block", class = "disabled",
                uiOutput("viz_content"))
        )
      ),

      # MODE: Correlation table (formula only)
      conditionalPanel("input.mode == 'corrtable'",
        div(class = "card",
            h4("Correlatietabel — Partiële Correlatie via Formule"),
            div(class = "muted", "Voer de drie bivariate correlaties in via de zijbalk en klik 'Bereken'. Vul daarna de teller, noemer en het eindresultaat in."),
            uiOutput("ct_formula_display"),
            br(),
            div(class = "formula-box",
                HTML("r<sub>xy.z</sub> = (r<sub>xy</sub> \u2212 r<sub>xz</sub> &middot; r<sub>yz</sub>) &nbsp;/&nbsp; &radic;((1 \u2212 r<sub>xz</sub>&sup2;)(1 \u2212 r<sub>yz</sub>&sup2;))")),
            br(),
            fluidRow(
              column(4, strong("Teller: r_xy \u2212 r_xz\u00B7r_yz"),
                     numericInput("ct_num", NULL, value = NA, step = .0001),
                     uiOutput("ct_num_light"),
                     uiOutput("msg_ct_num")),
              column(4, strong("Noemer: \u221A((1\u2212r_xz\u00B2)(1\u2212r_yz\u00B2))"),
                     numericInput("ct_denom", NULL, value = NA, step = .0001),
                     uiOutput("ct_denom_light"),
                     uiOutput("msg_ct_denom")),
              column(4, strong("r_xy.z"),
                     numericInput("ct_result", NULL, value = NA, step = .0001, min = -1, max = 1),
                     uiOutput("ct_result_light"),
                     uiOutput("msg_ct_result"))
            ),
            uiOutput("ct_status"),
            uiOutput("ct_detail_feedback"),
            br(),
            uiOutput("ct_interpretation")
        )
      )
    )
  )
)

# ============================================================
# SERVER
# ============================================================

server <- function(input, output, session) {

  rv        <- reactiveValues(df = NULL, truth = NULL, sc = NULL)
  ct_truth  <- reactiveVal(NULL)
  user_calc <- reactiveVal(NULL)
  user_var_sd <- reactiveVal(NULL)
  user_cov_r  <- reactiveVal(NULL)
  feedback_store <- reactiveValues()

  strip_html <- function(x) {
    if (is.null(x) || length(x) == 0) return("")
    x <- paste(as.character(x), collapse = " ")
    x <- gsub("<br\\s*/?>", "\n", x, perl = TRUE)
    x <- gsub("<[^>]+>", "", x)
    x <- gsub("&nbsp;", " ", x, fixed = TRUE)
    x <- gsub("&#8212;|&mdash;", "-", x)
    x <- gsub("&#8722;", "-", x)
    x <- gsub("&#8800;", "!=", x)
    x <- gsub("&#8804;", "<=", x)
    x <- gsub("&#8805;", ">=", x)
    x <- gsub("&#215;", "x", x)
    x <- gsub("&#178;", "^2", x)
    x <- gsub("&#233;", "e", x)
    x <- gsub("&#235;", "e", x)
    x <- gsub("&#236;|&#237;|&#238;|&#239;", "i", x)
    x <- gsub("&radic;", "sqrt", x, fixed = TRUE)
    x <- gsub("&middot;", "*", x, fixed = TRUE)
    x <- gsub("&lt;", "<", x, fixed = TRUE)
    x <- gsub("&gt;", ">", x, fixed = TRUE)
    x <- gsub("&amp;", "&", x, fixed = TRUE)
    x <- gsub("[\r\n\t]+", " ", x)
    trimws(x)
  }

  short_feedback_html <- function(msg) {
    if (is.null(msg) || !nzchar(trimws(as.character(msg)))) return(NULL)
    parts <- unlist(strsplit(as.character(msg), "<br\\s*/?>", perl = TRUE))
    trimws(parts[1])
  }

  set_feedback_msg <- function(id, msg) {
    feedback_store[[id]] <- msg
    invisible(msg)
  }

  clear_feedback_store <- function() {
    ids <- names(reactiveValuesToList(feedback_store))
    if (length(ids) == 0) return(invisible(NULL))
    for (id in ids) feedback_store[[id]] <- NULL
    invisible(NULL)
  }

  feedback_ui <- function(id, msg, compact = TRUE) {
    set_feedback_msg(id, msg)
    short_msg <- short_feedback_html(msg)
    if (is.null(short_msg) || !nzchar(strip_html(short_msg))) return(NULL)
    div(class = paste("feedback", if (compact) "feedback-compact" else NULL), HTML(short_msg))
  }

  feedback_panel_ui <- function(id_map, title = "Uitgebreide feedback") {
    msgs <- reactiveValuesToList(feedback_store)
    items <- Filter(function(it) !is.null(it$msg) && nzchar(strip_html(it$msg)),
                    lapply(seq_along(id_map), function(i) {
                      id <- unname(id_map[[i]])
                      list(label = names(id_map)[i], msg = msgs[[id]])
                    }))
    if (length(items) == 0) return(NULL)
    div(
      class = "feedback-panel",
      tags$strong(title),
      lapply(items, function(item) {
        div(
          class = "feedback-detail-item",
          tags$span(class = "feedback-detail-label", item$label),
          div(class = "feedback", HTML(item$msg))
        )
      })
    )
  }

  reset_raw_inputs <- function() {
    for (fld in c("partial_num", "partial_denom", "r_xy_z")) {
      updateNumericInput(session, fld, value = NA)
    }
    t <- rv$truth
    if (!is.null(t)) {
      updateNumericInput(session, "x_bar", value = NA)
      updateNumericInput(session, "y_bar", value = NA)
      updateNumericInput(session, "z_bar", value = NA)
    }
    user_calc(NULL)
    user_var_sd(NULL)
    user_cov_r(NULL)
    clear_feedback_store()
  }

  # ---- Generate ----
  observeEvent(input$gen, {
    sc <- get_sc(input$scenario); if (is.null(sc)) return()
    n  <- max(4L, min(as.integer(MAX_SAMPLE_SIZE), as.integer(input$n %||% 15)))
    df <- make_partial_data(sc, n = n, seed = safe_seed(input$seed))
    rv$df    <- df
    rv$truth <- calc_partial_truth(df, sc$vars$x$name, sc$vars$y$name, sc$vars$z$name)
    rv$sc    <- sc
    reset_raw_inputs()
  })

  observeEvent(input$new_same, {
    ids    <- vapply(scenarios, `[[`, character(1), "id")
    others <- ids[ids != input$scenario]
    chosen <- if (length(others) > 0) sample(others, 1) else sample(ids, 1)
    updateSelectInput(session, "scenario", selected = chosen)
    updateTextInput(session, "seed", value = as.character(sample(1:9999, 1)))
    sc <- get_sc(chosen); if (is.null(sc)) return()
    n  <- max(4L, min(as.integer(MAX_SAMPLE_SIZE), as.integer(input$n %||% 15)))
    df <- make_partial_data(sc, n = n, seed = NULL)
    rv$df    <- df
    rv$truth <- calc_partial_truth(df, sc$vars$x$name, sc$vars$y$name, sc$vars$z$name)
    rv$sc    <- sc
    reset_raw_inputs()
  })

  # ---- Correlation table mode ----
  observeEvent(input$calc_ct, {
    r_xy <- input$ct_rxy; r_xz <- input$ct_rxz; r_yz <- input$ct_ryz
    if (any(is.na(c(r_xy, r_xz, r_yz)))) return()
    ct_truth(calc_partial_from_r(r_xy, r_xz, r_yz))
    updateNumericInput(session, "ct_num",    value = NA)
    updateNumericInput(session, "ct_denom",  value = NA)
    updateNumericInput(session, "ct_result", value = NA)
    clear_feedback_store()
  })

  output$ct_truth_echo <- renderUI({
    t <- ct_truth(); if (is.null(t)) return(NULL)
    div(class = "accent", style = "margin-top:8px;",
        HTML(paste0("<b>Ingevoerd:</b> r_xy = ", t$r_xy,
                    " | r_xz = ", t$r_xz, " | r_yz = ", t$r_yz,
                    "<br/><b>Vul teller, noemer en r_xy.z in hiernaast.</b>")))
  })

  output$ct_formula_display <- renderUI({
    t <- ct_truth(); if (is.null(t)) return(div(class="muted","Voer correlaties in via de zijbalk en klik 'Bereken'."))
    div(class="accent",
        HTML(paste0(
          "<b>Ingevoerd:</b> r_xy = <b>", t$r_xy, "</b> | r_xz = <b>", t$r_xz,"</b> | r_yz = <b>", t$r_yz,"</b><br/>",
          "Vul teller, noemer en eindresultaat in met 4 decimalen."
        )))
  })

  make_ct_light <- function(output_id, input_id, true_val_fn) {
    output[[output_id]] <- renderUI({
      t <- ct_truth(); if (is.null(t)) return(NULL)
      chk <- safe_check(input[[input_id]], true_val_fn(t))
      col <- if (is.na(chk)) "#BDBDBD" else if (chk) "#00C853" else "#D50000"
      div(class="traffic",
          span(id=paste0("dot_ct_",input_id), class="light", style=paste0("background:",col,";")),
          span(style=paste0("color:",col,";font-weight:700;"),
               if(!is.na(chk)&&chk)"OK" else if(!is.na(chk))"X" else ""))
    })
    observe({
      t <- ct_truth(); if (is.null(t)) return()
      chk <- safe_check(input[[input_id]], true_val_fn(t))
      session$sendCustomMessage("markField", list(id=input_id,
        state=if(is.na(chk))"neutral" else if(chk)"valid" else "invalid"))
    })
  }

  make_ct_light("ct_num_light",    "ct_num",    function(t) t$num)
  make_ct_light("ct_denom_light",  "ct_denom",  function(t) t$denom)
  make_ct_light("ct_result_light", "ct_result", function(t) t$r_xy_z)

  show_ct_msg <- function(msg_id, input_id, true_val_fn, err_msg, diag_fn = NULL) {
    output[[msg_id]] <- renderUI({
      tryCatch({
        t <- ct_truth(); if (is.null(t)) return(NULL)
        if (!has_attempted(input[[input_id]])) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        chk <- safe_check(input[[input_id]], true_val_fn(t))
        if (isTRUE(chk)) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        v_num <- suppressWarnings(as.numeric(input[[input_id]]))
        if (is_decimal_miss(v_num, true_val_fn(t))) {
          dec_msg <- "<b>Afrondingsfout:</b> Uw waarde is correct maar heeft te weinig decimalen. Gebruik 4 decimalen."
          set_feedback_msg(msg_id, dec_msg)
          return(div(class = "feedback feedback-compact", HTML("Afrondingsfout &#8212; gebruik 4 decimalen.")))
        }
        if (!is.null(diag_fn)) {
          diag_msg <- tryCatch(diag_fn(input[[input_id]], t), error = function(e) NULL)
          if (!is.null(diag_msg)) {
            set_feedback_msg(msg_id, diag_msg)
            first_part <- gsub("^<b>([^<]+)</b>.*", "\\1", diag_msg)
            return(div(class = "feedback feedback-compact", HTML(first_part)))
          }
        }
        feedback_ui(msg_id, err_msg, compact = TRUE)
      }, error = function(e) {
        set_feedback_msg(msg_id, NULL)
        NULL
      })
    })
  }

  show_ct_msg("msg_ct_num", "ct_num", function(t) t$num,
    "<b>Teller onjuist.</b> Teller = r_xy &#8722; r_xz &#215; r_yz.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      if (!is.na(t$denom) && abs(v - t$denom) < max(0.01, 0.02 * abs(t$denom)))
        "<b>Waarom fout:</b> U vulde de noemer in bij de teller.<br/><b>Formule:</b> Teller = r_xy &#8722; r_xz &#215; r_yz &#8212; trek het product r_xz&#215;r_yz af van r_xy."
      else if (!is.na(t$r_xy) && abs(v - t$r_xy) < max(0.005, 0.01 * abs(t$r_xy)))
        "<b>Waarom fout:</b> U vulde alleen r_xy in, maar vergat r_xz &#215; r_yz af te trekken.<br/><b>Formule:</b> Teller = r_xy &#8722; r_xz &#215; r_yz &#8212; bereken ook het product en trek dit af."
      else NULL
    })
  show_ct_msg("msg_ct_denom", "ct_denom", function(t) t$denom,
    "<b>Noemer onjuist.</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)).",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      if (!is.na(t$num) && abs(v - t$num) < max(0.01, 0.02 * abs(t$num)))
        "<b>Waarom fout:</b> U vulde de teller in bij de noemer.<br/><b>Formule:</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)) &#8212; bereken het product van de twee factoren en neem de wortel."
      else NULL
    })
  show_ct_msg("msg_ct_result", "ct_result", function(t) t$r_xy_z,
    "<b>r_xy.z onjuist.</b> r_xy.z = teller / noemer.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      if (!is.na(t$r_xy_z) && t$r_xy_z != 0 &&
          abs(v - round(1 / t$r_xy_z, 4)) < max(0.01, 0.02 * abs(1 / t$r_xy_z)))
        "<b>Waarom fout:</b> U heeft noemer/teller berekend &#8212; draai de deling om.<br/><b>Formule:</b> r_xy.z = teller / noemer."
      else if (!is.na(t$r_xy) && abs(v - t$r_xy) < max(0.005, 0.01 * abs(t$r_xy)))
        "<b>Waarom fout:</b> U vulde r_xy in &#8212; dat is de ongecorrigeerde correlatie, niet de partiële.<br/><b>Formule:</b> r_xy.z = teller / noemer &#8212; gebruik uw berekende teller en noemer."
      else NULL
    })

  output$ct_status <- renderUI({
    t <- ct_truth(); if (is.null(t)) return(NULL)
    checks <- c(
      num    = safe_check(input$ct_num,    t$num),
      denom  = safe_check(input$ct_denom,  t$denom),
      result = safe_check(input$ct_result, t$r_xy_z)
    )
    n_ok <- sum(checks == TRUE, na.rm = TRUE)
    if (n_ok == 3L)
      div(class="ok", paste0("V Correct! r_xy.z = ", round(t$r_xy_z, 4)))
    else
      div(class="muted", paste0(n_ok, "/3 correct"))
  })

  output$ct_detail_feedback <- renderUI({
    if (is.null(ct_truth())) return(NULL)
    feedback_panel_ui(
      c("Teller" = "msg_ct_num", "Noemer" = "msg_ct_denom", "r_xy.z" = "msg_ct_result"),
      "Uitgebreide feedback bij de formule"
    )
  })

  output$ct_interpretation <- renderUI({
    t <- ct_truth(); if (is.null(t)) return(NULL)
    all_ok <- isTRUE(safe_check(input$ct_num,    t$num)) &&
              isTRUE(safe_check(input$ct_denom,  t$denom)) &&
              isTRUE(safe_check(input$ct_result, t$r_xy_z))
    if (!all_ok) return(NULL)
    r_raw  <- t$r_xy
    r_part <- t$r_xy_z
    richting <- if (r_part > 0) "positief" else if (r_part < 0) "negatief" else "nul"
    suppressie <- if (abs(r_part) < abs(r_raw)) "zwakker (suppressor/verwarring door Z)"
                  else if (abs(r_part) > abs(r_raw)) "sterker (Z onderdrukte de relatie)"
                  else "onveranderd"
    div(class="card",
        h5("Interpretatie"),
        HTML(paste0(
          "<ul>",
          "<li><b>Ongecontroleerde correlatie r_xy:</b> ", r_raw, "</li>",
          "<li><b>Partiële correlatie r_xy.z:</b> ", r_part, " (na controle voor Z)</li>",
          "<li>De relatie tussen X en Y is na controle voor Z <b>", suppressie, "</b>.</li>",
          "<li>Richting: de partiële correlatie is <b>", richting, "</b>.</li>",
          "</ul>"
        ))
    )
  })

  # ---- Dataset outputs ----
  output$seed_echo <- renderUI({
    t <- rv$truth; sc <- rv$sc; if (is.null(t) || is.null(sc)) return(NULL)
    div(class = "accent", style = "margin-top:8px;",
        HTML(paste0("<b>Scenario:</b> ", sc$title,
                    " | <b>N = </b>", t$n,
                    " | X: <b>", sc$vars$x$name, "</b>",
                    " | Y: <b>", sc$vars$y$name, "</b>",
                    " | Z: <b>", sc$vars$z$name, "</b>")))
  })

  output$dataset_vignette <- renderUI({
    sc <- rv$sc; t <- rv$truth
    if (is.null(sc)) return(div(class="muted","Genereer een dataset om te beginnen."))
    div(class="accent",
        HTML(paste0("<b>", sc$title, "</b> — N = ", t$n, " | ",
                    "X = <b>", sc$vars$x$name, "</b> (", sc$vars$x$unit, ") | ",
                    "Y = <b>", sc$vars$y$name, "</b> (", sc$vars$y$unit, ") | ",
                    "Z (controlevariabele) = <b>", sc$vars$z$name, "</b> (", sc$vars$z$unit, ")",
                    "<br/><i>", sc$vignette, "</i>")))
  })

  output$data_view <- renderRHandsontable({
    df <- rv$df; if (is.null(df)) return(NULL)
    rhandsontable(df, readOnly = TRUE, rowHeaders = FALSE,
                  height = 40 + nrow(df) * 26) |>
      hot_cols(manualColumnResize = TRUE)
  })

  output$dataset_footer <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    tags$small(class="muted", paste0("N = ", t$n, " observaties | 4 kolommen (Eenheid, X, Y, Z)"))
  })

  # ---- Deel II: Means ----
  output$means_ui <- renderUI({
    t <- rv$truth; sc <- rv$sc; if (is.null(t) || is.null(sc)) return(div(class="muted","Genereer eerst een dataset."))
    fluidRow(
      column(4, strong(paste0("Gemiddelde ", sc$vars$x$name, " (X\u0305)")),
             numericInput("x_bar", NULL, value = NA, step = .0001), uiOutput("x_bar_light"),
             uiOutput("msg_x_bar")),
      column(4, strong(paste0("Gemiddelde ", sc$vars$y$name, " (Y\u0305)")),
             numericInput("y_bar", NULL, value = NA, step = .0001), uiOutput("y_bar_light"),
             uiOutput("msg_y_bar")),
      column(4, strong(paste0("Gemiddelde ", sc$vars$z$name, " (Z\u0305)")),
             numericInput("z_bar", NULL, value = NA, step = .0001), uiOutput("z_bar_light"),
             uiOutput("msg_z_bar"))
    )
  })

  make_light <- function(output_id, input_id, true_val_fn) {
    output[[output_id]] <- renderUI({
      t <- rv$truth; if (is.null(t)) return(NULL)
      chk <- safe_check(input[[input_id]], true_val_fn(t))
      col <- if (is.na(chk)) "#BDBDBD" else if (chk) "#00C853" else "#D50000"
      div(class="traffic",
          span(id=paste0("dot_",input_id), class="light", style=paste0("background:",col,";")),
          span(style=paste0("color:",col,";font-weight:700;"),
               if(!is.na(chk)&&chk)"OK" else if(!is.na(chk))"X" else ""))
    })
    observe({
      t <- rv$truth; if (is.null(t)) return()
      chk <- safe_check(input[[input_id]], true_val_fn(t))
      session$sendCustomMessage("markField", list(id=input_id,
        state=if(is.na(chk))"neutral" else if(chk)"valid" else "invalid"))
    })
  }

  make_light("x_bar_light",      "x_bar",      function(t) t$x_bar)
  make_light("y_bar_light",      "y_bar",      function(t) t$y_bar)
  make_light("z_bar_light",      "z_bar",      function(t) t$z_bar)
  make_light("partial_num_light",   "partial_num",   function(t) t$num_partial)
  make_light("partial_denom_light", "partial_denom", function(t) t$denom_partial)
  make_light("r_xy_z_light",        "r_xy_z",        function(t) t$r_xy_z)

  # ---- Diagnostic formula hints for partial correlation fields ----
  show_field_msg <- function(msg_id, input_id, true_val_fn, err_msg, diag_fn = NULL) {
    output[[msg_id]] <- renderUI({
      tryCatch({
        t <- rv$truth; if (is.null(t)) return(NULL)
        if (!has_attempted(input[[input_id]])) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        chk <- safe_check(input[[input_id]], true_val_fn(t))
        if (isTRUE(chk)) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        v_num <- suppressWarnings(as.numeric(input[[input_id]]))
        if (is_decimal_miss(v_num, true_val_fn(t))) {
          dec_msg <- "<b>Afrondingsfout:</b> Uw waarde is correct maar heeft te weinig decimalen. Gebruik 4 decimalen."
          set_feedback_msg(msg_id, dec_msg)
          return(div(class = "feedback feedback-compact", HTML("Afrondingsfout &#8212; gebruik 4 decimalen.")))
        }
        if (!is.null(diag_fn)) {
          diag_msg <- tryCatch(diag_fn(input[[input_id]], t), error = function(e) NULL)
          if (!is.null(diag_msg)) {
            set_feedback_msg(msg_id, diag_msg)
            first_part <- gsub("^<b>([^<]+)</b>.*", "\\1", diag_msg)
            return(div(class = "feedback feedback-compact", HTML(first_part)))
          }
        }
        feedback_ui(msg_id, err_msg, compact = TRUE)
      }, error = function(e) {
        set_feedback_msg(msg_id, NULL)
        NULL
      })
    })
  }

  show_field_msg("msg_x_bar", "x_bar", function(t) t$x_bar,
    "X&#x0305; onjuist. X&#x0305; = &#x03a3;X / n.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      tol_f <- function(ref) max(0.005, 0.01 * abs(ref))
      if (!is.na(t$n) && !is.na(t$x_bar) &&
          abs(v - t$x_bar * t$n) <= max(0.5, tol_f(t$x_bar * t$n)))
        sprintf("<b>Waarom fout:</b> U vulde de som &#x03a3;X in zonder te delen door n.<br/><b>Formule:</b> X&#x0305; = &#x03a3;X / n.",
                t$x_bar * t$n, t$x_bar * t$n, t$n)
      else if (!is.na(t$y_bar) && abs(v - t$y_bar) <= tol_f(t$y_bar))
        "<b>Waarom fout:</b> U vulde Y&#x0305; in bij X&#x0305; &#8212; controleer welke variabele X is."
      else if (!is.na(t$z_bar) && abs(v - t$z_bar) <= tol_f(t$z_bar))
        "<b>Waarom fout:</b> U vulde Z&#x0305; in bij X&#x0305; &#8212; controleer welke variabele X is."
      else NULL
    })
  show_field_msg("msg_y_bar", "y_bar", function(t) t$y_bar,
    "Y&#x0305; onjuist. Y&#x0305; = &#x03a3;Y / n.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      tol_f <- function(ref) max(0.005, 0.01 * abs(ref))
      if (!is.na(t$n) && !is.na(t$y_bar) &&
          abs(v - t$y_bar * t$n) <= max(0.5, tol_f(t$y_bar * t$n)))
        sprintf("<b>Waarom fout:</b> U vulde de som &#x03a3;Y in zonder te delen door n.<br/><b>Formule:</b> Y&#x0305; = &#x03a3;Y / n.",
                t$y_bar * t$n, t$y_bar * t$n, t$n)
      else if (!is.na(t$x_bar) && abs(v - t$x_bar) <= tol_f(t$x_bar))
        "<b>Waarom fout:</b> U vulde X&#x0305; in bij Y&#x0305; &#8212; controleer welke variabele Y is."
      else if (!is.na(t$z_bar) && abs(v - t$z_bar) <= tol_f(t$z_bar))
        "<b>Waarom fout:</b> U vulde Z&#x0305; in bij Y&#x0305; &#8212; controleer welke variabele Y is."
      else NULL
    })
  show_field_msg("msg_z_bar", "z_bar", function(t) t$z_bar,
    "Z&#x0305; onjuist. Z&#x0305; = &#x03a3;Z / n.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      tol_f <- function(ref) max(0.005, 0.01 * abs(ref))
      if (!is.na(t$n) && !is.na(t$z_bar) &&
          abs(v - t$z_bar * t$n) <= max(0.5, tol_f(t$z_bar * t$n)))
        sprintf("<b>Waarom fout:</b> U vulde de som &#x03a3;Z in zonder te delen door n.<br/><b>Formule:</b> Z&#x0305; = &#x03a3;Z / n.",
                t$z_bar * t$n, t$z_bar * t$n, t$n)
      else if (!is.na(t$x_bar) && abs(v - t$x_bar) <= tol_f(t$x_bar))
        "<b>Waarom fout:</b> U vulde X&#x0305; in bij Z&#x0305; &#8212; controleer welke variabele Z is."
      else if (!is.na(t$y_bar) && abs(v - t$y_bar) <= tol_f(t$y_bar))
        "<b>Waarom fout:</b> U vulde Y&#x0305; in bij Z&#x0305; &#8212; controleer welke variabele Z is."
      else NULL
    })

  show_field_msg("msg_partial_num", "partial_num", function(t) t$num_partial,
    "<b>Teller onjuist.</b> Teller = r_xy &#8722; r_xz &#215; r_yz.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      if (!is.na(t$denom_partial) && abs(v - t$denom_partial) <= max(0.005, 0.01 * abs(t$denom_partial)))
        "<b>Waarom fout:</b> U vulde de noemer in bij de teller.<br/><b>Formule:</b> Teller = r_xy &#8722; r_xz &#215; r_yz &#8212; bereken het product r_xz&#215;r_yz en trek dit af van r_xy."
      else if (!is.na(t$r_xy) && abs(v - t$r_xy) <= max(0.005, 0.01 * abs(t$r_xy)))
        "<b>Waarom fout:</b> U vulde alleen r_xy in, maar vergat r_xz &#215; r_yz af te trekken.<br/><b>Formule:</b> Teller = r_xy &#8722; r_xz &#215; r_yz &#8212; trek het product ook af."
      else if (!is.na(t$r_xz) && !is.na(t$r_yz) &&
               abs(v - t$r_xz * t$r_yz) <= max(0.005, 0.01 * abs(t$r_xz * t$r_yz)))
        "<b>Waarom fout:</b> U berekende alleen het product r_xz &#215; r_yz, maar vergat dit van r_xy af te trekken.<br/><b>Formule:</b> Teller = r_xy &#8722; r_xz &#215; r_yz &#8212; trek dit product af van r_xy."
      else if (!is.na(t$r_xy) && !is.na(t$r_xz) && !is.na(t$r_yz) &&
               abs(v - (t$r_xy + t$r_xz * t$r_yz)) <= max(0.005, 0.01 * abs(t$r_xy + t$r_xz * t$r_yz)))
        "<b>Waarom fout:</b> U <em>telde</em> r_xz &#215; r_yz bij r_xy op in plaats van af te trekken.<br/><b>Formule:</b> Teller = r_xy <em>&#8722;</em> r_xz &#215; r_yz &#8212; gebruik min, niet plus."
      else NULL
    })
  show_field_msg("msg_partial_denom", "partial_denom", function(t) t$denom_partial,
    "<b>Noemer onjuist.</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)). Kwadrateer r_xz en r_yz v&#243;&#243;r de aftrekking.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      tol_d <- max(0.005, 0.01 * abs(t$denom_partial))
      if (!is.na(t$num_partial) && abs(v - t$num_partial) <= max(0.005, 0.01 * abs(t$num_partial)))
        "<b>Waarom fout:</b> U vulde de teller in bij de noemer.<br/><b>Formule:</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)) &#8212; bereken het product van de twee factoren en neem de wortel."
      else if (!is.na(t$r_xz) && !is.na(t$r_yz)) {
        raw_product <- (1 - t$r_xz^2) * (1 - t$r_yz^2)
        if (abs(v - raw_product) <= max(0.005, 0.01 * abs(raw_product)))
          "<b>Waarom fout:</b> U vergat de vierkantswortel te nemen over het product.<br/><b>Formule:</b> Noemer = &#x221a;(product) &#8212; neem nog de vierkantswortel van (1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)."
        else if (abs(v - sqrt((1 - t$r_xz) * (1 - t$r_yz))) <= tol_d)
          "<b>Waarom fout:</b> U kwadrateert r_xz en r_yz niet &#8212; gebruik (1&#8722;r_xz&#178;) niet (1&#8722;r_xz).<br/><b>Formule:</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)) &#8212; kwadrateer r_xz en r_yz v&#243;&#243;r de aftrekking."
        else if (abs(v - sqrt(1 - t$r_xz^2)) <= tol_d || abs(v - sqrt(1 - t$r_yz^2)) <= tol_d)
          "<b>Waarom fout:</b> U gebruikte slechts &#233;&#233;n factor in de wortel &#8212; het product van beide factoren is nodig.<br/><b>Correctie:</b> Noemer = &#x221a;((1&#8722;r_xz&#178;)(1&#8722;r_yz&#178;)) &#8212; vermenigvuldig beide factoren v&#243;&#243;r u de wortel neemt."
        else NULL
      } else NULL
    })
  show_field_msg("msg_r_xy_z", "r_xy_z", function(t) t$r_xy_z,
    "<b>r_xy.z onjuist.</b> r_xy.z = teller / noemer. Gebruik uw berekende teller en noemer hierboven.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (is.na(v)) return(NULL)
      if (!is.na(t$denom_partial) && t$denom_partial != 0 && !is.na(t$num_partial) &&
          abs(v - round(t$denom_partial / t$num_partial, 4)) <= max(0.005, 0.01 * abs(t$denom_partial / t$num_partial)))
        "<b>Waarom fout:</b> U heeft noemer/teller berekend &#8212; draai de deling om.<br/><b>Correctie:</b> r_xy.z = teller / noemer &#8212; deel uw teller door uw noemer."
      else if (!is.na(t$r_xy) && abs(v - t$r_xy) <= max(0.005, 0.01 * abs(t$r_xy)))
        sprintf("<b>Waarom fout:</b> U vulde r_xy (= %.4f) in &#8212; dat is de ongecorrigeerde correlatie, niet de parti&#235;le.<br/><b>Correctie:</b> r_xy.z = teller / noemer &#8212; gebruik uw berekende teller en noemer.", t$r_xy)
      else NULL
    })

  # ---- Conclusie type validation ----
  output$msg_conclusie <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    if (is.null(input$conclusie_type) || input$conclusie_type == "") return(NULL)
    if (is.na(t$conclusie_type)) return(NULL)
    user_ct <- suppressWarnings(as.integer(input$conclusie_type))
    if (is.na(user_ct)) return(NULL)
    if (user_ct == t$conclusie_type) {
      div(class="ok", paste0("V Correct! ",
        switch(as.character(t$conclusie_type),
          "1" = "Schijnverband: r_xy.z \u2248 0, Z verklaart het gehele verband.",
          "2" = "Indirect verband: r_xy.z daalt, Z is een derde (confounding) variabele.",
          "3" = "Suppressor: r_xy.z stijgt, Z onderdrukte de werkelijke relatie.",
          "4" = "Direct verband: r_xy.z verandert nauwelijks na controle voor Z.")))
    } else {
      r_diff <- if (!is.na(t$r_xy) && !is.na(t$r_xy_z))
        round(abs(t$r_xy_z) - abs(t$r_xy), 4) else NA
      hint <- if (!is.na(r_diff)) {
        if (r_diff < -0.05) paste0("r_xy = ", t$r_xy, " vs r_xy.z = ", t$r_xy_z, " \u2014 de correlatie daalt na controle.")
        else if (r_diff > 0.05) paste0("r_xy = ", t$r_xy, " vs r_xy.z = ", t$r_xy_z, " \u2014 de correlatie stijgt na controle.")
        else paste0("r_xy = ", t$r_xy, " vs r_xy.z = ", t$r_xy_z, " \u2014 de correlatie verandert nauwelijks.")
      } else ""
      div(class="feedback", paste0("Onjuist. ", hint))
    }
  })

  output$means_feedback <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    checks <- c(x = safe_check(input$x_bar, t$x_bar),
                y = safe_check(input$y_bar, t$y_bar),
                z = safe_check(input$z_bar, t$z_bar))
    n_ok <- sum(checks == TRUE, na.rm = TRUE)
    if (n_ok == 3L) div(class="ok","V Alle gemiddelden correct!")
    else div(class="muted", paste0(n_ok, "/3 correct"))
  })

  output$means_detail_feedback <- renderUI({
    if (is.null(rv$truth)) return(NULL)
    feedback_panel_ui(
      c("Gemiddelde X" = "msg_x_bar", "Gemiddelde Y" = "msg_y_bar", "Gemiddelde Z" = "msg_z_bar"),
      "Uitgebreide feedback bij de gemiddelden"
    )
  })

  # ---- Deel III: Deviation table ----
  output$calc_table <- renderRHandsontable({
    df <- rv$df; sc <- rv$sc; if (is.null(df) || is.null(sc)) return(NULL)
    tbl <- user_calc()
    if (is.null(tbl)) tbl <- build_blank_dev_table(df, sc$vars$x$name, sc$vars$y$name, sc$vars$z$name)
    if (is.null(tbl)) return(NULL)

    t <- rv$truth
    validation_data <- if (is.null(t)) {
      list(
        dX = numeric(0), dY = numeric(0), dZ = numeric(0),
        dX2 = numeric(0), dY2 = numeric(0), dZ2 = numeric(0),
        dXdY = numeric(0), dXdZ = numeric(0), dYdZ = numeric(0)
      )
    } else {
      list(
        dX   = as.numeric(t$dx),
        dY   = as.numeric(t$dy),
        dZ   = as.numeric(t$dz),
        dX2  = as.numeric(t$dx2),
        dY2  = as.numeric(t$dy2),
        dZ2  = as.numeric(t$dz2),
        dXdY = as.numeric(t$dxdy),
        dXdZ = as.numeric(t$dxdz),
        dYdZ = as.numeric(t$dydz)
      )
    }

    rhandsontable(tbl, rowHeaders = FALSE, height = 45 + nrow(tbl) * 26) |>
      hot_col(1, readOnly = TRUE, width = 130) |>
      hot_col(2, readOnly = TRUE, type = "numeric", format = "0.00", width = 90) |>
      hot_col(3, readOnly = TRUE, type = "numeric", format = "0.00", width = 90) |>
      hot_col(4, readOnly = TRUE, type = "numeric", format = "0.00", width = 90) |>
      hot_col(5, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(6, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(7, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(8, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(9, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(10, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 95) |>
      hot_col(11, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 105) |>
      hot_col(12, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 105) |>
      hot_col(13, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 105) |>
      hot_cols(
        manualColumnResize = TRUE,
        renderer = paste0(
          '
          function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.textAlign = "center";
            td.style.backgroundColor = "";
            td.style.border = "";

            if (col >= 1 && value !== null && value !== "" && !isNaN(Number(value))) {
              var num = Number(value);
              td.innerText = (col <= 3) ? num.toFixed(2) : num.toFixed(4);
            }

            var validationData = ', jsonlite::toJSON(validation_data, auto_unbox = TRUE), ';
            var expectedByCol = {
              4: validationData.dX,
              5: validationData.dY,
              6: validationData.dZ,
              7: validationData.dX2,
              8: validationData.dY2,
              9: validationData.dZ2,
              10: validationData.dXdY,
              11: validationData.dXdZ,
              12: validationData.dYdZ
            };

            if (col >= 4 && value !== null && value !== "" && !isNaN(Number(value))) {
              var expectedArray = expectedByCol[col];
              if (expectedArray !== undefined && expectedArray[row] !== undefined) {
                var userRounded = Math.round(Number(value) * 10000) / 10000;
                var expectedRounded = Math.round(Number(expectedArray[row]) * 10000) / 10000;

                if (userRounded === expectedRounded) {
                  td.style.backgroundColor = "#e8f5e9";
                  td.style.border = "2px solid #00C853";
                } else {
                  td.style.backgroundColor = "#ffebee";
                  td.style.border = "2px solid #D50000";
                }
              }
            }
          }'
        )
      )
  })

  observeEvent(input$calc_table, {
    tbl <- tryCatch(hot_to_r(input$calc_table), error = function(e) NULL)
    user_calc(tbl)
  })

  output$var_sd_table <- renderRHandsontable({
    t <- rv$truth; if (is.null(t)) return(NULL)
    tbl <- user_var_sd()
    if (is.null(tbl)) tbl <- build_blank_var_sd_table()
    truth_tbl <- build_var_sd_truth_table(t)
    validation_data <- lapply(truth_tbl, as.numeric)

    rhandsontable(tbl, rowHeaders = FALSE, height = 45 + nrow(tbl) * 35) |>
      hot_col(1, readOnly = TRUE, width = 190) |>
      hot_col(2, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_col(3, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_col(4, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_cols(
        manualColumnResize = TRUE,
        renderer = paste0(
          '
          function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.textAlign = (col === 0) ? "left" : "center";
            td.style.backgroundColor = "";
            td.style.border = "";

            if (col >= 1 && value !== null && value !== "" && !isNaN(Number(value))) {
              td.innerText = Number(value).toFixed(4);
            }

            var validationData = ', jsonlite::toJSON(validation_data, auto_unbox = TRUE), ';
            var expectedByCol = {
              1: validationData.X,
              2: validationData.Y,
              3: validationData.Z
            };

            if (col >= 1 && value !== null && value !== "" && !isNaN(Number(value))) {
              var expectedArray = expectedByCol[col];
              if (expectedArray !== undefined && expectedArray[row] !== undefined) {
                var userRounded = Math.round(Number(value) * 10000) / 10000;
                var expectedRounded = Math.round(Number(expectedArray[row]) * 10000) / 10000;

                if (userRounded === expectedRounded) {
                  td.style.backgroundColor = "#e8f5e9";
                  td.style.border = "2px solid #00C853";
                } else {
                  td.style.backgroundColor = "#ffebee";
                  td.style.border = "2px solid #D50000";
                }
              }
            }
          }'
        )
      )
  })

  observeEvent(input$var_sd_table, {
    tbl <- tryCatch(hot_to_r(input$var_sd_table), error = function(e) NULL)
    user_var_sd(tbl)
  })

  output$cov_r_table <- renderRHandsontable({
    t <- rv$truth; if (is.null(t)) return(NULL)
    tbl <- user_cov_r()
    if (is.null(tbl)) tbl <- build_blank_cov_r_table()
    truth_tbl <- build_cov_r_truth_table(t)
    validation_data <- lapply(truth_tbl, as.numeric)

    rhandsontable(tbl, rowHeaders = FALSE, height = 45 + nrow(tbl) * 35) |>
      hot_col(1, readOnly = TRUE, width = 190) |>
      hot_col(2, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_col(3, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_col(4, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 115) |>
      hot_cols(
        manualColumnResize = TRUE,
        renderer = paste0(
          '
          function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.textAlign = (col === 0) ? "left" : "center";
            td.style.backgroundColor = "";
            td.style.border = "";

            if (col >= 1 && value !== null && value !== "" && !isNaN(Number(value))) {
              td.innerText = Number(value).toFixed(4);
            }

            var validationData = ', jsonlite::toJSON(validation_data, auto_unbox = TRUE), ';
            var expectedByCol = {
              1: validationData.XY,
              2: validationData.XZ,
              3: validationData.YZ
            };

            if (col >= 1 && value !== null && value !== "" && !isNaN(Number(value))) {
              var expectedArray = expectedByCol[col];
              if (expectedArray !== undefined && expectedArray[row] !== undefined) {
                var userRounded = Math.round(Number(value) * 10000) / 10000;
                var expectedRounded = Math.round(Number(expectedArray[row]) * 10000) / 10000;

                if (userRounded === expectedRounded) {
                  td.style.backgroundColor = "#e8f5e9";
                  td.style.border = "2px solid #00C853";
                } else {
                  td.style.backgroundColor = "#ffebee";
                  td.style.border = "2px solid #D50000";
                }
              }
            }
          }'
        )
      )
  })

  observeEvent(input$cov_r_table, {
    tbl <- tryCatch(hot_to_r(input$cov_r_table), error = function(e) NULL)
    user_cov_r(tbl)
  })

  output$table_feedback <- renderUI({
    tbl <- user_calc(); t <- rv$truth; if (is.null(tbl) || is.null(t)) return(NULL)
    n <- nrow(tbl)
    # Columns 5-13: dX, dY, dZ, dX2, dY2, dZ2, dXdY, dXdZ, dYdZ
    cols_true <- list(t$dx, t$dy, t$dz, t$dx2, t$dy2, t$dz2, t$dxdy, t$dxdz, t$dydz)
    all_chk <- unlist(lapply(seq_along(cols_true), function(i) {
      check_col_vec(as.numeric(tbl[[4 + i]]), cols_true[[i]])
    }))
    n_ok <- sum(all_chk == TRUE, na.rm = TRUE); n_tot <- n * 9L
    if (n_ok == n_tot)
      div(class="ok", paste0("V Afwijkingtabel volledig correct! (", n_ok, "/", n_tot, " cellen)"))
    else
      div(class="muted", paste0(n_ok, "/", n_tot, " cellen correct"))
  })

  output$var_sd_status <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    checks <- c(
      ss_x=safe_check(input$ss_x,t$SS_x), ss_y=safe_check(input$ss_y,t$SS_y), ss_z=safe_check(input$ss_z,t$SS_z),
      var_x=safe_check(input$var_x,t$Var_x), var_y=safe_check(input$var_y,t$Var_y), var_z=safe_check(input$var_z,t$Var_z),
      sd_x=safe_check(input$sd_x,t$SD_x), sd_y=safe_check(input$sd_y,t$SD_y), sd_z=safe_check(input$sd_z,t$SD_z)
    )
    n_ok <- sum(checks == TRUE, na.rm = TRUE)
    if (n_ok == 9L) div(class="ok","V Varianties en standaarddeviaties correct!")
    else div(class="muted", paste0(n_ok, "/9 correct"))
  })

  output$cov_r_status <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    checks <- c(
      scp_xy=safe_check(input$scp_xy,t$SCP_xy), scp_xz=safe_check(input$scp_xz,t$SCP_xz), scp_yz=safe_check(input$scp_yz,t$SCP_yz),
      cov_xy=safe_check(input$cov_xy,t$Cov_xy), cov_xz=safe_check(input$cov_xz,t$Cov_xz), cov_yz=safe_check(input$cov_yz,t$Cov_yz),
      r_xy=safe_check(input$r_xy,t$r_xy), r_xz=safe_check(input$r_xz,t$r_xz), r_yz=safe_check(input$r_yz,t$r_yz)
    )
    n_ok <- sum(checks == TRUE, na.rm = TRUE)
    if (n_ok == 9L) div(class="ok","V Covarianties en bivariate correlaties correct!")
    else div(class="muted", paste0(n_ok, "/9 correct"))
  })

  output$partial_status <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    checks <- c(
      num   = safe_check(input$partial_num,   t$num_partial),
      denom = safe_check(input$partial_denom, t$denom_partial),
      r_xyz = safe_check(input$r_xy_z,        t$r_xy_z)
    )
    n_ok <- sum(checks == TRUE, na.rm = TRUE)
    if (n_ok == 3L)
      div(class="ok", paste0("V Correct! r_xy.z = ", round(t$r_xy_z, 4)))
    else
      div(class="muted", paste0(n_ok, "/3 correct"))
  })

  output$partial_detail_feedback <- renderUI({
    if (is.null(rv$truth)) return(NULL)
    feedback_panel_ui(
      c("Teller" = "msg_partial_num", "Noemer" = "msg_partial_denom", "r_xy.z" = "msg_r_xy_z"),
      "Uitgebreide feedback bij de partiële correlatie"
    )
  })

  # ---- All-correct -> unlock viz ----
  all_correct <- reactive({
    t <- rv$truth; if (is.null(t)) return(FALSE)
    if (!isTRUE(safe_check(input$x_bar, t$x_bar))) return(FALSE)
    if (!isTRUE(safe_check(input$y_bar, t$y_bar))) return(FALSE)
    if (!isTRUE(safe_check(input$z_bar, t$z_bar))) return(FALSE)
    tbl <- user_calc(); if (is.null(tbl) || nrow(tbl) == 0) return(FALSE)
    cols_true <- list(t$dx, t$dy, t$dz, t$dx2, t$dy2, t$dz2, t$dxdy, t$dxdz, t$dydz)
    all_tbl <- unlist(lapply(seq_along(cols_true), function(i)
      check_col_vec(as.numeric(tbl[[4 + i]]), cols_true[[i]])))
    if (!all(all_tbl == TRUE, na.rm=TRUE) || any(is.na(all_tbl))) return(FALSE)
    all(
      isTRUE(safe_check(input$ss_x,t$SS_x)),  isTRUE(safe_check(input$ss_y,t$SS_y)),  isTRUE(safe_check(input$ss_z,t$SS_z)),
      isTRUE(safe_check(input$var_x,t$Var_x)), isTRUE(safe_check(input$var_y,t$Var_y)), isTRUE(safe_check(input$var_z,t$Var_z)),
      isTRUE(safe_check(input$sd_x,t$SD_x)),  isTRUE(safe_check(input$sd_y,t$SD_y)),  isTRUE(safe_check(input$sd_z,t$SD_z)),
      isTRUE(safe_check(input$scp_xy,t$SCP_xy)), isTRUE(safe_check(input$scp_xz,t$SCP_xz)), isTRUE(safe_check(input$scp_yz,t$SCP_yz)),
      isTRUE(safe_check(input$cov_xy,t$Cov_xy)), isTRUE(safe_check(input$cov_xz,t$Cov_xz)), isTRUE(safe_check(input$cov_yz,t$Cov_yz)),
      isTRUE(safe_check(input$r_xy,t$r_xy)),   isTRUE(safe_check(input$r_xz,t$r_xz)),   isTRUE(safe_check(input$r_yz,t$r_yz)),
      isTRUE(safe_check(input$partial_num,   t$num_partial)),
      isTRUE(safe_check(input$partial_denom, t$denom_partial)),
      isTRUE(safe_check(input$r_xy_z,        t$r_xy_z)),
      !is.null(input$conclusie_type) && input$conclusie_type != "" &&
        isTRUE(suppressWarnings(as.integer(input$conclusie_type)) == t$conclusie_type)
    )
  })

  observe({
    if (input$mode == "raw") session$sendCustomMessage("toggleViz", all_correct())
  })

  output$final_success_message <- renderUI({
    if (input$mode != "raw" || !all_correct()) return(NULL)
    t <- rv$truth
    div(class="card",
        div(class="ok", style="font-size:1.2em;",
            HTML(paste0("Uitstekend! Alle stappen correct! r_xy.z = ",
                        round(t$r_xy_z, 4), " — bekijk de visualisaties hieronder."))))
  })

  # ---- Deel VII: Visualisaties ----
  output$viz_content <- renderUI({
    if (!all_correct()) return(div(class="muted","Voltooi alle stappen correct om de visualisaties te zien."))
    tagList(
      plotOutput("scatter_xyz", height = "360px"),
      br(),
      uiOutput("interpretation_block")
    )
  })

  output$scatter_xyz <- renderPlot({
    if (!all_correct()) return(NULL)
    df <- rv$df; sc <- rv$sc; t <- rv$truth; if (is.null(df)) return(NULL)
    xn <- sc$vars$x$name; yn <- sc$vars$y$name; zn <- sc$vars$z$name
    # Scatter X vs Y, colour-coded by Z (tertiles)
    df$Z_grp <- cut(df[[zn]], breaks = quantile(df[[zn]], c(0, 1/3, 2/3, 1), na.rm=TRUE),
                    include.lowest = TRUE,
                    labels = c(paste0("Laag ", zn), paste0("Midden ", zn), paste0("Hoog ", zn)))
    ggplot(df, aes(x = .data[[xn]], y = .data[[yn]], colour = Z_grp)) +
      geom_point(size = 3, alpha = 0.8) +
      geom_smooth(method = "lm", se = FALSE, linetype = "dashed", linewidth = 0.8, colour = "#888") +
      scale_colour_manual(values = c("#42A5F5","#FFA726","#66BB6A"), name = paste0(zn, " (tertiel)")) +
      annotate("text", x = -Inf, y = Inf,
               label = paste0("r_xy = ", round(t$r_xy,4), "   r_xy.z = ", round(t$r_xy_z,4)),
               hjust = -0.05, vjust = 1.5, size = 4.5, colour = "#3F51B5", fontface = "bold") +
      labs(title = paste0("Spreidingsdiagram: ", xn, " vs ", yn, " (gekleurd naar ", zn, ")"),
           x = paste0(xn, " (", sc$vars$x$unit, ")"),
           y = paste0(yn, " (", sc$vars$y$unit, ")")) +
      theme_minimal(base_size = 13) +
      theme(plot.title = element_text(face = "bold", colour = "#3F51B5"),
            legend.position = "bottom")
  })

  output$interpretation_block <- renderUI({
    if (!all_correct()) return(NULL)
    t <- rv$truth; sc <- rv$sc
    r_raw  <- t$r_xy
    r_part <- t$r_xy_z
    suppressie <- if (abs(r_part) < abs(r_raw)) "zwakker (suppressor/verwarring door Z)"
                  else if (abs(r_part) > abs(r_raw)) "sterker (Z onderdrukte de relatie)"
                  else "onveranderd"
    richting <- if (r_part > 0) "positief" else if (r_part < 0) "negatief" else "nul"
    div(class="card",
        h5("Interpretatie"),
        HTML(paste0(
          "<ul>",
          "<li><b>X:</b> ", sc$vars$x$name, " | <b>Y:</b> ", sc$vars$y$name,
          " | <b>Z (controlevariabele):</b> ", sc$vars$z$name, "</li>",
          "<li><b>Ongecontroleerde correlatie r_xy:</b> ", r_raw, "</li>",
          "<li><b>Partiële correlatie r_xy.z:</b> ", r_part, " (na controle voor ", sc$vars$z$name, ")</li>",
          "<li>De relatie is na controle voor Z <b>", suppressie, "</b>.</li>",
          "<li>Richting partiële correlatie: <b>", richting, "</b>.</li>",
          "<li>Bivariate correlaties gebruikt: r_xy = ", t$r_xy,
          " | r_xz = ", t$r_xz, " | r_yz = ", t$r_yz, "</li>",
          "</ul>"
        ))
    )
  })
}

shinyApp(ui, server)
