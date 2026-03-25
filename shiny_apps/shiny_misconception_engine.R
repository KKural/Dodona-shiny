# =============================================================================
# MISCONCEPTION DIAGNOSIS ENGINE  v1.0
# Shared helper for ANOVA, Correlatie & Regressie, and Partiële Correlatie apps.
# Source this file at the top of each app's server file:
#   if (file.exists("shiny_misconception_engine.R")) source("shiny_misconception_engine.R")
# =============================================================================

# ── Null-coalescing operator ────────────────────────────────────────────────
`%||%` <- function(a, b) if (!is.null(a) && length(a) > 0 && !is.na(a[1])) a else b

# ── Safe numeric parse ───────────────────────────────────────────────────────
# Handles comma→period, whitespace, returns NA_real_ on failure
me_parse <- function(val) {
  if (is.null(val) || length(val) == 0) return(NA_real_)
  if (is.numeric(val)) return(val)
  v <- trimws(as.character(val))
  v <- gsub(",", ".", v, fixed = TRUE)
  suppressWarnings(as.numeric(v))
}

# ── Adaptive tolerance ───────────────────────────────────────────────────────
me_tol <- function(ref, rel = 0.01, abs_min = 0.005) {
  if (is.na(ref) || ref == 0) return(abs_min)
  max(abs_min, rel * abs(ref))
}

# ── Does student value match a candidate? ────────────────────────────────────
me_matches <- function(v, ref, rel = 0.01, abs_min = 0.005) {
  if (is.na(v) || is.na(ref)) return(FALSE)
  abs(v - ref) <= me_tol(ref, rel, abs_min)
}

# ── Build structured diagnosis object ────────────────────────────────────────
# @param val         Student input (raw, will be parsed)
# @param true_val    Canonical correct answer
# @param patterns    Named list of lists, each with:
#                      value      – the wrong-formula result to match against
#                      code       – short identifier string
#                      why        – "Waarom fout" sentence
#                      cause      – "Waarschijnlijke oorzaak" sentence (optional)
#                      correction – "Correctie" sentence (optional)
#                      next_step  – follow-up hint (optional)
#                      inherit    – prerequisite warning (optional, shown when depends_on_ok=FALSE)
# @param depends_on_ok  Boolean or NA – are all prerequisite fields correct?
# @param field_label    Display name used in generic fallback
# @param formula_hint   Generic correction hint (markdown/HTML ok)
# @return Named list: status, code, confidence, why, cause, correction,
#                     next_step, depends_on_warning
me_diagnose <- function(val, true_val, patterns = list(),
                        depends_on_ok = NA,
                        field_label = "Dit veld",
                        formula_hint = NULL) {
  tryCatch({
    v <- me_parse(val)

    if (is.na(v)) {
      return(list(
        status = "missing", code = "not_entered", confidence = 1.0,
        why = paste0(field_label, " is nog niet ingevuld."),
        cause = NULL, correction = formula_hint, next_step = NULL,
        depends_on_warning = NULL
      ))
    }

    # Correct?
    if (!is.na(true_val) && me_matches(v, true_val)) {
      return(list(
        status = "correct", code = "correct", confidence = 1.0,
        why = NULL, cause = NULL, correction = NULL,
        next_step = NULL, depends_on_warning = NULL
      ))
    }

    # Prerequisite warning
    prereq_warning <- if (isFALSE(depends_on_ok)) {
      paste0("\u26a0 <b>Let op:</b> ", field_label,
             " bouwt voort op een eerder veld. ",
             "Als u een vorige stap heeft gecorrigeerd, herbereken dan ook dit veld.")
    } else NULL

    # Try misconception patterns
    for (p in patterns) {
      ref <- me_parse(p$value)
      if (!is.na(ref) && me_matches(v, ref)) {
        inherit_hint <- if (isFALSE(depends_on_ok) && !is.null(p$inherit)) p$inherit
                        else prereq_warning
        return(list(
          status     = "wrong",
          code       = p$code %||% "pattern_match",
          confidence = p$confidence %||% 0.9,
          why        = p$why    %||% paste0(field_label, " klopt niet."),
          cause      = p$cause  %||% NULL,
          correction = p$correction %||% formula_hint,
          next_step  = p$next_step  %||% NULL,
          depends_on_warning = inherit_hint
        ))
      }
    }

    # No pattern matched
    list(
      status = "wrong", code = "wrong_unknown", confidence = 0.5,
      why    = paste0(field_label, " is onjuist."),
      cause  = prereq_warning,
      correction = formula_hint,
      next_step = NULL,
      depends_on_warning = NULL
    )
  }, error = function(e) {
    list(
      status = "wrong", code = "engine_error", confidence = 0.0,
      why = paste0(field_label, " is onjuist."),
      cause = NULL, correction = formula_hint, next_step = NULL,
      depends_on_warning = NULL
    )
  })
}

# ── Render diagnosis as Shiny-compatible HTML ─────────────────────────────────
# Returns a shiny::div(class="feedback", ...) or NULL
me_render <- function(d) {
  if (is.null(d) || d$status %in% c("correct", "missing")) return(NULL)
  tryCatch({
    parts <- character(0)
    if (!is.null(d$why))               parts <- c(parts, paste0("<b>Waarom fout:</b> ", d$why))
    if (!is.null(d$cause))             parts <- c(parts, paste0("<b>Oorzaak:</b> ", d$cause))
    if (!is.null(d$correction))        parts <- c(parts, paste0("<b>Correctie:</b> ", d$correction))
    if (!is.null(d$depends_on_warning)) parts <- c(parts, paste0("<span style='color:#E65100;'>", d$depends_on_warning, "</span>"))
    if (!is.null(d$next_step))         parts <- c(parts, paste0("<b>Volgende stap:</b> ", d$next_step))

    if (length(parts) == 0) parts <- d$why %||% "Onjuist antwoord."
    shiny::div(class = "feedback", shiny::HTML(paste(parts, collapse = "<br/>")))
  }, error = function(e) NULL)
}

# ── Convenience wrapper: diagnose + render in one call ───────────────────────
me_diag_html <- function(val, true_val, patterns = list(),
                         depends_on_ok = NA,
                         field_label = "Dit veld",
                         formula_hint = NULL) {
  d <- me_diagnose(val, true_val, patterns, depends_on_ok, field_label, formula_hint)
  me_render(d)
}

# ── Build an HTML feedback string (for use with diag_fn inside show_field_msg)
# Returns character string with HTML tags, or NULL if no pattern matched
me_html_msg <- function(val, true_val, patterns = list(),
                        depends_on_ok = NA,
                        field_label = "Dit veld",
                        formula_hint = NULL) {
  d <- me_diagnose(val, true_val, patterns, depends_on_ok, field_label, formula_hint)
  if (d$status %in% c("correct", "missing")) return(NULL)
  parts <- character(0)
  if (!is.null(d$why))               parts <- c(parts, paste0("<b>Waarom fout:</b> ", d$why))
  if (!is.null(d$cause))             parts <- c(parts, paste0("<b>Oorzaak:</b> ", d$cause))
  if (!is.null(d$correction))        parts <- c(parts, paste0("<b>Correctie:</b> ", d$correction))
  if (!is.null(d$depends_on_warning)) parts <- c(parts, paste0(
    "<span style='color:#E65100;'>", d$depends_on_warning, "</span>"))
  if (!is.null(d$next_step))         parts <- c(parts, paste0("<b>Volgende stap:</b> ", d$next_step))
  if (length(parts) == 0) return(NULL)
  paste(parts, collapse = "<br/>")
}

# ── Test harness (run this file standalone to verify basic behavior) ──────────
if (FALSE) {
  # Example: var_X field. True value = 5.1234. Student enters 5.1234/n instead.
  n <- 10
  true_var <- 5.1234
  pop_var  <- round(true_var * (n - 1) / n, 4)  # student divided by n

  d <- me_diagnose(
    val       = as.character(pop_var),
    true_val  = true_var,
    patterns  = list(
      list(value      = pop_var,
           code       = "divided_by_n",
           why        = paste0("U deelde door n (= ", n, ") in plaats van n\u22121."),
           cause      = "Steekproefvariantie vereist de Bessel-correctie (deling door n\u22121).",
           correction = paste0("Var(X) = \u03a3(X\u2212X\u0305)\u00b2 / (n\u22121) = ", true_var))
    ),
    field_label  = "Var(X)",
    formula_hint = paste0("Var(X) = \u03a3(X\u2212X\u0305)\u00b2 / (n\u22121) = ", true_var)
  )

  stopifnot(d$status == "wrong")
  stopifnot(d$code   == "divided_by_n")
  cat("me_diagnose basic test: PASS\n")

  # Correct value
  d2 <- me_diagnose(as.character(true_var), true_var, list())
  stopifnot(d2$status == "correct")
  cat("me_diagnose correct test: PASS\n")

  message("All engine tests passed.")
}
