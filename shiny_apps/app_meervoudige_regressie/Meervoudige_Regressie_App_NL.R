# ============================================================
# Multiple Regression — practice dashboard
# - Multiple regression with 2 predictors (X1, X2)
# - Students compute core quantities (means, cross-products, coefficients)
# - All truth values are computed from the 2-decimal display data
# - 4-decimal checking for student inputs
# ============================================================

suppressPackageStartupMessages({
  library(shiny)
  library(ggplot2)
  library(dplyr)
  library(rhandsontable)
  library(gridExtra)
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

clamp_vec <- function(v, lo, hi) {
  if (is.null(v) || length(v) == 0) return(v)
  pmin(hi, pmax(lo, v))
}

check_decimals <- function(user_val, true_val, target_decimals = 4) {
  if (is.na(user_val) || is.na(true_val) || is.null(user_val) || is.null(true_val)) return(NA)
  # Compare rounded values directly for exact match
  round(user_val, target_decimals) == round(true_val, target_decimals)
}

normalize_raw_numeric <- function(raw_val) {
  if (is.null(raw_val) || length(raw_val) == 0) return(NA_character_)
  raw <- trimws(as.character(raw_val)[1])
  if (!nzchar(raw)) return(NA_character_)
  chartr(",", ".", raw)
}

count_decimal_places <- function(raw_val) {
  raw <- normalize_raw_numeric(raw_val)
  if (is.na(raw) || grepl("[eE]", raw)) return(NA_integer_)
  raw <- sub("^[+-]", "", raw)
  if (!grepl("\\.", raw)) return(0L)
  nchar(sub("^[^.]*\\.", "", raw))
}

is_decimal_miss <- function(user_val, true_val, target_decimals = 4, raw_input = NULL) {
  if (is.na(user_val) || is.na(true_val)) return(FALSE)
  if (round(user_val, target_decimals) == round(true_val, target_decimals)) return(FALSE)
  user_precision <- count_decimal_places(if (is.null(raw_input)) as.character(user_val) else raw_input)
  if (is.na(user_precision) || user_precision >= target_decimals) return(FALSE)
  any(vapply(seq_len(user_precision), function(d) {
    round(user_val, d) == round(true_val, d)
  }, logical(1)))
}

has_attempted <- function(val) {
  !is.null(val) && nzchar(trimws(as.character(val))) && !is.na(suppressWarnings(as.numeric(val)))
}

safe_check <- function(user_val, true_val, decimals = 4) {
  if (!has_attempted(user_val)) return(NA)
  check_decimals(suppressWarnings(as.numeric(user_val)), true_val, decimals)
}

# ============================================================
# SCENARIOS
# ============================================================

scenarios <- list(
  list(
    id = "crime_program",
    title = "Implementatie criminaliteitspreventieprogramma",
    vignette = "Een stad heeft een preventieprogramma geïmplementeerd in verschillende buurten. Onderzoek of een hogere blootstelling samenhangt met lagere inbraakcijfers (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "ProgrammaBlootstelling", unit = "%"), y = list(name = "InbraakCijfer", unit = "per 1.000")),
    gen  = list(r_target = -0.45),
    extras = c("PolitieZichtbaarheid", "BuurtBijeenkomsten", "HerhaaldSlachtofferschapPercentage", "StraatVerlichting", "BuurtPreventie"),
    entity = "Buurt"
  ),
  list(
    id = "hotspots_policing",
    title = "Hot-spot politiestrategie",
    vignette = "Straten variëren in aantal voetpatrouille-uren op criminele hotspots. Beoordeel de relatie met het aantal meldingen aan de politie (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "VoetPatrouilleUren", unit = "uren/week"), y = list(name = "MeldingenAanPolitie", unit = "per week")),
    gen  = list(r_target = -0.25),
    extras = c("GerichtePatrouilles", "Arrestaties", "Reactietijd", "ProactieveControles", "OpenbareOrdeMeldingen"),
    entity = "Straat"
  ),
  list(
    id = "fear_disorder",
    title = "Angst voor criminaliteit & buurtwanorde",
    vignette = "Ondervraagde bewoners beoordelen fysieke/sociale wanorde en angst voor criminaliteit (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "WanordeIndex", unit = "0–10"), y = list(name = "AngstScore", unit = "0–100")),
    gen  = list(r_target = 0.55),
    extras = c("OnbeschoftheidIncidenten", "CollectieveEffectiviteit", "StraatVerlichting", "GraffitiMeldingen", "ZwerfvuilKlachten"),
    entity = "Buurt"
  ),
  list(
    id = "police_public_relations",
    title = "Politie–publiek relaties",
    vignette = "Percepties van procedurale rechtvaardigheid versus vertrouwen in politie per district (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "ProcedureleRechtvaardigheid", unit = "1–7"), y = list(name = "VertrouwenInPolitie", unit = "1–7")),
    gen  = list(r_target = 0.70),
    extras = c("Eerlijkheid", "Respect", "Inspraak", "Tevredenheid", "KlachtenPercentage"),
    entity = "District"
  ),
  list(
    id = "guardianship_victimization",
    title = "Toezicht & slachtofferschap",
    vignette = "Toezichtscores van huishoudens versus slachtofferschapincidenten (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "Toezicht", unit = "0–10"), y = list(name = "Slachtofferschap", unit = "aantal")),
    gen  = list(r_target = -0.40),
    extras = c("SlotKwaliteit", "BuitenVerlichting", "AlarmBezit", "RoutineActiviteiten", "BekwaamToezicht"),
    entity = "Huishouden"
  ),
  list(
    id = "biosocial",
    title = "Biosociaal risico",
    vignette = "Impulsiviteit versus agressieve incidenten onder jongeren (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "Impulsiviteit", unit = "z-score"), y = list(name = "AgressieveIncidenten", unit = "schoolmeldingen/trimester")),
    gen  = list(r_target = 0.45),
    extras = c("Zelfbeheersing", "LeeftijdgenotenAfwijkendGedrag", "DocentenOndersteuning", "OuderlijkToezicht", "SchoolBetrokkenheid"),
    entity = "Student"
  ),
  list(
    id = "reentry_recidivism",
    title = "Re-integratiebegeleiding & recidiverisico",
    vignette = "Begeleiding na vrijlating (in uren per maand) versus een gevalideerde recidiverisicoScore (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "OndersteuningsUren", unit = "per maand"), y = list(name = "RecidiveRisico", unit = "0–100")),
    gen  = list(r_target = -0.35),
    extras = c("HuisvestingsOndersteuning", "WerkgelegenheidsWorkshops", "IdentiteitsdocumentenHulp", "DossierContacten", "VerslavingsBegeleiding"),
    entity = "Deelnemer"
  ),
  list(
    id = "cyber_training",
    title = "Cybercrime-bewustmakingstraining",
    vignette = "Phishing-trainingsuren versus gesimuleerde klikratio (met controle voor een tweede voorspeller).",
    vars = list(x = list(name = "TrainingsUren", unit = "uren"), y = list(name = "Klikratio", unit = "%")),
    gen  = list(r_target = -0.55),
    extras = c("QuizScores", "GesimuleerdeMeldingen", "BewustzijnsIndex", "MeldingsTijd", "BeleidKennis"),
    entity = "Medewerker"
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
# DATA GENERATION (2 predictors + Y)
# ============================================================

# Helper that reproduces the bivariate app's X and Y generation
# exactly (same scenarios, same seed logic). This ensures that for
# a given scenario/seed/N, X and Y here match the bivariate app.
make_scenario_xy_core <- function(sc, n = 20, seed = NULL) {
  if (is.null(sc)) return(NULL)
  n <- as.integer(n)
  if (is.na(n) || n < 0) n <- 0

  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)

  if (n <= 0) {
    return(tibble::tibble(Entity = character(), Var1 = numeric()))
  }

  xname <- sc$vars$x$name
  yname <- sc$vars$y$name

  # Latent standardized variables (same structure as bivariate app)
  Xz <- rnorm(n)
  eps <- rnorm(n)
  r <- sc$gen$r_target %||% 0
  Yz <- r * Xz + sqrt(max(0, 1 - r^2)) * eps

  # Shared scaling helper (mirrors bivariate app behaviour)
  scale_by_unit <- function(z, center, scale) {
    if (length(z) == 0) return(numeric(0))
    if (length(z) < 2 || is.na(stats::sd(z)) || stats::sd(z) == 0) {
      zz <- z
    } else {
      zz <- as.numeric(scale(z))
    }
    round(center + scale * zz, 4)
  }

  x_unit <- sc$vars$x$unit %||% "default"
  y_unit <- sc$vars$y$unit %||% "default"

  # Centers and scales mirror those in the bivariate app
  x_center <- switch(x_unit,
                     "%" = 50, "010" = 5, "17" = 4, "uren" = 20, "uren/week" = 20, "hours" = 20, "hours/week" = 20,
                     "per maand" = 15, "per month" = 15, "z-score" = 0, 30)
  x_scale  <- switch(x_unit,
                     "%" = 20, "010" = 2.5, "17" = 1.2, "uren" = 8, "uren/week" = 8, "hours" = 8, "hours/week" = 8,
                     "per maand" = 6, "per month" = 6, "z-score" = 1, 8)
  y_center <- switch(y_unit,
                     "per 1.000" = 20, "per 1,000" = 20, "per week" = 60, "0100" = 60,
                     "17" = 4, "%" = 30, "aantal" = 6, "count" = 6, 60)
  y_scale  <- switch(y_unit,
                     "per 1.000" = 8, "per 1,000" = 8, "per week" = 14, "0100" = 15,
                     "17" = 1.2, "%" = 12, "aantal" = 3, "count" = 3, 12)

  # Dataset-level variability (same structure as bivariate app)
  x_center <- x_center + runif(1, -8, 8)
  x_scale  <- x_scale  * runif(1, 0.8, 1.4)
  y_center <- y_center + runif(1, -8, 8)
  y_scale  <- y_scale  * runif(1, 0.8, 1.4)

  Xv <- scale_by_unit(Xz, x_center, x_scale)
  Yv <- scale_by_unit(Yz, y_center, y_scale)

  df <- tibble::tibble(
    Entity = paste(sc$entity %||% "Unit", seq_len(n)),
    !!xname := Xv
  )
  df[[yname]] <- Yv

  # Clamp percentage/score/count style variables to reasonable bounds
  num_cols <- names(df)[sapply(df, is.numeric)]
  for (nm in num_cols) {
    if (grepl("(%|Score|Risico|Ratio|Cijfer)", nm, ignore.case = TRUE)) {
      df[[nm]] <- clamp_vec(df[[nm]], 0, 100)
    } else if (grepl("(Aantal|Incidenten|Meldingen)", nm, ignore.case = TRUE)) {
      df[[nm]] <- clamp_vec(round(df[[nm]]), 0, Inf)
    }
  }

  df
}

make_scenario_data_multi2 <- function(sc, n = 20, seed = NULL) {
  if (is.null(sc)) return(NULL)
  n <- as.integer(n)
  if (is.na(n) || n < 5) n <- 5
  n <- min(n, MAX_SAMPLE_SIZE)

  # First generate X1 and Y exactly as in the bivariate app
  base_df <- make_scenario_xy_core(sc, n = n, seed = seed)
  if (is.null(base_df) || nrow(base_df) == 0) return(NULL)

  x1_name <- sc$vars$x$name
  y_name  <- sc$vars$y$name
  x2_candidates <- c(sc$extras %||% character(0), "ControlVar")
  x2_name <- x2_candidates[which(!(x2_candidates %in% c(x1_name, y_name)))[1]] %||% "ControlVar"
  while (x2_name %in% names(base_df)) x2_name <- paste0(x2_name, "_2")

  # Derive a second predictor X2 that is correlated with X1 (and
  # indirectly with Y), without changing the already-generated Y.
  X1_vals <- as.numeric(base_df[[x1_name]])
  Y_vals  <- as.numeric(base_df[[y_name]])

  X1z <- as.numeric(scale(X1_vals))
  if (any(is.na(X1z))) X1z <- rep(0, length(X1_vals))

  # Create a new latent for X2 with moderate correlation to X1
  X2z <- 0.5 * X1z + sqrt(1 - 0.5^2) * rnorm(length(X1z))

  scale_x2 <- function(z) {
    z <- as.numeric(scale(z))
    clamp_vec(round(50 + 18 * z, 4), 0, 100)
  }

  X2_vals <- scale_x2(X2z)

  base_df[[x2_name]] <- X2_vals

  # Enforce Y as the last column: Entity, X1, X2, Y
  entity_col <- names(base_df)[1]
  base_df[, c(entity_col, x1_name, x2_name, y_name), drop = FALSE]
}

# ============================================================
# TRUTH (based on 2-decimal display data)
# ============================================================

calc_multi2_manual_truth <- function(df, y_var, x_vars) {
  if (is.null(df) || nrow(df) == 0 || is.null(y_var) || length(x_vars) != 2) return(NULL)

  # Step 1: Round raw data to 2 decimals (what students see)
  Y <- round(as.numeric(df[[y_var]]), 2)
  X1 <- round(as.numeric(df[[x_vars[1]]]), 2)
  X2 <- round(as.numeric(df[[x_vars[2]]]), 2)
  n <- length(Y)
  if (n < 3) return(NULL)

  # Step 2: Calculate means and round to 4 decimals (what students enter)
  y_bar <- round(mean(Y), 4)
  x1_bar <- round(mean(X1), 4)
  x2_bar <- round(mean(X2), 4)

  # Step 3: Calculate deviations from 4-decimal means and round to 4 decimals
  dy <- round(Y - y_bar, 4)
  dx1 <- round(X1 - x1_bar, 4)
  dx2 <- round(X2 - x2_bar, 4)

  # Step 4: Calculate cross-products from 4-decimal deviations
  # Round each individual product/square BEFORE summing (matches manual calculation)
  S11 <- round(sum(round(dx1^2, 4)), 4)
  S22 <- round(sum(round(dx2^2, 4)), 4)
  S12 <- round(sum(round(dx1 * dx2, 4)), 4)
  S1y <- round(sum(round(dx1 * dy, 4)), 4)
  S2y <- round(sum(round(dx2 * dy, 4)), 4)
  SST <- round(sum(round(dy^2, 4)), 4)

  # Step 5: Calculate determinant from 4-decimal cross-products
  det <- round(S11 * S22 - S12^2, 4)
  if (abs(det) < 1e-10) return(NULL)

  # Step 6: Calculate regression coefficients with intermediate rounding
  b1 <- round(round(S1y * S22 - S2y * S12, 4) / det, 4)
  b2 <- round(round(S2y * S11 - S1y * S12, 4) / det, 4)
  a <- round(y_bar - round(b1 * x1_bar + b2 * x2_bar, 4), 4)

  # Step 7: Calculate predictions and fit statistics with intermediate rounding
  # For each prediction: a + b1*X1 + b2*X2, round intermediate products
  Y_pred <- round(a + round(b1 * X1, 4) + round(b2 * X2, 4), 4)
  SSE <- round(sum(round((Y - Y_pred)^2, 4)), 4)
  R_squared <- round(1 - round(SSE / SST, 4), 4)
  alienation <- round(1 - R_squared, 4)

  # Step 8: ANOVA components for global model test
  p <- 2
  SSR <- round(SST - SSE, 4)
  df_reg <- p
  df_err <- n - p - 1
  MSR <- round(SSR / df_reg, 4)
  MSE <- round(SSE / df_err, 4)
  F_stat <- round(MSR / MSE, 4)
  model_p <- round(1 - stats::pf(F_stat, df_reg, df_err), 4)

  # Step 9: Calculate variances and SDs from 4-decimal sums of squares
  var_X1 <- round(S11 / (n - 1), 4)
  var_X2 <- round(S22 / (n - 1), 4)
  var_Y <- round(SST / (n - 1), 4)
  sd_X1 <- round(sqrt(var_X1), 4)
  sd_X2 <- round(sqrt(var_X2), 4)
  sd_Y <- round(sqrt(var_Y), 4)
  
  # Step 10: Calculate covariances from 4-decimal cross-products
  cov_x1y <- round(S1y / (n - 1), 4)
  cov_x2y <- round(S2y / (n - 1), 4)
  cov_x1x2 <- round(S12 / (n - 1), 4)
  
  # Step 11: Calculate correlations from 4-decimal covariances and SDs
  # Round intermediate products to maintain 4-decimal precision throughout
  r_x1y <- round(cov_x1y / round(sd_X1 * sd_Y, 4), 4)
  r_x2y <- round(cov_x2y / round(sd_X2 * sd_Y, 4), 4)
  r_x1x2 <- round(cov_x1x2 / round(sd_X1 * sd_X2, 4), 4)

  list(
    n = n,
    x1_bar = x1_bar,
    x2_bar = x2_bar,
    y_bar = y_bar,
    S11 = S11,
    S22 = S22,
    S12 = S12,
    S1y = S1y,
    S2y = S2y,
    SST = SST,
    var_X1 = var_X1,
    var_X2 = var_X2,
    var_Y = var_Y,
    sd_X1 = sd_X1,
    sd_X2 = sd_X2,
    sd_Y = sd_Y,
    cov_x1y = cov_x1y,
    cov_x2y = cov_x2y,
    cov_x1x2 = cov_x1x2,
    r_x1y = r_x1y,
    r_x2y = r_x2y,
    r_x1x2 = r_x1x2,
    det = det,
    b1 = b1,
    b2 = b2,
    intercept = a,
    predictions = Y_pred,
    SSR = SSR,
    SSE = SSE,
    df_reg = df_reg,
    df_err = df_err,
    MSR = MSR,
    MSE = MSE,
    F_stat = F_stat,
    model_p = model_p,
    R_squared = R_squared,
    alienation = alienation
  )
}

# ============================================================
# CALCULATION TABLE FUNCTIONS
# ============================================================

build_blank_calc_multi <- function(df, x_vars, y_var) {
  if (is.null(df) || nrow(df) == 0 || length(x_vars) != 2 || is.null(y_var)) return(NULL)

  entity_col_name <- names(df)[1]
  n <- nrow(df)

  # Create with standard column names first. Raw columns are in
  # the order X1, X2, Y so that Y is always last, as in the
  # bivariate app (X, then Y).
  tbl <- data.frame(
    Entity = df[[entity_col_name]],
    X1 = round(df[[x_vars[1]]], 2),
    X2 = round(df[[x_vars[2]]], 2),
    Y  = round(df[[y_var]], 2),
    dX1 = rep(NA_real_, n),
    dX2 = rep(NA_real_, n),
    dY  = rep(NA_real_, n),
    dX1_2 = rep(NA_real_, n),
    dX2_2 = rep(NA_real_, n),
    dY_2  = rep(NA_real_, n),
    dX1_dX2 = rep(NA_real_, n),
    dX1_dY  = rep(NA_real_, n),
    dX2_dY  = rep(NA_real_, n),
    check.names = FALSE,
    stringsAsFactors = FALSE
  )

  # Rename first column to match entity
  names(tbl)[1] <- entity_col_name

  tbl
}

# ============================================================
# UI
# ============================================================

ui <- fluidPage(
  tags$head(tags$title("Multiple Regressie - Oefeningen")),
  tags$head(tags$style(HTML('
    body{background:linear-gradient(180deg,#F6FAFF 0%,#F9F7FF 100%);} 
    .card{background:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 6px 18px rgba(0,0,0,0.08);} 
    .muted{color:#666;} .ok{color:#0E7C7B;font-weight:700;} .err{color:#B00020;font-weight:600;} 
    .btn-wide{min-width:220px;} .disabled{opacity:.5;pointer-events:none;}
    .accent{background:#E3F2FD;border-left:4px solid #42A5F5;padding:8px 10px;border-radius:10px;}
    .title{font-weight:800;color:#3F51B5;}
    .traffic{display:flex;gap:8px;margin-top:8px}
    .light{width:12px;height:12px;border-radius:50%;display:inline-block;background:#BDBDBD;}
    .feedback{color:#B00020;font-weight:600;margin-top:4px;}
    input.invalid{border:2px solid #D50000 !important; background:#ffebee !important; box-shadow:0 0 0 2px rgba(213,0,0,0.10) inset;}
    input.valid{border:2px solid #00C853 !important; background:#e8f5e9 !important; box-shadow:0 0 0 2px rgba(0,200,83,0.10) inset;}
    .grid-compact{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
    .grid-compact-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
    .grid-compact-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
    #part3_card h5{margin:8px 0 4px 0;}
    #part3_card .html-widget, #part3_card .rhandsontable, #part3_card .handsontable{margin-bottom:0 !important;}
    #pred_card .html-widget, #pred_card .rhandsontable, #pred_card .handsontable{margin-bottom:0 !important;}
    .cell-invalid{
      background:#ffebee !important;
      border:2px solid #D50000 !important;
    }
    .cell-valid{
      background:#e8f5e9 !important;
      border:2px solid #00C853 !important;
    }
    /* Center align all table headers and cells */
    .rhandsontable th,
    .rhandsontable td {
      text-align: center !important;
    }
  '))),
  tags$head(tags$script(HTML("
    // Enhanced visualization toggle with smooth transitions
    Shiny.addCustomMessageHandler('toggleViz', function(show){
      var el = document.getElementById('viz_block');
      if (!el) return;
      
      if (show) { 
        el.classList.remove('disabled');
        el.style.transition = 'opacity 0.3s ease-in-out';
        el.style.opacity = '1';
      } else { 
        el.classList.add('disabled');
        el.style.opacity = '0.5';
      }
    });
    
    // Enhanced light painting with smooth color transitions
    Shiny.addCustomMessageHandler('paintLight', function(msg){
      var el = document.getElementById(msg.id);
      if (!el) return;
      
      el.style.transition = 'background-color 0.2s ease-in-out';
      el.style.background = msg.col || '#BDBDBD';
    });
    
    // Enhanced field marking with better visual feedback
    Shiny.addCustomMessageHandler('markField', function(msg){
      var el = document.getElementById(msg.id);
      if (!el) return;
      
      el.classList.remove('invalid', 'valid');
      el.style.transition = 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out';
      
      if (msg.state === 'invalid') { 
        el.classList.add('invalid');
      } else if (msg.state === 'valid') { 
        el.classList.add('valid');
      }
    });

    function syncRawNumericValue(el) {
      if (!el || !el.id || !window.Shiny) return;
      Shiny.setInputValue(el.id + '__raw', el.value, {priority: 'event'});
    }

    document.addEventListener('input', function(evt) {
      var el = evt.target;
      if (el && el.tagName === 'INPUT' && el.type === 'number') {
        syncRawNumericValue(el);
      }
    });

    document.addEventListener('change', function(evt) {
      var el = evt.target;
      if (el && el.tagName === 'INPUT' && el.type === 'number') {
        syncRawNumericValue(el);
      }
    });
    
    // Add subtle hover effects for better UX
    document.addEventListener('DOMContentLoaded', function() {
      var cards = document.querySelectorAll('.card');
      cards.forEach(function(card) {
        card.style.transition = 'box-shadow 0.2s ease-in-out';
        card.addEventListener('mouseenter', function() {
          this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        });
        card.addEventListener('mouseleave', function() {
          this.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
        });
      });

      var numericInputs = document.querySelectorAll('input[type=\"number\"]');
      numericInputs.forEach(syncRawNumericValue);
    });
  "))),

  titlePanel(div(class = "title", "Oefeningen voor Multiple Regressie")),

  sidebarLayout(
    sidebarPanel(
      width = 4,
      div(class = "card",
          h4("Hoe deze webpagina werkt"),
          HTML("<ul style='margin:6px 0 0 0px; padding-left: 20px;'>
            <li>Oefen <b>multiple regressieanalyse</b> met 2 voorspellers (x₁, x₂) met criminologiedatasets.</li>
            <li>Voltooi <b>8 delen</b> om handmatig multiple regressie uit te voeren (gebruik 4 decimalen).</li>
            <li>Bekijk de dataset (alleen-lezen). Vul daarna stap voor stap in:
              <ul style='margin-top:4px;'>
                <li><b>Deel I:</b> Dataset bekijken</li>
                <li><b>Deel II:</b> Stap 1 (Rekenkundige gemiddelden voor x₁, x₂ en Y)</li>
                <li><b>Deel III:</b> Stappen 2-6 (Afwijkingen, kwadraten en kruisproducten: Σ(x₁−x̄₁)², Σ(x₂−x̄₂)², Σ(Y−Ȳ)², Σ(x₁−x̄₁)(x₂−x̄₂), Σ(x₁−x̄₁)(Y−Ȳ), Σ(x₂−x̄₂)(Y−Ȳ))</li>
                <li><b>Deel IV:</b> Stappen 7-8 (Varianties en standaardafwijkingen)</li>
                <li><b>Deel V:</b> Stappen 15-18 (Determinant, b₁, b₂ en intercept a)</li>
                <li><b>Deel VI:</b> Voorspellingen met Ŷ = a + b₁·x₁ + b₂·x₂</li>
                <li><b>Deel VII:</b> R² en vervreemdingscoëfficiënt</li>
                <li><b>Deel VIII:</b> F-toets & model p-waarde (via R²-formule)</li>
              </ul>
            </li>
            <li>Velden worden groen wanneer correct en rood wanneer fout.</li>
            <li>Wanneer alle stappen correct zijn, verschijnen <b>visualisaties en interpretatie</b> in Deel IX.</li>
          </ul>")
      ),
      br(),
      div(class = "card",
          h4("Scenario en dataset"),
          div(class="muted", style="margin-bottom: 10px;", 
              HTML("<b>Twee manieren om data te verkrijgen:</b><br/>
              <b>1. Selecteer een specifiek scenario</b> uit de dropdown en klik 'Genereer dataset'<br/>
              <b>2. Kies een willekeurig scenario</b> via 'Willekeurig scenario' (kiest uit onze criminologie-collectie)")),
          
          selectInput("scenario", "Scenario", choices = scenario_choices),
          helpText("Kies een criminologische context (bijv. criminaliteitspreventie, inbraakcijfers). Elk scenario heeft realistische relaties tussen variabelen."),
          
          numericInput("n", paste0("Steekproefgrootte N (5–", MAX_SAMPLE_SIZE, ")"), 
                       value = 10, min = 5, max = MAX_SAMPLE_SIZE, step = 1),
          helpText("Aantal waarnemingen/cases in de dataset (bijv. 10 buurten, 20 studenten). Grotere steekproeven = meer berekeningen."),
          
          textInput("seed", "Datasetcode (seed, optioneel)", value = ""),
          helpText(HTML("<b>Optioneel nummer voor reproduceerbaarheid.</b> Zelfde code = elke keer dezelfde dataset. Typ een willekeurig nummer: bij dezelfde code krijg je steeds dezelfde dataset.")),
          
          fluidRow(
            column(5, actionButton("gen", "Genereer dataset", class = "btn btn-success btn-wide")),
            column(5, actionButton("new_same", "Willekeurig scenario", class = "btn btn-default btn-wide"))
          ),
          helpText("'Genereer dataset' gebruikt het gekozen scenario. 'Willekeurig scenario' kiest een willekeurig scenario - ideaal voor gevarieerde oefening!"),
          
          uiOutput("seed_echo")
      ),
      br(),
      div(class = "card",
          h4("Stappen "),
          HTML(paste0(
            "<div class='accent'><b>Multiple regressie (2 voorspellers: x₁, x₂)</b><ol style='margin:6px 0 0 18px;'>",
            "<li>Bereken rekenkundige gemiddelden: x̄₁, x̄₂, Ȳ.</li>",
            "<li>Bereken voor elke eenheid de afwijking t.o.v. het gemiddelde voor x₁, x₂ en Y.</li>",
            "<li>Kwadrateer deze afwijkingen (bouwt variatie op in x₁, x₂ en Y).</li>",
            "<li>Tel de gekwadrateerde afwijkingen op: Σ(x₁−x̄₁)², Σ(x₂−x̄₂)², Σ(Y−Ȳ)².</li>",
            "<li>Bereken de kruisproducten: Σ(x₁−x̄₁)(x₂−x̄₂), Σ(x₁−x̄₁)(Y−Ȳ), Σ(x₂−x̄₂)(Y−Ȳ).</li>",
            "<li>Gebruik deze totalen als bouwstenen voor de regressie (sommen van kwadraten en kruisproducten).</li>",
            "<li>Bereken Var(x₁) = Σ(x₁−x̄₁)²/(n−1), Var(x₂) = Σ(x₂−x̄₂)²/(n−1), Var(Y) = Σ(Y−Ȳ)²/(n−1).</li>",
            "<li>Neem de vierkantswortel (√) om SD(x₁), SD(x₂) en SD(Y) te verkrijgen.</li>",
            "<li>Bereken Cov(x₁,Y) = Σ(x₁−x̄₁)(Y−Ȳ)/(n−1).</li>",
            "<li>Bereken Cov(x₂,Y) = Σ(x₂−x̄₂)(Y−Ȳ)/(n−1).</li>",
            "<li>Bereken Cov(x₁,x₂) = Σ(x₁−x̄₁)(x₂−x̄₂)/(n−1).</li>",
            "<li>Standaardiseer tot correlatie r<sub>x₁,Y</sub> = Cov(x₁,Y) / [SD(x₁)×SD(Y)].</li>",
            "<li>Standaardiseer tot correlatie r<sub>x₂,Y</sub> = Cov(x₂,Y) / [SD(x₂)×SD(Y)].</li>",
            "<li>Standaardiseer tot correlatie r<sub>x₁,x₂</sub> = Cov(x₁,x₂) / [SD(x₁)×SD(x₂)].</li>",
            "<li>Bereken de determinant van de variantie-covariantiematrix.</li>",
            "<li>Bereken de ongestandaardiseerde regressiecoëfficiënt b₁ met determinant en kruisproducten.</li>",
            "<li>Bereken de ongestandaardiseerde regressiecoëfficiënt b₂ met determinant en kruisproducten.</li>",
            "<li>Bereken het intercept a = Ȳ − b₁·x̄₁ − b₂·x̄₂.</li>",
            "<li>Voorspelde waarde Ŷ = a + b₁·x₁ + b₂·x₂ (voor elke observatie).</li>",
            "<li>R² = 1 − SSE/SST (determinatiecoëfficiënt: aandeel verklaarde variantie).</li>",
            "<li>Vervreemdingscoëfficiënt = 1 − R² (onverklaarde variantie).</li>",
            "<li>F = (R²/2) / ((1−R²)/(n−3)) met p = 2 voorspellers.</li>",
            "<li>Model p-waarde = rechterstaartkans van F met df<sub>1</sub>=2 en df<sub>2</sub>=n−3.</li>",
            "</ol></div>"
          ))
      )
    ),

    mainPanel(
      div(class = "card",
          h4("Deel I — Dataset"),
          div(class = "muted", "(Alleen-lezen)."),
          rHandsontableOutput("data_view")
      ),
      br(),

      div(class = "card",
          h4("Taak & vignette"),
          uiOutput("vignette_block")
      ),
      br(),

      div(class = "card",
          h4("Deel II — Stap 1: Rekenkundige Gemiddelden (4 decimalen)"),
          div(class = "muted", "Bereken het rekenkundig gemiddelde voor elke variabele."),
          uiOutput("labels_vars"),
          numericInput("mean_X1", HTML("Gemiddelde x̄₁"), value = NA, step = 0.0001),
          uiOutput("msg_mean_X1"),
          numericInput("mean_X2", HTML("Gemiddelde x̄₂"), value = NA, step = 0.0001),
          uiOutput("msg_mean_X2"),
          numericInput("mean_Y", HTML("Gemiddelde Ȳ"), value = NA, step = 0.0001),
          uiOutput("msg_mean_Y")
      ),
      br(),

        div(class = "card", id = "part3_card",
          h4("Deel III — Stappen 2-6: Afwijkingen, Kwadraten & Kruisproducten (4 decimalen)"),
          div(class = "muted", "Werk in twee tabellen en bereken daarna de totalen hieronder. Cellen worden groen wanneer correct en rood wanneer fout."),
          div(style="margin: 6px 0 6px 0;",
            HTML("<b>Tabel 1:</b> Ruwe waarden x₁, x₂ en Y met hun afwijkingen t.o.v. het gemiddelde: x₁−x̄₁, x₂−x̄₂, Y−Ȳ.")
          ),
          div(style="width: 100%; padding: 0; margin: 0;",
            rHandsontableOutput("calc_table_1")
          ),
          div(style="margin: 6px 0 6px 0;",
            HTML("<b>Tabel 2:</b> Kwadraten (x₁−x̄₁)², (x₂−x̄₂)², (Y−Ȳ)² en kruisproducten (x₁−x̄₁)(x₂−x̄₂), (x₁−x̄₁)(Y−Ȳ), (x₂−x̄₂)(Y−Ȳ).")
          ),
          div(style="width: 100%; padding: 0; margin: 0;",
            rHandsontableOutput("calc_table_2")
          ),
          h5("Totalen uit Tabel 1 & 2"),
          div(class = "muted", "Gebruik je ingevulde tabellen om deze belangrijke sommen van kwadraten en kruisproducten te berekenen."),
          numericInput("tot_X1_2", HTML("Σ(x₁−x̄₁)²"), value = NA, step = 0.0001),
          uiOutput("msg_tot_X1_2"),
          numericInput("tot_X2_2", HTML("Σ(x₂−x̄₂)²"), value = NA, step = 0.0001),
          uiOutput("msg_tot_X2_2"),
          numericInput("tot_X1X2", HTML("Σ(x₁−x̄₁)(x₂−x̄₂)"), value = NA, step = 0.0001),
          uiOutput("msg_tot_X1X2"),
          numericInput("tot_X1Y", HTML("Σ(x₁−x̄₁)(Y−Ȳ)"), value = NA, step = 0.0001),
          uiOutput("msg_tot_X1Y"),
          numericInput("tot_X2Y", HTML("Σ(x₂−x̄₂)(Y−Ȳ)"), value = NA, step = 0.0001),
          uiOutput("msg_tot_X2Y"),
          numericInput("tot_Y2", HTML("Σ(Y−Ȳ)² (SST)"), value = NA, step = 0.0001),
          uiOutput("msg_tot_Y2")
      ),
      br(),

      div(class = "card",
          h4("Deel IV — Stappen 7-8: Varianties & Standaardafwijkingen (4 decimalen)"),
          div(class = "muted", "Bereken eerst de varianties door elke som van kwadraten te delen door (n−1). De standaardafwijkingen SD(x₁), SD(x₂), SD(Y) volgen uit SD = √Var."),
          numericInput("var_X1", HTML("Var(x₁) = Σ(x₁−x̄₁)²/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_var_X1"),
          numericInput("sd_X1", HTML("SD(x₁) = √Var(x₁)"), value = NA, step = 0.0001),
          uiOutput("msg_sd_X1"),
          numericInput("var_X2", HTML("Var(x₂) = Σ(x₂−x̄₂)²/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_var_X2"),
          numericInput("sd_X2", HTML("SD(x₂) = √Var(x₂)"), value = NA, step = 0.0001),
          uiOutput("msg_sd_X2"),
          numericInput("var_Y", HTML("Var(Y) = Σ(Y−Ȳ)²/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_var_Y"),
          numericInput("sd_Y", HTML("SD(Y) = √Var(Y)"), value = NA, step = 0.0001),
          uiOutput("msg_sd_Y")
      ),
      br(),

      div(class = "card",
          h4("Deel IV-A — Stappen 9-11: Covarianties (4 decimalen)"),
          div(class = "muted", "Bereken covarianties tussen paren van variabelen. Covariantie meet hoe twee variabelen samen variëren."),
          helpText("Formule: Cov(X,Y) = Σ(X−X̄)(Y−Ȳ)/(n−1)"),
          numericInput("cov_x1y", HTML("Cov(x₁,Y) = Σ(x₁−x̄₁)(Y−Ȳ)/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_cov_x1y"),
          numericInput("cov_x2y", HTML("Cov(x₂,Y) = Σ(x₂−x̄₂)(Y−Ȳ)/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_cov_x2y"),
          numericInput("cov_x1x2", HTML("Cov(x₁,x₂) = Σ(x₁−x̄₁)(x₂−x̄₂)/(n−1)"), value = NA, step = 0.0001),
          uiOutput("msg_cov_x1x2")
      ),
      br(),

      div(class = "card",
          h4("Deel IV-B — Stappen 12-14: Correlatiecoëfficiënten (4 decimalen)"),
          div(class = "muted", "Standaardiseer covarianties om correlaties te verkrijgen. Elke correlatie r = Cov / [SD×SD]."),
          helpText("Gebruik je covarianties uit Deel IV-A en standaardafwijkingen uit Deel IV."),
          numericInput("r_x1y", HTML("r<sub>x₁,Y</sub> = Cov(x₁,Y) / [SD(x₁)×SD(Y)]"), value = NA, step = 0.0001),
          uiOutput("msg_r_x1y"),
          numericInput("r_x2y", HTML("r<sub>x₂,Y</sub> = Cov(x₂,Y) / [SD(x₂)×SD(Y)]"), value = NA, step = 0.0001),
          uiOutput("msg_r_x2y"),
          numericInput("r_x1x2", HTML("r<sub>x₁,x₂</sub> = Cov(x₁,x₂) / [SD(x₁)×SD(x₂)]"), value = NA, step = 0.0001),
          uiOutput("msg_r_x1x2")
      ),
      br(),

      div(class = "card",
          h4("Deel V — Stappen 15-18: Regressiecoëfficiënten (4 decimalen)"),
          div(class = "muted", "Bereken de ongestandaardiseerde coëfficiënten (b₁, b₂) en het intercept (a). Met twee voorspellers moeten we rekening houden met hun onderlinge correlatie."),
          helpText("In tegenstelling tot bivariate regressie (waar b = Cov(X,Y)/Var(X)) vereist multiple regressie gelijktijdige vergelijkingen. Bereken eerst de determinant det = Σ(x₁−x̄₁)²·Σ(x₂−x̄₂)² − [Σ(x₁−x̄₁)(x₂−x̄₂)]². Dit meet hoe onafhankelijk de voorspellers zijn."),
          numericInput("multi_det", HTML("<b>Stap 15:</b> det = Σ(x₁−x̄₁)²·Σ(x₂−x̄₂)² − [Σ(x₁−x̄₁)(x₂−x̄₂)]²"), value = NA, step = 0.0001),
          uiOutput("msg_multi_det"),
          numericInput("multi_b1", HTML("<b>Stap 16:</b> Ongestandaardiseerde regressiecoëfficiënt b₁ = [Σ(x₁−x̄₁)(Y−Ȳ)·Σ(x₂−x̄₂)² − Σ(x₂−x̄₂)(Y−Ȳ)·Σ(x₁−x̄₁)(x₂−x̄₂)] / det"), value = NA, step = 0.0001),
          uiOutput("msg_multi_b1"),
          numericInput("multi_b2", HTML("<b>Stap 17:</b> Ongestandaardiseerde regressiecoëfficiënt b₂ = [Σ(x₂−x̄₂)(Y−Ȳ)·Σ(x₁−x̄₁)² − Σ(x₁−x̄₁)(Y−Ȳ)·Σ(x₁−x̄₁)(x₂−x̄₂)] / det"), value = NA, step = 0.0001),
          uiOutput("msg_multi_b2"),
          numericInput("multi_intercept", HTML("<b>Stap 18:</b> Intercept a = Ȳ − b₁·x̄₁ − b₂·x̄₂"), value = NA, step = 0.0001),
          uiOutput("msg_multi_intercept")
      ),
      br(),

      div(class = "card", id = "pred_card",
          h4("Deel VI — Stap 19: Voorspellingen (4 decimalen)"),
          div(class = "muted", "Pas de regressievergelijking toe om Y-waarden te voorspellen voor elke observatie."),
          helpText("Bereken per rij: Ŷ = a + b₁·x₁ + b₂·x₂ met je coëfficiënten uit Deel V."),
          div(style="width: 100%; padding: 0; margin: 0;",
              rHandsontableOutput("prediction_table")
          ),
          uiOutput("msg_predictions")
      ),
      br(),

      div(class = "card",
          h4("Deel VII — Stappen 20-21: Model Fit & Samenvatting (4 decimalen)"),
          div(class = "muted", "Beoordeel hoe goed het model de variatie in Y verklaart."),
          helpText("R² (determinatiecoëfficiënt) toont het aandeel verklaarde variantie. Vervreemdingscoëfficiënt (onverklaarde variantie) = 1 − R²."),
          numericInput("multi_r_squared", HTML("R² = 1 − SSE/SST (determinatiecoëfficiënt)"), value = NA, step = 0.0001),
          uiOutput("msg_multi_r_squared"),
          numericInput("multi_alienation", HTML("Vervreemdingscoëfficiënt = 1 − R² (onverklaarde variantie)"), value = NA, step = 0.0001),
          uiOutput("msg_multi_alienation")
      ),
      br(),

      div(class = "card",
          h4("Deel VIII — Stappen 22-23: F-toets via R² (4 decimalen)"),
          div(class = "muted", "Bereken de globale modeltoets met p = 2 voorspellers."),
          helpText("Gebruik exact: F = (R²/2)/((1−R²)/(n−3)) en model p-waarde = P(F(df1=2, df2=n−3) ≥ F). In Excel: =F.DIST.RT(F;2;n−3)."),
          numericInput("multi_f_stat", HTML("F = (R²/2) / ((1−R²)/(n−3))"), value = NA, step = 0.0001),
          uiOutput("msg_multi_f_stat"),
          numericInput("multi_model_p", HTML("Model p-waarde = F.DIST.RT(F; 2; n−3)"), value = NA, step = 0.0001),
          uiOutput("msg_multi_model_p")
      ),
      br(),

      uiOutput("final_success_message"),
      br(),

      div(class = "card",
          h4("Deel IX — Visualisaties & Samenvatting (ontgrendelt wanneer alles correct is)"),
          div(id = "viz_block", class = "disabled",
              uiOutput("plot_block"),
              uiOutput("stats_block"),
              uiOutput("interpret_block")
          )
      )
    )
  )
)

# ============================================================
# SERVER
# ============================================================

server <- function(input, output, session) {
  current <- reactiveVal(tibble::tibble())
  xvars <- reactiveVal(character(0))
  yvar <- reactiveVal(NULL)
  user_calc_tbl <- reactiveVal(NULL)
  prediction_tbl <- reactiveVal(NULL)
  unlocked <- reactiveVal(FALSE)

  do_check <- reactiveVal(0L)
  bump <- function() do_check(isolate(do_check()) + 1L)

  observeEvent(input$check_btn, bump())
  observeEvent(reactiveValuesToList(input), {
    bump()
  })

  output$seed_echo <- renderUI({
    s <- safe_seed(input$seed)
    if (is.null(s)) return(NULL)
    div(class = "muted", paste0("Datasetcode (seed): ", s))
  })
  
  reset_analysis_inputs_multi <- function() {
    input_ids <- c(
      "mean_X1", "mean_X2", "mean_Y",
      "tot_X1_2", "tot_X2_2", "tot_X1X2", "tot_X1Y", "tot_X2Y", "tot_Y2",
      "var_X1", "sd_X1", "var_X2", "sd_X2", "var_Y", "sd_Y",
      "cov_x1y", "cov_x2y", "cov_x1x2",
      "r_x1y", "r_x2y", "r_x1x2",
      "multi_det", "multi_b1", "multi_b2", "multi_intercept",
      "multi_r_squared", "multi_alienation",
      "multi_f_stat", "multi_model_p"
    )
    
    msg_ids <- c(
      "msg_mean_X1", "msg_mean_X2", "msg_mean_Y",
      "msg_tot_X1_2", "msg_tot_X2_2", "msg_tot_X1X2", "msg_tot_X1Y", "msg_tot_X2Y", "msg_tot_Y2",
      "msg_var_X1", "msg_sd_X1", "msg_var_X2", "msg_sd_X2", "msg_var_Y", "msg_sd_Y",
      "msg_cov_x1y", "msg_cov_x2y", "msg_cov_x1x2",
      "msg_r_x1y", "msg_r_x2y", "msg_r_x1x2",
      "msg_multi_det", "msg_multi_b1", "msg_multi_b2", "msg_multi_intercept",
      "msg_predictions",
      "msg_multi_r_squared", "msg_multi_alienation",
      "msg_multi_f_stat", "msg_multi_model_p"
    )
    
    for (id in input_ids) {
      session$sendInputMessage(id, list(value = ""))
      session$sendCustomMessage("markField", list(id = id, state = "neutral"))
    }
    
    for (id in msg_ids) {
      output[[id]] <- renderUI(HTML(""))
    }
    
    prediction_tbl(NULL)
    user_calc_tbl(NULL)
    unlocked(FALSE)
    session$sendCustomMessage("toggleViz", FALSE)
  }

  # Centralised dataset creation, mirroring the bivariate app structure
  new_data_multi <- function(random_scenario = FALSE) {
    n <- as.integer(input$n %||% 10)
    if (is.na(n) || n < 5) n <- 5
    if (n > MAX_SAMPLE_SIZE) n <- MAX_SAMPLE_SIZE

    ss <- safe_seed(input$seed)
    if (is.null(ss)) ss <- sample.int(1e9, 1)

    sc <- NULL
    if (isTRUE(random_scenario)) {
      # Pick a random scenario and update the dropdown
      sc <- sample(scenarios, 1)[[1]]
      updateSelectInput(session, "scenario", selected = sc$id)
    } else {
      sc <- get_sc(input$scenario)
    }

    if (is.null(sc)) return(NULL)

    df <- make_scenario_data_multi2(sc, n = n, seed = ss)
    if (is.null(df) || nrow(df) == 0) return(NULL)

    current(df)

    # Y is always generated as the last column.
    if (ncol(df) < 4) return(NULL)
    xvars(names(df)[2:3])
    yvar(names(df)[ncol(df)])

    reset_analysis_inputs_multi()
    bump()
  }

  # Generate dataset on button clicks
  observeEvent(input$gen, {
    new_data_multi(FALSE)
  })

  observeEvent(input$new_same, {
    new_data_multi(TRUE)
  })

  # Auto-generate a dataset on first load (and when N changes)
  observe({
    df <- current()
    if (is.null(df) || nrow(df) == 0) {
      new_data_multi(FALSE)
    }
  })

  output$vignette_block <- renderUI({
    sc <- get_sc(input$scenario)
    if (is.null(sc)) return(NULL)

    x1_name  <- sc$vars$x$name
    x1_unit  <- sc$vars$x$unit %||% ""
    y_name   <- sc$vars$y$name
    y_unit   <- sc$vars$y$unit %||% ""
    x2_name  <- (sc$extras %||% c("ControlVar"))[1]

    var_labels <- paste0(
      "<br><b>x₁ = ", x1_name, "</b> (", x1_unit, ") &nbsp;|&nbsp; ",
      "<b>x₂ = ", x2_name, "</b> &nbsp;|&nbsp; ",
      "<b>Y = ", y_name, "</b> (", y_unit, ")"
    )

    HTML(paste0(
      "<div class='accent'><b>", sc$title, "</b><br>",
      sc$vignette,
      var_labels,
      "</div>"
    ))
  })

  output$labels_vars <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    xs <- xvars()
    y <- yvar()
    if (length(xs) != 2 || is.null(y)) return(NULL)
    tags$div(class = "muted", HTML(paste0("<b>x₁:</b> ", xs[1], " &nbsp;&nbsp; <b>x₂:</b> ", xs[2], " &nbsp;&nbsp; <b>Y:</b> ", y)))
  })

  output$data_view <- renderRHandsontable({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    numeric_cols <- sapply(df, is.numeric)
    df[numeric_cols] <- lapply(df[numeric_cols], function(x) round(x, 2))
    
    rhandsontable(df, rowHeaders = FALSE, readOnly = TRUE, width = 800) %>%
      hot_col(1, width = 150) %>%
      hot_col(2, width = 150) %>%
      hot_col(3, width = 150) %>%
      hot_col(4, width = 150) %>%
      hot_cols(
        renderer = '
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          td.style.textAlign = "center";
          if (col > 0 && value !== null && value !== "" && !isNaN(Number(value))) {
            td.innerText = Number(value).toFixed(2);
          }
        }'
      )
  })
  
  # Part III calculation tables (split into two narrower tables)
  output$calc_table_1 <- renderRHandsontable({
    df <- current()
    xs <- xvars()
    y <- yvar()
    if (is.null(df) || nrow(df) == 0 || length(xs) != 2 || is.null(y)) return(NULL)

    full_tbl <- user_calc_tbl()
    if (is.null(full_tbl)) full_tbl <- build_blank_calc_multi(df, xs, y)
    if (is.null(full_tbl)) return(NULL)

    # First table: Entity, raw data (X₁, X₂, Y), deviations
    # Columns in backing table: Entity, X1, X2, Y, dX1, dX2, dY
    # View them as: Entity, X1, X2, Y, X1−X̄1, X2−X̄2, Y−Ȳ
    view_cols <- c(1, 2, 3, 4, 5, 6, 7)
    tbl <- full_tbl[, view_cols, drop = FALSE]

    entity_col_name <- names(full_tbl)[1]
    raw_x1 <- xs[1]
    raw_x2 <- xs[2]
    raw_y  <- y

    headers <- c(
      entity_col_name,
      raw_x1, raw_x2, raw_y,
      "x₁ − x̄₁", "x₂ − x̄₂", "Y − Ȳ"
    )

    ht <- rhandsontable(tbl, rowHeaders = FALSE, colHeaders = headers, width = "100%", stretchH = "all")

    ht <- ht %>%
      hot_col(1, readOnly = TRUE) %>%
      hot_col(2, readOnly = TRUE, type = "numeric", format = "0.00") %>%
      hot_col(3, readOnly = TRUE, type = "numeric", format = "0.00") %>%
      hot_col(4, readOnly = TRUE, type = "numeric", format = "0.00")

    for (i in 5:7) {
      ht <- ht %>% hot_col(i, type = "numeric", format = "0.0000", allowInvalid = TRUE)
    }

    # Validation based on means and original data (2 dp)
    meanX1 <- suppressWarnings(as.numeric(input$mean_X1))
    meanX2 <- suppressWarnings(as.numeric(input$mean_X2))
    meanY  <- suppressWarnings(as.numeric(input$mean_Y))

    if (!is.na(meanX1) && !is.na(meanX2) && !is.na(meanY)) {
      X1_vals <- round(as.numeric(df[[xs[1]]]), 2)
      X2_vals <- round(as.numeric(df[[xs[2]]]), 2)
      Y_vals  <- round(as.numeric(df[[y]]), 2)

      exp_dX1 <- round(X1_vals - meanX1, 4)
      exp_dX2 <- round(X2_vals - meanX2, 4)
      exp_dY  <- round(Y_vals  - meanY,  4)

      validation_data <- list(
        dX1 = as.numeric(exp_dX1),
        dX2 = as.numeric(exp_dX2),
        dY  = as.numeric(exp_dY)
      )

      ht <- ht %>% hot_cols(
        renderer = paste0('
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.NumericRenderer.apply(this, arguments);
          td.style.textAlign = "center";

          if (col > 0 && value !== null && value !== "") {
            var num = Number(value);
            if (!isNaN(num)) {
              if (col >= 1 && col <= 3) {
                td.innerText = num.toFixed(2);
              } else {
                td.innerText = num.toFixed(4);
              }
            }
          }

          var validationData = ', jsonlite::toJSON(validation_data), ';

          var expectedByCol = {
            4: validationData.dX1,
            5: validationData.dX2,
            6: validationData.dY
          };

          if (value !== null && value !== "" && !isNaN(Number(value))) {
            var userVal = Number(value);
            var expectedArray = expectedByCol[col];

            if (expectedArray !== undefined && expectedArray[row] !== undefined) {
              var expected = Number(expectedArray[row]);
              var userRounded = Math.round(userVal * 10000) / 10000;
              var expectedRounded = Math.round(expected * 10000) / 10000;

              if (userRounded === expectedRounded) {
                td.style.backgroundColor = "#e8f5e9";
                td.style.border = "2px solid #00C853";
              } else {
                td.style.backgroundColor = "#ffebee";
                td.style.border = "2px solid #D50000";
              }
            }
          }
        }')
      )
    }

    ht
  })

  output$calc_table_2 <- renderRHandsontable({
    df <- current()
    xs <- xvars()
    y <- yvar()
    if (is.null(df) || nrow(df) == 0 || length(xs) != 2 || is.null(y)) return(NULL)

    full_tbl <- user_calc_tbl()
    if (is.null(full_tbl)) full_tbl <- build_blank_calc_multi(df, xs, y)
    if (is.null(full_tbl)) return(NULL)

    # Second table: Entity, squared deviations and cross-products
    view_cols <- c(1, 8, 9, 10, 11, 12, 13)
    tbl <- full_tbl[, view_cols, drop = FALSE]

    entity_col_name <- names(full_tbl)[1]
    # Use explicit squared-deviation and cross-product notation
    # with a superscript ² on the whole term, matching the
    # bivariate app style (e.g., (x₁−x̄)²).
    headers <- c(
      entity_col_name,
      "(x₁ − x̄₁)²", "(x₂ − x̄₂)²", "(Y − Ȳ)²",
      "(x₁ − x̄₁)(x₂ − x̄₂)", "(x₁ − x̄₁)(Y − Ȳ)", "(x₂ − x̄₂)(Y − Ȳ)"
    )

    ht <- rhandsontable(tbl, rowHeaders = FALSE, colHeaders = headers, width = "100%", stretchH = "all")

    ht <- ht %>%
      hot_col(1, readOnly = TRUE)

    for (i in 2:7) {
      ht <- ht %>% hot_col(i, type = "numeric", format = "0.0000", allowInvalid = TRUE)
    }

    # Validation based on means and original data
    meanX1 <- suppressWarnings(as.numeric(input$mean_X1))
    meanX2 <- suppressWarnings(as.numeric(input$mean_X2))
    meanY  <- suppressWarnings(as.numeric(input$mean_Y))

    if (!is.na(meanX1) && !is.na(meanX2) && !is.na(meanY)) {
      X1_vals <- round(as.numeric(df[[xs[1]]]), 2)
      X2_vals <- round(as.numeric(df[[xs[2]]]), 2)
      Y_vals  <- round(as.numeric(df[[y]]), 2)

      exp_dX1 <- round(X1_vals - meanX1, 4)
      exp_dX2 <- round(X2_vals - meanX2, 4)
      exp_dY  <- round(Y_vals  - meanY,  4)
      exp_dX1_2   <- round(exp_dX1^2, 4)
      exp_dX2_2   <- round(exp_dX2^2, 4)
      exp_dY_2    <- round(exp_dY^2,   4)
      exp_dX1_dX2 <- round(exp_dX1 * exp_dX2, 4)
      exp_dX1_dY  <- round(exp_dX1 * exp_dY,  4)
      exp_dX2_dY  <- round(exp_dX2 * exp_dY,  4)

      validation_data <- list(
        dX1_2   = as.numeric(exp_dX1_2),
        dX2_2   = as.numeric(exp_dX2_2),
        dY_2    = as.numeric(exp_dY_2),
        dX1_dX2 = as.numeric(exp_dX1_dX2),
        dX1_dY  = as.numeric(exp_dX1_dY),
        dX2_dY  = as.numeric(exp_dX2_dY)
      )

      ht <- ht %>% hot_cols(
        renderer = paste0('
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.NumericRenderer.apply(this, arguments);
          td.style.textAlign = "center";

          if (col > 0 && value !== null && value !== "") {
            var num = Number(value);
            if (!isNaN(num)) {
              td.innerText = num.toFixed(4);
            }
          }

          var validationData = ', jsonlite::toJSON(validation_data), ';

          var expectedByCol = {
            1: validationData.dX1_2,
            2: validationData.dX2_2,
            3: validationData.dY_2,
            4: validationData.dX1_dX2,
            5: validationData.dX1_dY,
            6: validationData.dX2_dY
          };

          if (value !== null && value !== "" && !isNaN(Number(value))) {
            var userVal = Number(value);
            var expectedArray = expectedByCol[col];

            if (expectedArray !== undefined && expectedArray[row] !== undefined) {
              var expected = Number(expectedArray[row]);
              var userRounded = Math.round(userVal * 10000) / 10000;
              var expectedRounded = Math.round(expected * 10000) / 10000;

              if (userRounded === expectedRounded) {
                td.style.backgroundColor = "#e8f5e9";
                td.style.border = "2px solid #00C853";
              } else {
                td.style.backgroundColor = "#ffebee";
                td.style.border = "2px solid #D50000";
              }
            }
          }
        }')
      )
    }

    ht
  })

  # Keep a single backing table, updating it when either view changes
  observeEvent(input$calc_table_1, {
    if (is.null(input$calc_table_1)) return()

    df <- current()
    xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || length(xs) != 2) return()

    full_tbl <- user_calc_tbl()
    if (is.null(full_tbl)) {
      y <- yvar()
      full_tbl <- build_blank_calc_multi(df, xs, y)
    }
    if (is.null(full_tbl)) return()

    partial <- hot_to_r(input$calc_table_1)
    common_cols <- intersect(names(full_tbl), names(partial))
    full_tbl[common_cols] <- partial[common_cols]
    user_calc_tbl(full_tbl)
  })

  observeEvent(input$calc_table_2, {
    if (is.null(input$calc_table_2)) return()

    df <- current()
    xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || length(xs) != 2) return()

    full_tbl <- user_calc_tbl()
    if (is.null(full_tbl)) {
      y <- yvar()
      full_tbl <- build_blank_calc_multi(df, xs, y)
    }
    if (is.null(full_tbl)) return()

    partial <- hot_to_r(input$calc_table_2)
    common_cols <- intersect(names(full_tbl), names(partial))
    full_tbl[common_cols] <- partial[common_cols]
    user_calc_tbl(full_tbl)
  })

  output$prediction_table <- renderRHandsontable({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    xs <- xvars()
    y <- yvar()
    if (length(xs) != 2 || is.null(y)) return(NULL)

    stored <- prediction_tbl()
    # Check for the column with the full formula name
    pred_col_name <- "Ŷ = a + b₁·X₁ + b₂·X₂"
    pred_col <- if (!is.null(stored) && pred_col_name %in% names(stored)) {
      stored[[pred_col_name]]
    } else {
      rep(NA_real_, nrow(df))
    }

    entity_col_name <- names(df)[1]
    
    pred_tbl <- data.frame(
      entity = df[[entity_col_name]],
      X1 = round(df[[xs[1]]], 2),
      X2 = round(df[[xs[2]]], 2),
      Y = round(df[[y]], 2),
      Y_pred = pred_col,
      check.names = FALSE,
      stringsAsFactors = FALSE
    )
    names(pred_tbl) <- c(entity_col_name, xs[1], xs[2], y, pred_col_name)

    # Show full table while minimizing extra whitespace
    total_height <- 36 + 24 * nrow(pred_tbl)
    
    ht <- rhandsontable(pred_tbl, rowHeaders = FALSE, width = 1000, height = total_height) %>%
      hot_col(1, readOnly = TRUE, width = 150) %>%
      hot_col(2, readOnly = TRUE, type = "numeric", format = "0.00", width = 150) %>%
      hot_col(3, readOnly = TRUE, type = "numeric", format = "0.00", width = 150) %>%
      hot_col(4, readOnly = TRUE, type = "numeric", format = "0.00", width = 150) %>%
      hot_col(5, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 200)
    
    # Add validation using TRUTH predictions (same source as server-side checks)
    truth <- calc_multi2_manual_truth(df, y, xs)
    
    if (!is.null(truth) && !is.null(truth$predictions)) {
      # Use the already computed truth$predictions, which incorporate
      # the same intermediate rounding as in calc_multi2_manual_truth().
      validation_data <- list(
        expected = as.numeric(truth$predictions)
      )
      
      ht <- ht %>% hot_cols(
        renderer = paste0('
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.NumericRenderer.apply(this, arguments);
          td.style.textAlign = "center";
          
          // Reset styling first
          td.style.backgroundColor = "";
          td.style.border = "";
          
          if (col > 0 && value !== null && value !== "") {
            var num = Number(value);
            if (!isNaN(num)) {
              if (col >= 1 && col <= 3) {
                td.innerText = num.toFixed(2);
              } else if (col === 4) {
                td.innerText = num.toFixed(4);
              }
            }
          }
          
          var validationData = ', jsonlite::toJSON(validation_data), ';
          
          if (col === 4 && value !== null && value !== "" && !isNaN(Number(value))) {
            var userVal = Number(value);
            var expected = Number(validationData.expected[row]);
            
            var userRounded = Math.round(userVal * 10000) / 10000;
            var expectedRounded = Math.round(expected * 10000) / 10000;
            
            if (userRounded === expectedRounded) {
              td.style.backgroundColor = "#e8f5e9";
              td.style.border = "2px solid #00C853";
            } else {
              td.style.backgroundColor = "#ffebee";
              td.style.border = "2px solid #D50000";
            }
          }
        }')
      )
    }
    
    ht
  })

  observeEvent(input$prediction_table, {
    if (!is.null(input$prediction_table)) prediction_tbl(hot_to_r(input$prediction_table))
  })

  raw_numeric_input <- function(id) {
    raw_val <- input[[paste0(id, "__raw")]]
    if (!is.null(raw_val) && nzchar(trimws(as.character(raw_val)))) return(raw_val)
    input[[id]]
  }

  field_status_ui <- function(state) {
    if (!state %in% c("valid", "invalid")) return(NULL)
    col <- if (identical(state, "valid")) "#00C853" else "#D50000"
    label <- if (identical(state, "valid")) "OK" else "X"
    div(
      class = "traffic",
      span(class = "light", style = paste0("background:", col, ";")),
      span(style = paste0("color:", col, ";font-weight:700;"), label)
    )
  }

  mark_field <- function(id, ok, msg_id, ok_msg = "", err_msg = "", true_val = NULL) {
    st <- if (isTRUE(ok)) "valid" else if (identical(ok, FALSE)) "invalid" else "neutral"
    session$sendCustomMessage("markField", list(id = id, state = st))

    em <- if (!isTRUE(ok) && !is.null(true_val)) {
      u_num <- suppressWarnings(as.numeric(input[[id]]))
      if (!is.na(u_num) && is_decimal_miss(u_num, true_val, raw_input = raw_numeric_input(id)))
        "Afrondingsfout: gebruik 4 decimalen (uw waarde is inhoudelijk correct)."
      else
        as.character(err_msg)
    } else {
      as.character(err_msg)
    }
    om <- as.character(ok_msg)
    st_local <- st

    output[[msg_id]] <- renderUI({
      if (identical(st_local, "invalid")) {
        tagList(
          field_status_ui("invalid"),
          div(class = "feedback", em)
        )
      } else if (identical(st_local, "valid") && nzchar(om)) {
        tagList(
          field_status_ui("valid"),
          div(class = "ok", om)
        )
      } else if (identical(st_local, "valid")) {
        field_status_ui("valid")
      } else {
        HTML("")
      }
    })
  }

  observeEvent(do_check(), {
    df <- current()
    if (is.null(df) || nrow(df) == 0) return()
    xs <- xvars()
    y <- yvar()
    if (length(xs) != 2 || is.null(y)) return()

    truth <- calc_multi2_manual_truth(df, y, xs)
    if (is.null(truth)) return()
    
    # Helper function to safely get numeric value from input
    to_num <- function(field_name) suppressWarnings(as.numeric(input[[field_name]]))

    # Step 1 means - only mark if attempted
    if (has_attempted(input$mean_X1)) {
      mark_field("mean_X1", check_decimals(to_num("mean_X1"), truth$x1_bar, 4), "msg_mean_X1",
                 true_val = truth$x1_bar,
                 err_msg = "Gemiddelde x₁ is onjuist.")
    }
    if (has_attempted(input$mean_X2)) {
      mark_field("mean_X2", check_decimals(to_num("mean_X2"), truth$x2_bar, 4), "msg_mean_X2",
                 true_val = truth$x2_bar,
                 err_msg = "Gemiddelde x₂ is onjuist.")
    }
    if (has_attempted(input$mean_Y)) {
      mark_field("mean_Y", check_decimals(to_num("mean_Y"), truth$y_bar, 4), "msg_mean_Y",
                 true_val = truth$y_bar,
                 err_msg = "Gemiddelde Y is onjuist.")
    }

    # Cross-product totals
    if (has_attempted(input$tot_X1_2)) {
      mark_field("tot_X1_2", check_decimals(to_num("tot_X1_2"), truth$S11, 4), "msg_tot_X1_2",
                 true_val = truth$S11,
                 err_msg = "Σ(x₁−x̄₁)² is onjuist.")
    }
    if (has_attempted(input$tot_X2_2)) {
      mark_field("tot_X2_2", check_decimals(to_num("tot_X2_2"), truth$S22, 4), "msg_tot_X2_2",
                 true_val = truth$S22,
                 err_msg = "Σ(x₂−x̄₂)² is onjuist.")
    }
    if (has_attempted(input$tot_X1X2)) {
      mark_field("tot_X1X2", check_decimals(to_num("tot_X1X2"), truth$S12, 4), "msg_tot_X1X2",
                 true_val = truth$S12,
                 err_msg = "Σ(x₁−x̄₁)(x₂−x̄₂) is onjuist.")
    }
    if (has_attempted(input$tot_X1Y)) {
      mark_field("tot_X1Y", check_decimals(to_num("tot_X1Y"), truth$S1y, 4), "msg_tot_X1Y",
                 true_val = truth$S1y,
                 err_msg = "Σ(x₁−x̄₁)(Y−Ȳ) is onjuist.")
    }
    if (has_attempted(input$tot_X2Y)) {
      mark_field("tot_X2Y", check_decimals(to_num("tot_X2Y"), truth$S2y, 4), "msg_tot_X2Y",
                 true_val = truth$S2y,
                 err_msg = "Σ(x₂−x̄₂)(Y−Ȳ) is onjuist.")
    }
    if (has_attempted(input$tot_Y2)) {
      mark_field("tot_Y2", check_decimals(to_num("tot_Y2"), truth$SST, 4), "msg_tot_Y2",
                 true_val = truth$SST,
                 err_msg = "Σ(Y−Ȳ)² is onjuist.")
    }

    # Variances / SDs
    if (has_attempted(input$var_X1)) {
      mark_field("var_X1", check_decimals(to_num("var_X1"), truth$var_X1, 4), "msg_var_X1",
                 true_val = truth$var_X1,
                 err_msg = "Var(x₁) is onjuist.")
    }
    if (has_attempted(input$sd_X1)) {
      mark_field("sd_X1", check_decimals(to_num("sd_X1"), truth$sd_X1, 4), "msg_sd_X1",
                 true_val = truth$sd_X1,
                 err_msg = "SD(x₁) is onjuist.")
    }
    if (has_attempted(input$var_X2)) {
      mark_field("var_X2", check_decimals(to_num("var_X2"), truth$var_X2, 4), "msg_var_X2",
                 true_val = truth$var_X2,
                 err_msg = "Var(x₂) is onjuist.")
    }
    if (has_attempted(input$sd_X2)) {
      mark_field("sd_X2", check_decimals(to_num("sd_X2"), truth$sd_X2, 4), "msg_sd_X2",
                 true_val = truth$sd_X2,
                 err_msg = "SD(x₂) is onjuist.")
    }
    if (has_attempted(input$var_Y)) {
      mark_field("var_Y", check_decimals(to_num("var_Y"), truth$var_Y, 4), "msg_var_Y",
                 true_val = truth$var_Y,
                 err_msg = "Var(Y) is onjuist.")
    }
    if (has_attempted(input$sd_Y)) {
      mark_field("sd_Y", check_decimals(to_num("sd_Y"), truth$sd_Y, 4), "msg_sd_Y",
                 true_val = truth$sd_Y,
                 err_msg = "SD(Y) is onjuist.")
    }

    # Covariances
    if (has_attempted(input$cov_x1y)) {
      mark_field("cov_x1y", check_decimals(to_num("cov_x1y"), truth$cov_x1y, 4), "msg_cov_x1y",
                 true_val = truth$cov_x1y,
                 err_msg = "Cov(x₁,Y) is onjuist.")
    }
    if (has_attempted(input$cov_x2y)) {
      mark_field("cov_x2y", check_decimals(to_num("cov_x2y"), truth$cov_x2y, 4), "msg_cov_x2y",
                 true_val = truth$cov_x2y,
                 err_msg = "Cov(x₂,Y) is onjuist.")
    }
    if (has_attempted(input$cov_x1x2)) {
      mark_field("cov_x1x2", check_decimals(to_num("cov_x1x2"), truth$cov_x1x2, 4), "msg_cov_x1x2",
                 true_val = truth$cov_x1x2,
                 err_msg = "Cov(x₁,x₂) is onjuist.")
    }

    # Correlations
    if (has_attempted(input$r_x1y)) {
      mark_field("r_x1y", check_decimals(to_num("r_x1y"), truth$r_x1y, 4), "msg_r_x1y",
                 true_val = truth$r_x1y,
                 err_msg = "Correlatie r(x₁,Y) is onjuist.")
    }
    if (has_attempted(input$r_x2y)) {
      mark_field("r_x2y", check_decimals(to_num("r_x2y"), truth$r_x2y, 4), "msg_r_x2y",
                 true_val = truth$r_x2y,
                 err_msg = "Correlatie r(x₂,Y) is onjuist.")
    }
    if (has_attempted(input$r_x1x2)) {
      mark_field("r_x1x2", check_decimals(to_num("r_x1x2"), truth$r_x1x2, 4), "msg_r_x1x2",
                 true_val = truth$r_x1x2,
                 err_msg = "Correlatie r(x₁,x₂) is onjuist.")
    }

    # Coefficients
    if (has_attempted(input$multi_det)) {
      mark_field("multi_det", check_decimals(to_num("multi_det"), truth$det, 4), "msg_multi_det",
                 true_val = truth$det,
                 err_msg = "Determinant (det) is onjuist.")
    }
    if (has_attempted(input$multi_b1)) {
      mark_field("multi_b1", check_decimals(to_num("multi_b1"), truth$b1, 4), "msg_multi_b1",
                 true_val = truth$b1,
                 err_msg = "b₁ is onjuist.")
    }
    if (has_attempted(input$multi_b2)) {
      mark_field("multi_b2", check_decimals(to_num("multi_b2"), truth$b2, 4), "msg_multi_b2",
                 true_val = truth$b2,
                 err_msg = "b₂ is onjuist.")
    }
    if (has_attempted(input$multi_intercept)) {
      mark_field("multi_intercept", check_decimals(to_num("multi_intercept"), truth$intercept, 4), "msg_multi_intercept",
                 true_val = truth$intercept,
                 err_msg = "Intercept a is onjuist.")
    }

    # Fit
    if (has_attempted(input$multi_r_squared)) {
      mark_field("multi_r_squared", check_decimals(to_num("multi_r_squared"), truth$R_squared, 4), "msg_multi_r_squared",
                 true_val = truth$R_squared,
                 err_msg = "R² is onjuist.")
    }
    if (has_attempted(input$multi_alienation)) {
      mark_field("multi_alienation", check_decimals(to_num("multi_alienation"), truth$alienation, 4), "msg_multi_alienation",
                 true_val = truth$alienation,
                 err_msg = "Vervreemdingscoëfficiënt is onjuist.")
    }

    # F-test via R² (p = 2 voorspellers)
    f_from_r2 <- round((truth$R_squared / 2) / ((1 - truth$R_squared) / (truth$n - 3)), 4)
    p_from_f <- round(stats::pf(f_from_r2, 2, truth$n - 3, lower.tail = FALSE), 4)

    if (has_attempted(input$multi_f_stat)) {
      mark_field("multi_f_stat", check_decimals(to_num("multi_f_stat"), f_from_r2, 4), "msg_multi_f_stat",
                 true_val = f_from_r2,
                 err_msg = "F-statistiek (via R²-formule) is onjuist.")
    }
    if (has_attempted(input$multi_model_p)) {
      mark_field("multi_model_p", check_decimals(to_num("multi_model_p"), p_from_f, 4), "msg_multi_model_p",
                 true_val = p_from_f,
                 err_msg = "Model p-waarde (via F-verdeling) is onjuist.")
    }

    # Prediction table (validate attempted cells only using TRUTH predictions)
    pred_tbl <- prediction_tbl()
    pred_col_name <- "Ŷ = a + b₁·X₁ + b₂·X₂"
    if (!is.null(pred_tbl) && pred_col_name %in% names(pred_tbl)) {
      user_preds <- suppressWarnings(as.numeric(pred_tbl[[pred_col_name]]))
      # Use truth predictions for validation
      expected <- round(truth$predictions, 4)
      attempted <- which(!is.na(user_preds))
      if (length(attempted) == 0) {
        output$msg_predictions <- renderUI(HTML(""))
      } else {
        ok_all <- all(round(user_preds[attempted], 4) == expected[attempted])
        output$msg_predictions <- renderUI({
          if (ok_all) div(class = "ok", "✅ Voorspellingen: alle ingevoerde waarden zijn correct.")
          else div(class = "err", "❌ Sommige ingevoerde voorspellingen zijn fout (controleer 4 decimalen).")
        })
      }
    } else {
      output$msg_predictions <- renderUI(HTML(""))
    }

    # Unlock visuals when ALL 23 core steps are attempted AND correct
    # Core 23 steps = means (3) + totals (6) + var/SD (6) + coefficients (4) + fit (2) + F/p via R² (2)
    # Covariances and correlations are intermediate calculations (validated but not required for unlock)
    # Predictions are optional
    
    # Check if all required fields are attempted
    all_attempted <- has_attempted(input$mean_X1) && has_attempted(input$mean_X2) && 
      has_attempted(input$mean_Y) && has_attempted(input$tot_X1_2) && 
      has_attempted(input$tot_X2_2) && has_attempted(input$tot_X1X2) && 
      has_attempted(input$tot_X1Y) && has_attempted(input$tot_X2Y) && 
      has_attempted(input$tot_Y2) && has_attempted(input$var_X1) && 
      has_attempted(input$sd_X1) && has_attempted(input$var_X2) && 
      has_attempted(input$sd_X2) && has_attempted(input$var_Y) && 
      has_attempted(input$sd_Y) && has_attempted(input$multi_det) && 
      has_attempted(input$multi_b1) && has_attempted(input$multi_b2) && 
      has_attempted(input$multi_intercept) && has_attempted(input$multi_r_squared) && 
      has_attempted(input$multi_alienation) &&
      has_attempted(input$multi_f_stat) && has_attempted(input$multi_model_p)
    
    # If not all attempted, don't unlock
    if (!all_attempted) {
      unlocked(FALSE)
      session$sendCustomMessage("toggleViz", FALSE)
      return()
    }
    
    # If all attempted, check if all are correct.
    # Use the same check_decimals/to_num path as the green/red boxes
    # so that "all correct" logic matches the visible feedback.
    all_steps_ok <- isTRUE(check_decimals(to_num("mean_X1"), truth$x1_bar, 4)) &&
      isTRUE(check_decimals(to_num("mean_X2"), truth$x2_bar, 4)) &&
      isTRUE(check_decimals(to_num("mean_Y"),  truth$y_bar,  4)) &&
      isTRUE(check_decimals(to_num("tot_X1_2"), truth$S11,   4)) &&
      isTRUE(check_decimals(to_num("tot_X2_2"), truth$S22,   4)) &&
      isTRUE(check_decimals(to_num("tot_X1X2"), truth$S12,   4)) &&
      isTRUE(check_decimals(to_num("tot_X1Y"),  truth$S1y,   4)) &&
      isTRUE(check_decimals(to_num("tot_X2Y"),  truth$S2y,   4)) &&
      isTRUE(check_decimals(to_num("tot_Y2"),   truth$SST,   4)) &&
      isTRUE(check_decimals(to_num("var_X1"),   truth$var_X1,4)) &&
      isTRUE(check_decimals(to_num("sd_X1"),    truth$sd_X1, 4)) &&
      isTRUE(check_decimals(to_num("var_X2"),   truth$var_X2,4)) &&
      isTRUE(check_decimals(to_num("sd_X2"),    truth$sd_X2, 4)) &&
      isTRUE(check_decimals(to_num("var_Y"),    truth$var_Y, 4)) &&
      isTRUE(check_decimals(to_num("sd_Y"),     truth$sd_Y,  4)) &&
      isTRUE(check_decimals(to_num("multi_det"),       truth$det,        4)) &&
      isTRUE(check_decimals(to_num("multi_b1"),        truth$b1,        4)) &&
      isTRUE(check_decimals(to_num("multi_b2"),        truth$b2,        4)) &&
      isTRUE(check_decimals(to_num("multi_intercept"), truth$intercept,  4)) &&
      isTRUE(check_decimals(to_num("multi_r_squared"), truth$R_squared, 4)) &&
      isTRUE(check_decimals(to_num("multi_alienation"), truth$alienation, 4)) &&
      isTRUE(check_decimals(to_num("multi_f_stat"), f_from_r2, 4)) &&
      isTRUE(check_decimals(to_num("multi_model_p"), p_from_f, 4))

    unlocked(all_steps_ok)
    session$sendCustomMessage("toggleViz", all_steps_ok)
  })

  output$final_success_message <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    div(
      class = "card",
      style = "background-color: #E8F5E9; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0;",
      h3(style = "color: #2E7D32; margin-top: 0;", "🎉 Uitstekend werk! Alle 23 stappen voltooid!"),
      p(style = "font-size: 16px; margin: 15px 0;",
        strong("Proficiat!"),
        " Je hebt de volledige multiple regressieanalyse (23 stappen, met 2 voorspellers) succesvol afgerond."
      ),
      p(style = "font-size: 15px; margin: 10px 0;",
        "Je kan nu de ",
        strong("visualisaties hieronder"),
        " bekijken om te zien:"
      ),
      tags$ul(style = "font-size: 15px; margin: 10px 0;",
        tags$li(strong("Kalibratieplot"), " — vergelijkt voorspelde met geobserveerde waarden"),
        tags$li(strong("Residuenplot"), " — controleert patronen in voorspelfouten (idealiter willekeurig)"),
        tags$li(strong("Plots per voorspeller"), " — toont het verband tussen elke voorspeller en de uitkomst")
      ),
      p(style = "font-size: 15px; margin: 10px 0;", 
        strong("Hoe interpreteer je de resultaten:")),
      tags$ul(style = "font-size: 15px; margin: 10px 0;",
        tags$li("De ", strong("ongestandaardiseerde coëfficiënten (b₁, b₂)"), " tonen hoeveel Y gemiddeld verandert per 1 eenheid in x₁ of x₂ (met de andere constant)."),
        tags$li("Het ", strong("intercept (a)"), " is de voorspelde Y-waarde wanneer x₁ = 0 en x₂ = 0."),
        tags$li("De ", strong("determinatiecoëfficiënt (R²)"), " is het aandeel variantie in Y dat door beide voorspellers samen verklaard wordt."),
        tags$li("De ", strong("vervreemdingscoëfficiënt"), " is het aandeel variantie in Y dat onverklaard blijft.")
      ),
      p(style = "font-size: 15px; margin: 10px 0; color: #1B5E20;",
        "Bekijk de visualisaties hieronder om extra inzicht te krijgen in je multiple regressieanalyse."
      )
    )
  })

  output$plot_block <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    tagList(
      plotOutput("calib_plot", height = 330),
      plotOutput("resid_plot", height = 250),
      plotOutput("partial_plots", height = 330)
    )
  })

  output$calib_plot <- renderPlot({
    req(unlocked())
    df <- current()
    xs <- xvars()
    y <- yvar()
    truth <- calc_multi2_manual_truth(df, y, xs)
    req(!is.null(truth))

    plot_df <- tibble::tibble(
      Y = round(df[[y]], 2),
      Y_hat = round(truth$predictions, 4)
    )
    
    # Calculate correlation between observed and predicted
    calib_r <- cor(plot_df$Y, plot_df$Y_hat)

    ggplot(plot_df, aes(x = Y_hat, y = Y)) +
      geom_abline(aes(color = "Perfecte kalibratie"),
                  slope = 1, intercept = 0,
                  linetype = 2, linewidth = 1.2, alpha = 0.7) +
      geom_point(aes(color = "Geobserveerde data"),
                 size = 3.5, alpha = 0.75) +
      geom_smooth(aes(color = "Aangepaste regressie"),
                  method = "lm", se = FALSE,
                  linewidth = 1, linetype = 1) +
      annotate("text", x = min(plot_df$Y_hat), y = max(plot_df$Y), 
               label = sprintf("R² = %.4f", truth$R_squared), 
               hjust = 0, vjust = 1, size = 4.5, fontface = "bold", color = "#424242") +
      labs(x = "Voorspeld (Ŷ)", y = "Geobserveerd (Y)", 
           title = "Kalibratieplot: voorspeld vs. geobserveerd",
           color = "Legende") +
      scale_color_manual(values = c(
        "Perfecte kalibratie" = "#D32F2F",
        "Geobserveerde data" = "#1976D2",
        "Aangepaste regressie" = "#388E3C"
      )) +
      theme_minimal(base_size = 13) +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold", size = 14, color = "#212121"),
        axis.title = element_text(face = "bold", size = 11),
        panel.grid.minor = element_blank(),
        panel.border = element_rect(color = "gray80", fill = NA, linewidth = 0.5)
      )
  })

  output$resid_plot <- renderPlot({
    req(unlocked())
    df <- current()
    xs <- xvars()
    y <- yvar()
    truth <- calc_multi2_manual_truth(df, y, xs)
    req(!is.null(truth))

    plot_df <- tibble::tibble(
      Y = round(df[[y]], 2),
      Y_hat = round(truth$predictions, 4),
      resid = round(round(df[[y]], 2) - round(truth$predictions, 4), 4)
    )

    ggplot(plot_df, aes(x = Y_hat, y = resid)) +
      geom_hline(aes(color = "Nul-residulijn"),
                 yintercept = 0,
                 linetype = 1, linewidth = 1, alpha = 0.6) +
      geom_point(aes(color = "Residuen"),
                 size = 3, alpha = 0.7) +
      geom_smooth(aes(color = "Trend in residuen"),
                  se = FALSE, linewidth = 0.8, linetype = 2) +
      labs(x = "Voorspeld (Ŷ)", y = "Residuen (Y − Ŷ)", 
           title = "Residuenplot",
           color = "Legende") +
      scale_color_manual(values = c(
        "Nul-residulijn" = "#D32F2F",
        "Residuen" = "#5E35B1",
        "Trend in residuen" = "#F57C00"
      )) +
      theme_minimal(base_size = 12) +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold", size = 13, color = "#212121"),
        axis.title = element_text(face = "bold", size = 10),
        panel.grid.minor = element_blank(),
        panel.border = element_rect(color = "gray80", fill = NA, linewidth = 0.5)
      )
  })

  output$partial_plots <- renderPlot({
    req(unlocked())
    df <- current()
    xs <- xvars()
    y <- yvar()
    truth <- calc_multi2_manual_truth(df, y, xs)
    req(!is.null(truth))
    
    X1 <- round(df[[xs[1]]], 2)
    X2 <- round(df[[xs[2]]], 2)
    Y <- round(df[[y]], 2)
    
    # Create side-by-side plots
    p1 <- ggplot(tibble::tibble(x = X1, y = Y), aes(x, y)) +
      geom_point(aes(color = "Geobserveerde data"), size = 3, alpha = 0.7) +
      geom_smooth(aes(color = "Aangepaste lijn"), method = "lm", se = FALSE, linewidth = 1.2) +
      annotate("text", x = min(X1), y = max(Y), 
               label = sprintf("r = %.3f\nb₁ = %.3f", truth$r_x1y, truth$b1), 
               hjust = 0, vjust = 1, size = 3.5, fontface = "bold") +
      labs(x = xs[1], y = y, title = paste("Effect van", xs[1], "op", y)) +
      scale_color_manual(values = c("Geobserveerde data" = "#1976D2", "Aangepaste lijn" = "#D32F2F")) +
      labs(color = "Legende") +
      theme_minimal(base_size = 11) +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold", size = 12),
        axis.title = element_text(face = "bold"),
        panel.grid.minor = element_blank(),
        panel.border = element_rect(color = "gray80", fill = NA, linewidth = 0.5),
        legend.position = "bottom"
      )
    
    p2 <- ggplot(tibble::tibble(x = X2, y = Y), aes(x, y)) +
      geom_point(aes(color = "Geobserveerde data"), size = 3, alpha = 0.7) +
      geom_smooth(aes(color = "Aangepaste lijn"), method = "lm", se = FALSE, linewidth = 1.2) +
      annotate("text", x = min(X2), y = max(Y), 
               label = sprintf("r = %.3f\nb₂ = %.3f", truth$r_x2y, truth$b2), 
               hjust = 0, vjust = 1, size = 3.5, fontface = "bold") +
      labs(x = xs[2], y = y, title = paste("Effect van", xs[2], "op", y)) +
      scale_color_manual(values = c("Geobserveerde data" = "#388E3C", "Aangepaste lijn" = "#D32F2F")) +
      labs(color = "Legende") +
      theme_minimal(base_size = 11) +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold", size = 12),
        axis.title = element_text(face = "bold"),
        panel.grid.minor = element_blank(),
        panel.border = element_rect(color = "gray80", fill = NA, linewidth = 0.5),
        legend.position = "bottom"
      )
    
    gridExtra::grid.arrange(p1, p2, ncol = 2, 
                           top = grid::textGrob("Bivariate relaties: effect per voorspeller", 
                                              gp = grid::gpar(fontsize = 14, fontface = "bold")))
  })

  output$stats_block <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    df <- current()
    xs <- xvars()
    y <- yvar()
    truth <- calc_multi2_manual_truth(df, y, xs)
    if (is.null(truth)) return(NULL)

    HTML(sprintf(
      "<div class='accent'><h5>Statistieken multiple regressie</h5>
       <ul style='margin:6px 0 0 18px;'>
         <li><b>n:</b> %d</li>
         <li><b>a (intercept):</b> %.4f &nbsp;&nbsp; <b>b₁:</b> %.4f &nbsp;&nbsp; <b>b₂:</b> %.4f</li>
         <li><b>det:</b> %.4f</li>
         <li><b>R²:</b> %.4f &nbsp;&nbsp; <b>Vervreemdingscoëfficiënt:</b> %.4f</li>
         <li><b>ANOVA:</b> SSR = %.4f, SSE = %.4f, dfreg = %d, dferr = %d, F = %.4f, p = %.4f</li>
       </ul></div>",
      truth$n, truth$intercept, truth$b1, truth$b2, truth$det, truth$R_squared, truth$alienation,
      truth$SSR, truth$SSE, truth$df_reg, truth$df_err, truth$F_stat, truth$model_p
    ))
  })

  output$interpret_block <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    df <- current()
    xs <- xvars()
    y <- yvar()
    truth <- calc_multi2_manual_truth(df, y, xs)
    if (is.null(truth)) return(NULL)

    x1 <- xs[1]
    x2 <- xs[2]
    r2 <- truth$R_squared
    explained <- 100 * r2
    unexplained <- 100 * (1 - r2)
    f_model <- truth$F_stat
    p_model <- truth$model_p
    is_sig <- p_model < 0.05
    sig_label <- if (is_sig) "statistisch significant" else "niet statistisch significant"
    h0_conclusion <- if (is_sig) {
      sprintf("We verwerpen H0: %s en %s voorspellen %s als geheel significant.", x1, x2, y)
    } else {
      sprintf("We verwerpen H0 niet: er is geen statistisch bewijs dat %s en %s samen %s significant voorspellen.", x1, x2, y)
    }
    power_note <- if (!is_sig && truth$n <= 15) {
      "Opmerking: met een kleine steekproef kan de power van de F-toets beperkt zijn."
    } else {
      ""
    }

    HTML(sprintf(
      "<div class='accent'><h5>Interpretatie</h5>
       <p>Dit is een <b>multiple regressie</b> model: <i>%s</i> ~ <i>%s</i> + <i>%s</i>.</p>
       <ul style='margin:6px 0 0 18px;'>
         <li><b>b₁ = %.4f</b>: met <i>%s</i> constant is een stijging van 1 eenheid in <i>%s</i> gemiddeld geassocieerd met een verandering van %.4f eenheden in <i>%s</i>.</li>
         <li><b>b₂ = %.4f</b>: met <i>%s</i> constant is een stijging van 1 eenheid in <i>%s</i> gemiddeld geassocieerd met een verandering van %.4f eenheden in <i>%s</i>.</li>
         <li><b>R² = %.4f</b>: ongeveer <b>%.2f%%</b> van de variantie in <i>%s</i> wordt verklaard door <i>%s</i> en <i>%s</i>; ongeveer <b>%.2f%%</b> blijft onverklaard (vervreemding).</li>
         <li><b>Globale F-toets</b>: F(%d, %d) = %.4f, p = %.4f. Op 5%%-niveau is het model <b>%s</b>. %s %s</li>
       </ul>
       <p><i>Onthoud: associatie impliceert geen causaliteit.</i></p>
       </div>",
      y, x1, x2,
      truth$b1, x2, x1, truth$b1, y,
      truth$b2, x1, x2, truth$b2, y,
      r2, explained, y, x1, x2, unexplained,
      truth$df_reg, truth$df_err, f_model, p_model, sig_label, h0_conclusion, power_note
    ))
  })
}

shinyApp(ui, server)
