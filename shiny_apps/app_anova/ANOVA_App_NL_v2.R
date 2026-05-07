# ============================================================
# Eenweg-ANOVA — Handmatige berekening (NL)
# - One-way ANOVA with k=3 groups, variable n per group (3-16)
# - Criminological scenarios in Dutch; mirrors bivariate/multiple regression apps
# - Students compute: group means, grand mean, deviation table (4 cols),
#   SSW, SSB, SST, degrees of freedom, MS and F-ratio
# - All truth values are computed from 2-decimal display data
# - 4-decimal checking for student inputs; green/red field feedback
# ============================================================
# ============================================================
# OPTIMIZED VERSION v3 — fully button-driven validation with dirty-state reset
# Builds on ANOVA_App_NL_optimized.R (v1 changes retained):
# v1 changes:
# 1. Colour fix: #888/#555 -> #888888/#555555 (R hex compatibility)
# 2. clear_feedback_store(): static ID list, no reactiveValuesToList()
# 3. Dead renderUI outputs (means/ss/anova_table _detail_feedback) removed
# v2 changes:
# 4. Added actionButton("check_all", "Controleer mijn antwoorden") in
#    sidebar (sticky) and as a floating row above Deel V.
# 5. rv$snap: a reactiveValues list that is populated only when
#    check_all is clicked. All light/feedback/status outputs read
#    from rv$snap, not from live input$... — so they are frozen
#    between clicks and do not fire on every keystroke.
# 6. observeEvent(input$check_all, ignoreInit=TRUE): snapshots all
#    inputs, runs full validation, sends all markField JS messages,
#    sends toggleViz/toggleCI, and stores rv$snap$all_correct.
# 7. Removed all standalone observe({session$sendCustomMessage("markField")})
#    blocks from make_light(), from the grand_mean observer, and from
#    the group-mean loop — 12+ live observers eliminated.
# 8. Removed the two live observe({toggleViz/toggleCI}) calls.
# 9. all_correct() replaced by reactive reading rv$snap$all_correct.
# v3 changes:
# 10. rv$dirty: boolean that turns TRUE whenever any input changes after a
#     check. All feedback/status outputs show a "changed since last check"
#     notice when dirty. mark_dirty() clears field colours and hides viz.
# 11. clearValidationClasses JS handler: clears field valid/invalid classes,
#     resets window.anovaValidationData = null, re-renders handsontable.
# 12. per-section check buttons: check_deel2/3/4/5 each call do_check().
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

# Returns TRUE if value is correct at fewer decimals than required (rounding/truncation error)
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

format_p_value <- function(p, digits = 4) {
  if (is.null(p) || length(p) == 0 || is.na(p)) return("NA")
  cutoff <- 10^(-digits)
  if (p < cutoff) return(paste0("< ", format(cutoff, scientific = FALSE, trim = TRUE)))
  format(round(p, digits), nsmall = digits, scientific = FALSE, trim = TRUE)
}

# ============================================================
# SCENARIOS
# ============================================================

scenarios <- list(
  list(
    id = "crime_program",
    title = "Implementatie van het criminaliteitspreventie-programma (3 niveaus)",
    vignette = "Een stad test drie interventieniveaus in buurten: geen programma, basispreventie en intensief programma. Onderzoek of het interventieniveau samenhangt met het inbraakcijfer.",
    groups = c("GeenProgramma", "BasisProgramma", "IntensiefProgramma"),
    y_var = list(name = "InbraakCijfer", unit = "per 1.000"),
    entity = "Buurt",
    means = c(28, 22, 16),
    sd_within = 5,
    subtle_scale = 0.25
  ),
  list(
    id = "hotspots_policing",
    title = "Politiestrategieën & meldingen (3 typen)",
    vignette = "Drie typen politiestrategie worden vergeleken in stedelijke straten: standaard patrouille, hot-spot aanpak, en gemeenschapsgerichte strategie. Uitkomst: meldingen aan de politie per week.",
    groups = c("StandaardPatrouille", "HotSpotAanpak", "GemeenschapsStrategie"),
    y_var = list(name = "MeldingenAanPolitie", unit = "per week"),
    entity = "Straat",
    means = c(65, 48, 38),
    sd_within = 10,
    subtle_scale = 0.25
  ),
  list(
    id = "fear_disorder",
    title = "Wijkniveau & angst voor criminaliteit",
    vignette = "Bewoners van drie typen wijken (lage, gemiddelde en hoge wanorde) worden vergeleken op angstscores. Uitkomst: angstschaal (0-100).",
    groups = c("LaagWanorde", "GemiddeldWanorde", "HoogWanorde"),
    y_var = list(name = "AngstScore", unit = "0-100"),
    entity = "Bewoner",
    means = c(38, 55, 70),
    sd_within = 10,
    subtle_scale = 0.25
  ),
  list(
    id = "police_trust",
    title = "Politieaanpak & vertrouwen (3 condities)",
    vignette = "Drie politiecondities worden vergeleken op vertrouwen van burgers: geen interventie, standaard contact, en procedurale rechtvaardigheidsaanpak. Uitkomst: vertrouwensscore (1-7).",
    groups = c("GeenInterventie", "StandaardContact", "ProcedureleAanpak"),
    y_var = list(name = "VertrouwenInPolitie", unit = "1-7"),
    entity = "District",
    means = c(3.5, 4.5, 5.5),
    sd_within = 0.8,
    subtle_scale = 0.25
  ),
  list(
    id = "guardianship",
    title = "Toezichtsniveaus & slachtofferschap",
    vignette = "Drie niveaus van buurttoezicht worden vergeleken op slachtofferschapincidenten: laag, gemiddeld en hoog toezicht. Uitkomst: aantal slachtofferschapincidenten.",
    groups = c("LaagToezicht", "GemiddeldToezicht", "HoogToezicht"),
    y_var = list(name = "Slachtofferschap", unit = "aantal"),
    entity = "Huishouden",
    means = c(8, 5, 3),
    sd_within = 2,
    subtle_scale = 0.25
  ),
  list(
    id = "biosocial",
    title = "Risicogroepen & agressieve incidenten",
    vignette = "Drie risicogroepen onder jongeren (laag, gemiddeld en hoog risico) worden vergeleken op agressieve incidenten op school. Uitkomst: schoolmeldingen per trimester.",
    groups = c("LaagRisico", "GemiddeldRisico", "HoogRisico"),
    y_var = list(name = "AgressieveIncidenten", unit = "schoolmeldingen/trimester"),
    entity = "Student",
    means = c(2, 5, 9),
    sd_within = 2,
    subtle_scale = 0.20
  ),
  list(
    id = "reentry_recidivism",
    title = "Re-integratieniveaus & recidiverisico",
    vignette = "Drie typen begeleiding worden vergeleken op recidiverisico na vrijlating: minimaal, standaard en intensief. Uitkomst: recidiverisicoScore (0-100).",
    groups = c("MinimaleBegeleiding", "StandaardBegeleiding", "IntensieveBegeleiding"),
    y_var = list(name = "RecidiveRisico", unit = "0-100"),
    entity = "Deelnemer",
    means = c(62, 48, 35),
    sd_within = 10,
    subtle_scale = 0.25
  ),
  list(
    id = "cyber_training",
    title = "Cybertrainingsniveaus & klikratio",
    vignette = "Drie trainingsintensiteiten worden vergeleken op het klikratio bij gesimuleerde phishingaanvallen: geen training, basistraining en intensieve training. Uitkomst: klikratio (%).",
    groups = c("GeenTraining", "BasisTraining", "IntensieveTraining"),
    y_var = list(name = "Klikratio", unit = "%"),
    entity = "Medewerker",
    means = c(35, 22, 12),
    sd_within = 8,
    subtle_scale = 0.20
  ),
  # --- k = 2 scenarios (categorische groeperingsvariabelen) ---
  list(
    id = "gender_fear",
    title = "Geslacht & angst voor criminaliteit (k\u00a0=\u00a02)",
    vignette = "Ervaren mannen en vrouwen een verschillende mate van angst voor criminaliteit in de openbare ruimte? Twee groepen worden vergeleken op angstscore (0-100). Bij k = 2 is ANOVA equivalent aan de onafhankelijke t-toets.",
    groups = c("Man", "Vrouw"),
    y_var = list(name = "AngstScore", unit = "0-100"),
    entity = "Respondent",
    means = c(42, 63),
    sd_within = 12,
    subtle_scale = 0.30
  ),
  list(
    id = "nationality_victimisation",
    title = "Nationaliteit & slachtofferschap (k\u00a0=\u00a02)",
    vignette = "Worden personen met Belgische en niet-Belgische nationaliteit even vaak slachtoffer van vermogenscriminaliteit? Twee groepen worden vergeleken op slachtofferschapindex (0-100). Bij k = 2 geldt: F = t\u00b2.",
    groups = c("Belgisch", "NietBelgisch"),
    y_var = list(name = "SlachtofferschapIndex", unit = "0-100"),
    entity = "Respondent",
    means = c(38, 52),
    sd_within = 10,
    subtle_scale = 0.30
  ),
  # --- k = 3 scenarios met categorische groeperingsvariabelen ---
  list(
    id = "education_police_trust",
    title = "Opleidingsniveau & vertrouwen in politie (k\u00a0=\u00a03)",
    vignette = "Verschilt het vertrouwen in de politie naargelang het opleidingsniveau van de respondent? Drie onderwijsgroepen worden vergeleken op vertrouwensscore (1-7). Opleidingsniveau is een voorbeeld van een categorische groeperingsvariabele.",
    groups = c("LaagOnderwijs", "GemiddeldOnderwijs", "HoogOnderwijs"),
    y_var = list(name = "VertrouwenPolitie", unit = "1-7"),
    entity = "Respondent",
    means = c(3.8, 4.5, 5.2),
    sd_within = 0.9,
    subtle_scale = 0.30
  ),
  list(
    id = "age_group_victimisation",
    title = "Leeftijdsgroep & slachtofferschap (k\u00a0=\u00a03)",
    vignette = "Worden bepaalde leeftijdsgroepen vaker slachtoffer van criminaliteit? Jongeren, volwassenen en ouderen worden vergeleken op slachtofferschaprate (per 1.000). Leeftijdsgroep is een voorbeeld van een categorische groeperingsvariabele.",
    groups = c("Jongeren", "Volwassenen", "Ouderen"),
    y_var = list(name = "Slachtofferschaprate", unit = "per 1.000"),
    entity = "Respondent",
    means = c(62, 45, 30),
    sd_within = 12,
    subtle_scale = 0.25
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
# DATA GENERATION
# ============================================================

clamp_by_unit <- function(v, unit) {
  if (grepl("0-100|0.100|%|score|Score|Risico|Ratio|Cijfer", unit, ignore.case = TRUE)) {
    lo <- if (grepl("1-7", unit)) 1 else 0
    hi <- if (grepl("1-7", unit)) 7 else 100
    v  <- clamp_vec(v, lo, hi)
  } else {
    v <- clamp_vec(v, 0, Inf)
  }
  v
}

pick_anova_effect_scale <- function(sc) {
  subtle_scale <- sc$subtle_scale %||% 0.25
  sample(c(1, subtle_scale), size = 1, prob = c(0.4, 0.6))
}

get_anova_profile_means <- function(sc, effect_scale = NULL) {
  if (is.null(sc) || is.null(sc$means)) return(NULL)
  effect_scale <- effect_scale %||% pick_anova_effect_scale(sc)
  center <- mean(sc$means)
  center + effect_scale * (sc$means - center)
}

make_anova_data <- function(sc, n_per_group = 10, seed = NULL) {
  if (is.null(sc)) return(NULL)
  n_per_group <- as.integer(n_per_group)
  if (is.na(n_per_group) || n_per_group < 3) n_per_group <- 3L
  n_per_group <- min(n_per_group, as.integer(MAX_SAMPLE_SIZE / length(sc$groups)))

  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)

  means_use <- get_anova_profile_means(sc)
  k    <- length(sc$groups)
  rows <- lapply(seq_len(k), function(i) {
    vals <- round(rnorm(n_per_group, mean = means_use[i], sd = sc$sd_within), 2)
    vals <- clamp_by_unit(vals, sc$y_var$unit)
    data.frame(
      Eenheid = paste(sc$entity, (i - 1L) * n_per_group + seq_len(n_per_group)),
      Groep   = sc$groups[i],
      setNames(data.frame(vals), sc$y_var$name),
      stringsAsFactors = FALSE
    )
  })
  do.call(rbind, rows)
}

# ============================================================
# TRUTH CALCULATION  (based on 2-decimal display data)
# ============================================================

calc_anova_truth <- function(df, y_col) {
  if (is.null(df) || nrow(df) == 0 || !y_col %in% names(df)) return(NULL)
  Y <- round(as.numeric(df[[y_col]]), 2)
  G <- as.character(df[["Groep"]])
  n <- length(Y)
  groups <- unique(G)
  k <- length(groups)
  if (n < k + 1L) return(NULL)

  grp_means  <- setNames(sapply(groups, function(g) round(mean(Y[G == g]), 4)), groups)
  grand_mean <- round(mean(Y), 4)

  grp_mean_per_obs <- unname(grp_means[G])
  dev_within     <- round(Y - grp_mean_per_obs, 4)
  dev_within_sq  <- round(dev_within^2, 4)
  dev_between    <- round(grp_mean_per_obs - grand_mean, 4)
  dev_between_sq <- round(dev_between^2, 4)

  SSW <- round(sum(dev_within_sq), 4)
  SSB <- round(sum(dev_between_sq), 4)
  SST <- round(SSW + SSB, 4)

  df_between <- as.integer(k - 1L)
  df_within  <- as.integer(n - k)
  df_total   <- as.integer(n - 1L)

  MSB     <- round(SSB / df_between, 4)
  MSW     <- round(SSW / df_within,  4)
  F_ratio <- if (!is.na(MSW) && MSW > 0) round(MSB / MSW, 4) else NA_real_
  eta_sq  <- if (!is.na(SST) && SST > 0) round(SSB / SST, 4) else NA_real_

  t_crit    <- if (!is.na(MSW) && MSW >= 0) round(qt(0.975, df_within), 4) else NA_real_
  ci_margin <- if (!is.na(MSW) && MSW >= 0) {
    setNames(round(vapply(groups, function(g) {
      nj <- sum(G == g)
      qt(0.975, df_within) * sqrt(MSW / nj)
    }, numeric(1)), 4), groups)
  } else setNames(rep(NA_real_, length(groups)), groups)
  ci_lower  <- round(grp_means - ci_margin, 4)
  ci_upper  <- round(grp_means + ci_margin, 4)

  list(
    n = n, k = k, groups = groups,
    n_groups       = setNames(sapply(groups, function(g) sum(G == g)), groups),
    grp_means      = grp_means,
    grand_mean     = grand_mean,
    dev_within     = dev_within,
    dev_within_sq  = dev_within_sq,
    dev_between    = dev_between,
    dev_between_sq = dev_between_sq,
    SSW = SSW, SSB = SSB, SST = SST,
    df_between = df_between, df_within = df_within, df_total = df_total,
    MSB = MSB, MSW = MSW, F_ratio = F_ratio, eta_sq = eta_sq,
    t_crit = t_crit, ci_margin = ci_margin,
    ci_lower = ci_lower, ci_upper = ci_upper
  )
}

# ============================================================
# CALCULATION TABLE BLANK (rhandsontable for Deel III)
# ============================================================

build_blank_calc_anova <- function(df, y_col) {
  if (is.null(df) || nrow(df) == 0) return(NULL)
  n <- nrow(df)
  tbl <- data.frame(
    Eenheid = df[[1]],
    Groep   = df[["Groep"]],
    Y       = round(df[[y_col]], 2),
    dW      = rep(NA_real_, n),
    dW2     = rep(NA_real_, n),
    dB      = rep(NA_real_, n),
    dB2     = rep(NA_real_, n),
    check.names = FALSE, stringsAsFactors = FALSE
  )
  names(tbl) <- c("Eenheid", "Groep", y_col,
                  "(Y-Yj)", "(Y-Yj)^2", "(Yj-Y..)", "(Yj-Y..)^2")
  tbl
}

get_anova_group_blocks <- function(group_vec) {
  if (is.null(group_vec) || length(group_vec) == 0) {
    return(data.frame(
      group = character(0),
      start = integer(0),
      end = integer(0),
      rowspan = integer(0),
      stringsAsFactors = FALSE
    ))
  }

  runs <- rle(as.character(group_vec))
  ends <- cumsum(runs$lengths)
  starts <- ends - runs$lengths + 1L

  data.frame(
    group = runs$values,
    start = starts,
    end = ends,
    rowspan = runs$lengths,
    stringsAsFactors = FALSE
  )
}

normalize_group_level_cols_anova <- function(tbl) {
  value_cols <- c("(Yj-Y..)", "(Yj-Y..)^2")
  if (is.null(tbl) || !"Groep" %in% names(tbl) || !all(value_cols %in% names(tbl))) return(tbl)

  blocks <- get_anova_group_blocks(tbl[["Groep"]])
  if (nrow(blocks) == 0) return(tbl)

  for (col_name in value_cols) {
    col_vals <- suppressWarnings(as.numeric(tbl[[col_name]]))
    for (i in seq_len(nrow(blocks))) {
      idx <- blocks$start[i]:blocks$end[i]
      block_vals <- col_vals[idx]
      block_val <- if (!is.na(col_vals[blocks$start[i]])) {
        col_vals[blocks$start[i]]
      } else {
        filled_vals <- block_vals[!is.na(block_vals)]
        if (length(filled_vals)) filled_vals[1] else NA_real_
      }
      if (!is.na(block_val)) col_vals[idx] <- block_val
    }
    tbl[[col_name]] <- col_vals
  }

  tbl
}

build_anova_calc_display <- function(tbl) {
  value_cols <- c("(Yj-Y..)", "(Yj-Y..)^2")
  if (is.null(tbl) || !"Groep" %in% names(tbl) || !all(value_cols %in% names(tbl))) return(tbl)

  blocks <- get_anova_group_blocks(tbl[["Groep"]])
  if (nrow(blocks) == 0) return(tbl)

  display_tbl <- tbl
  for (col_name in value_cols) {
    col_vals <- suppressWarnings(as.numeric(display_tbl[[col_name]]))
    for (i in seq_len(nrow(blocks))) {
      idx <- blocks$start[i]:blocks$end[i]
      hidden_idx <- idx[idx != blocks$start[i]]
      if (length(hidden_idx)) col_vals[hidden_idx] <- NA_real_
    }
    display_tbl[[col_name]] <- col_vals
  }

  display_tbl
}

build_anova_merge_cells <- function(tbl) {
  if (is.null(tbl) || !"Groep" %in% names(tbl)) return(list())
  blocks <- get_anova_group_blocks(tbl[["Groep"]])
  if (nrow(blocks) == 0) return(list())

  merge_cells <- list()
  merge_cols <- c(5L, 6L)
  for (i in seq_len(nrow(blocks))) {
    for (col_idx in merge_cols) {
      merge_cells[[length(merge_cells) + 1L]] <- list(
        row = blocks$start[i] - 1L,
        col = col_idx,
        rowspan = blocks$rowspan[i],
        colspan = 1L
      )
    }
  }

  merge_cells
}

calc_anova_step3_expected <- function(tbl, y_col, group_means, grand_mean) {
  required_cols <- c("Groep", y_col)
  if (is.null(tbl) || is.null(group_means) || is.null(grand_mean)) return(NULL)
  if (!all(required_cols %in% names(tbl))) return(NULL)
  if (is.null(names(group_means)) || any(is.na(group_means))) return(NULL)
  if (is.na(grand_mean)) return(NULL)

  Y <- suppressWarnings(as.numeric(tbl[[y_col]]))
  G <- as.character(tbl[["Groep"]])
  grp_mean_per_obs <- unname(round(group_means[G], 4))
  grand_mean <- round(as.numeric(grand_mean), 4)

  if (length(Y) == 0 || any(is.na(Y)) || any(is.na(grp_mean_per_obs))) return(NULL)

  dW <- round(Y - grp_mean_per_obs, 4)
  dB <- round(grp_mean_per_obs - grand_mean, 4)

  list(
    dev_within     = dW,
    dev_within_sq  = round(dW^2, 4),
    dev_between    = dB,
    dev_between_sq = round(dB^2, 4)
  )
}

# ============================================================
# UI
# ============================================================

ui <- fluidPage(
  tags$head(tags$title("Eenweg-ANOVA - Oefeningen")),
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
    .feedback-panel{margin-top:10px;padding:10px 12px;border-radius:12px;background:#FFF5F5;border-left:4px solid #D50000;}
    .feedback-detail-item + .feedback-detail-item{margin-top:10px;padding-top:10px;border-top:1px solid #F2C7CF;}
    .feedback-detail-label{font-weight:700;color:#7A1020;margin-bottom:4px;}
    input.invalid{border:2px solid #D50000 !important; background:#ffebee !important; box-shadow:0 0 0 2px rgba(213,0,0,0.10) inset;}
    input.valid{border:2px solid #00C853 !important; background:#e8f5e9 !important; box-shadow:0 0 0 2px rgba(0,200,83,0.10) inset;}
    .grid-compact{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
    .grid-compact-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
    .grid-compact-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
    #part3_card .html-widget, #part3_card .rhandsontable, #part3_card .handsontable{margin-bottom:0 !important;}
    .cell-invalid{background:#ffebee !important;border:2px solid #D50000 !important;}
    .cell-valid{background:#e8f5e9 !important;border:2px solid #00C853 !important;}
    .rhandsontable th,.rhandsontable td{text-align:center !important;}
  '))),
  tags$head(tags$script(HTML("
    Shiny.addCustomMessageHandler('toggleViz', function(show){
      var el = document.getElementById('viz_block');
      if (!el) return;
      if (show){ el.classList.remove('disabled'); el.style.transition='opacity 0.3s ease-in-out'; el.style.opacity='1'; }
      else { el.classList.add('disabled'); el.style.opacity='0.5'; }
    });
    Shiny.addCustomMessageHandler('toggleCI', function(show){
      var el = document.getElementById('ci_block');
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
    Shiny.addCustomMessageHandler('setAnovaValidationData', function(data) {
      window.anovaValidationData = data;
      var w = HTMLWidgets.find('#calc_table');
      if (w && w.hot) { w.hot.render(); }
    });
    Shiny.addCustomMessageHandler('clearValidationClasses', function(msg) {
      document.querySelectorAll('input.valid, input.invalid').forEach(function(el) {
        el.classList.remove('valid', 'invalid');
      });
      window.anovaValidationData = null;
      var w = HTMLWidgets.find('#calc_table');
      if (w && w.hot) { w.hot.render(); }
    });
    function syncRawNumericValue(el){
      if (!el || !el.id || !window.Shiny) return;
      Shiny.setInputValue(el.id + '__raw', el.value, {priority:'event'});
    }
    document.addEventListener('input', function(evt){
      var el = evt.target;
      if (el && el.tagName === 'INPUT' && el.type === 'number') syncRawNumericValue(el);
    });
    document.addEventListener('change', function(evt){
      var el = evt.target;
      if (el && el.tagName === 'INPUT' && el.type === 'number') syncRawNumericValue(el);
    });
    document.addEventListener('DOMContentLoaded', function(){
      var cards = document.querySelectorAll('.card');
      cards.forEach(function(card){
        card.style.transition='box-shadow 0.2s ease-in-out';
        card.addEventListener('mouseenter',function(){ this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; });
        card.addEventListener('mouseleave',function(){ this.style.boxShadow='0 6px 18px rgba(0,0,0,0.08)'; });
      });
      var numericInputs = document.querySelectorAll('input[type=\"number\"]');
      numericInputs.forEach(syncRawNumericValue);
    });
  "))),

  titlePanel(div(class = "title", "Oefeningen voor Eenweg-ANOVA")),

  sidebarLayout(
    sidebarPanel(
      width = 4,

      div(class = "card",
          h4("Hoe deze webpagina werkt"),
          HTML("<ul style='margin:6px 0 0 0px; padding-left: 20px;'>
            <li>Oefen <b>eenweg-ANOVA</b> met 2 of 3 groepen en criminologiedatasets.</li>
            <li>Voltooi <b>7 delen</b> om handmatig ANOVA uit te voeren (gebruik 4 decimalen).</li>
            <li>Bekijk de dataset (alleen-lezen). Vul daarna stap voor stap in:
              <ul style='margin-top:4px;'>
                <li><b>Deel I:</b> Dataset bekijken</li>
                <li><b>Deel II:</b> Stap 1 (Groepsgemiddelden Y&#x0305;<sub>j</sub> per groep en grootgemiddelde Y..)</li>
                <li><b>Deel III:</b> Stappen 2-6 (Afwijkingtabel: (Y-Yj), (Y-Yj)^2, (Yj-Y..), (Yj-Y..)^2)</li>
                <li><b>Deel IV:</b> Stappen 7-9 (SSW, SSB en SST)</li>
                <li><b>Deel V:</b> Stappen 10-12 (df, MS en F-ratio)</li>
                <li><b>Deel VI:</b> Visualisaties en interpretatie (vrijkomt na correcte invoer)</li>
                <li><b>Deel VII:</b> 95%-betrouwbaarheidsinterval per groep (wordt getoond na correcte invoer)</li>
              </ul>
            </li>
            <li>Velden worden <span style='color:#00C853;font-weight:700;'>groen</span> wanneer correct en <span style='color:#D50000;font-weight:700;'>rood</span> wanneer fout.</li>
            <li>Wanneer alle stappen correct zijn, verschijnen <b>visualisaties</b> (Deel VI) en <b>95%-BI</b> (Deel VII).</li>
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
          helpText("Kies een criminologisch scenario: k\u00a0=\u00a03 (interventieniveaus, opleidingsgroepen, leeftijdscategorie\u00ebn) of k\u00a0=\u00a02 (geslacht, nationaliteit)."),
          numericInput("n_per_group",
                       paste0("Observaties per groep (3-", as.integer(MAX_SAMPLE_SIZE / 2), ")"),
                       value = 10, min = 3, max = as.integer(MAX_SAMPLE_SIZE / 2), step = 1),
          helpText("Aantal waarnemingen per groep. Totale N = n \u00d7 k (k = aantal groepen in het scenario)."),
          textInput("seed", "Datasetcode (seed, optioneel)", value = ""),
          helpText(HTML("<b>Optioneel nummer voor reproduceerbaarheid.</b> Zelfde code = elke keer dezelfde dataset.")),
          fluidRow(
            column(5, actionButton("gen",      "Genereer dataset",     class = "btn btn-success btn-wide")),
            column(5, actionButton("new_same", "Willekeurig scenario", class = "btn btn-default btn-wide"))
          ),
          helpText("'Genereer dataset' gebruikt het gekozen scenario. 'Willekeurig scenario' kiest een willekeurig scenario - ideaal voor gevarieerde oefening!"),
          uiOutput("seed_echo")
      ),
      br(),

      # v2: central check button — frozen validation fires only on click
      div(class = "card",
          style = "background:#E8F5E9; border-left:4px solid #4CAF50;",
          h4(style="color:#2E7D32; margin:0 0 8px 0;", "Controleer antwoorden"),
          p(class="muted", style="margin:0 0 10px 0;",
            "Klik op de knop om alle ingevulde velden tegelijk te controleren. Velden worden groen of rood gemarkeerd."),
          actionButton("check_all", "Controleer mijn antwoorden",
                       class = "btn btn-success btn-wide",
                       style = "width:100%;font-size:15px;padding:10px;"),
          uiOutput("check_status_summary")
      ),
      br(),

      div(class = "card",
          h4("Stappen (NL)"),
          HTML(paste0(
            "<div class='accent'><b>Stappen voor handmatige ANOVA (NL)</b>",
            "<ol style='margin:6px 0 0 18px;'>",
            "<li>Bereken het groepsgemiddelde voor elke groep: Y1, Y2, Y3.</li>",
            "<li>Bereken het grootgemiddelde Y.. (gemiddelde van <i>alle</i> waarden).</li>",
            "<li>Bereken voor elke observatie de <b>binnengroepse afwijking</b>: (Yij - Yj).</li>",
            "<li>Kwadrateer: (Yij - Yj)^2.</li>",
            "<li>Bereken de <b>tussengroepse afwijking</b>: (Yj - Y..).</li>",
            "<li>Kwadrateer: (Yj - Y..)^2.</li>",
            "<li>Tel op: SSW = Sum(Yij - Yj)^2 &nbsp;(<i>variatie binnen groepen</i>).</li>",
            "<li>Tel op: SSB = Sum[n<sub>j</sub> x (Yj - Y..)^2] &nbsp;(<i>variatie tussen groepen</i>).</li>",
            "<li>SST = SSW + SSB.</li>",
            "<li>df: dfB = k-1, dfW = N-k, dfT = N-1.</li>",
            "<li>MS: MSB = SSB/dfB, MSW = SSW/dfW.</li>",
            "<li>F = MSB / MSW.</li>",
            "</ol></div>"
          ))
      )
    ),

    mainPanel(
      div(class = "card",
          h4("Deel I — Dataset"),
          div(class = "muted", "Bekijk de dataset met drie groepen voordat u begint."),
          uiOutput("dataset_vignette"),
          uiOutput("group_tables_ui"),
          uiOutput("dataset_footer")
      ),
      br(),

      div(class = "card",
          h4("Deel II — Stap 1: Groepsgemiddelden en grootgemiddelde (4 decimalen)"),
          div(class = "muted", "Bereken het gemiddelde voor elke groep (Yj) en het grootgemiddelde Y.."),
          uiOutput("means_ui"),
          uiOutput("means_feedback"),
          div(style = "text-align:right; margin-top:10px;",
              actionButton("check_deel2", HTML("&#x2714;&nbsp;Controleer Deel II"),
                           class = "btn btn-success btn-sm"))
      ),
      br(),

      div(class = "card", id = "part3_card",
          h4("Deel III — Stappen 2-6: Afwijkingtabel (4 decimalen)"),
          div(class = "muted", "Vul voor elke observatie de binnen- en tussengroepse afwijkingen en hun kwadraten in."),
          helpText(HTML("Kolommen: <b>(Y-Yj)</b> = binnengroepse afwijking | <b>(Y-Yj)^2</b> = kwadraat | <b>(Yj-Y..)</b> = tussengroepse afwijking | <b>(Yj-Y..)^2</b> = kwadraat. Gebruik 4 decimalen.<br/><b>Let op:</b> de laatste twee kolommen zijn samengevoegd per groep. Vul daar alleen de <b>eerste zichtbare cel</b> van elk groepsblok in; die waarde geldt voor alle observaties in die groep.")),
          div(style = "display: flex; justify-content: center;",
              rHandsontableOutput("calc_table")
          ),
          br(),
          uiOutput("table_feedback"),
          br(),
          uiOutput("col_sums_hint"),
          div(style = "text-align:right; margin-top:10px;",
              actionButton("check_deel3", HTML("&#x2714;&nbsp;Controleer Deel III"),
                           class = "btn btn-success btn-sm"))
      ),

      div(class = "card",
          h4("Deel IV \u2014 Stappen 7-9: Kwadratensommen (4 decimalen)"),
          div(class = "muted", "Bereken SSW als de som van alle (Y-Yj)^2, SSB als de som per groep van n_j x (Yj-Y..)^2, en SST als SSW + SSB."),
          fluidRow(
            column(4,
                   strong("SSW (binnengroeps)"),
                   numericInput("ssw", NULL, value = NA, step = 0.0001),
                   uiOutput("ssw_light"),
                   uiOutput("msg_ssw")
            ),
            column(4,
                   strong("SSB (tussengroeps)"),
                   numericInput("ssb", NULL, value = NA, step = 0.0001),
                   uiOutput("ssb_light"),
                   uiOutput("msg_ssb")
            ),
            column(4,
                   strong("SST (totaal = SSW + SSB)"),
                   numericInput("sst", NULL, value = NA, step = 0.0001),
                   uiOutput("sst_light"),
                   uiOutput("msg_sst")
            )
          ),
          uiOutput("ss_status"),
          div(style = "text-align:right; margin-top:10px;",
              actionButton("check_deel4", HTML("&#x2714;&nbsp;Controleer Deel IV"),
                           class = "btn btn-success btn-sm"))
      ),
      br(),

      div(class = "card",
          h4("Deel V — Stappen 10-12: ANOVA-tabel (4 decimalen voor MS & F; gehele getallen voor df)"),
          div(class = "muted", "Vul de ANOVA-tabel in."),
          tags$table(
            style = "width:100%; border-collapse:collapse; margin-top:8px;",
            tags$thead(tags$tr(
              tags$th(style="background:#E3F2FD;padding:6px 10px;border:1px solid #BBDEFB;text-align:center;","Bron"),
              tags$th(style="background:#E3F2FD;padding:6px 10px;border:1px solid #BBDEFB;text-align:center;","SS"),
              tags$th(style="background:#E3F2FD;padding:6px 10px;border:1px solid #BBDEFB;text-align:center;","df"),
              tags$th(style="background:#E3F2FD;padding:6px 10px;border:1px solid #BBDEFB;text-align:center;","MS"),
              tags$th(style="background:#E3F2FD;padding:6px 10px;border:1px solid #BBDEFB;text-align:center;","F-ratio")
            )),
            tags$tbody(
              tags$tr(
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;","Tussen groepen"),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",uiOutput("ssb_disp")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("df_between", NULL, value = NA, min = 1, step = 1, width = "80px")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("msb", NULL, value = NA, step = 0.0001, width = "100px")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("f_ratio", NULL, value = NA, step = 0.0001, width = "100px"))
              ),
              tags$tr(
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;","Binnen groepen (fout)"),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",uiOutput("ssw_disp")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("df_within", NULL, value = NA, min = 1, step = 1, width = "80px")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("msw", NULL, value = NA, step = 0.0001, width = "100px")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;","-")
              ),
              tags$tr(
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",tags$strong("Totaal")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",uiOutput("sst_disp")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;",
                        numericInput("df_total", NULL, value = NA, min = 1, step = 1, width = "80px")),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;","-"),
                tags$td(style="padding:5px 10px;border:1px solid #E0E0E0;text-align:center;","-")
              )
            )
          ),
          br(),
          fluidRow(
            column(3, uiOutput("df_between_light"), uiOutput("msg_df_between")),
            column(3, uiOutput("df_within_light"),  uiOutput("msg_df_within")),
            column(3, uiOutput("df_total_light"),   uiOutput("msg_df_total")),
            column(3, uiOutput("f_ratio_light"),    uiOutput("msg_f_ratio"))
          ),
          fluidRow(
            column(3, uiOutput("msb_light"), uiOutput("msg_msb")),
            column(3, uiOutput("msw_light"), uiOutput("msg_msw"))
          ),
          br(),
          div(class = "card",
              h5("\u03b7\u00b2 (eta-kwadraat) \u2014 effectgrootte"),
              div(class = "muted", "Bereken de proportie verklaarde variantie: \u03b7\u00b2 = SSB / SST."),
              fluidRow(
                column(4,
                       strong("\u03b7\u00b2"),
                       numericInput("eta_kwadraat", NULL, value = NA, step = 0.0001),
                       uiOutput("eta_light"),
                       uiOutput("msg_eta"))
              )
          ),
          uiOutput("anova_table_status"),
          uiOutput("anova_sig_note"),
          div(style = "text-align:right; margin-top:10px;",
              actionButton("check_deel5", HTML("&#x2714;&nbsp;Controleer Deel V"),
                           class = "btn btn-success btn-sm"))
      ),
      br(),

      uiOutput("final_success_message"),

      div(class = "card",
          h4("Deel VI — Visualisaties en conclusie"),
          div(id = "viz_block", class = "disabled",
              uiOutput("viz_content")
          )
      ),
      br(),
      div(class = "card",
          h4("Deel VII \u2014 95%-betrouwbaarheidsinterval per groep"),
          div(id = "ci_block", class = "disabled",
              uiOutput("ci_content")
          )
      )
    )
  )
)

# ============================================================
# SERVER
# ============================================================

server <- function(input, output, session) {

  rv <- reactiveValues(df = NULL, truth = NULL, sc = NULL)
  # v2: rv$snap holds the frozen validation state from the last button click.
  # All light/feedback/status outputs read from rv$snap, not from live input$.
  # snap is a plain list; reading it does NOT create reactive dependencies on inputs.
  rv$snap     <- list()   # empty until first check_all click
  # v3: rv$dirty turns TRUE whenever an input changes after a snap was taken.
  # All feedback outputs show stale-notice when dirty; do_check() resets it.
  rv$dirty    <- FALSE
  # v3: guard to prevent mark_dirty() firing during reset_inputs()
  rv$resetting <- FALSE

  user_calc <- reactiveVal(NULL)
  feedback_store <- reactiveValues()

  strip_html <- function(x) gsub("<[^>]+>", "", as.character(x))

  short_feedback_html <- function(msg) {
    if (is.null(msg)) return(NULL)
    msg <- as.character(msg)
    if (!nzchar(trimws(strip_html(msg)))) return(NULL)
    parts <- unlist(strsplit(msg, "<br\\s*/?>", perl = TRUE))
    trimws(parts[1])
  }

  set_feedback_msg <- function(id, msg) {
    isolate({
      feedback_store[[id]] <- if (is.null(msg) || !nzchar(trimws(strip_html(msg)))) NULL else as.character(msg)
    })
  }

  # OPTIMIZED: avoid reactiveValuesToList(feedback_store) dependency accumulation.
  # Use a static list of known IDs plus group-specific IDs from rv$truth.
  clear_feedback_store <- function() {
    static_ids <- c(
      "msg_grand_mean",
      "msg_ssw", "msg_ssb", "msg_sst",
      "msg_df_between", "msg_df_within", "msg_df_total",
      "msg_msb", "msg_msw", "msg_f_ratio", "msg_eta"
    )
    isolate({
      for (id in static_ids) feedback_store[[id]] <- NULL
      t <- rv$truth
      if (!is.null(t)) {
        for (g in t$groups) {
          feedback_store[[paste0("msg_grpmean_", make.names(g))]] <- NULL
        }
      }
    })
  }

  raw_numeric_input <- function(id) {
    raw_val <- input[[paste0(id, "__raw")]]
    if (!is.null(raw_val) && nzchar(trimws(as.character(raw_val)))) return(raw_val)
    input[[id]]
  }

  feedback_ui <- function(id, msg, compact = TRUE) {
    set_feedback_msg(id, msg)
    if (is.null(msg)) return(NULL)
    msg_to_show <- if (compact) short_feedback_html(msg) else as.character(msg)
    if (is.null(msg_to_show) || !nzchar(trimws(strip_html(msg_to_show)))) return(NULL)
    div(class = if (compact) "feedback feedback-compact" else "feedback", HTML(msg_to_show))
  }

  # OPTIMIZED: feedback_panel_ui removed — all three callers (means_detail_feedback,
  # ss_detail_feedback, anova_table_detail_feedback) had no matching uiOutput() in the
  # UI and were themselves removed. The reactiveValuesToList(feedback_store) call inside
  # this function is therefore also eliminated.

  to_num1 <- function(val) {
    num <- suppressWarnings(as.numeric(val))
    if (length(num) == 0 || is.na(num[1])) return(NA_real_)
    num[1]
  }

  get_step3_expected <- function(tbl) {
    t <- rv$truth
    sc <- rv$sc
    if (is.null(tbl) || is.null(t) || is.null(sc)) return(NULL)

    group_means <- setNames(
      vapply(t$groups, function(g) {
        round(to_num1(input[[paste0("grp_mean_", make.names(g))]]), 4)
      }, numeric(1)),
      t$groups
    )
    grand_mean <- round(to_num1(input$grand_mean), 4)

    calc_anova_step3_expected(tbl, sc$y_var$name, group_means, grand_mean)
  }

  reset_inputs <- function() {
    rv$resetting <- TRUE
    for (fld in c("ssw","ssb","sst","df_between","df_within","df_total","msb","msw","f_ratio","eta_kwadraat")) {
      updateNumericInput(session, fld, value = NA)
    }
    t <- rv$truth
    if (!is.null(t)) {
      updateNumericInput(session, "grand_mean", value = NA)
      for (g in t$groups)
        updateNumericInput(session, paste0("grp_mean_", make.names(g)), value = NA)
    }
    user_calc(NULL)
    clear_feedback_store()
    # v3: clear snap, dirty, and all browser validation state
    rv$snap  <- list()
    rv$dirty <- FALSE
    session$sendCustomMessage("clearValidationClasses", list())
    rv$resetting <- FALSE
  }

  observeEvent(input$gen, {
    sc <- get_sc(input$scenario); if (is.null(sc)) return()
    n  <- max(3L, min(as.integer(MAX_SAMPLE_SIZE / length(sc$groups)),
                      as.integer(input$n_per_group %||% 10)))
    df <- make_anova_data(sc, n_per_group = n, seed = safe_seed(input$seed))
    rv$df    <- df
    rv$truth <- calc_anova_truth(df, sc$y_var$name)
    rv$sc    <- sc
    reset_inputs()
  })

  observeEvent(input$new_same, {
    ids    <- vapply(scenarios, `[[`, character(1), "id")
    others <- ids[ids != input$scenario]
    chosen <- if (length(others) > 0) sample(others, 1) else sample(ids, 1)
    seed_new <- sample(1:9999, 1)
    updateSelectInput(session, "scenario", selected = chosen)
    updateTextInput(session, "seed", value = as.character(seed_new))
    sc <- get_sc(chosen); if (is.null(sc)) return()
    n  <- max(3L, min(as.integer(MAX_SAMPLE_SIZE / length(sc$groups)),
                      as.integer(input$n_per_group %||% 10)))
    df <- make_anova_data(sc, n_per_group = n, seed = seed_new)
    rv$df    <- df
    rv$truth <- calc_anova_truth(df, sc$y_var$name)
    rv$sc    <- sc
    reset_inputs()
  })

  # v2: per-section check buttons — all call do_check() (validates full app, snap updated once)
  observeEvent(input$check_deel2,  { do_check() }, ignoreInit = TRUE)
  observeEvent(input$check_deel3,  { do_check() }, ignoreInit = TRUE)
  observeEvent(input$check_deel4,  { do_check() }, ignoreInit = TRUE)
  observeEvent(input$check_deel5,  { do_check() }, ignoreInit = TRUE)

  # v3: mark_dirty — called whenever any input changes after a snap exists.
  # Clears JS field classes, resets table colours, hides viz.
  mark_dirty <- function() {
    if (isTRUE(rv$resetting)) return(invisible(NULL))
    if (length(rv$snap) > 0 && !isTRUE(rv$dirty)) {
      rv$dirty <- TRUE
      session$sendCustomMessage("clearValidationClasses", list())
      session$sendCustomMessage("toggleViz", FALSE)
      session$sendCustomMessage("toggleCI",  FALSE)
    }
  }

  # v3: dirty observer — fires when any student input changes
  observeEvent(
    {
      t <- rv$truth
      ids <- c(
        "grand_mean",
        "ssw", "ssb", "sst",
        "df_between", "df_within", "df_total",
        "msb", "msw", "f_ratio", "eta_kwadraat"
      )
      if (!is.null(t)) ids <- c(ids, paste0("grp_mean_", make.names(t$groups)))
      paste(vapply(ids, function(id) as.character(input[[id]] %||% ""), character(1)), collapse = "|")
    },
    { mark_dirty() },
    ignoreInit = TRUE
  )

  # ============================================================
  # v2: CORE VALIDATION SNAPSHOT — runs only on button click
  # ============================================================

  # Helper: build the full validation snapshot from current inputs
  do_check <- function() {
    rv$resetting <- TRUE
    on.exit({ rv$resetting <- FALSE }, add = TRUE)

    t <- rv$truth
    if (is.null(t)) return(invisible(NULL))

    snap <- list()

    # --- group means ---
    grp_checks <- setNames(
      vapply(t$groups, function(g) {
        fid <- paste0("grp_mean_", make.names(g))
        safe_check(input[[fid]], t$grp_means[g])
      }, logical(1)),
      t$groups
    )
    snap$grp_checks <- grp_checks
    snap$grand_check <- safe_check(input$grand_mean, t$grand_mean)

    # --- deviation table ---
    tbl <- user_calc()
    tbl_ok <- FALSE
    snap$tbl_n_ok  <- 0L
    snap$tbl_n_tot <- 0L
    snap$tbl_wrong_cols <- character(0)
    if (!is.null(tbl) && nrow(tbl) > 0) {
      tbl <- normalize_group_level_cols_anova(tbl)
      grp_means_for_step3 <- setNames(
        vapply(t$groups, function(g) {
          round(to_num1(input[[paste0("grp_mean_", make.names(g))]]), 4)
        }, numeric(1)), t$groups)
      gm_used <- round(to_num1(input$grand_mean), 4)
      step3_exp <- calc_anova_step3_expected(tbl, rv$sc$y_var$name, grp_means_for_step3, gm_used)
      if (!is.null(step3_exp)) {
        group_blocks <- get_anova_group_blocks(tbl[["Groep"]])
        entry_rows <- group_blocks$start
        dW_chk  <- check_col_vec(as.numeric(tbl[[4]]), step3_exp$dev_within)
        dW2_chk <- check_col_vec(as.numeric(tbl[[5]]), step3_exp$dev_within_sq)
        dB_chk  <- check_col_vec(as.numeric(tbl[[6]]), step3_exp$dev_between)
        dB2_chk <- check_col_vec(as.numeric(tbl[[7]]), step3_exp$dev_between_sq)
        snap$step3_exp  <- step3_exp
        snap$tbl_dW2_ok <- all(dW2_chk == TRUE, na.rm = TRUE) && !any(is.na(dW2_chk))
        snap$tbl_dB2_ok <- all(dB2_chk[entry_rows] == TRUE, na.rm = TRUE) && !any(is.na(dB2_chk[entry_rows]))
        all_chk <- c(dW_chk, dW2_chk, dB_chk[entry_rows], dB2_chk[entry_rows])
        snap$tbl_n_ok  <- sum(all_chk == TRUE, na.rm = TRUE)
        snap$tbl_n_tot <- nrow(tbl) * 2L + length(entry_rows) * 2L
        snap$tbl_wrong_cols <- c(
          if (any(dW_chk  == FALSE, na.rm = TRUE)) "(Y\u2212Yj)",
          if (any(dW2_chk == FALSE, na.rm = TRUE)) "(Y\u2212Yj)\u00b2",
          if (any(dB_chk[entry_rows] == FALSE, na.rm = TRUE)) "(Yj\u2212Y.)",
          if (any(dB2_chk[entry_rows] == FALSE, na.rm = TRUE)) "(Yj\u2212Y.)\u00b2"
        )
        tbl_ok <- snap$tbl_n_ok == snap$tbl_n_tot && snap$tbl_n_tot > 0
      }
    }
    snap$tbl_ok <- tbl_ok

    # --- scalar fields: SS, df, MS, F, eta ---
    scalar_fields <- list(
      ssw = list(val = input$ssw,          true = t$SSW),
      ssb = list(val = input$ssb,          true = t$SSB),
      sst = list(val = input$sst,          true = t$SST),
      df_between   = list(val = input$df_between,   true = t$df_between),
      df_within    = list(val = input$df_within,    true = t$df_within),
      df_total     = list(val = input$df_total,     true = t$df_total),
      msb          = list(val = input$msb,          true = t$MSB),
      msw          = list(val = input$msw,          true = t$MSW),
      f_ratio      = list(val = input$f_ratio,      true = t$F_ratio),
      eta_kwadraat = list(val = input$eta_kwadraat, true = t$eta_sq)
    )
    snap$field_checks <- setNames(
      lapply(scalar_fields, function(x) safe_check(x$val, x$true)),
      names(scalar_fields)
    )

    # --- all_correct ---
    grp_all_ok <- all(grp_checks == TRUE, na.rm = TRUE) && !any(is.na(grp_checks))
    grand_ok   <- isTRUE(snap$grand_check)
    tbl_all_ok <- tbl_ok
    scalars_ok <- all(vapply(snap$field_checks, isTRUE, logical(1)))
    snap$all_correct <- grp_all_ok && grand_ok && tbl_all_ok && scalars_ok

    # store snapshot (triggers renderUI outputs that depend on rv$snap)
    rv$snap  <- snap
    # v3: reset dirty — this is now the authoritative checked state
    rv$dirty <- FALSE

    # --- JS field colouring (fires once per click) ---
    # group means
    for (g in t$groups) {
      fid <- paste0("grp_mean_", make.names(g))
      chk <- grp_checks[[g]]
      session$sendCustomMessage("markField", list(
        id = fid,
        state = if (is.na(chk)) "neutral" else if (chk) "valid" else "invalid"
      ))
    }
    # grand mean
    session$sendCustomMessage("markField", list(
      id = "grand_mean",
      state = if (is.na(snap$grand_check)) "neutral" else if (snap$grand_check) "valid" else "invalid"
    ))
    # scalar fields
    for (fid in names(snap$field_checks)) {
      chk <- snap$field_checks[[fid]]
      session$sendCustomMessage("markField", list(
        id = fid,
        state = if (is.na(chk)) "neutral" else if (chk) "valid" else "invalid"
      ))
    }

    # --- viz unlock ---
    session$sendCustomMessage("toggleViz", snap$all_correct)
    session$sendCustomMessage("toggleCI",  snap$all_correct)

    # --- send table cell-validation data to JS global (triggers hot.render in browser) ---
    if (!is.null(snap$step3_exp)) {
      session$sendCustomMessage("setAnovaValidationData", list(
        dW  = as.numeric(snap$step3_exp$dev_within),
        dW2 = as.numeric(snap$step3_exp$dev_within_sq),
        dB  = as.numeric(snap$step3_exp$dev_between),
        dB2 = as.numeric(snap$step3_exp$dev_between_sq)
      ))
    } else {
      session$sendCustomMessage("setAnovaValidationData",
        list(dW = list(), dW2 = list(), dB = list(), dB2 = list()))
    }

    invisible(NULL)
  }

  observeEvent(input$check_all, {
    do_check()
  }, ignoreInit = TRUE)

  # v2: summary shown in the sidebar check-button card after each click
  output$check_status_summary <- renderUI({
    snap <- rv$snap
    if (length(snap) == 0) return(div(class = "muted", style="margin-top:8px;font-size:12px;",
                                      "Nog niet gecontroleerd."))
    if (isTRUE(rv$dirty))
      return(div(class = "muted", style="margin-top:8px;font-size:12px;",
                 "Antwoorden gewijzigd — klik opnieuw op Controleer."))
    if (isTRUE(snap$all_correct)) {
      div(class = "ok", style = "margin-top:8px;", "\u2714 Alle antwoorden zijn juist!")
    } else {
      n_grp <- sum(snap$grp_checks == TRUE, na.rm = TRUE)
      n_grp_tot <- length(snap$grp_checks) + 1L  # +1 for grand mean
      grand_ok  <- isTRUE(snap$grand_check)
      n_scalar_ok  <- sum(vapply(snap$field_checks, isTRUE, logical(1)))
      n_scalar_tot <- length(snap$field_checks)
      div(style = "margin-top:8px; font-size:12px;",
          div(class="muted", paste0("Deel II: ", n_grp + grand_ok, "/", n_grp_tot, " gemiddelden correct")),
          div(class="muted", paste0("Deel III: ", snap$tbl_n_ok, "/", snap$tbl_n_tot, " tabelcellen correct")),
          div(class="muted", paste0("Delen IV-V: ", n_scalar_ok, "/", n_scalar_tot, " getallen correct"))
      )
    }
  })

  output$seed_echo <- renderUI({
    t <- rv$truth; sc <- rv$sc; if (is.null(t) || is.null(sc)) return(NULL)
    div(class = "accent", style = "margin-top:8px;",
        HTML(paste0("<b>Scenario:</b> ", sc$title,
                    " | <b>N totaal:</b> ", t$n,
                    " | <b>Groepen:</b> ", paste(t$groups, collapse = " | "))))
  })

  output$dataset_vignette <- renderUI({
    sc <- rv$sc; t <- rv$truth
    if (is.null(sc)) return(div(class="muted","Genereer een dataset om te beginnen."))
    div(class="accent",
        HTML(paste0("<b>", sc$title, "</b> - N=", t$n, " observaties | ",
                    t$k, " groepen | uitkomst: <b>", sc$y_var$name,
                    "</b> (", sc$y_var$unit, ")<br/><i>", sc$vignette, "</i>")))
  })

  output$group_tables_ui <- renderUI({
    df <- rv$df; sc <- rv$sc; t <- rv$truth
    if (is.null(df) || is.null(sc) || is.null(t)) return(NULL)
    grp_col   <- "Groep"
    y_col     <- sc$y_var$name
    col_width <- max(2, floor(12 / t$k))
    cols <- lapply(t$groups, function(g) {
      sub <- df[df[[grp_col]] == g, , drop = FALSE]
      rows <- lapply(seq_len(nrow(sub)), function(i) {
        tags$tr(
          tags$td(as.character(sub[["Eenheid"]][i]), style = "padding:3px 8px; text-align:center;"),
          tags$td(as.character(round(sub[[y_col]][i], 2)), style = "padding:3px 8px; text-align:center;")
        )
      })
      column(
        width = col_width,
        tags$div(
          style = "margin-bottom:10px;",
          tags$strong(g, style = "display:block; text-align:center; margin-bottom:4px;"),
          tags$table(
            class = "table table-bordered table-striped table-condensed",
            style = "font-size:13px; width:100%;",
            tags$thead(tags$tr(
              tags$th("Eenheid", style = "text-align:center; padding:4px 8px; background:#f0f0f0;"),
              tags$th(y_col,     style = "text-align:center; padding:4px 8px; background:#f0f0f0;")
            )),
            tags$tbody(rows)
          )
        )
      )
    })
    do.call(fluidRow, cols)
  })

  output$dataset_footer <- renderUI({
    t <- rv$truth; if (is.null(t)) return(NULL)
    tags$small(class="muted",
               paste0("n per groep = ", paste(t$n_groups, collapse="/"),
                      " | Totaal N = ", t$n, " | k = ", t$k, " groepen"))
  })

  # ---- DEEL II: Means ----
  output$means_ui <- renderUI({
    t <- rv$truth; if (is.null(t)) return(div(class="muted","Genereer eerst een dataset."))
    grp_cols <- lapply(seq_along(t$groups), function(i) {
      g <- t$groups[i]; fid <- paste0("grp_mean_", make.names(g))
      column(3, strong(paste0("Y_", g)),
             numericInput(fid, NULL, value = NA, step = 0.0001),
             uiOutput(paste0("lgt_", make.names(g))),
             uiOutput(paste0("msg_grpmean_", make.names(g))))
    })
    grand_col <- column(3, strong("Grootgemiddelde Y.."),
                        numericInput("grand_mean", NULL, value = NA, step = 0.0001),
                        uiOutput("lgt_grand"),
                        uiOutput("msg_grand_mean"))
    tagList(do.call(fluidRow, c(grp_cols, list(grand_col))))
  })

  # v2: group-mean lights and feedback read from rv$snap (frozen at last button click)
  # The observe() that set up live group-mean renderUI + markField observers is replaced
  # with a single observe that re-registers output[[lid]] and output[[mid]] whenever the
  # truth changes (i.e. on new dataset). markField JS is sent only from do_check().
  observe({
    t <- rv$truth; if (is.null(t)) return()
    lapply(t$groups, function(g) {
      local({
        grp <- g; fid <- paste0("grp_mean_", make.names(grp)); lid <- paste0("lgt_", make.names(grp))
        mid <- paste0("msg_grpmean_", make.names(grp))

        # Light reads from rv$snap (frozen), not live input; grey when dirty
        output[[lid]] <- renderUI({
          snap <- rv$snap
          chk  <- if (length(snap) == 0 || isTRUE(rv$dirty)) NA else snap$grp_checks[[grp]]
          col  <- if (is.na(chk)) "#BDBDBD" else if (isTRUE(chk)) "#00C853" else "#D50000"
          div(class="traffic",
              span(id=paste0("dot_",make.names(grp)), class="light", style=paste0("background:",col,";")),
              span(style=paste0("color:",col,";font-weight:700;"),
                   if(!is.na(chk)&&isTRUE(chk))"OK" else if(!is.na(chk)&&!isTRUE(chk))"X" else ""))
        })

        # Feedback message: shown only after button click and when not dirty
        output[[mid]] <- renderUI({
          snap <- rv$snap
          # Only show feedback if the button has been clicked at least once
          if (length(snap) == 0) return(NULL)
          # v3: hide when dirty — value changed since last check
          if (isTRUE(rv$dirty)) return(NULL)
          chk <- snap$grp_checks[[grp]]
          # If correct per snapshot, no feedback message
          if (isTRUE(chk)) { set_feedback_msg(mid, NULL); return(NULL) }
          # Read the current input value for diagnostic message
          v_raw <- input[[fid]]
          if (!has_attempted(v_raw)) { set_feedback_msg(mid, NULL); return(NULL) }
          tryCatch({
            t_cur <- rv$truth; if (is.null(t_cur)) return(NULL)
            v   <- suppressWarnings(as.numeric(v_raw))
            tol <- function(ref) max(0.005, 0.01 * abs(ref))
            nj_grp  <- tryCatch(as.numeric(t_cur$n_groups[grp]), error = function(e) NA_real_)
            grp_sum <- if (!is.na(nj_grp)) t_cur$grp_means[grp] * nj_grp else NA_real_
            msg <- if (!is.na(v)) {
              if (!is.na(t_cur$grand_mean) && abs(v - t_cur$grand_mean) <= tol(t_cur$grand_mean))
                sprintf("<b>Waarom fout:</b> U vulde het grootgemiddelde in als groepsgemiddelde.<br/><b>Oorzaak:</b> Het groepsgemiddelde gebruikt alleen de waarden binnen groep '%s', niet alle waarnemingen samen.<br/><b>Correctie:</b> Y&#x0305;_%s = &#x03a3;(Y voor groep %s) / n_%s", grp, grp, grp, grp)
              else if (!is.na(t_cur$MSW) && abs(v - t_cur$MSW) <= tol(t_cur$MSW))
                sprintf("<b>Waarom fout:</b> U vulde MSW in &#8212; dat is een gemiddeld kwadraat, geen rekenkundig gemiddelde.<br/><b>Correctie:</b> Y&#x0305;_%s = &#x03a3;(Y_i voor groep %s) / n_%s &#8212; gebruik alleen de Y-waarden binnen groep '%s'.", grp, grp, grp, grp)
              else if (!is.na(grp_sum) && !is.na(nj_grp) && nj_grp > 1 && abs(v - grp_sum) <= max(0.5, tol(grp_sum)))
                sprintf("<b>Waarom fout:</b> U heeft de som van Y-waarden in groep '%s' ingevuld zonder te delen door n.<br/><b>Correctie:</b> Y&#x0305;_%s = &#x03a3;Y / n_%s &#8212; deel de groepssom door het aantal waarnemingen in die groep.", grp, grp, grp)
              else NULL
            } else NULL
            full_msg <- if (!is.null(msg)) msg else sprintf(
              "Groepsgemiddelde onjuist. Y&#x0305;_%s = &#x03a3;(Y voor groep %s) / n_%s.",
              grp, grp, grp
            )
            feedback_ui(mid, full_msg, compact = TRUE)
          }, error = function(e) { set_feedback_msg(mid, NULL); NULL })
        })
      })
    })
  })

  # v2/v3: grand mean light reads from rv$snap; grey when dirty
  output$lgt_grand <- renderUI({
    snap <- rv$snap
    chk  <- if (length(snap) == 0 || isTRUE(rv$dirty)) NA else snap$grand_check
    col  <- if (is.na(chk)) "#BDBDBD" else if (isTRUE(chk)) "#00C853" else "#D50000"
    div(class="traffic",
        span(id="dot_grand", class="light", style=paste0("background:",col,";")),
        span(style=paste0("color:",col,";font-weight:700;"),
             if(!is.na(chk)&&isTRUE(chk))"OK" else if(!is.na(chk)&&!isTRUE(chk))"X" else ""))
  })
  # v2: removed live observe({ sendCustomMessage("markField", grand_mean) }) — now in do_check()

  # v2: grand_mean feedback shown only after button click (reads snap to gate display)
  output$msg_grand_mean <- renderUI({
    snap <- rv$snap
    if (length(snap) == 0) return(NULL)
    if (isTRUE(rv$dirty)) return(NULL)
    if (isTRUE(snap$grand_check)) { set_feedback_msg("msg_grand_mean", NULL); return(NULL) }
    tryCatch({
      t <- rv$truth; if (is.null(t)) return(NULL)
      if (!has_attempted(input$grand_mean)) { set_feedback_msg("msg_grand_mean", NULL); return(NULL) }
      v   <- suppressWarnings(as.numeric(input$grand_mean))
      tol <- function(ref) max(0.005, 0.01 * abs(ref))
      unweighted_mean <- mean(t$grp_means, na.rm = TRUE)
      msg <- if (!is.na(v)) {
        if (!is.na(unweighted_mean) && abs(v - unweighted_mean) <= tol(unweighted_mean) &&
            abs(v - t$grand_mean) > 0.005)
          "<b>Waarom fout:</b> U berekende het ongewogen gemiddelde van de groepsgemiddelden in plaats van het grootgemiddelde.<br/><b>Oorzaak:</b> Bij ongelijke groepsgrootten is het gemiddelde van groepsgemiddelden niet gelijk aan &#x03a3;(Y)/N.<br/><b>Correctie:</b> Tel alle Y-waarden op en deel door N."
        else {
          grp_match <- tryCatch({
            idx <- which.min(abs(t$grp_means - v))
            if (length(idx) > 0 && abs(t$grp_means[idx] - v) <= tol(t$grp_means[idx]))
              t$groups[idx] else NULL
          }, error = function(e) NULL)
          if (!is.null(grp_match))
            sprintf("<b>Waarom fout:</b> U vulde het groepsgemiddelde van groep '%s' in.<br/><b>Correctie:</b> Het grootgemiddelde is het gemiddelde van alle Y-waarden samen &#8212; voeg alle groepen samen en deel door N.", grp_match)
          else NULL
        }
      } else NULL
      full_msg <- if (!is.null(msg)) msg else
        "Grootgemiddelde onjuist. Y&#x0305;.. = &#x03a3;(alle Y-waarden) / N. Gebruik alle waarnemingen, niet alleen &#233;&#233;n groep."
      feedback_ui("msg_grand_mean", full_msg, compact = TRUE)
    }, error = function(e) { set_feedback_msg("msg_grand_mean", NULL); NULL })
  })

  # v2: means_feedback reads from rv$snap (frozen counts, not live inputs)
  output$means_feedback <- renderUI({
    snap <- rv$snap
    if (length(snap) == 0) return(div(class="muted", "Klik op 'Controleer mijn antwoorden' om de gemiddelden te controleren."))
    if (isTRUE(rv$dirty)) return(div(class="muted", "Antwoorden gewijzigd \u2014 klik opnieuw op Controleer."))
    n_ok  <- sum(snap$grp_checks == TRUE, na.rm = TRUE) + isTRUE(snap$grand_check)
    n_tot <- length(snap$grp_checks) + 1L
    if (n_ok == n_tot)
      div(class = "ok", paste0("V Alle gemiddelden zijn juist! (", n_ok, "/", n_tot, ")"))
    else
      div(class = "muted", paste0(n_ok, "/", n_tot, " correct (na laatste controle)"))
  })

    # ---- DEEL III: Afwijkingtabel ----
  output$calc_table <- renderRHandsontable({
    df <- rv$df; sc <- rv$sc; if (is.null(df) || is.null(sc)) return(NULL)
    tbl <- user_calc()
    if (is.null(tbl)) tbl <- build_blank_calc_anova(df, sc$y_var$name)
    if (is.null(tbl)) return(NULL)
    tbl <- normalize_group_level_cols_anova(tbl)
    display_tbl <- build_anova_calc_display(tbl)
    merge_cells <- build_anova_merge_cells(display_tbl)
    # v2: validation_data is NO LONGER baked in here.
    # Colors are applied via window.anovaValidationData, set only from do_check().

    rhandsontable(display_tbl, rowHeaders = FALSE, height = 50 + nrow(display_tbl) * 26) |>
      hot_col(1, readOnly = TRUE, width = 140) |>
      hot_col(2, readOnly = TRUE, width = 160) |>
      hot_col(3, readOnly = TRUE, type = "numeric", format = "0.00", width = 110) |>
      hot_col(4, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 110) |>
      hot_col(5, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 120) |>
      hot_col(6, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 110) |>
      hot_col(7, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 120) |>
      hot_cols(
        manualColumnResize = TRUE,
        renderer = '
          function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.textAlign = "center";
            td.style.backgroundColor = "";
            td.style.border = "";

            if (col >= 2 && value !== null && value !== "" && !isNaN(Number(value))) {
              var num = Number(value);
              td.innerText = (col === 2) ? num.toFixed(2) : num.toFixed(4);
            }

            var vd = window.anovaValidationData;
            if (!vd) return;
            var expectedByCol = {3: vd.dW, 4: vd.dW2, 5: vd.dB, 6: vd.dB2};

            if (col >= 3 && value !== null && value !== "" && !isNaN(Number(value))) {
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
      ) |>
      hot_table(contextMenu = FALSE, mergeCells = merge_cells)
  })
  observeEvent(input$calc_table, {
    tbl <- tryCatch(hot_to_r(input$calc_table), error = function(e) NULL)
    if (!is.null(tbl)) tbl <- normalize_group_level_cols_anova(tbl)
    user_calc(tbl)

    if (!isTRUE(rv$resetting)) {
      mark_dirty()
    }
  }, ignoreInit = TRUE)

  output$table_feedback <- renderUI({
    snap <- rv$snap
    if (length(snap) == 0) return(NULL)
    if (isTRUE(rv$dirty)) return(div(class="muted", "Antwoorden gewijzigd \u2014 klik opnieuw op Controleer."))
    n_ok  <- snap$tbl_n_ok
    n_tot <- snap$tbl_n_tot
    if (n_tot == 0L)
      return(div(class="muted","Vul eerst de groepsgemiddelden en het grootgemiddelde in om de afwijkingtabel te controleren."))
    if (n_ok == n_tot)
      div(class="ok", paste0("V Afwijkingtabel is volledig juist! (", n_ok, "/", n_tot, " cellen)"))
    else {
      wrong_cols <- snap$tbl_wrong_cols
      col_hint <- if (length(wrong_cols) > 0)
        paste0(" \u2014 controleer kolom", if (length(wrong_cols) > 1) "men" else "", ": ",
               paste(wrong_cols, collapse = ", "))
      else ""
      div(class="muted", paste0(n_ok, "/", n_tot, " cellen correct", col_hint, "."))
    }
  })

  output$col_sums_hint <- renderUI({
    snap <- rv$snap
    formula_hint <- div(class="accent",
      HTML("<b>Kwadratensommen:</b><ul style='margin:4px 0 0 16px;'><li>SSW = som van alle (Y-Yj)^2</li><li>SSB = som per groep van n_j x (Yj-Y..)^2</li><li>SST = SSW + SSB</li></ul>"))
    if (length(snap) == 0) return(formula_hint)
    if (isTRUE(rv$dirty)) return(formula_hint)
    if (isTRUE(snap$tbl_dW2_ok) && isTRUE(snap$tbl_dB2_ok))
      div(class="ok","V Kwadratenkolommen correct - bereken nu SSW als som van alle (Y-Yj)^2 en SSB als som per groep van n_j x (Yj-Y..)^2 in Deel IV.")
    else
      formula_hint
  })

  # ---- DEEL IV & V: lights (generic) ----
  # v2/v3: make_light reads from rv$snap; grey when dirty
  make_light <- function(output_id, input_id, true_val_fn) {
    output[[output_id]] <- renderUI({
      snap <- rv$snap
      chk  <- if (length(snap) == 0 || isTRUE(rv$dirty)) NA else snap$field_checks[[input_id]]
      col  <- if (is.na(chk)) "#BDBDBD" else if (isTRUE(chk)) "#00C853" else "#D50000"
      div(class="traffic",
          span(id=paste0("dot_",input_id), class="light", style=paste0("background:",col,";")),
          span(style=paste0("color:",col,";font-weight:700;"),
               if(!is.na(chk)&&isTRUE(chk))"OK" else if(!is.na(chk)&&!isTRUE(chk))"X" else ""))
    })
    # v2: removed observe({ sendCustomMessage("markField",...) }) — now in do_check()
  }

  make_light("ssw_light",        "ssw",        function(t) t$SSW)
  make_light("ssb_light",        "ssb",        function(t) t$SSB)
  make_light("sst_light",        "sst",        function(t) t$SST)
  make_light("df_between_light", "df_between", function(t) t$df_between)
  make_light("df_within_light",  "df_within",  function(t) t$df_within)
  make_light("df_total_light",   "df_total",   function(t) t$df_total)
  make_light("msb_light",        "msb",        function(t) t$MSB)
  make_light("msw_light",        "msw",        function(t) t$MSW)
  make_light("f_ratio_light",    "f_ratio",    function(t) t$F_ratio)
  make_light("eta_light",        "eta_kwadraat", function(t) t$eta_sq)

  # ---- Diagnostic formula hints (show why a field is wrong) ----
  # v2/v3: gated on rv$snap and rv$dirty— only shows feedback after button click and when not dirty
  show_field_msg <- function(msg_id, input_id, true_val_fn, err_msg, diag_fn = NULL) {
    output[[msg_id]] <- renderUI({
      tryCatch({
        snap <- rv$snap
        # Gate: show nothing until button has been clicked at least once
        if (length(snap) == 0) return(NULL)
        # v3: hide when dirty
        if (isTRUE(rv$dirty)) { set_feedback_msg(msg_id, NULL); return(NULL) }
        t <- rv$truth; if (is.null(t)) return(NULL)
        chk <- snap$field_checks[[input_id]]
        if (isTRUE(chk)) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        if (!has_attempted(input[[input_id]])) {
          set_feedback_msg(msg_id, NULL)
          return(NULL)
        }
        # Check for decimal rounding miss first
        v_num <- suppressWarnings(as.numeric(input[[input_id]]))
        if (is_decimal_miss(v_num, true_val_fn(t), raw_input = raw_numeric_input(input_id))) {
          dec_msg <- "<b>Afrondingsfout:</b> Uw waarde is correct maar heeft te weinig decimalen. Gebruik 4 decimalen."
          set_feedback_msg(msg_id, dec_msg)
          return(div(class = "feedback feedback-compact", HTML("Afrondingsfout &#8212; gebruik 4 decimalen.")))
        }
        if (!is.null(diag_fn)) {
          diag_msg <- tryCatch(diag_fn(input[[input_id]], t), error = function(e) NULL)
          if (!is.null(diag_msg)) {
            set_feedback_msg(msg_id, diag_msg)
            return(div(class = "feedback feedback-compact", HTML(diag_msg)))
          }
        }
        feedback_ui(msg_id, err_msg, compact = TRUE)
      }, error = function(e) {
        set_feedback_msg(msg_id, NULL)
        NULL
      })
    })
  }

  show_field_msg("msg_ssw", "ssw", function(t) t$SSW,
    "SSW onjuist. SSW = som van alle (Y&#x2212;Y&#x0305;<sub>j</sub>)&#x00b2; in de afwijkingtabel.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      tol <- function(ref) max(0.5, 0.01 * abs(ref))
      if (!is.na(v) && !is.na(t$SSB) && abs(v - t$SSB) <= tol(t$SSB))
        "<b>Waarom fout:</b> U vulde SSB in bij SSW &#8212; deze zijn verwisseld.<br/><b>Oorzaak:</b> SSW = <em>binnengroepse</em> variatie &#x03a3;(Y&#x2212;Y&#x0305;<sub>j</sub>)&#x00b2;; SSB = <em>tussengroepse</em> variatie.<br/><b>Correctie:</b> Gebruik de juiste kolom &#8212; SSW is de som van kwadraten <em>binnen</em> de groepen."
      else if (!is.na(v) && !is.na(t$SST) && abs(v - t$SST) <= tol(t$SST))
        "<b>Waarom fout:</b> U vulde SST in bij SSW.<br/><b>Oorzaak:</b> SST = SSW + SSB; SSW is <em>alleen</em> de binnengroepse variatie.<br/><b>Correctie:</b> SSW = SST &#8722; SSB."
      else if (!is.na(v) && !is.na(t$MSW) && abs(v - t$MSW) <= tol(t$MSW))
        "<b>Waarom fout:</b> U vulde MSW in bij SSW.<br/><b>Oorzaak:</b> MSW = SSW / df<sub>binnen</sub>; SSW is de som <em>v&#243;&#243;r</em> deling door df.<br/><b>Correctie:</b> Vermenigvuldig terug: SSW = MSW &#215; df<sub>binnen</sub>."
      else NULL
    })
  show_field_msg("msg_ssb", "ssb", function(t) t$SSB,
    "SSB onjuist. SSB = &#x03a3; n<sub>j</sub>(Y&#x0305;<sub>j</sub>&#x2212;Y&#x0305;..)&#x00b2;.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      tol <- function(ref) max(0.5, 0.01 * abs(ref))
      if (!is.na(v) && !is.na(t$SSW) && abs(v - t$SSW) <= tol(t$SSW))
        "<b>Waarom fout:</b> U vulde SSW in bij SSB &#8212; deze zijn verwisseld.<br/><b>Oorzaak:</b> SSB = <em>tussengroepse</em> variatie &#x03a3; n<sub>j</sub>(Y&#x0305;<sub>j</sub>&#x2212;Y&#x0305;..)&#x00b2;; SSW is binnengroeps.<br/><b>Correctie:</b> Gebruik de tussengroepse afwijkingskwadraten &#8212; bereken voor elke groep n<sub>j</sub>(Y&#x0305;<sub>j</sub>&#x2212;Y&#x0305;..)&#x00b2; en tel op."
      else if (!is.na(v) && !is.na(t$SST) && abs(v - t$SST) <= tol(t$SST))
        "<b>Waarom fout:</b> U vulde SST in bij SSB.<br/><b>Oorzaak:</b> SSB is alleen de tussengroepse variatie, niet het totaal.<br/><b>Correctie:</b> SSB = SST &#8722; SSW."
      else if (!is.na(v) && !is.na(t$MSB) && abs(v - t$MSB) <= tol(t$MSB))
        "<b>Waarom fout:</b> U vulde MSB in bij SSB.<br/><b>Oorzaak:</b> MSB = SSB / df<sub>tussen</sub>; SSB is de som v&#243;&#243;r deling door df.<br/><b>Correctie:</b> Vermenigvuldig terug: SSB = MSB &#215; df<sub>tussen</sub>."
      else NULL
    })
  show_field_msg("msg_sst", "sst", function(t) t$SST,
    "SST onjuist. SST = SSW + SSB.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      tol <- function(ref) max(0.5, 0.01 * abs(ref))
      if (!is.na(v) && !is.na(t$SSW) && abs(v - t$SSW) <= tol(t$SSW))
        "<b>Waarom fout:</b> U vulde SSW in bij SST.<br/><b>Correctie:</b> SST = SSW <em>+</em> SSB &#8212; voeg beide kwadratensommen samen."
      else if (!is.na(v) && !is.na(t$SSB) && abs(v - t$SSB) <= tol(t$SSB))
        "<b>Waarom fout:</b> U vulde SSB in bij SST.<br/><b>Correctie:</b> SST = SSW <em>+</em> SSB &#8212; voeg beide kwadratensommen samen."
      else if (!is.na(v) && !is.na(t$SSW) && !is.na(t$SSB) &&
               abs(v - abs(t$SST - 2 * t$SSW)) <= tol(t$SST))
        "<b>Waarom fout:</b> U gebruikte SSW &#8722; SSB in plaats van SSW + SSB.<br/><b>Correctie:</b> Gebruik de <em>optelling</em>: SST = SSW + SSB."
      else NULL
    })
  show_field_msg("msg_df_between", "df_between", function(t) t$df_between,
    "<b>Waarom fout:</b> df<sub>tussen</sub> is onjuist.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1 (aantal groepen min 1).",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (!is.na(v) && v == t$k)
        "<b>Waarom fout:</b> U vulde k in plaats van k &#8722; 1.<br/><b>Oorzaak:</b> df<sub>tussen</sub> is het aantal <em>vrijheidsgraden</em> tussen groepen, niet het aantal groepen zelf.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1."
      else if (!is.na(v) && v == t$k + 1L)
        "<b>Waarom fout:</b> U telde 1 op bij k in plaats van 1 af te trekken.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1."
      else if (!is.na(v) && v == t$df_within)
        "<b>Waarom fout:</b> U vulde df<sub>binnen</sub> in bij df<sub>tussen</sub> &#8212; verwisseld.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1; df<sub>binnen</sub> = N &#8722; k."
      else if (!is.na(v) && v == t$df_total)
        "<b>Waarom fout:</b> U vulde df<sub>totaal</sub> in bij df<sub>tussen</sub>.<br/><b>Oorzaak:</b> df<sub>totaal</sub> = N &#8722; 1; df<sub>tussen</sub> = k &#8722; 1.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1."
      else
        "<b>Waarom fout:</b> df<sub>tussen</sub> is onjuist.<br/><b>Correctie:</b> df<sub>tussen</sub> = k &#8722; 1 (aantal groepen min 1)."
    })
  show_field_msg("msg_df_within", "df_within", function(t) t$df_within,
    "<b>Waarom fout:</b> df<sub>binnen</sub> is onjuist.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k (totaal waarnemingen min aantal groepen).",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (!is.na(v) && v == t$n)
        "<b>Waarom fout:</b> U vulde N in zonder k af te trekken.<br/><b>Oorzaak:</b> df<sub>binnen</sub> = N &#8722; k, niet N.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k."
      else if (!is.na(v) && v == t$n - 1L)
        "<b>Waarom fout:</b> U berekende N &#8722; 1 &#8212; dat is df<sub>totaal</sub>, niet df<sub>binnen</sub>.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k."
      else if (!is.na(v) && v == t$df_between)
        "<b>Waarom fout:</b> U vulde df<sub>tussen</sub> in bij df<sub>binnen</sub> &#8212; verwisseld.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k; df<sub>tussen</sub> = k &#8722; 1."
      else if (!is.na(v) && v == t$k)
        "<b>Waarom fout:</b> U vulde k in bij df<sub>binnen</sub>.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k, niet k."
      else
        "<b>Waarom fout:</b> df<sub>binnen</sub> is onjuist.<br/><b>Formule:</b> df<sub>binnen</sub> = N &#8722; k."
    })
  show_field_msg("msg_df_total", "df_total", function(t) t$df_total,
    "<b>Waarom fout:</b> df<sub>totaal</sub> is onjuist.<br/><b>Formule:</b> df<sub>totaal</sub> = N &#8722; 1.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (!is.na(v) && v == t$n)
        "<b>Waarom fout:</b> U vulde N in zonder 1 af te trekken.<br/><b>Formule:</b> df<sub>totaal</sub> = N &#8722; 1."
      else if (!is.na(v) && v == t$df_within + t$df_between - 1L)
        "<b>Waarom fout:</b> U berekende df<sub>tussen</sub> + df<sub>binnen</sub> &#8722; 1 &#8212; de &#8722;1 is hier niet nodig.<br/><b>Formule:</b> df<sub>totaal</sub> = df<sub>tussen</sub> + df<sub>binnen</sub> = N &#8722; 1."
      else if (!is.na(v) && v == t$df_between)
        "<b>Waarom fout:</b> U vulde df<sub>tussen</sub> in bij df<sub>totaal</sub>.<br/><b>Formule:</b> df<sub>totaal</sub> = N &#8722; 1."
      else if (!is.na(v) && v == t$df_within)
        "<b>Waarom fout:</b> U vulde df<sub>binnen</sub> in bij df<sub>totaal</sub>.<br/><b>Formule:</b> df<sub>totaal</sub> = N &#8722; 1."
      else
        "<b>Waarom fout:</b> df<sub>totaal</sub> is onjuist.<br/><b>Formule:</b> df<sub>totaal</sub> = N &#8722; 1."
    })
  show_field_msg("msg_msb", "msb", function(t) t$MSB,
    "MSB onjuist. MSB = SSB / df<sub>tussen</sub>.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      tol <- function(ref) max(0.5, 0.01 * abs(ref))
      if (!is.na(v) && !is.na(t$SSB) && abs(v - t$SSB) <= tol(t$SSB))
        "<b>Waarom fout:</b> U vulde SSB in bij MSB &#8212; deel nog door df<sub>tussen</sub>.<br/><b>Formule:</b> MSB = SSB / df<sub>tussen</sub>."
      else if (!is.na(v) && !is.na(t$MSW) && abs(v - t$MSW) <= tol(t$MSW))
        "<b>Waarom fout:</b> U vulde MSW in bij MSB &#8212; verwisseld.<br/><b>Formule:</b> MSB = SSB / df<sub>tussen</sub>; MSW = SSW / df<sub>binnen</sub>."
      else if (!is.na(v) && !is.na(t$SSB) && t$df_within > 0 &&
               abs(v - round(t$SSB / t$df_within, 4)) <= tol(round(t$SSB / t$df_within, 4)))
        "<b>Waarom fout:</b> U deelde SSB door df<sub>binnen</sub> in plaats van df<sub>tussen</sub>.<br/><b>Formule:</b> MSB = SSB / df<sub>tussen</sub>."
      else NULL
    })
  show_field_msg("msg_msw", "msw", function(t) t$MSW,
    "MSW onjuist. MSW = SSW / df<sub>binnen</sub>.",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      tol <- function(ref) max(0.5, 0.01 * abs(ref))
      if (!is.na(v) && !is.na(t$SSW) && abs(v - t$SSW) <= tol(t$SSW))
        "<b>Waarom fout:</b> U vulde SSW in bij MSW &#8212; deel nog door df<sub>binnen</sub>.<br/><b>Formule:</b> MSW = SSW / df<sub>binnen</sub>."
      else if (!is.na(v) && !is.na(t$MSB) && abs(v - t$MSB) <= tol(t$MSB))
        "<b>Waarom fout:</b> U vulde MSB in bij MSW &#8212; verwisseld.<br/><b>Formule:</b> MSW = SSW / df<sub>binnen</sub>; MSB = SSB / df<sub>tussen</sub>."
      else if (!is.na(v) && !is.na(t$SSW) && t$df_between > 0 &&
               abs(v - round(t$SSW / t$df_between, 4)) <= tol(round(t$SSW / t$df_between, 4)))
        "<b>Waarom fout:</b> U deelde SSW door df<sub>tussen</sub> in plaats van df<sub>binnen</sub>.<br/><b>Formule:</b> MSW = SSW / df<sub>binnen</sub>."
      else NULL
    })
  show_field_msg("msg_f_ratio", "f_ratio", function(t) t$F_ratio,
    "F onjuist. F = MSB / MSW (tussengroeps gedeeld door binnengroeps).",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (!is.na(v) && !is.na(t$F_ratio) && t$F_ratio > 0 &&
          abs(v - round(1 / t$F_ratio, 4)) < max(0.01, 0.02 * abs(1 / t$F_ratio)))
        "<b>Waarom fout:</b> U berekende MSW/MSB in plaats van MSB/MSW &#8212; draai de deling om.<br/><b>Formule:</b> F = MSB / MSW."
      else NULL
    })
  show_field_msg("msg_eta", "eta_kwadraat", function(t) t$eta_sq,
    "&#951;&#178; onjuist. &#951;&#178; = SSB / SST (gebruik SST in de noemer).",
    diag_fn = function(val, t) {
      v <- suppressWarnings(as.numeric(val))
      if (!is.na(v) && !is.na(t$SSW) && t$SSW > 0 &&
          abs(v - round(t$SSB / t$SSW, 4)) < max(0.01, 0.02 * abs(t$SSB / t$SSW)))
        "<b>Waarom fout:</b> U gebruikte SSB/SSW in plaats van SSB/SST.<br/><b>Oorzaak:</b> De noemer van &#951;&#178; is SST (= SSW + SSB), niet SSW.<br/><b>Formule:</b> &#951;&#178; = SSB / SST."
      else NULL
    })

  output$ss_status <- renderUI({
    if (length(rv$snap) == 0) return(NULL)
    if (isTRUE(rv$dirty)) return(div(class="muted", "Antwoorden gewijzigd \u2014 klik opnieuw op Controleer."))
    fc  <- rv$snap$field_checks
    checks <- c(ssw = isTRUE(fc[["ssw"]]), ssb = isTRUE(fc[["ssb"]]), sst = isTRUE(fc[["sst"]]))
    n_ok <- sum(checks)
    if (n_ok == 3L) div(class="ok","V Alle kwadratensommen zijn juist! SST = SSW + SSB")
    else div(class="muted", paste0(n_ok,"/3 juist - Gebruik kolomsommen uit de afwijkingtabel."))
  })

  # OPTIMIZED: output$ss_detail_feedback removed — had no matching uiOutput() in UI.

  make_ss_disp <- function(output_id, input_id, true_val_fn) {
    output[[output_id]] <- renderUI({
      t    <- rv$truth
      snap <- rv$snap
      if (is.null(t) || length(snap) == 0 || isTRUE(rv$dirty)) return(div("-"))
      chk <- snap$field_checks[[input_id]]
      if (isTRUE(chk)) div(style="color:#0E7C7B;", round(true_val_fn(t), 4)) else div("-")
    })
  }
  make_ss_disp("ssb_disp","ssb",function(t)t$SSB)
  make_ss_disp("ssw_disp","ssw",function(t)t$SSW)
  make_ss_disp("sst_disp","sst",function(t)t$SST)

  output$anova_table_status <- renderUI({
    if (length(rv$snap) == 0) return(NULL)
    if (isTRUE(rv$dirty)) return(div(class="muted", "Antwoorden gewijzigd \u2014 klik opnieuw op Controleer."))
    t  <- rv$truth; if (is.null(t)) return(NULL)
    fc <- rv$snap$field_checks
    fields <- c("df_between","df_within","df_total","msb","msw","f_ratio","eta_kwadraat")
    n_ok <- sum(sapply(fields, function(f) isTRUE(fc[[f]])))
    if (n_ok == 7L)
      div(class="ok", paste0("V ANOVA-tabel is juist! F(",t$df_between,",",t$df_within,") = ",round(t$F_ratio,4),
                             " | \u03b7\u00b2 = ",round(t$eta_sq,4)))
    else
      div(class="muted", paste0(n_ok,"/7 juist"))
  })

  # OPTIMIZED: output$anova_table_detail_feedback removed — had no matching uiOutput() in UI.

  output$anova_sig_note <- renderUI({
    snap <- rv$snap
    if (length(snap) == 0) return(NULL)
    if (isTRUE(rv$dirty)) return(NULL)
    fc <- snap$field_checks
    if (!isTRUE(fc[["f_ratio"]]) ||
        !isTRUE(fc[["df_between"]]) ||
        !isTRUE(fc[["df_within"]])) return(NULL)
    div(
      class = "accent",
      HTML(
        paste0(
          "<b>Significantie zonder p-waarde:</b> ",
          "zoek na het berekenen van F de kritieke F-waarde op in een ",
          "<a href='F_table.pdf' target='_blank' rel='noopener noreferrer'>F-tabel (PDF)</a> ",
          "bij alpha = 0,05 met teller-vrijheidsgraden <b>df_between</b> en noemer-vrijheidsgraden <b>df_within</b>.",
          "<ul style='margin:6px 0 0 18px;'>",
          "<li><b>F &gt; Fkrit</b> - significant</li>",
          "<li><b>F &lt;= Fkrit</b> - niet significant</li>",
          "</ul>"
        )
      )
    )
  })

  # ---- All-correct -> unlock viz (reads rv$snap, updated only on button click) ----
  all_correct <- reactive({ isTRUE(rv$snap$all_correct) })

  # ---- DEEL VII: Betrouwbaarheidsintervallen (display only) ----
  output$ci_content <- renderUI({
    if (!all_correct() || isTRUE(rv$dirty))
      return(div(class = "muted", "Voltooi alle stappen correct om de betrouwbaarheidsintervallen te zien."))
    t <- rv$truth

    # Per-group CI rows
    ci_rows <- lapply(t$groups, function(g) {
      nj  <- t$n_groups[g]
      se  <- round(sqrt(t$MSW / nj), 4)
      lo  <- round(t$ci_lower[g], 4)
      hi  <- round(t$ci_upper[g], 4)
      tags$tr(
        tags$td(style = "padding:6px 12px;font-weight:600;", g),
        tags$td(style = "padding:6px 12px;text-align:center;", round(t$grp_means[g], 4)),
        tags$td(style = "padding:6px 12px;text-align:center;", nj),
        tags$td(style = "padding:6px 12px;text-align:center;", se),
        tags$td(style = "padding:6px 12px;text-align:center;color:#1565C0;font-weight:700;",
                paste0("[", lo, " ; ", hi, "]"))
      )
    })

    tagList(
      # Formula explanation
      div(class = "accent",
          HTML(paste0(
            "<b>Formule:</b> CI<sub>j</sub> = Y&#x0305;<sub>j</sub> &plusmn; t<sub>0,975;&thinsp;df<sub>binnen</sub></sub>",
            " &times; &#x221A;(MSW / n<sub>j</sub>)",
            "<br/><b>Gebruikte waarden:</b>",
            " t<sub>0,975;&thinsp;", t$df_within, "</sub> = ", round(t$t_crit, 4),
            " &nbsp;|&nbsp; MSW = ", round(t$MSW, 4)
          ))
      ),
      br(),
      # CI table
      tags$table(
        style = "border-collapse:collapse; width:100%; font-size:14px;",
        tags$thead(
          tags$tr(style = "background:#E3F2FD; border-bottom:2px solid #90CAF9;",
            tags$th(style = "padding:6px 12px;text-align:left;",  "Groep"),
            tags$th(style = "padding:6px 12px;text-align:center;", "Y\u0305\u2C7C"),
            tags$th(style = "padding:6px 12px;text-align:center;", "n\u2C7C"),
            tags$th(style = "padding:6px 12px;text-align:center;", "SE = \u221A(MSW/n\u2C7C)"),
            tags$th(style = "padding:6px 12px;text-align:center;", "95%-BI")
          )
        ),
        tags$tbody(ci_rows)
      ),
      br(),
      # What does CI mean?
      div(class = "card",
          style = "background:#F3F8FF; border-left:4px solid #1565C0; padding:14px 18px;",
          HTML(paste0(
            "<b style='color:#1565C0;'>Wat betekent een 95%-betrouwbaarheidsinterval?</b><br/>",
            "<ul style='margin:8px 0 0 16px;'>",
            "<li>Als je dit onderzoek 100 keer zou herhalen, zou het betrouwbaarheidsinterval in ",
            "<b>95 van de 100 gevallen</b> de ware populatieparameter bevatten.</li>",
            "<li>Het BI geeft aan hoe <b>nauwkeurig</b> je schatting is: een smal BI = grotere zekerheid, ",
            "een breed BI = meer onzekerheid (door kleine n of grote spreiding).</li>",
            "<li>De breedte hangt af van <b>drie factoren</b>: MSW (binnengroepse spreiding), ",
            "n<sub>j</sub> (steekproefgrootte) en df<sub>binnen</sub> (via t-kritiek).</li>",
            "<li>In de grafiek (Deel VI) zijn de betrouwbaarheidsintervallen zichtbaar als ",
            "<b style='color:#3F51B5;'>blauwe foutbalken</b> rondom elk groepsgemiddelde.</li>",
            "<li><b>Overlappende BI's</b> wijzen niet noodzakelijk op een niet-significant verschil \u2014 ",
            "gebruik altijd de F-toets als beslissingsinstrument.</li>",
            "</ul>"
          ))
      )
    )
  })

  output$final_success_message <- renderUI({
    if (!all_correct()) return(NULL)
    if (isTRUE(rv$dirty)) return(NULL)
    t <- rv$truth
    div(
      class = "card",
      style = "background-color: #E8F5E9; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0;",
      h3(
        style = "color: #2E7D32; margin-top: 0;",
        "Uitstekend werk! Alle stappen zijn juist!"
      ),
      p(
        style = "font-size: 15px; margin: 10px 0; color: #1B5E20;",
        HTML(paste0(
          "F(",
          t$df_between, ", ", t$df_within, ") = ",
          round(t$F_ratio, 4),
          " | \u03b7\u00b2 = ", round(t$eta_sq, 4),
          " \u2014 bekijk de visualisaties hieronder."
        ))
      )
    )
  })

  # ---- DEEL VI: Visualisaties ----
  output$viz_content <- renderUI({
    if (!all_correct() || isTRUE(rv$dirty))
      return(div(class="muted","Voltooi alle stappen correct om de visualisaties te zien."))
    tagList(
      plotOutput("boxplot_plot",   height = "320px"),
      br(),
      plotOutput("ss_decomp_plot", height = "260px"),
      br(),
      uiOutput("interpretation_block")
    )
  })

  output$boxplot_plot <- renderPlot({
    if (!all_correct() || isTRUE(rv$dirty)) return(NULL)
    df <- rv$df; sc <- rv$sc; t <- rv$truth; if (is.null(df)) return(NULL)
    df$Groep <- factor(df$Groep, levels = t$groups)
    gm_df <- data.frame(
      Groep = factor(t$groups, levels = t$groups),
      Gem   = as.numeric(t$grp_means),
      CIlo  = as.numeric(t$ci_lower),
      CIhi  = as.numeric(t$ci_upper)
    )
    pal <- c("#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A")[seq_along(t$groups)]
    ggplot(df, aes(x = Groep, y = .data[[sc$y_var$name]], fill = Groep)) +
      geom_boxplot(alpha = 0.55, outlier.colour = "#B00020", outlier.size = 2) +
      geom_errorbar(data = gm_df, aes(x = Groep, ymin = CIlo, ymax = CIhi),
                    width = 0.25, colour = "#3F51B5", linewidth = 1.2, inherit.aes = FALSE) +
      geom_point(data = gm_df, aes(y = Gem), shape = 18, size = 5, colour = "#3F51B5") +
      geom_hline(yintercept = t$grand_mean, linetype = "dashed", colour = "#888888", linewidth = 0.8) +
      annotate("text", x = 0.62, y = t$grand_mean,
               label = paste0("Y.. = ", round(t$grand_mean, 2)), vjust = -0.4, colour = "#555555", size = 3.5) +
      scale_fill_manual(values = pal) +
      labs(title = paste0("Verdeling van ", sc$y_var$name, " per groep"),
           x = "Groep", y = paste0(sc$y_var$name, " (", sc$y_var$unit, ")"),
           caption = "Ruit = groepsgemiddelde | Foutbalken = 95%-BI | --- = grootgemiddelde Y..") +
      theme_minimal(base_size = 13) +
      theme(legend.position = "none", plot.title = element_text(face = "bold", colour = "#3F51B5"))
  })

  output$ss_decomp_plot <- renderPlot({
    if (!all_correct() || isTRUE(rv$dirty)) return(NULL)
    t <- rv$truth
    ss_df <- data.frame(
      Bron   = factor(c("SSB (tussen groepen)","SSW (binnen groepen)"),
                      levels = c("SSB (tussen groepen)","SSW (binnen groepen)")),
      Waarde = c(t$SSB, t$SSW)
    )
    ggplot(ss_df, aes(x = Bron, y = Waarde, fill = Bron)) +
      geom_col(width = 0.5, colour = "white") +
      geom_text(aes(label = round(Waarde, 2)), vjust = -0.4, size = 4.5, fontface = "bold") +
      scale_fill_manual(values = c("#42A5F5","#FFA726")) +
      labs(title = "Decompositie van variatie: SST = SSB + SSW",
           subtitle = paste0("SST = ",round(t$SST,2)," | SSB = ",round(t$SSB,2)," | SSW = ",round(t$SSW,2)),
           y = "Kwadratensom", x = "") +
      theme_minimal(base_size = 13) +
      theme(legend.position = "none",
            plot.title    = element_text(face = "bold", colour = "#3F51B5"),
            plot.subtitle = element_text(colour = "#555555"))
  })

  output$interpretation_block <- renderUI({
    if (!all_correct() || isTRUE(rv$dirty)) return(NULL)
    t <- rv$truth; sc <- rv$sc
    pct_between <- round(100 * t$SSB / t$SST, 1)
    f_crit      <- round(qf(0.95, t$df_between, t$df_within), 2)
    p_value     <- pf(t$F_ratio, t$df_between, t$df_within, lower.tail = FALSE)
    p_label     <- format_p_value(p_value, 4)
    sig         <- t$F_ratio > f_crit
    conclusie   <- if (sig)
      paste0("<span style='color:#0E7C7B;font-weight:700;'>Conclusie: F = ", round(t$F_ratio,4),
             " > Fkrit = ", f_crit, " en p = ", p_label,
             " - Er zijn significant verschillende groepsgemiddelden (alpha = 0,05).</span>")
    else
      paste0("<span style='color:#B00020;font-weight:700;'>Conclusie: F = ", round(t$F_ratio,4),
             " <= Fkrit = ", f_crit, " en p = ", p_label,
             " - Geen significant verschil gevonden (alpha = 0,05).</span>")
    div(class="card",
        h5("Interpretatie"),
        HTML(paste0(
          "<ul>",
          "<li><b>Groepsgemiddelden:</b> ",
          paste(sapply(t$groups, function(g) paste0(g," = ",round(t$grp_means[g],2))), collapse=" | "),
          "</li>",
          "<li><b>Grootgemiddelde:</b> Y.. = ", round(t$grand_mean, 2), "</li>",
          "<li><b>Aandeel tussengroepse variatie (\\u03b7\\u00b2):</b> SSB/SST = ", pct_between, "% (\\u03b7\\u00b2 = ",round(t$eta_sq,4),")</li>",
          "<li><b>F-ratio:</b> MSB/MSW = ",round(t$MSB,4)," / ",round(t$MSW,4)," = ",round(t$F_ratio,4),"</li>",
          if (t$k == 2L) paste0("<li style='color:#1565C0;'><b>k\u00a0=\u00a02:</b> Bij twee groepen is ANOVA equivalent aan de onafhankelijke t-toets (F\u00a0=\u00a0t\u00b2).</li>") else "",
          "<li><b>Kritieke F (alpha=0,05):</b> Fkrit(",t$df_between,",",t$df_within,") = ",f_crit,"</li>",
          "<li><b>Extra interpretatie:</b> p-waarde = ", p_label,
          " (rechterstaartkans van de F-verdeling bij F(",t$df_between,",",t$df_within,"))</li>",
          "<li>", conclusie, "</li>",
          "</ul>"
        ))
    )
  })
}

shinyApp(ui, server)

