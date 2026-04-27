# ============================================================
# Criminology Scenarios — Manual Correlation & Regression (NL)
# - Correlation Analysis (9 steps) and Bivariate Regression (15 steps)
# - Random/seedable data, N 0–50, 2 variables
# - Modes: Correlation or Bivariate Regression
# - Students compute manually using exact steps (4 dp checks)
# - Final stats at 2 dp; gentle feedback (neutral→red/green). No answer reveal.
# - UI and variable names in Dutch; code/comments in English
# ============================================================

suppressPackageStartupMessages({
  library(shiny)
  library(ggplot2)
  library(dplyr)
  library(tidyr)
  library(rhandsontable)
})

# ============================================================
# CONSTANTS AND CONFIGURATION
# ============================================================
TOLERANCE_4DP <- 5.0 * 10^(-4)  # Relaxed tolerance for 4dp to account for floating point precision and student workflow
TOLERANCE_2DP <- 0.5 * 10^(-2)  # Standard tolerance for 2dp
MAX_SAMPLE_SIZE <- 50
MAX_VARIABLES <- 10
MAX_PREDICTORS <- 1

`%||%` <- function(a, b) if (is.null(a)) b else a

# NA-aware numeric fallback (use b when a is NA)
or_num <- function(a, b) {
  if (is.null(a)) return(b)
  if (length(a) == 0 || is.na(a)) return(b)
  a
}

# ============================================================
# HELPER FUNCTIONS - IMPROVED WITH ERROR HANDLING
# ============================================================

# Enhanced decimal checking - exact match of rounded values (no tolerance)
check_decimals <- function(user_val, true_val, target_decimals = 4, tol = NULL) {
  if (is.na(user_val) || is.na(true_val) || is.null(user_val) || is.null(true_val)) return(NA)
  # Compare rounded values directly for exact match (tolerance parameter kept for compatibility but ignored)
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

# Enhanced column vector checking
check_col_vec <- function(user_vec, true_vec, target_decimals = 4, tol = NULL) {
  if (is.null(user_vec) || is.null(true_vec)) return(rep(NA, length(true_vec)))
  mapply(function(u, t) check_decimals(u, t, target_decimals, tol), user_vec, true_vec)
}

# Safe ID generation
safe_id <- function(x) gsub("[^A-Za-z0-9_]", "_", x)

# Subscript digits for labels X₁, X₂, …
sub_num <- function(i){
  subs <- c("0"="₀","1"="₁","2"="₂","3"="₃","4"="₄","5"="₅","6"="₆","7"="₇","8"="₈","9"="₉")
  if (is.na(i) || is.null(i)) return("")
  paste0(sapply(strsplit(as.character(i), "")[[1]], function(d) subs[[d]] %||% d), collapse = "")
}
Xk <- function(k) paste0("X", sub_num(k))  # "X₁" etc

# Enhanced safe seed function
safe_seed <- function(seed_in) {
  if (is.null(seed_in) || length(seed_in) == 0) return(NULL)
  s <- suppressWarnings(as.numeric(seed_in))
  if (is.na(s)) return(NULL)
  s <- as.integer(abs(floor(s)) %% .Machine$integer.max)
  if (is.na(s) || s <= 0) return(NULL)
  s
}

# Enhanced clamping function with proper bounds checking
clamp_vec <- function(v, lo, hi) {
  if (is.null(v) || length(v) == 0) return(v)
  pmin(hi, pmax(lo, v))
}

# Treat a logical vector as OK if every value is TRUE or NA
all_true_or_na <- function(x) all(is.na(x) | as.logical(x))

# ============================================================
# INTERNATIONALIZATION - DUTCH TRANSLATIONS
# ============================================================

# i18n dictionary for Dutch UI text
tr <- function(key) {
  nl <- list(
    # General
    "entity" = "Eenheid",
    
    # Variable name mappings (English -> Dutch)
    "ProgramExposure" = "ProgrammaBlootstelling",
    "BurglaryRate" = "InbraakCijfer",
    "FootPatrolHours" = "VoetPatrouilleUren",
    "CallsForService" = "MeldingenAanPolitie",
    "DisorderIndex" = "WanordeIndex",
    "FearScore" = "AngstScore",
    "ProceduralJustice" = "ProcedureleRechtvaardigheid",
    "TrustInPolice" = "VertrouwenInPolitie",
    "Guardianship" = "Toezicht",
    "Victimization" = "Slachtofferschap",
    "Impulsivity" = "Impulsiviteit",
    "AggressiveIncidents" = "AgressieveIncidenten",
    "SupportHours" = "OndersteuningsUren",
    "RecidivismRisk" = "RecidiveRisico",
    "TrainingHours" = "TrainingsUren",
    "ClickThroughRate" = "Klikratio",
    
    # Extra variables
    "PoliceVisibility" = "PolitieZichtbaarheid",
    "CommunityMeetings" = "BuurtBijeenkomsten",
    "RepeatVictimRate" = "HerhaaldSlachtofferschapPercentage",
    "StreetLighting" = "StraatVerlichting",
    "NeighbourWatch" = "BuurtPreventie",
    "DirectedPatrols" = "Gerichte Patrouilles",
    "Arrests" = "Arrestaties",
    "ResponseTime" = "Reactietijd",
    "ProactiveStops" = "ProactieveControles",
    "PublicDisorderCalls" = "OpenbareOrdeMeldingen",
    "Incivilities" = "OnbeschoftheidIncidenten",
    "CollectiveEfficacy" = "CollectieveEffectiviteit",
    "GraffitiReports" = "GraffitiMeldingen",
    "LitterComplaints" = "ZwerfvuilKlachten",
    "Fairness" = "Eerlijkheid",
    "Respect" = "Respect",
    "Voice" = "Inspraak",
    "Satisfaction" = "Tevredenheid",
    "ComplaintRate" = "KlachtenPercentage",
    "LockQuality" = "SlotKwaliteit",
    "OutdoorLighting" = "BuitenVerlichting",
    "AlarmOwnership" = "AlarmBezit",
    "RoutineActivities" = "RoutineActiviteiten",
    "CapableGuardian" = "BekwaamToezicht",
    "SelfControl" = "Zelfbeheersing",
    "PeerDeviance" = "LeeftijdgenotenAfwijkendGedrag",
    "TeacherSupport" = "DocentenOndersteuning",
    "ParentalMonitoring" = "OuderlijkToezicht",
    "SchoolConnectedness" = "SchoolBetrokkenheid",
    "HousingSupport" = "HuisvestingsOndersteuning",
    "EmploymentWorkshops" = "WerkgelegenheidsWorkshops",
    "IDAssistance" = "IdentiteitsdocumentenHulp",
    "CaseContacts" = "DossierContacten",
    "SubstanceCounseling" = "VerslavingsBegeleiding",
    "QuizScores" = "QuizScores",
    "SimulatedReports" = "GesimuleerdeMeldingen",
    "AwarenessIndex" = "BewustzijnsIndex",
    "TimeToReport" = "MeldingsTijd",
    "PolicyKnowledge" = "BeleidKennis"
  )
  
  nl[[key]] %||% key
}

# ============================================================
# SCENARIO AND CONCEPT MANAGEMENT
# ============================================================

concepts_for <- function(sc_id) {
  concept_map <- list(
    "crime_program" = c(
      "<b>Inbraakcijfer:</b> inbraken per 1.000 inwoners.",
      "<b>Programmablootstelling:</b> % huishoudens bereikt door preventie."
    ),
    "hotspots_policing" = c(
      "<b>Hot-spot politiestrategie:</b> gerichte patrouille in gebieden met verhoogde criminaliteit.",
      "<b>Meldingen aan politie:</b> aantal verzoeken om politie-interventie."
    ),
    "fear_disorder" = c(
      "<b>Angst voor criminaliteit:</b> bezorgdheid om slachtoffer te worden.",
      "<b>Wanorde:</b> signalen zoals zwerfvuil, graffiti, overlastgevend gedrag."
    ),
    "police_public_relations" = c(
      "<b>Procedurale rechtvaardigheid:</b> respectvolle, eerlijke behandeling en inspraak.",
      "<b>Vertrouwen in politie:</b> geloof dat politie effectief en eerlijk handelt."
    ),
    "guardianship_victimization" = c(
      "<b>Toezicht (guardianship):</b> personen/middelen die plaatsen beschermen (sloten, verlichting).",
      "<b>Slachtofferschap:</b> aantal keer dat een huishouden slachtoffer werd."
    ),
    "biosocial" = c(
      "<b>Impulsiviteit:</b> snel handelen zonder planning.",
      "<b>Agressieve incidenten:</b> gevechten of bedreigingen geregistreerd door school."
    ),
    "reentry_recidivism" = c(
      "<b>Ondersteuningsuren:</b> begeleiding op gebied van werk, huisvesting en documenten.",
      "<b>Recidiverisico:</b> risicoscore (0–100) voor het opnieuw plegen van een strafbaar feit."
    ),
    "cyber_training" = c(
      "<b>Phishing-training:</b> oefenen met herkennen van valse e-mails.",
      "<b>Klikratio:</b> % gesimuleerde phishing-links aangeklikt."
    )
  )
  concept_map[[sc_id]] %||% character(0)
}

# ============================================================
# SCENARIO DEFINITIONS
# ============================================================

scenarios <- list(
  list(
    id = "crime_program",
    title = "Implementatie criminaliteitspreventieprogramma",
    vignette = "Een stad heeft een preventieprogramma geïmplementeerd in verschillende buurten. Onderzoek of een hogere blootstelling samenhangt met lagere inbraakcijfers.",
    vars = list(x = list(name="ProgrammaBlootstelling", unit="%"), y = list(name="InbraakCijfer", unit="per 1.000")),
    gen  = list(r_target = -0.45),
    extras = c("PolitieZichtbaarheid","BuurtBijeenkomsten","HerhaaldSlachtofferschapPercentage","StraatVerlichting","BuurtPreventie"),
    entity = "Buurt"
  ),
  list(
    id = "hotspots_policing",
    title = "Hot-spot politiestrategie",
    vignette = "Straten variëren in aantal voetpatrouille-uren op criminele hotspots. Beoordeel de relatie met het aantal meldingen aan de politie.",
    vars = list(x = list(name="VoetPatrouilleUren", unit="uren/week"), y = list(name="MeldingenAanPolitie", unit="per week")),
    gen  = list(r_target = -0.25),
    extras = c("GerichtePatrouilles","Arrestaties","Reactietijd","ProactieveControles","OpenbareOrdeMeldingen"),
    entity = "Straat"
  ),
  list(
    id = "fear_disorder",
    title = "Angst voor criminaliteit & buurtwanorde",
    vignette = "Ondervraagde bewoners beoordelen fysieke/sociale wanorde en angst voor criminaliteit.",
    vars = list(x = list(name="WanordeIndex", unit="0–10"), y = list(name="AngstScore", unit="0–100")),
    gen  = list(r_target = 0.55),
    extras = c("OnbeschoftheidIncidenten","CollectieveEffectiviteit","StraatVerlichting","GraffitiMeldingen","ZwerfvuilKlachten"),
    entity = "Buurt"
  ),
  list(
    id = "police_public_relations",
    title = "Politie–publiek relaties",
    vignette = "Percepties van procedurale rechtvaardigheid versus vertrouwen in politie per district.",
    vars = list(x = list(name="ProcedureleRechtvaardigheid", unit="1–7"), y = list(name="VertrouwenInPolitie", unit="1–7")),
    gen  = list(r_target = 0.70),
    extras = c("Eerlijkheid","Respect","Inspraak","Tevredenheid","KlachtenPercentage"),
    entity = "District"
  ),
  list(
    id = "guardianship_victimization",
    title = "Toezicht & slachtofferschap",
    vignette = "Toezichtscores van huishoudens versus slachtofferschapincidenten.",
    vars = list(x = list(name="Toezicht", unit="0–10"), y = list(name="Slachtofferschap", unit="aantal")),
    gen  = list(r_target = -0.40),
    extras = c("SlotKwaliteit","BuitenVerlichting","AlarmBezit","RoutineActiviteiten","BekwaamToezicht"),
    entity = "Huishouden"
  ),
  list(
    id = "biosocial",
    title = "Biosociaal risico",
    vignette = "Impulsiviteit versus agressieve incidenten onder jongeren.",
    vars = list(x = list(name="Impulsiviteit", unit="z-score"), y = list(name="AgressieveIncidenten", unit="schoolmeldingen/trimester")),
    gen  = list(r_target = 0.45),
    extras = c("Zelfbeheersing","LeeftijdgenotenAfwijkendGedrag","DocentenOndersteuning","OuderlijkToezicht","SchoolBetrokkenheid"),
    entity = "Student"
  ),
  list(
    id = "reentry_recidivism",
    title = "Re-integratiebegeleiding & recidiverisico",
    vignette = "Begeleiding na vrijlating (in uren per maand) versus gevalideerde recidiverisicoScore.",
    vars = list(x = list(name="OndersteuningsUren", unit="per maand"), y = list(name="RecidiveRisico", unit="0–100")),
    gen  = list(r_target = -0.35),
    extras = c("HuisvestingsOndersteuning","WerkgelegenheidsWorkshops","IdentiteitsdocumentenHulp","DossierContacten","VerslavingsBegeleiding"),
    entity = "Deelnemer"
  ),
  list(
    id = "cyber_training",
    title = "Cybercrime-bewustmakingstraining",
    vignette = "Phishing-trainingsuren versus gesimuleerde klikratio.",
    vars = list(x = list(name="TrainingsUren", unit="uren"), y = list(name="Klikratio", unit="%")),
    gen  = list(r_target = -0.55),
    extras = c("QuizScores","GesimuleerdeMeldingen","BewustzijnsIndex","MeldingsTijd","BeleidKennis"),
    entity = "Medewerker"
  )
)

scenario_choices <- setNames(
  vapply(scenarios, `[[`, character(1), "id"),
  vapply(scenarios, `[[`, character(1), "title")
)

get_sc <- function(id){ 
  for (s in scenarios) if (s$id == id) return(s)
  NULL 
}

# Enhanced random name generation with Dutch names
rnd_name_list <- function(k){
  pool <- c("Uren","Praktijk","Snelheid","Hoogte","Gewicht","Leeftijd","Studie","Score","Inkomen",
            "Afstand","Tijd","Risico","Vertrouwen","Betrokkenheid","Tevredenheid","Inspanning","Fout",
            "Klikken","Latentie","Kwaliteit","InbraakCijfer","MeldingenAanPolitie","AngstScore","WanordeIndex",
            "ProcedureleRechtvaardigheid","PolitieVertrouwen","Toezicht","Slachtofferschap","Impulsiviteit","Agressie",
            "OndersteuningsUren","RecidiveRisico","TrainingsUren","Klikratio","Veiligheid","Beveiliging","Preventie")
  if (k > length(pool)) {
    # Generate additional names if needed
    extra_names <- paste0("Var", seq(length(pool) + 1, k))
    pool <- c(pool, extra_names)
  }
  sample(pool, k, replace = FALSE)
}

# ============================================================
# DATA GENERATION - FIXED AND ENHANCED
# ============================================================

# Enhanced random multivariate data generation
make_random_multi <- function(n = 15, seed = NULL, k = 2, names = NULL){
  # Input validation
  if (n < 0) n <- 0
  if (k < 2) k <- 2
  if (k > MAX_VARIABLES) k <- MAX_VARIABLES
  
  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)
  
  k <- max(2, min(MAX_VARIABLES, k))
  
  if (n <= 0) {
    df <- tibble::tibble(Entity = character())
    for (j in 1:k) df[[paste0("Var", j)]] <- numeric()
    return(df)
  }
  
  # Generate correlated data
  Z <- matrix(rnorm(n * k), n, k)
  M <- (matrix(rnorm(k*k), k, k) + t(matrix(rnorm(k*k), k, k)))/2
  XM <- Z %*% M
  if (n >= 2) {
    X <- scale(XM)[, 1:k, drop=FALSE]
  } else {
    X <- XM[, 1:k, drop=FALSE]
  }
  
  # Scale to friendly ranges
  centers <- runif(k, min = 5, max = 85)
  scales  <- runif(k, min = 4, max = 16)
  for (j in 1:k) {
    X[,j] <- round(centers[j] + scales[j]*X[,j], 4)
  }
  
  # Create variable names
  vnames <- names %||% rnd_name_list(k)
  vnames <- make.unique(vnames)[1:k]  # Ensure unique names
  
  # Create initial dataframe
  df <- as.data.frame(X)
  names(df) <- vnames
  
  # Apply clamping based on variable name patterns - FIXED LOGIC with word boundaries
  for (nm in names(df)) {
    if (grepl("\\b(Percent|Percentage|Score|Risico|Ratio|Cijfer)\\b|%", nm, ignore.case = TRUE)) {
      df[[nm]] <- clamp_vec(df[[nm]], 0, 100)
    } else if (grepl("\\b(Aantal|Incidenten|Meldingen)\\b", nm, ignore.case = TRUE)) {
      df[[nm]] <- clamp_vec(round(df[[nm]]), 0, Inf)
    }
  }
  
  # Add entity column
  tibble::tibble(Eenheid = paste0("Eenheid ", seq_len(n))) |>
    dplyr::bind_cols(tibble::as_tibble(df))
}

# FIXED scenario-driven data generation
make_scenario_data <- function(sc, n = 20, seed = NULL, k_total = 2){
  # Input validation
  if (is.null(sc)) return(NULL)
  if (n < 0) n <- 0
  if (k_total < 2) k_total <- 2
  if (k_total > MAX_VARIABLES) k_total <- MAX_VARIABLES
  
  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)
  
  if (n <= 0) {
    df <- tibble::tibble(Eenheid = character())
    for (j in 1:k_total) df[[paste0("Var", j)]] <- numeric()
    return(df)
  }
  
  xname <- sc$vars$x$name
  yname <- sc$vars$y$name
  
  # Generate latent standardized variables
  Xz <- rnorm(n)
  eps <- rnorm(n)
  r <- sc$gen$r_target %||% 0
  Yz <- r*Xz + sqrt(max(0, 1 - r^2))*eps
  
  # Scale to friendly units with better bounds checking
  scale_by_unit <- function(z, center, scale) {
    if (length(z) == 0) return(numeric(0))
    if (length(z) < 2 || is.na(stats::sd(z)) || stats::sd(z) == 0) {
      zz <- z
    } else {
      zz <- as.numeric(scale(z))
    }
    round(center + scale*zz, 4)
  }
  
  # Define centers/scales by unit with safer defaults
  x_center <- switch(sc$vars$x$unit %||% "default", 
                     "%"=50, "0–10"=5, "1–7"=4, "uren"=20, "hours"=20,
                     "per maand"=15, "per month"=15, "z-score"=0, 30)
  x_scale  <- switch(sc$vars$x$unit %||% "default", 
                     "%"=20, "0–10"=2.5, "1–7"=1.2, "uren"=8, "hours"=8,
                     "per maand"=6, "per month"=6, "z-score"=1, 8)
  y_center <- switch(sc$vars$y$unit %||% "default", 
                     "per 1.000"=20, "per 1,000"=20, "per week"=60, "0–100"=60, 
                     "1–7"=4, "%"=30, "aantal"=6, "count"=6, 60)
  y_scale  <- switch(sc$vars$y$unit %||% "default", 
                     "per 1.000"=8, "per 1,000"=8, "per week"=14, "0–100"=15, 
                     "1–7"=1.2, "%"=12, "aantal"=3, "count"=3, 12)
  
  # Add dataset-level variability
  x_center <- x_center + runif(1, -8, 8)
  x_scale  <- x_scale  * runif(1, 0.8, 1.4)
  y_center <- y_center + runif(1, -8, 8)
  y_scale  <- y_scale  * runif(1, 0.8, 1.4)
  
  # Generate main variables
  Xv <- scale_by_unit(Xz, x_center, x_scale)
  Yv <- scale_by_unit(Yz, y_center, y_scale)
  
  # Create initial dataframe with just Eenheid and first X variable
  df <- tibble::tibble(
    Eenheid = paste(sc$entity %||% "Eenheid", seq_len(n)),
    !!xname := Xv
  )
  
  # Add Y variable at the end
  df[[yname]] <- Yv
  
  # Apply clamping to ALL variables - FIXED LOGIC
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

# ============================================================
# STATISTICAL CALCULATION FUNCTIONS - ENHANCED
# ============================================================

# Enhanced truth calculation with proper 4dp precision
calc_truth_basic <- function(vec) {
  if (is.null(vec) || length(vec) == 0) {
    return(list(mean = NA, dev = rep(NA, 0), dev2 = rep(NA, 0), 
                sum_dev2 = NA, var = NA, sd = NA))
  }
  
  # Use full precision - no rounding to allow proper tolerance comparison
  v <- suppressWarnings(as.numeric(vec))
  v <- v[!is.na(v)]
  n <- length(v)
  if (n < 2) {
    return(list(mean = if(n == 1) v[1] else NA_real_, 
                dev = if(n == 1) 0 else rep(NA, 0), 
                dev2 = if(n == 1) 0 else rep(NA, 0),
                sum_dev2 = if(n == 1) 0 else NA_real_, 
                var = if(n == 1) 0 else NA_real_,
                sd = NA_real_))
  }
  
  mean_v <- mean(v)
  d <- v - mean_v
  d2 <- d^2
  sum_d2 <- sum(d2)
  var_v <- sum_d2 / (n - 1)  # sample variance
  list(
    mean = mean_v,
    dev = d,
    dev2 = d2,
    sum_dev2 = sum_d2,
    var = var_v,
    sd = sqrt(var_v)
  )
}

# ============================================================
# UI HELPER FUNCTIONS
# ============================================================

steps_nl_html <- function() HTML(paste0(
  "<div class='accent'><b>Stappen voor handmatige regressieanalyse (NL)</b><ol style='margin:6px 0 0 18px;'>",
  "<li>Bereken het rekenkundig gemiddelde van X en Y.</li>",
  "<li>Bereken voor elke eenheid de afwijking van het gemiddelde voor X en voor Y.</li>",
  "<li>Kwadrateer deze afwijkingen (bouwt variatie in X en Y op en de basis voor het kruisproduct).</li>",
  "<li>Tel de gekwadrateerde afwijkingen op voor X en voor Y.</li>",
  "<li>Bereken Var(X) en Var(Y) door deze sommen te delen door (n − 1).</li>",
  "<li>Neem de vierkantswortels om SD(X) en SD(Y) te verkrijgen.</li>",
  "<li>Bereken de kruisproductsom Σ(X−X̄)(Y−Ȳ) (covariatie).</li>",
  "<li>Deel door (n − 1) om Cov(X, Y) te verkrijgen.</li>",
  "<li>Bereken SD(X) × SD(Y).</li>",
  "<li>Correlatie r = Cov(X,Y) / (SD(X)×SD(Y)).</li>",
  "<li>Regressiecoëfficiënt b = Cov(X,Y) / Var(X).</li>",
  "<li>Intercept a = Ȳ − b·X̄.</li>",
  "<li>Voorspelling Ŷ = a + b·X (bijv., kies een willekeurige X).</li>",
  "<li>Determinatiecoëfficiënt R² = r² (in het bivariate geval).</li>",
  "<li>Vervreemdingscoëfficiënt = 1 − R² (aandeel van Y niet verklaard door X).</li>",
  "</ol></div>"
))

# ============================================================
# USER INTERFACE
# ============================================================

ui <- fluidPage(
  tags$head(tags$title("Correlatie & Regressie - Oefeningen")),
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
    input.invalid{border:2px solid #D50000 !important; background:#ffebee !important; box-shadow:0 0 0 2px rgba(213,0,0,0.10) inset;}
    input.valid{border:2px solid #00C853 !important; background:#e8f5e9 !important; box-shadow:0 0 0 2px rgba(0,200,83,0.10) inset;}
    .grid-compact{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
    .grid-compact-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
    .grid-compact-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
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
  
  titlePanel(div(class="title","Oefeningen voor Correlatie & Regressie")),
  
  sidebarLayout(
    sidebarPanel(width = 4,
                 # 1) How it works - now dynamic
                 div(class="card",
                     h4("Hoe deze webpagina werkt"),
                     uiOutput("how_it_works_display")
                 ),
                 
                 br(),
                 # 2) Scenario & dataset
                 div(class="card",
                     h4("Scenario & dataset"),
                     div(class="muted", style="margin-bottom: 10px;", 
                         HTML("<b>Twee manieren om data te verkrijgen:</b><br/>
                         <b>1. Selecteer een specifiek scenario</b> uit de dropdown en klik 'Genereer dataset'<br/>
                         <b>2. Verkrijg een willekeurig scenario</b> door te klikken op 'Genereer willekeurig dataset' (kiest een scenario uit onze criminologie-collectie)")),
                     
                     radioButtons("mode","Analysetype", choices=c("Correlatie"="Correlation", "Bivariate Regressie"="Bivariate"), inline=TRUE),
                     
                     selectInput("scenario", "Scenario",
                                 choices = scenario_choices),
                     helpText("Kies een criminologische context (bijv., criminaliteitspreventie, inbraakcijfers). Elk scenario heeft realistische variabele relaties."),
                     
                     numericInput("n", paste0("Steekproefgrootte N (0–", MAX_SAMPLE_SIZE, ")"), 
                                  value = 10, min = 0, max = MAX_SAMPLE_SIZE, step = 1),
                     helpText("Aantal waarnemingen/cases in uw dataset (bijv., 10 buurten, 20 studenten). Grotere steekproeven = meer berekeningen."),
                     
                     textInput("seed", "Datasetcode (seed, optioneel)", value = ""),
                     helpText(HTML("<b>Optioneel nummer voor reproduceerbaarheid.</b> Zelfde code = elke keer dezelfde dataset. Typ een willekeurig nummer; bij dezelfde code krijgt u steeds dezelfde dataset.")),
                     
                     fluidRow(
                       column(5, actionButton("gen", "Genereer dataset", class="btn btn-success btn-wide")),
                       column(5, actionButton("new_same", "Genereer willekeurig dataset", class="btn btn-default btn-wide"))
                     ),
                     helpText("'Genereer dataset' gebruikt uw geselecteerde scenario hierboven. 'Genereer willekeurig dataset' kiest een willekeurig scenario - ideaal voor gevarieerde oefening!"),
                     
                     uiOutput("seed_echo")
                 ),
                 
                 br(),
                 # 4) Steps card - now dynamic based on mode
                 div(class="card",
                     h4("Stappen"),
                     uiOutput("steps_display")
                 )
    ),
    
    mainPanel(
      div(class="card",
          h4("Deel I — Dataset"),
          div(class="muted", "Bekijk uw dataset voordat u de analyse begint."),
          div(style="display: flex; justify-content: center;",
              rHandsontableOutput("data_view")
          )
      ),
      br(),
      
      # Task & vignette section (separate card)
      div(class="card",
          h4("Taak & vignette"),
          uiOutput("vignette_block")
      ),
      br(),
      
      # Part II — Step 1: Means only
      div(class="card",
          h4("Deel II — Stap 1: Rekenkundige Gemiddelden (4 decimalen)"),
          div(class="muted", "Bereken het rekenkundig gemiddelde van X en Y."),
          uiOutput("labels_vars"),
          uiOutput("means_only_ui"),
          uiOutput("step1_feedback")
      ),
      br(),
      
      # Part III — Steps 2-4: Deviations, Squares, and Sums
      div(class="card",
          h4("Deel III — Stappen 2-4: Afwijkingen, Kwadraten & Sommen (4 decimalen)"),
          div(class="muted", "Bereken afwijkingen van gemiddelden, kwadrateer deze, en bereken kruisproducten. Tel vervolgens de gekwadrateerde afwijkingen op."),
          helpText("Vul elke kolom exact in; kolomkoppen komen overeen met de formulenotatie uit de les."),
          
          # Single table for Bivariate/Correlation
          div(style="display: flex; justify-content: center;",
              rHandsontableOutput("calc_table")
          ),
          
          uiOutput("step3_feedback"),
          br(),
          uiOutput("feedback_block"),
          uiOutput("totals_ui"),
          uiOutput("step4_feedback")
      ),
      br(),
      
      # Part IV — Steps 5-6: Variances and Standard Deviations
      div(class="card",
          h4("Deel IV — Stappen 5-6: Varianties & Standaardafwijkingen (4 decimalen)"),
          div(class="muted", "Bereken Var(X) en Var(Y) door sommen te delen door (n-1), neem vervolgens vierkantswortels voor SD(X) en SD(Y)."),
          uiOutput("variance_sd_ui"),
          uiOutput("step56_feedback")
      ),
      br(),
      
      # Part V — Steps 7-9: Covariation Preparation
      div(class="card",
          h4("Deel V — Stappen 7-9: Covariatie & Voorbereiding (4 decimalen)"),
          div(class="muted", "Bereken covariantie uit kruisproductsom en bereken SD(X) × SD(Y) voor correlatievoorbereiding."),
          uiOutput("covariation_ui"),
          uiOutput("step79_feedback")
      ),
      br(),
      
      # Part VI — Step 10 in Correlation mode, Steps 10-12 in Bivariate mode
      div(class="card",
          uiOutput("final_results_heading"),
          uiOutput("final_results_intro"),
          uiOutput("final_regression_ui"),
          uiOutput("step1012_feedback")
      ),
      br(),
      
      # Part VII — Step 13: Prediction Table (hidden in Correlation mode)
      conditionalPanel(
        condition = "input.mode != 'Correlation'",
        div(class="card",
            h4("Deel VII — Stap 13: Voorspellingen met de Regressievergelijking (4 decimalen)"),
            div(class="muted", "Pas de regressievergelijking toe om Y-waarden te voorspellen voor gegeven X-waarden."),
            helpText("Voer voorspelde Y-waarden in met Ŷ = a + b·X waarbij a het intercept is en b de regressiecoëfficiënt."),
            div(style="display: flex; justify-content: center;",
                rHandsontableOutput("prediction_table")
            ),
            uiOutput("step13_feedback")
        ),
        br()
      ),
      
      # Part VIII — Steps 14-17 & Summary (hidden in Correlation mode)
      conditionalPanel(
        condition = "input.mode != 'Correlation'",
        div(class="card",
            h4("Deel VIII — Stappen 14-17: Model Fit & F-toets (4 decimalen)"),
            div(class="muted", "Bereken R², vervreemdingscoëfficiënt, F en model p-waarde om de analyse te voltooien."),
            helpText("Formules: F = (R²/1)/((1−R²)/(n−2)) en p = F.DIST.RT(F;1;n−2)."),
            uiOutput("coefficients_ui"),
            uiOutput("step1415_feedback")
        ),
        br()
      ),
      
      # Success message when all steps complete
      uiOutput("final_success_message"),
      
      # Visualizations & Summary (Part VI for Correlation, Part IX for Regression modes)
      div(class="card",
          uiOutput("viz_heading"),
          div(id="viz_block", class="disabled",
              uiOutput("plot_block"),
              uiOutput("stats_block"),
              uiOutput("interpret_block"),
              uiOutput("prediction_block")
          )
      )
    )
  )
)

# ============================================================
# SERVER LOGIC - ENHANCED AND COMPLETED
# ============================================================

server <- function(input, output, session){
  # Reactive values
  current <- reactiveVal(tibble::tibble())
  yvar <- reactiveVal(NULL)
  xvars <- reactiveVal(character(0))
  user_calc_tbl <- reactiveVal(NULL)
  prediction_tbl <- reactiveVal(NULL)
  unlocked <- reactiveVal(FALSE)
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
  
  # ============================================================
  # DYNAMIC UI OUTPUTS BASED ON ANALYSIS MODE
  # ============================================================
  
  # Dynamic steps display based on mode
  output$steps_display <- renderUI({
    mode <- input$mode
    if (is.null(mode)) mode <- "Bivariate"
    
    if (mode == "Correlation") {
      HTML("<div class='accent'><b>Stappen voor correlatieanalyse </b><ol style='margin:6px 0 0 18px;'>
        <li>Bereken het rekenkundig gemiddelde van X en Y.</li>
        <li>Bereken de afwijking van elke eenheid ten opzichte van het gemiddelde voor X en voor Y.</li>
        <li>Kwadrateer deze afwijkingen (bouwt variatie in X en Y op).</li>
        <li>Tel de gekwadrateerde afwijkingen op voor X en voor Y.</li>
        <li>Bereken Var(X) en Var(Y) door deze sommen te delen door (n − 1).</li>
        <li>Neem de vierkantswortel om SD(X) en SD(Y) te krijgen.</li>
        <li>Bereken de kruisproductsom Σ(X−X̄)(Y−Ȳ) (covariatie).</li>
        <li>Deel door (n − 1) om Cov(X, Y) te krijgen.</li>
        <li>Bereken SD(X) × SD(Y).</li>
        <li><b>Correlatie r = Cov(X,Y) / (SD(X)×SD(Y))</b> — Dit meet de sterkte en richting van de lineaire relatie.</li>
        </ol>
        <div class='muted' style='margin-top:6px;'><b>Correlatiemodus</b> eindigt hier. Schakel over naar <b>Bivariate Regressie</b> om voorspellingen en R² te leren.</div>
        </div>")
    } else {
      HTML("<div class='accent'><b>Stappen voor bivariate regressieanalyse </b><ol style='margin:6px 0 0 18px;'>
        <li>Bereken het rekenkundig gemiddelde van X en Y.</li>
        <li>Bereken de afwijking van elke eenheid ten opzichte van het gemiddelde voor X en voor Y.</li>
        <li>Kwadrateer deze afwijkingen (bouwt variatie in X en Y en de kruisproductbasis op).</li>
        <li>Tel de gekwadrateerde afwijkingen op voor X en voor Y.</li>
        <li>Bereken Var(X) en Var(Y) door deze sommen te delen door (n − 1).</li>
        <li>Neem de vierkantswortel om SD(X) en SD(Y) te krijgen.</li>
        <li>Bereken de kruisproductsom Σ(X−X̄)(Y−Ȳ) (covariatie).</li>
        <li>Deel door (n − 1) om Cov(X, Y) te krijgen.</li>
        <li>Bereken SD(X) × SD(Y).</li>
        <li>Correlatie r = Cov(X,Y) / (SD(X)×SD(Y)).</li>
        <li>Ongestandaardiseerde helling b = Cov(X,Y) / Var(X).</li>
        <li>Intercept a = Ȳ − b·X̄.</li>
        <li>Voorspelde waarde Ŷ = a + b·X (bijv., kies een willekeurige X).</li>
        <li>Determinatiecoëfficiënt R² = r² (bivariate geval).</li>
        <li>Aliënatiecoëfficiënt = 1 − R² (aandeel van Y niet verklaard door X).</li>
        </ol></div>")
    }
  })
  
  # Dynamic visualization heading based on mode
  output$viz_heading <- renderUI({
    mode <- input$mode
    if (is.null(mode)) mode <- "Bivariate"
    
    if (mode == "Correlation") {
      h4("Deel VI — Visualisaties & Samenvatting (beschikbaar zodra alle antwoorden correct zijn)")
    } else {
      h4("Deel IX — Visualisaties & Samenvatting (beschikbaar zodra alle antwoorden correct zijn)")
    }
  })
  
  output$final_results_heading <- renderUI({
    mode <- input$mode
    if (is.null(mode)) mode <- "Bivariate"

    if (mode == "Correlation") {
      h4("Deel VI - Stap 10: Correlatiecoefficient (4 decimalen)")
    } else {
      h4("Deel VI - Stappen 10-12: Correlatie & Regressiecoefficienten (4 decimalen)")
    }
  })

  output$final_results_intro <- renderUI({
    mode <- input$mode
    if (is.null(mode)) mode <- "Bivariate"

    if (mode == "Correlation") {
      div(class = "muted", "Bereken de correlatiecoefficient r uit covariantie en het SD-product.")
    } else {
      div(class = "muted", "Voltooi de regressieanalyse met correlatie, regressiecoefficient en intercept.")
    }
  })
  
  # Dynamic "How this webpage works" section based on mode
  output$how_it_works_display <- renderUI({
    mode <- input$mode
    if (is.null(mode)) mode <- "Bivariate"
    
    if (mode == "Correlation") {
      HTML("<ul style='margin:6px 0 0 0px; padding-left: 20px;'>
        <li>Oefen <b>correlatieanalyse</b> met criminologische datasets.</li>
        <li>Voltooi <b>9 stappen verdeeld over Delen I-V</b> om de correlatiecoëfficiënt te berekenen (gebruik 4 decimalen).</li>
        <li>Bestudeer de dataset (alleen-lezen). Voltooi vervolgens elke stap:
          <ul style='margin-top:4px;'>
            <li><b>Deel I:</b> Bekijk dataset</li>
            <li><b>Deel II:</b> Stap 1 (Rekenkundige gemiddelden)</li>
            <li><b>Deel III:</b> Stappen 2-4 (Afwijkingen en sommen)</li>
            <li><b>Deel IV:</b> Stappen 5-6 (Standaardafwijkingen)</li>
            <li><b>Deel V:</b> Stappen 7-9 (Bereken correlatiecoëfficiënt r)</li>
          </ul>
        </li>
        <li>Cellen worden groen wanneer correct, rood wanneer fout.</li>
        <li>Wanneer alle stappen voltooid zijn, verschijnt een <b>spreidingsdiagram met regressielijn</b> in Deel VI.</li>
        <li><b>Wilt u voorspellingen doen?</b> Schakel over naar <i>Bivariate Regressie</i> voor de volledige 17-stappenanalyse!</li>
      </ul>")
    } else {
      HTML("<ul style='margin:6px 0 0 0px; padding-left: 20px;'>
        <li>Oefen <b>bivariate regressieanalyse</b> met criminologische datasets.</li>
        <li>Voltooi <b>17 stappen verdeeld over Delen I-VIII</b> voor volledige correlatie en regressie (gebruik 4 decimalen).</li>
        <li>Bestudeer de dataset (alleen-lezen). Voltooi vervolgens elke stap:
          <ul style='margin-top:4px;'>
            <li><b>Deel I:</b> Bekijk dataset</li>
            <li><b>Deel II:</b> Stap 1 (Rekenkundige gemiddelden)</li>
            <li><b>Deel III:</b> Stappen 2-4 (Afwijkingen en sommen)</li>
            <li><b>Deel IV:</b> Stappen 5-6 (Standaardafwijkingen)</li>
            <li><b>Deel V:</b> Stappen 7-9 (Correlatiecoëfficiënt)</li>
            <li><b>Deel VI:</b> Stappen 10-12 (Regressievergelijking: regressiecoëfficiënt en intercept)</li>
            <li><b>Deel VII:</b> Stap 13 (Voorspellingen met Ŷ = a + b·X)</li>
            <li><b>Deel VIII:</b> Stappen 14-17 (R², vervreemdingscoëfficiënt, F en model p-waarde)</li>
          </ul>
        </li>
        <li>Cellen worden groen wanneer correct, rood wanneer fout.</li>
        <li><b>F-toets vereist:</b> bereken F en model p-waarde op basis van R² met df₁=1 en df₂=n−2.</li>
        <li>Wanneer alle stappen voltooid zijn, verschijnen <b>grafieken en interpretatie</b> in Deel IX.</li>
      </ul>")
    }
  })
  
  # ============================================================
  # VALIDATION FUNCTIONS FOR STEP-SPECIFIC FEEDBACK
  # ============================================================
  
  # Sanitize user numbers (kills stray spaces, "-0", and FP dust)
  as_num_sanitized <- function(x) {
    if (is.null(x)) return(x)
    x <- gsub("\\s+", "", as.character(x))
    v <- suppressWarnings(as.numeric(x))
    v[abs(v) < max(TOLERANCE_4DP, 5e-8)] <- 0
    v
  }
  
  # Helper function to check if user has attempted to enter a value (not empty/NA)
  has_attempted <- function(val) {
    if (is.null(val)) return(FALSE)
    if (identical(val, "")) return(FALSE)
    val_char <- trimws(as.character(val))
    if (!nzchar(val_char)) return(FALSE)
    if (identical(tolower(val_char), "na")) return(FALSE)
    val_num <- suppressWarnings(as.numeric(val))
    !is.na(val_num)
  }
  
  # Helper function for safer checking - only validate if user attempted input
  safe_check <- function(user_val, true_val, decimals = 4) {
    user_num <- suppressWarnings(as.numeric(user_val))
    if (!has_attempted(user_val)) return(NA)
    check_decimals(user_num, true_val, decimals)
  }

  raw_numeric_input <- function(id) {
    raw_val <- input[[paste0(id, "__raw")]]
    if (!is.null(raw_val) && nzchar(trimws(as.character(raw_val)))) return(raw_val)
    input[[id]]
  }
  
  combine_ok <- function(okv) all(isTRUE(okv) | is.na(okv))
  
  validate_step2 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    all_attempted <- TRUE
    all_correct <- TRUE
    
    if (length(xs) < 1) return(list(ok = FALSE, message = "Variabeleselectie niet klaar."))
    xcol <- xs[[1]]
    if (!(xcol %in% names(df)) || !(y %in% names(df))) {
      return(list(ok = FALSE, message = "Geselecteerde variabelen niet gevonden in dataset."))
    }
    
    X_truth <- calc_truth_basic(round(df[[xcol]], 2))
    Y_truth <- calc_truth_basic(round(df[[y]], 2))
    
    all_attempted <- has_attempted(input$mean_X) && has_attempted(input$sd_X) && 
      has_attempted(input$mean_Y) && has_attempted(input$sd_Y)
    
    if (has_attempted(input$mean_X)) {
      all_correct <- all_correct && isTRUE(safe_check(input$mean_X, X_truth$mean, 4))
    }
    if (has_attempted(input$sd_X)) {
      all_correct <- all_correct && isTRUE(safe_check(input$sd_X, X_truth$sd, 4))
    }
    if (has_attempted(input$mean_Y)) {
      all_correct <- all_correct && isTRUE(safe_check(input$mean_Y, Y_truth$mean, 4))
    }
    if (has_attempted(input$sd_Y)) {
      all_correct <- all_correct && isTRUE(safe_check(input$sd_Y, Y_truth$sd, 4))
    }
    
    if (!all_attempted) return(list(ok = FALSE, attempted = FALSE, message = NULL))
    if (!all_correct) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stap 2 tabel: alle Gemiddelden/SD's moeten overeenkomen op 4 decimalen."))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  validate_step3 <- function() {
    df  <- current(); y <- yvar(); xs <- xvars()
    tbl <- user_calc_tbl()
    if (is.null(tbl)) return(list(ok = FALSE, message = NULL))
    
    meanY  <- suppressWarnings(as.numeric(input$mean_Y))
    meanX1 <- suppressWarnings(as.numeric(or_num(input$mean_X, input$mean_X1)))
    if (is.null(meanY)  || is.na(meanY)  ||
        is.null(meanX1) || is.na(meanX1)) {
      return(list(ok = TRUE, message = NULL))
    }
    
    Y4  <- round(as.numeric(tbl[["Y"]]),  4)
    X14 <- round(as.numeric(tbl[["X1"]]), 4)
    dY4  <- round(Y4  - round(meanY,  4), 4)
    dX14 <- round(X14 - round(meanX1, 4), 4)
    
    exp_dY    <- round(dY4,        4)
    exp_dY2   <- round(dY4^2,      4)
    exp_dX1   <- round(dX14,       4)
    exp_dX12  <- round(dX14^2,     4)
    exp_dX1dY <- round(dX14*dY4,   4)
    
    tried_any  <- FALSE
    wrong_cols <- character(0)

    if ("dY" %in% names(tbl)) {
      u <- suppressWarnings(as.numeric(tbl$dY))
      has_data  <- any(!is.na(u))
      tried_any <- tried_any || has_data
      if (has_data && !all_true_or_na(check_col_vec(round(u,4), exp_dY, 4)))
        wrong_cols <- c(wrong_cols, "y \u2212 \u0233")
    }
    if ("dY2" %in% names(tbl)) {
      u <- suppressWarnings(as.numeric(tbl$dY2))
      has_data  <- any(!is.na(u))
      tried_any <- tried_any || has_data
      if (has_data && !all_true_or_na(check_col_vec(round(u,4), exp_dY2, 4)))
        wrong_cols <- c(wrong_cols, "(y \u2212 \u0233)\u00b2")
    }
    if ("dX1" %in% names(tbl)) {
      u <- suppressWarnings(as.numeric(tbl$dX1))
      has_data  <- any(!is.na(u))
      tried_any <- tried_any || has_data
      if (has_data && !all_true_or_na(check_col_vec(round(u,4), exp_dX1, 4)))
        wrong_cols <- c(wrong_cols, "x \u2212 x\u0304")
    }
    if ("dX12" %in% names(tbl)) {
      u <- suppressWarnings(as.numeric(tbl$dX12))
      has_data  <- any(!is.na(u))
      tried_any <- tried_any || has_data
      if (has_data && !all_true_or_na(check_col_vec(round(u,4), exp_dX12, 4)))
        wrong_cols <- c(wrong_cols, "(x \u2212 x\u0304)\u00b2")
    }
    if ("dX1dY" %in% names(tbl)) {
      u <- suppressWarnings(as.numeric(tbl$dX1dY))
      has_data  <- any(!is.na(u))
      tried_any <- tried_any || has_data
      if (has_data && !all_true_or_na(check_col_vec(round(u,4), exp_dX1dY, 4)))
        wrong_cols <- c(wrong_cols, "(x \u2212 x\u0304)(y \u2212 \u0233)")
    }

    if (!tried_any) return(list(ok = FALSE, message = NULL))
    if (length(wrong_cols) > 0)
      return(list(ok = FALSE, message = paste0(
        "Controleer kolom(men): <b>",
        paste(wrong_cols, collapse = ", "),
        "</b>. Reken na op 4 decimalen."
      )))
    list(ok = TRUE, message = NULL)
  }
  
  validate_step4 <- function(step4_started = TRUE) {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    if (!step4_started) {
      return(list(ok = TRUE, message = NULL))
    }
    
    if (length(xs) < 1) return(list(ok = FALSE, message = "Variabeleselectie niet klaar."))
    xcol <- xs[[1]]
    if (!(xcol %in% names(df)) || !(y %in% names(df))) {
      return(list(ok = FALSE, message = "Variabelen niet gevonden."))
    }
    
    Y2 <- round(df[[y]], 2)
    X12 <- round(df[[xcol]], 2)
    mY <- mean(Y2, na.rm = TRUE)
    mX <- mean(X12, na.rm = TRUE)
    dY <- round(Y2 - mY, 4)
    dX <- round(X12 - mX, 4)
    
    exp_Y2 <- round(sum(dY^2), 4)
    exp_X12 <- round(sum(dX^2), 4)
    
    user_Y2 <- suppressWarnings(as.numeric(input$tot_Y2))
    user_X12 <- suppressWarnings(as.numeric(input$tot_X1_2))
    
    errors <- c()
    if (!isTRUE(check_decimals(user_Y2, exp_Y2, 4))) {
      errors <- c(errors, "Σ(ΔY)² berekeningsfout")
    }
    if (!isTRUE(check_decimals(user_X12, exp_X12, 4))) {
      errors <- c(errors, "Σ(ΔX)² berekeningsfout")
    }
    
    if (length(errors) > 0) {
      return(list(ok = FALSE, message = paste("Deel IV: Controleer uw totaalberekeningen (gebruik 4 decimalen):", paste(errors, collapse = "; "))))
    }
    
    return(list(ok = TRUE, message = NULL))
  }
  
  # Validate Step 1: Means only
  validate_step1 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    all_attempted <- TRUE
    all_correct <- TRUE
    
    if (length(xs) < 1) return(list(ok = FALSE, message = "Variabeleselectie niet klaar."))
    xcol <- xs[[1]]
    if (!(xcol %in% names(df)) || !(y %in% names(df))) {
      return(list(ok = FALSE, message = "Geselecteerde variabelen niet gevonden in dataset."))
    }
    
    X_truth <- calc_truth_basic(round(df[[xcol]], 2))
    Y_truth <- calc_truth_basic(round(df[[y]], 2))
    
    all_attempted <- has_attempted(input$mean_X) && has_attempted(input$mean_Y)
    
    if (has_attempted(input$mean_X)) {
      x_check <- safe_check(input$mean_X, X_truth$mean, 4)
      x_ok <- isTRUE(x_check)
      mark_field("mean_X", x_check, "msg_mean_X",
                 true_val = X_truth$mean,
                 err_msg = {
                   v <- suppressWarnings(as.numeric(input$mean_X))
                   tol_m <- max(0.005, 0.01 * abs(X_truth$mean))
                   n_rows <- length(round(df[[xcol]], 2))
                   sum_X  <- round(sum(round(df[[xcol]], 2)), 4)
                   if (!is.na(v) && abs(v - sum_X) <= max(0.5, 0.01 * abs(sum_X)))
                     "<b>Waarom fout:</b> U vulde de som &#x03a3;X in, maar deelde niet door n.<br/><b>Formule:</b> X&#x0305; = &#x03a3;X / n."
                   else if (!is.na(v) && !is.na(Y_truth$mean) && abs(v - Y_truth$mean) <= tol_m)
                     "<b>Waarom fout:</b> U vulde Y&#x0305; in bij X&#x0305; &#8212; controleer welke kolom X is."
                   else
                     "Gemiddelde van X onjuist. Bereken X&#x0305; = &#x03a3;X / n met 4 decimalen."
                 })
      all_correct <- all_correct && x_ok
    }
    if (has_attempted(input$mean_Y)) {
      y_check <- safe_check(input$mean_Y, Y_truth$mean, 4)
      y_ok <- isTRUE(y_check)
      mark_field("mean_Y", y_check, "msg_mean_Y",
                 true_val = Y_truth$mean,
                 err_msg = {
                   v   <- suppressWarnings(as.numeric(input$mean_Y))
                   tol_m <- max(0.005, 0.01 * abs(Y_truth$mean))
                   n_rows <- length(round(df[[y]], 2))
                   sum_Y  <- round(sum(round(df[[y]], 2)), 4)
                   if (!is.na(v) && abs(v - sum_Y) <= max(0.5, 0.01 * abs(sum_Y)))
                     "<b>Waarom fout:</b> U vulde de som &#x03a3;Y in, maar deelde niet door n.<br/><b>Formule:</b> Y&#x0305; = &#x03a3;Y / n."
                   else if (!is.na(v) && !is.na(X_truth$mean) && abs(v - X_truth$mean) <= tol_m)
                     "<b>Waarom fout:</b> U vulde X&#x0305; in bij Y&#x0305; &#8212; controleer welke kolom Y is."
                   else
                     "Gemiddelde van Y onjuist. Bereken Y&#x0305; = &#x03a3;Y / n met 4 decimalen."
                 })
      all_correct <- all_correct && y_ok
    }
    
    if (!all_attempted) return(list(ok = FALSE, attempted = FALSE, message = NULL))
    if (!all_correct) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stap 1: alle gemiddelden moeten overeenkomen op 4 decimalen."))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  # Validate Steps 5-6: Variances and Standard Deviations
  validate_step56 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    all_attempted <- TRUE
    all_correct <- TRUE
    
    xcol <- xs[[1]]
    X_truth <- calc_truth_basic(round(df[[xcol]], 2))
    Y_truth <- calc_truth_basic(round(df[[y]], 2))
    
    all_attempted <- has_attempted(input$var_X) && has_attempted(input$var_Y) &&
      has_attempted(input$sd_X) && has_attempted(input$sd_Y)
    
    var_X_correct <- has_attempted(input$var_X) && isTRUE(safe_check(input$var_X, X_truth$var, 4))
    var_Y_correct <- has_attempted(input$var_Y) && isTRUE(safe_check(input$var_Y, Y_truth$var, 4))
    sd_X_correct <- has_attempted(input$sd_X) && isTRUE(safe_check(input$sd_X, X_truth$sd, 4))
    sd_Y_correct <- has_attempted(input$sd_Y) && isTRUE(safe_check(input$sd_Y, Y_truth$sd, 4))
    
    all_correct <- var_X_correct && var_Y_correct && sd_X_correct && sd_Y_correct
    
    if (!all_attempted) return(list(ok = FALSE, attempted = FALSE, message = NULL))
    if (!all_correct) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stappen 5-6: alle varianties en standaardafwijkingen moeten overeenkomen op 4 decimalen."))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  # Validate Steps 7-9: Covariation preparation
  validate_step79 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    xcol <- xs[[1]]
    X_truth <- calc_truth_basic(round(df[[xcol]], 2))
    Y_truth <- calc_truth_basic(round(df[[y]], 2))
    
    cross_product_sum <- sum((round(df[[xcol]], 2) - X_truth$mean) * (round(df[[y]], 2) - Y_truth$mean))
    cov_XY <- cross_product_sum / (nrow(df) - 1)
    sd_product <- X_truth$sd * Y_truth$sd
    
    all_attempted <- has_attempted(input$cross_product_sum) && 
      has_attempted(input$covariance) && 
      has_attempted(input$sd_product)
    
    cross_product_correct <- has_attempted(input$cross_product_sum) && 
      isTRUE(safe_check(input$cross_product_sum, cross_product_sum, 4))
    covariance_correct <- has_attempted(input$covariance) && 
      isTRUE(safe_check(input$covariance, cov_XY, 4))
    sd_product_correct <- has_attempted(input$sd_product) && 
      isTRUE(safe_check(input$sd_product, sd_product, 4))
    
    all_correct <- cross_product_correct && covariance_correct && sd_product_correct
    
    if (!all_attempted) return(list(ok = FALSE, attempted = FALSE, message = NULL))
    if (!all_correct) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stappen 7-9: kruisproductsom, covariantie en SD-product moeten overeenkomen op 4 decimalen."))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  # Validate Steps 10-12: Correlation, Slope, Intercept
  validate_step1012 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }

    xcol <- xs[[1]]
    X_truth <- calc_truth_basic(round(df[[xcol]], 2))
    Y_truth <- calc_truth_basic(round(df[[y]], 2))

    cross_product_sum <- sum((round(df[[xcol]], 2) - X_truth$mean) * (round(df[[y]], 2) - Y_truth$mean))
    cov_XY <- cross_product_sum / (nrow(df) - 1)
    correlation_expected <- round(cov_XY / (X_truth$sd * Y_truth$sd), 4)

    correlation_attempted <- has_attempted(input$correlation)
    if (!correlation_attempted) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }

    correlation_correct <- isTRUE(safe_check(input$correlation, correlation_expected, 4))

    if (identical(input$mode, "Correlation")) {
      if (!correlation_correct) {
        return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stap 10: de correlatiecoefficient r moet overeenkomen op 4 decimalen."))
      }
      return(list(ok = TRUE, attempted = TRUE, message = NULL))
    }

    slope_attempted <- has_attempted(input$slope)
    intercept_attempted <- has_attempted(input$intercept)

    if (!slope_attempted && !intercept_attempted) {
      return(list(ok = FALSE, attempted = TRUE, message = NULL))
    }

    all_attempted <- correlation_attempted && slope_attempted && intercept_attempted
    if (!all_attempted) {
      return(list(ok = FALSE, attempted = TRUE, message = NULL))
    }

    slope_expected <- round(cov_XY / X_truth$var, 4)
    intercept_expected <- round(Y_truth$mean - slope_expected * X_truth$mean, 4)

    slope_correct <- isTRUE(safe_check(input$slope, slope_expected, 4))
    intercept_correct <- isTRUE(safe_check(input$intercept, intercept_expected, 4))

    if (!(correlation_correct && slope_correct && intercept_correct)) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stappen 10-12: correlatie, helling en intercept moeten overeenkomen op 4 decimalen."))
    }

    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  # Validate Step 13 - Prediction
  validate_step13 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    prereq_result <- validate_step1012()
    if (!prereq_result$ok && prereq_result$attempted) {
      return(list(ok = FALSE, message = "Voltooi eerst Stappen 10-12 (correlatie, helling, intercept)."))
    }
    if (!prereq_result$ok) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    pred_tbl <- prediction_tbl()
    if (is.null(pred_tbl)) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    if (!"Predicted Y" %in% names(pred_tbl)) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    predicted_vals <- pred_tbl$`Predicted Y`
    attempted_count <- sum(!is.na(predicted_vals))
    
    if (attempted_count == 0) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  # Validate Steps 14-17: R², alienation, F and model p-value
  validate_step1415 <- function() {
    df <- current(); y <- yvar(); xs <- xvars()
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(list(ok = FALSE, message = "Dataset niet klaar."))
    }
    
    r_squared_attempted <- has_attempted(input$r_squared)
    alienation_attempted <- has_attempted(input$alienation)
    f_attempted <- has_attempted(input$f_stat)
    p_attempted <- has_attempted(input$model_p_value)
    
    if (!r_squared_attempted && !alienation_attempted && !f_attempted && !p_attempted) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    prereq_result <- validate_step1012()
    if (!prereq_result$ok && prereq_result$attempted) {
      return(list(ok = FALSE, message = "Voltooi eerst Stappen 10-12 (correlatie, helling, intercept)."))
    }
    if (!prereq_result$ok) {
      return(list(ok = FALSE, attempted = FALSE, message = NULL))
    }
    
    correlation_val <- as.numeric(input$correlation)
    
    if (is.na(correlation_val)) {
      return(list(ok = FALSE, message = "Geldige correlatiewaarde vereist."))
    }
    
    # Use canonical expected values - recalculate to avoid depending on student input
    xcol_1415 <- tryCatch(xvars()[[1]], error = function(e) NULL)
    if (!is.null(xcol_1415) && xcol_1415 %in% names(df) && y %in% names(df)) {
      X_1415 <- calc_truth_basic(round(df[[xcol_1415]], 2))
      Y_1415 <- calc_truth_basic(round(df[[y]], 2))
      cps_1415 <- sum((round(df[[xcol_1415]], 2) - X_1415$mean) * (round(df[[y]], 2) - Y_1415$mean))
      cov_1415 <- cps_1415 / (nrow(df) - 1)
      sdp_1415 <- X_1415$sd * Y_1415$sd
      r_canonical <- round(cov_1415 / sdp_1415, 4)
    } else {
      r_canonical <- correlation_val
    }
    r_squared_expected  <- round(r_canonical^2, 4)
    alienation_expected <- round(1 - r_squared_expected, 4)
    # For bivariate regression (k = 1): F = (R²/1) / ((1−R²)/(n−2))
    f_expected <- round((r_squared_expected / 1) / ((1 - r_squared_expected) / (nrow(df) - 2)), 4)
    model_p_expected <- round(stats::pf(f_expected, 1, nrow(df) - 2, lower.tail = FALSE), 4)
    
    all_attempted <- has_attempted(input$r_squared) &&
      has_attempted(input$alienation) &&
      has_attempted(input$f_stat) &&
      has_attempted(input$model_p_value)
    
    r_squared_correct <- has_attempted(input$r_squared) && 
      isTRUE(safe_check(input$r_squared, r_squared_expected, 4))
    alienation_correct <- has_attempted(input$alienation) && 
      isTRUE(safe_check(input$alienation, alienation_expected, 4))
    f_correct <- has_attempted(input$f_stat) &&
      isTRUE(safe_check(input$f_stat, f_expected, 4))
    p_correct <- has_attempted(input$model_p_value) &&
      isTRUE(safe_check(input$model_p_value, model_p_expected, 4))
    
    all_correct <- r_squared_correct && alienation_correct && f_correct && p_correct
    
    if (!all_attempted) return(list(ok = FALSE, attempted = FALSE, message = NULL))
    if (!all_correct) {
      return(list(ok = FALSE, attempted = TRUE, message = "Controleer Stappen 14-17: R², vervreemdingscoëfficiënt, F en model p-waarde moeten overeenkomen op 4 decimalen."))
    }
    
    list(ok = TRUE, attempted = TRUE, message = NULL)
  }
  
  clamp <- function(x, lo, hi) {
    if (is.null(x) || is.na(x)) return(lo)
    max(lo, min(hi, x))
  }
  
  output$seed_echo <- renderUI({
    ss <- safe_seed(input$seed)
    if (!is.null(ss)) {
      div(class="muted", paste0("Code: ", ss))
    } else {
      div(class="muted", "Code: (geen of ongeldig → gebruikt willekeurig)")
    }
  })
  
  vignette_html <- function(sc) {
    if (is.null(sc)) return(HTML(""))
    primers <- concepts_for(sc$id)
    primer_html <- if (length(primers)) {
      paste0("<hr style='margin:8px 0'>",
             "<b>Concepten :</b><ul style='margin:6px 0 0 16px;'><li>",
             paste(primers, collapse='</li><li>'), "</li></ul>")
    } else ""
    var_labels <- paste0(
      "<br><b>X = ", sc$vars$x$name, "</b> (", sc$vars$x$unit, ") &nbsp;|&nbsp; ",
      "<b>Y = ", sc$vars$y$name, "</b> (", sc$vars$y$unit, ")"
    )
    HTML(paste0(
      "<div class='accent'><b>", sc$title, "</b><br>",
      sc$vignette, var_labels, primer_html, "</div>"
    ))
  }
  
  output$vignette_block <- renderUI({
    vignette_html(get_sc(input$scenario))
  })
  
  # Dataset creation & reset
  new_data <- function(same = FALSE){
    n <- clamp(as.integer(input$n %||% 10), 0, MAX_SAMPLE_SIZE)
    nv <- 2  # Always 2 variables for Bivariate/Correlation
    
    raw <- input$seed
    ss <- safe_seed(raw)
    if (same) {
      ss <- sample(1e9, 1)
    } else {
      if (is.null(ss)) ss <- sample(1e9, 1)
    }
    
    selected_scenario <- NULL
    df <- if (same) {
      available_scenario_ids <- as.character(scenario_choices)
      if (length(available_scenario_ids) > 0) {
        random_scenario_id <- sample(available_scenario_ids, 1)
        selected_scenario <- random_scenario_id
        sc <- get_sc(random_scenario_id)
        if (is.null(sc)) {
          make_random_multi(n = n, seed = ss, k = nv)
        } else {
          make_scenario_data(sc, n = n, seed = ss, k_total = nv)
        }
      } else {
        make_random_multi(n = n, seed = ss, k = nv)
      }
    } else {
      sc <- get_sc(input$scenario)
      if (is.null(sc)) {
        make_random_multi(n = n, seed = ss, k = nv)
      } else {
        make_scenario_data(sc, n = n, seed = ss, k_total = nv)
      }
    }
    
    current(df)
    updateTextInput(session, "seed", value = as.character(ss))
    
    if (same && !is.null(selected_scenario)) {
      updateSelectInput(session, "scenario", selected = selected_scenario)
    }
    
    vars <- names(df)[-1]
    if (length(vars) == 0) { 
      yvar(NULL)
      xvars(character(0)) 
    } else {
      yvar(vars[length(vars)])
      xvars(vars[1])
    }
    
    user_calc_tbl(NULL)
    prediction_tbl(NULL)
    unlocked(FALSE)
    clear_feedback_store()
    session$sendCustomMessage("toggleViz", FALSE)
  }
  
  observeEvent(input$gen, new_data(FALSE))
  observeEvent(input$new_same, new_data(TRUE))
  observeEvent(list(input$n, input$mode), {
    new_data(TRUE)
  }, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  observe({
    if (is.null(current()) || nrow(current()) == 0) {
      new_data(FALSE)
    }
  })
  
  output$labels_vars <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    HTML(paste0("<b>Generieke mapping:</b> X = ", xs[1], " &nbsp;&nbsp; Y = ", y))
  })
  
  # Step 1: Means only
  output$means_only_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    pretty_labs <- c("X","Y")
    ids <- c("X","Y")
    
    grid_class <- "grid-compact"
    
    tagList(
      div(class = grid_class,
          lapply(seq_along(ids), function(i){
            id <- ids[i]
            lab <- pretty_labs[i]
            tagList(
              numericInput(paste0("mean_", id), 
                           label = HTML(paste0("<strong>Stap 1:</strong> Gemiddelde van <b>", lab, "</b> = Σ", lab, "/n")),
                           value = NA, step = 0.0001),
              uiOutput(paste0("msg_mean_", id))
            )
          })
      ),
      div(style="margin-top: 15px; font-size: 14px; color: #666;",
          "Opmerking: Standaardafwijkingen worden berekend in Stap 6 nadat we varianties in Stap 5 hebben berekend.")
    )
  })
  
  # Dataset table
  output$data_view <- renderRHandsontable({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    
    numeric_cols <- sapply(df, is.numeric)
    df[numeric_cols] <- lapply(df[numeric_cols], function(x) round(x, 2))
    
    rhandsontable(df, rowHeaders = FALSE, readOnly = TRUE, width = 800) %>%
      hot_col(1, width = 150) %>%
      hot_col(2, width = 150) %>%
      hot_col(3, width = 150) %>%
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
  
  # Build blank calculation table
  build_blank_calc <- function(){
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0 || is.null(xs)) return(NULL)
    
    if (!y %in% names(df)) return(NULL)
    if (!all(xs %in% names(df))) return(NULL)
    
    tbl <- tibble::tibble(Eenheid = df[[names(df)[1]]])
    
    tbl[["Y"]] <- round(df[[y]], 2)
    tbl[["dY"]] <- NA_real_
    tbl[["dY2"]] <- NA_real_
    
    for (i in seq_along(xs)) {
      if (xs[i] %in% names(df)) {
        x_name <- paste0("X", i)
        tbl[[x_name]] <- round(df[[xs[i]]], 2)
        tbl[[paste0("dX", i)]] <- NA_real_
        tbl[[paste0("dX", i, "2")]] <- NA_real_
        tbl[[paste0("dX", i, "dY")]] <- NA_real_
      }
    }
    
    tbl
  }
  
  # Calculation table
  output$calc_table <- renderRHandsontable({
    tbl <- user_calc_tbl()
    if (is.null(tbl)) tbl <- build_blank_calc()
    if (is.null(tbl)) return(NULL)
    
    df <- isolate(current())
    y <- isolate(yvar())
    xs <- isolate(xvars())
    if (is.null(df) || nrow(df) == 0 || is.null(y) || length(xs) == 0) {
      return(NULL)
    }
    
    entity_col_name <- names(df)[1]
    wanted <- c(entity_col_name, "X1", "Y", "dX1", "dY", "dX12", "dY2", "dX1dY")
    wanted <- wanted[wanted %in% names(tbl)]
    if (length(wanted) == 0) return(NULL)
    
    tbl_sub <- tbl[, wanted, drop = FALSE]
    
    entity_label <- names(df)[1]
    y_label <- y %||% "Y"
    x_label <- if(length(xs) > 0) xs[1] else "X"
    headers <- c(
      entity_label, x_label, y_label,
      "x − x̄", "y − ȳ",
      "(x − x̄)²", "(y − ȳ)²",
      "(x − x̄)(y − ȳ)"
    )
    headers <- headers[seq_along(wanted)]
    
    num_cols <- if (ncol(tbl_sub) > 1) 2:ncol(tbl_sub) else integer(0)
    
    total_width <- 1100
    total_height <- min(400, 50 + 30 * nrow(tbl_sub))
    
    ht <- rhandsontable(tbl_sub, rowHeaders = FALSE, colHeaders = headers, width = total_width, height = total_height)
    
    ht <- ht %>% 
      hot_col(1, width = 120) %>%
      hot_col(2, width = 100) %>%
      hot_col(3, width = 100) %>%
      hot_col(4, width = 120) %>%
      hot_col(5, width = 120) %>%
      hot_col(6, width = 120) %>%
      hot_col(7, width = 120) %>%
      hot_col(8, width = 140)
    
    if (length(num_cols) > 0) {
      ht <- ht %>% rhandsontable::hot_col(col = num_cols, type = "numeric", format = "0.0000", allowInvalid = TRUE)
      
      if ("Y" %in% names(tbl_sub)) {
        y_col_idx <- which(names(tbl_sub) == "Y")
        if (length(y_col_idx) > 0) {
          ht <- ht %>% rhandsontable::hot_col(col = y_col_idx, type = "numeric", format = "0.00", readOnly = TRUE)
        }
      }
      
      for (i in 1:length(xs)) {
        x_col_name <- paste0("X", i)
        if (x_col_name %in% names(tbl_sub)) {
          x_col_idx <- which(names(tbl_sub) == x_col_name)
          if (length(x_col_idx) > 0) {
            ht <- ht %>% rhandsontable::hot_col(col = x_col_idx, type = "numeric", format = "0.00", readOnly = TRUE)
          }
        }
      }
    }
    
    meanY <- isolate(suppressWarnings(as.numeric(input$mean_Y)))
    if (length(meanY) == 0 || is.null(meanY)) meanY <- NA_real_
    meanX1 <- isolate(suppressWarnings(as.numeric(input$mean_X)))
    if (length(meanX1) == 0 || is.null(meanX1)) meanX1 <- NA_real_
    
    if ("Y" %in% names(tbl_sub) && "X1" %in% names(tbl_sub)) {
      Y4 <- round(tbl_sub[["Y"]], 4)
      X14 <- round(tbl_sub[["X1"]], 4)
      
      if (!is.null(meanY) && !is.null(meanX1) && !is.na(meanY) && !is.na(meanX1) && !any(is.na(Y4)) && !any(is.na(X14))) {
        exp_dY <- round(Y4 - meanY, 4)
        exp_dY2 <- round(exp_dY^2, 4)
        exp_dX1 <- round(X14 - meanX1, 4)
        exp_dX12 <- round(exp_dX1^2, 4)
        exp_dX1dY <- round(exp_dX1 * exp_dY, 4)
        
        validation_data <- list(
          dY = as.numeric(exp_dY),
          dY2 = as.numeric(exp_dY2), 
          dX1 = as.numeric(exp_dX1),
          dX12 = as.numeric(exp_dX12),
          dX1dY = as.numeric(exp_dX1dY)
        )
        
        ht <- ht %>% rhandsontable::hot_cols(
          renderer = paste0('
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          td.style.textAlign = "center";
          td.style.backgroundColor = "";
          td.style.border = "";

          if (col > 0 && value !== null && value !== "") {
            var num = Number(value);
            if (!isNaN(num)) {
              if (col === 1 || col === 2) {
                td.innerText = num.toFixed(2);
              } else {
                td.innerText = num.toFixed(4);
              }
            }
          }

          var validationData = ', jsonlite::toJSON(validation_data), ';

          var expectedByCol = {
            3: validationData.dX1,
            4: validationData.dY,
            5: validationData.dX12,
            6: validationData.dY2,
            7: validationData.dX1dY
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
    }
    
    ht
  })
  
  observeEvent(input$calc_table, { 
    if (!is.null(input$calc_table)) {
      user_calc_tbl(hot_to_r(input$calc_table))
    }
  })
  
  # Prediction table
  output$prediction_table <- renderRHandsontable({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs) == 0) return(NULL)
    
    xcol <- xs[[1]]
    
    user_slope <- suppressWarnings(as.numeric(input$slope))
    user_intercept <- suppressWarnings(as.numeric(input$intercept))
    
    X_values <- round(df[[xcol]], 2)
    Y_values <- round(df[[y]], 2)
    
    entity_col_name <- names(df)[1]
    entity_values <- df[[entity_col_name]]
    
    stored_pred_tbl <- prediction_tbl()
    user_predictions <- if (!is.null(stored_pred_tbl) && "Predicted Y" %in% names(stored_pred_tbl)) {
      stored_pred_tbl$`Predicted Y`
    } else {
      rep(NA, nrow(df))
    }
    
    pred_tbl <- data.frame(
      entity_values,
      X_values,
      Y_values,
      user_predictions,
      check.names = FALSE
    )
    names(pred_tbl) <- c(entity_col_name, xcol, y, "Predicted Y")
    
    pred_height <- min(400, 50 + 30 * nrow(pred_tbl))
    
    ht <- rhandsontable(pred_tbl, rowHeaders = FALSE, width = 800, height = pred_height) %>%
      hot_col(1, readOnly = TRUE, width = 150) %>%
      hot_col(2, readOnly = TRUE, type = "numeric", format = "0.00", width = 150) %>%
      hot_col(3, readOnly = TRUE, type = "numeric", format = "0.00", width = 150) %>%
      hot_col(4, type = "numeric", format = "0.0000", allowInvalid = TRUE, width = 200)
    
    if (!is.null(user_slope) && !is.null(user_intercept) && !is.na(user_slope) && !is.na(user_intercept)) {
      expected_predictions <- round(user_intercept + user_slope * X_values, 4)
      
      validation_data <- list(
        expected = as.numeric(expected_predictions)
      )
      
      ht <- ht %>% hot_cols(
        renderer = paste0('
        function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.NumericRenderer.apply(this, arguments);
          td.style.textAlign = "center";
          td.style.backgroundColor = "";
          td.style.border = "";
          
          if (col > 0 && value !== null && value !== "") {
            var num = Number(value);
            if (!isNaN(num)) {
              if (col === 1 || col === 2) {
                td.innerText = num.toFixed(2);
              } else if (col === 3) {
                td.innerText = num.toFixed(4);
              }
            }
          }
          
          var validationData = ', jsonlite::toJSON(validation_data), ';
          
          if (col === 3 && value !== null && value !== "" && !isNaN(Number(value))) {
            var userVal = Number(value);
            var expected = Number(validationData.expected[row]);
            
            var userRounded = Math.round(userVal * 10000) / 10000;
            var expectedRounded = Math.round(expected * 10000) / 10000;
            
            if (userRounded === expectedRounded) {
              td.style.backgroundColor = "#C8E6C9";
              td.style.border = "2px solid #00C853";
            } else {
              td.style.backgroundColor = "#FFCDD2";
              td.style.border = "2px solid #D50000";
            }
          }
        }')
      )
    }
    
    ht
  })
  
  observeEvent(input$prediction_table, {
    if (!is.null(input$prediction_table)) {
      prediction_tbl(hot_to_r(input$prediction_table))
    }
  })
  
  # Totals UI
  output$totals_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    tagList(
      numericInput("tot_X1_2", HTML("<strong>Stap 4:</strong> Σ(x − x̄)²"), value = NA, step = 0.0001), 
      uiOutput("msg_tot_X1_2"),
      numericInput("tot_Y2", HTML("<strong>Stap 4:</strong> Σ(y − ȳ)²"), value = NA, step = 0.0001), 
      uiOutput("msg_tot_Y2")
    )
  })
  
  # Steps 5-6: Variances and Standard Deviations UI
  output$variance_sd_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    pretty_labs <- c("X","Y")
    ids <- c("X","Y")
    
    tagList(
      div(class = "grid-compact",
          lapply(seq_along(ids), function(i){
            id <- ids[i]
            lab <- pretty_labs[i]
            tagList(
              numericInput(paste0("var_", id), 
                           label = HTML(paste0("<strong>Stap 5:</strong> Var(", lab, ") = Σ(", lab, "-", lab, "̄)² / (n-1)")),
                           value = NA, step = 0.0001),
              uiOutput(paste0("msg_var_", id)),
              numericInput(paste0("sd_", id), 
                           label = HTML(paste0("<strong>Stap 6:</strong> SD(", lab, ") = √Var(", lab, ")")),
                           value = NA, step = 0.0001),
              uiOutput(paste0("msg_sd_", id))
            )
          })
      )
    )
  })
  
  # Steps 7-9: Covariation UI
  output$covariation_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    tagList(
      numericInput("cross_product_sum", 
                   HTML("<strong>Stap 7:</strong> Kruisproductsom Σ(X−X̄)(Y−Ȳ)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_cross_product_sum"),
      numericInput("covariance", 
                   HTML("<strong>Stap 8:</strong> Cov(X,Y) = Σ(X−X̄)(Y−Ȳ) / (n-1)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_covariance"),
      numericInput("sd_product", 
                   HTML("<strong>Stap 9:</strong> SD(X) × SD(Y)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_sd_product")
    )
  })
  
  # Steps 10-12: Final Regression Results UI
  output$final_regression_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)

    if (identical(input$mode, "Correlation")) {
      return(tagList(
        numericInput("correlation",
                     HTML("<strong>Stap 10:</strong> Correlatie r = Cov(X,Y) / (SD(X)*SD(Y))"),
                     value = NA, step = 0.0001),
        uiOutput("msg_correlation")
      ))
    }
    
    tagList(
      numericInput("correlation", 
                   HTML("<strong>Stap 10:</strong> Correlatie r = Cov(X,Y) / (SD(X)×SD(Y))"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_correlation"),
      numericInput("slope", 
                   HTML("<strong>Stap 11:</strong> Ongestandaardiseerde helling b = Cov(X,Y) / Var(X)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_slope"),
      numericInput("intercept", 
                   HTML("<strong>Stap 12:</strong> Intercept a = Ȳ − b·X̄"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_intercept")
    )
  })
  
  # Coefficients UI for Part VIII (Steps 14-17)
  output$coefficients_ui <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df)==0) return(NULL)
    y <- yvar()
    xs <- xvars()
    if (is.null(y) || length(xs)==0) return(NULL)
    
    tagList(
      numericInput("r_squared", 
                   HTML("<strong>Stap 14:</strong> R² = r² (determinatiecoëfficiënt)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_r_squared"),
      numericInput("alienation", 
                   HTML("<strong>Stap 15:</strong> Aliënatiecoëfficiënt = 1 − R² (onverklaarde variantie)"), 
                   value = NA, step = 0.0001),
      uiOutput("msg_alienation"),
      numericInput("f_stat",
                   HTML("<strong>Stap 16:</strong> F = (R²/1) / ((1−R²)/(n−2))"),
                   value = NA, step = 0.0001),
      uiOutput("msg_f_stat"),
      numericInput("model_p_value",
                   HTML("<strong>Stap 17:</strong> Model p-waarde = F.DIST.RT(F; 1; n−2)"),
                   value = NA, step = 0.0001),
      uiOutput("msg_model_p_value")
    )
  })
  
  # Feedback and validation helpers
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
      tryCatch({
        if (identical(st_local, "invalid")) {
          tagList(
            field_status_ui("invalid"),
            feedback_ui(msg_id, em, compact = TRUE)
          )
        } else if (identical(st_local, "valid") && nzchar(om)) {
          set_feedback_msg(msg_id, NULL)
          tagList(
            field_status_ui("valid"),
            div(class = "ok", om)
          )
        } else if (identical(st_local, "valid")) {
          set_feedback_msg(msg_id, NULL)
          field_status_ui("valid")
        } else {
          set_feedback_msg(msg_id, NULL)
          HTML("")
        }
      }, error = function(e) {
        set_feedback_msg(msg_id, NULL)
        NULL
      })
    })
  }
  
  paint <- function(id, col) {
    session$sendCustomMessage("paintLight", list(id=id, col=col))
  }
  
  do_check <- reactiveVal(0)
  bump <- function() { do_check(isolate(do_check())+1) }
  observeEvent(input$check_btn, bump())
  observeEvent(reactiveValuesToList(input), { 
    bump() 
  })
  
  # ============================================================
  # STEP-SPECIFIC FEEDBACK OUTPUTS
  # ============================================================
  
  output$step2_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step2()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel II voltooid! Alle waarden zijn correct.")
    } else {
      NULL
    }
  })
  
  output$step3_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    step2_result <- validate_step2()
    if (!step2_result$ok) return(NULL)
    
    result <- validate_step3()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", HTML(result$message))
    } else if (result$ok) {
      div(class = "ok", "✅ Deel III voltooid! Alle berekeningen zijn correct.")
    } else {
      NULL
    }
  })
  
  output$step4_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    step4_started <- FALSE
    step4_started <- has_attempted(input$tot_Y2) || 
      has_attempted(input$tot_X1_2)
    
    if (step4_started) {
      step3_result <- validate_step3()
      step4_result <- validate_step4(step4_started)
      if (isTRUE(step3_result$ok) && step4_result$ok) {
        div(class = "ok", "✅ Deel III (Stappen 2-4) voltooid! Alle afwijkingen, kwadraten en sommen zijn correct.")
      } else {
        NULL
      }
    } else {
      NULL
    }
  })
  
  output$step1_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step1()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel II (Stap 1) voltooid! Alle gemiddelden zijn correct.")
    } else {
      NULL
    }
  })

  output$step1_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c("Gemiddelde X" = "msg_mean_X", "Gemiddelde Y" = "msg_mean_Y"),
      "Uitgebreide feedback bij de gemiddelden"
    )
  })
  
  output$step56_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step56()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel IV (Stappen 5-6) voltooid! Alle varianties en standaardafwijkingen zijn correct.")
    } else {
      NULL
    }
  })

  output$step4_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c("Σ(x - x̄)^2" = "msg_tot_X1_2", "Σ(y - ȳ)^2" = "msg_tot_Y2"),
      "Uitgebreide feedback bij de kwadraatsommen"
    )
  })

  output$step56_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c("Var(X)" = "msg_var_X", "Var(Y)" = "msg_var_Y", "SD(X)" = "msg_sd_X", "SD(Y)" = "msg_sd_Y"),
      "Uitgebreide feedback bij varianties en standaardafwijkingen"
    )
  })
  
  output$step79_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step79()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel V (Stappen 7-9) voltooid! Correlatiecoëfficiënt correct berekend.")
    } else {
      NULL
    }
  })

  output$step79_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c(
        "Kruisproductsom" = "msg_cross_product_sum",
        "Cov(X,Y)" = "msg_covariance",
        "SD(X) × SD(Y)" = "msg_sd_product"
      ),
      "Uitgebreide feedback bij covariatie"
    )
  })
  
  output$step1012_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step1012()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel VI (Stappen 10-12) voltooid! Correlatie, regressiecoëfficiënt en intercept zijn correct.")
    } else {
      NULL
    }
  })

  output$step1012_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c("Correlatie r" = "msg_correlation", "Helling b" = "msg_slope", "Intercept a" = "msg_intercept"),
      "Uitgebreide feedback bij de regressiecoëfficiënten"
    )
  })
  
  output$step79_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)

    result <- validate_step79()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "Deel V (Stappen 7-9) voltooid! Kruisproductsom, covariantie en SD-product zijn correct.")
    } else {
      NULL
    }
  })

  output$step1012_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)

    result <- validate_step1012()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      if (identical(input$mode, "Correlation")) {
        div(class = "ok", "Deel VI (Stap 10) voltooid! Correlatiecoefficient r correct berekend.")
      } else {
        div(class = "ok", "Deel VI (Stappen 10-12) voltooid! Correlatie, regressiecoefficient en intercept zijn correct.")
      }
    } else {
      NULL
    }
  })

  output$step1012_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)

    if (identical(input$mode, "Correlation")) {
      feedback_panel_ui(
        c("Correlatie r" = "msg_correlation"),
        "Uitgebreide feedback bij de correlatiecoefficient"
      )
    } else {
      feedback_panel_ui(
        c("Correlatie r" = "msg_correlation", "Helling b" = "msg_slope", "Intercept a" = "msg_intercept"),
        "Uitgebreide feedback bij de regressiecoefficienten"
      )
    }
  })

  output$step13_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step13()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel VII (Stap 13) voltooid! Alle voorspellingen met Ŷ = a + b·X zijn correct.")
    } else {
      NULL
    }
  })
  
  output$step1415_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    
    result <- validate_step1415()
    if (!result$ok && !is.null(result$message)) {
      div(class = "err", result$message)
    } else if (result$ok) {
      div(class = "ok", "✅ Deel VIII (Stappen 14-17) voltooid! R², vervreemdingscoëfficiënt, F en model p-waarde zijn correct.")
    } else {
      NULL
    }
  })

  output$step1415_detail_feedback <- renderUI({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return(NULL)
    feedback_panel_ui(
      c("R²" = "msg_r_squared",
        "Aliënatiecoëfficiënt" = "msg_alienation",
        "F-statistiek" = "msg_f_stat",
        "Model p-waarde" = "msg_model_p_value"),
      "Uitgebreide feedback bij de samenvattingsmaten"
    )
  })
  
  output$final_success_message <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    
    if (identical(input$mode, "Correlation")) {
      div(class = "card", style = "background-color: #E8F5E9; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0;",
          h3(style = "color: #2E7D32; margin-top: 0;", "🎉 Uitstekend Werk! Correlatieanalyse Voltooid!"),
          p(style = "font-size: 16px; margin: 15px 0;", 
            strong("Gefeliciteerd!"), " U heeft met succes de 9-stappen correlatieanalyse voltooid (Delen I-V)."),
          p(style = "font-size: 15px; margin: 10px 0;", 
            "U kunt nu de ", strong("spreidingsdiagram visualisatie hieronder"), " bekijken om de relatie tussen uw variabelen te zien."),
          p(style = "font-size: 15px; margin: 10px 0;", 
            strong("Belangrijkste resultaat:")),
          tags$ul(style = "font-size: 15px; margin: 10px 0;",
            tags$li("De ", strong("correlatiecoëfficiënt (r)"), " toont de sterkte en richting van de lineaire relatie")
          ),
          p(style = "font-size: 15px; margin: 10px 0; color: #1B5E20;", 
            strong("Wilt u voorspellingen leren?"), " Schakel over naar 'Bivariate Regressie' modus om de volledige 17-stappenanalyse te voltooien met regressievergelijking, voorspellingen, R² en F-toets!")
      )
    } else {
      div(class = "card", style = "background-color: #E8F5E9; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0;",
          h3(style = "color: #2E7D32; margin-top: 0;", "🎉 Uitstekend Werk! Alle 17 Stappen Voltooid!"),
          p(style = "font-size: 16px; margin: 15px 0;", 
            strong("Gefeliciteerd!"), " U heeft met succes de volledige 17-stappen regressieanalyse voltooid."),
          p(style = "font-size: 15px; margin: 10px 0;", 
            "U kunt nu de ", strong("visualisaties hieronder"), " bekijken om te zien:"),
          tags$ul(style = "font-size: 15px; margin: 10px 0;",
            tags$li(strong("Spreidingsdiagram"), " - Toont de lineaire relatie tussen uw variabelen"),
            tags$li(strong("Residuenplot"), " - Helpt bij het beoordelen van de modelpassing en het identificeren van patronen in fouten"),
            tags$li(strong("Kalibratieplot"), " - Vergelijkt voorspelde vs. werkelijke waarden")
          ),
          p(style = "font-size: 15px; margin: 10px 0;", 
            strong("Hoe uw resultaten te interpreteren:")),
          tags$ul(style = "font-size: 15px; margin: 10px 0;",
            tags$li("De ", strong("correlatie (r)"), " toont de sterkte en richting van de relatie"),
            tags$li("De ", strong("R² waarde"), " geeft het aandeel van de variantie aan dat door uw model wordt verklaard"),
            tags$li("De ", strong("helling (b)"), " vertelt u hoeveel Y verandert voor elke eenheidsverandering in X"),
            tags$li("De ", strong("intercept (a)"), " is de voorspelde Y-waarde wanneer X = 0")
          ),
          p(style = "font-size: 15px; margin: 10px 0; color: #1B5E20;", 
            "Bekijk de visualisaties hieronder om diepere inzichten in uw regressieanalyse te krijgen!")
      )
    }
  })
  
  # ============================================================
  # REAL-TIME VALIDATION OBSERVERS FOR STEP-SPECIFIC FEEDBACK
  # ============================================================
  
  observe({
    df <- current()
    if (is.null(df) || nrow(df) == 0) return()
    
    if (is.null(input$mean_X) || is.null(input$mean_Y)) return()
    if (is.na(input$mean_X) || is.na(input$mean_Y)) return()
    
    validate_step1()
  })
  
  # ENHANCED MAIN VALIDATOR
  output$feedback_block <- renderUI({
    tryCatch({
      req(do_check())
      df <- current()
      if (is.null(df) || nrow(df) == 0) return(NULL)
      
      y <- yvar()
      xs <- xvars()
      if (is.null(xs) || length(xs) == 0 || is.null(y)) {
        num_cols <- names(df)[sapply(df, is.numeric)]
        if (length(num_cols) >= 2) {
          xs <- num_cols[1]
          y <- num_cols[2]
        } else {
          return(div(class="err", "Onvoldoende numerieke variabelen in dataset."))
        }
      }
      
      to_num <- function(id) {
        v <- input[[id]]
        if (is.null(v) || length(v)==0) return(NA_real_)
        suppressWarnings(as.numeric(v))
      }
      
      ## ===== Step 2: Means & SDs =====
      means_ok <- TRUE
      sds_ok <- TRUE
      
      xs_ids <- "X"
      lab_map <- setNames("X", "X")
      
      for (id in xs_ids) {
        idx <- 1L
        if (idx > length(xs)) next
        
        vec <- df[[ xs[idx] ]]
        tru <- calc_truth_basic(round(vec, 2))
        
        okm <- check_decimals(to_num(paste0("mean_", id)), tru$mean, 4)
        oks <- check_decimals(to_num(paste0("sd_",   id)), tru$sd,   4)
        
        mark_field(paste0("mean_", id), okm, paste0("msg_mean_", id),
                   true_val = tru$mean,
                   err_msg = {
                     v_m  <- to_num(paste0("mean_", id))
                     idx  <- match(id, xs_ids)
                     if (!is.na(idx) && idx <= length(xs)) {
                       vec_m  <- df[[ xs[idx] ]]
                       tru_m  <- calc_truth_basic(round(vec_m, 2))
                       sum_v  <- round(sum(round(vec_m, 2)), 4)
                       n_m    <- length(round(vec_m, 2))
                       tol_mm <- max(0.005, 0.01 * abs(tru_m$mean))
                       if (!is.na(v_m) && abs(v_m - sum_v) <= max(0.5, 0.01 * abs(sum_v)))
                         sprintf("<b>Waarom fout:</b> U vulde de som &#x03a3;%s in zonder te delen door n.<br/><b>Formule:</b> %s&#x0305; = &#x03a3;%s / n.", lab_map[[id]], lab_map[[id]], lab_map[[id]])
                       else
                         sprintf("Gemiddelde van %s onjuist. Gebruik 4 decimalen voor tussentijdse berekeningen.", lab_map[[id]])
                     } else sprintf("Gemiddelde van %s onjuist. Gebruik 4 decimalen voor tussentijdse berekeningen.", lab_map[[id]])
                   })
        mark_field(paste0("sd_",   id), oks, paste0("msg_sd_",   id),
                   err_msg = sprintf("SD van %s onjuist. Volg stappen 5–6 nauwkeurig met 4 decimalen.", lab_map[[id]]))
        
        means_ok <- means_ok && isTRUE(okm)
        sds_ok   <- sds_ok   && isTRUE(oks)
      }
      
      truY <- calc_truth_basic(round(df[[y]], 2))
      okmY <- check_decimals(to_num("mean_Y"), truY$mean, 4)
      oksY <- check_decimals(to_num("sd_Y"),   truY$sd,   4)
      
      mark_field("mean_Y", okmY, "msg_mean_Y",
                 err_msg = "Gemiddelde van Y onjuist. Gebruik 4 decimalen voor berekeningen.")
      mark_field("sd_Y",   oksY, "msg_sd_Y",
                 err_msg = "SD van Y onjuist. Volg stappen 5–6 nauwkeurig met 4 decimalen.")
      
      means_ok <- means_ok && isTRUE(okmY)
      sds_ok   <- sds_ok   && isTRUE(oksY)
      
      if (!(means_ok && sds_ok)) {
        unlocked(FALSE)
        session$sendCustomMessage("toggleViz", FALSE)
      }
      
      ## ===== Step 3: Row-wise checks =====
      tbl <- user_calc_tbl()
      if (is.null(tbl)) tbl <- build_blank_calc()
      if (is.null(tbl)) return(NULL)
      
      meanY <- round(to_num("mean_Y"), 4)
      meanX1 <- round(or_num(to_num("mean_X"), to_num("mean_X1")), 4)
      
      Y4 <- round(tbl[["Y"]], 4)
      X14 <- round(tbl[["X1"]], 4)
      
      dY4 <- round(Y4 - meanY, 4)
      dX14 <- round(X14 - meanX1, 4)
      
      ok_rows <- TRUE
      
      if ("dY" %in% names(tbl)) {
        user_dY <- round(as.numeric(tbl[["dY"]]), 4)
        okv <- check_col_vec(user_dY, dY4, 4)
        if (any(!isTRUE(okv), na.rm = TRUE)) ok_rows <- FALSE
      }
      
      if ("dY2" %in% names(tbl)) {
        user_dY2 <- round(as.numeric(tbl[["dY2"]]), 4)
        expected_dY2 <- round(dY4^2, 4)
        okv <- check_col_vec(user_dY2, expected_dY2, 4)
        if (any(!isTRUE(okv), na.rm = TRUE)) ok_rows <- FALSE
      }
      
      if ("dX1" %in% names(tbl)) {
        user_dX1 <- round(as.numeric(tbl[["dX1"]]), 4)
        okv <- check_col_vec(user_dX1, dX14, 4)
        if (any(!isTRUE(okv), na.rm = TRUE)) ok_rows <- FALSE
      }
      
      if ("dX12" %in% names(tbl)) {
        user_dX12 <- round(as.numeric(tbl[["dX12"]]), 4)
        expected_dX12 <- round(dX14^2, 4)
        okv <- check_col_vec(user_dX12, expected_dX12, 4)
        if (any(!isTRUE(okv), na.rm = TRUE)) ok_rows <- FALSE
      }
      
      if ("dX1dY" %in% names(tbl)) {
        user_dX1dY <- round(as.numeric(tbl[["dX1dY"]]), 4)
        expected_dX1dY <- round(dX14 * dY4, 4)
        okv <- check_col_vec(user_dX1dY, expected_dX1dY, 4)
        if (any(!isTRUE(okv), na.rm = TRUE)) ok_rows <- FALSE
      }
      
      step2_ok <- validate_step2()$ok
      step3_ok <- validate_step3()$ok
      
      ## ===== Helpers needed for Step 4 onwards =====
      n <- nrow(df)
      diag <- function(val, patterns, fallback) {
        v <- suppressWarnings(as.numeric(val))
        if (is.na(v)) return(fallback)
        for (p in patterns) {
          ref <- suppressWarnings(as.numeric(p$value))
          tol <- max(0.005, 0.01 * abs(ref))
          if (!is.na(ref) && abs(v - ref) <= tol) return(p$tip)
        }
        fallback
      }
      
      ## ===== Step 4: Totals =====
      exp_Y2 <- round(sum(dY4^2), 4)
      exp_X12 <- round(sum(dX14^2), 4)
      exp_X1Y <- round(sum(dX14 * dY4), 4)
      
      tot_ok <- TRUE
      
      mark_field("tot_Y2", check_decimals(to_num("tot_Y2"), exp_Y2, 4), "msg_tot_Y2",
                 err_msg = diag(input$tot_Y2, list(
                   list(value = round(exp_Y2 / (n - 1), 4),
                        tip   = "<b>Waarom fout:</b> U deelde de kwadraatsom door n&#8722;1 (= variantie). Dit veld vraagt de ruwe kwadraatsom.<br/><b>Correctie:</b> Tel de kolom (y&#x2212;&#x0233;)&#178; direct op &#8212; deel <em>niet</em> door n&#8722;1."),
                   list(value = exp_X12,
                        tip   = "<b>Waarom fout:</b> U vulde &#x03a3;(x&#x2212;x&#x0305;)&#178; in bij &#x03a3;(y&#x2212;&#x0233;)&#178;. Controleer welke kolom Y is.")
                 ), "&#x03a3;(y&#x2212;&#x0233;)&#178; onjuist. Tel de kolom (y&#x2212;&#x0233;)&#178; op in de tabel."))
      tot_ok <- tot_ok && isTRUE(check_decimals(to_num("tot_Y2"), exp_Y2, 4))
      
      mark_field("tot_X1_2", check_decimals(to_num("tot_X1_2"), exp_X12, 4), "msg_tot_X1_2",
                 err_msg = diag(input$tot_X1_2, list(
                   list(value = round(exp_X12 / (n - 1), 4),
                        tip   = "<b>Waarom fout:</b> U deelde de kwadraatsom door n&#8722;1 (= variantie). Dit veld vraagt de ruwe kwadraatsom.<br/><b>Correctie:</b> Tel de kolom (x&#x2212;x&#x0305;)&#178; direct op &#8212; deel <em>niet</em> door n&#8722;1."),
                   list(value = exp_Y2,
                        tip   = "<b>Waarom fout:</b> U vulde &#x03a3;(y&#x2212;&#x0233;)&#178; in bij &#x03a3;(x&#x2212;x&#x0305;)&#178;. Controleer welke kolom X is.")
                 ), "&#x03a3;(x&#x2212;x&#x0305;)&#178; onjuist. Tel de kolom (x&#x2212;x&#x0305;)&#178; op in de tabel."))
      
      tot_ok <- tot_ok && 
        isTRUE(check_decimals(to_num("tot_X1_2"), exp_X12, 4))
      
      # Validate the 15-step sections
      xcol <- xs[[1]]
      if (xcol %in% names(df) && y %in% names(df)) {
        mX <- round(mean(round(df[[xcol]], 2)), 4)
        mY <- round(mean(round(df[[y]], 2)), 4)
        dX <- round(df[[xcol]], 2) - mX
        dY <- round(df[[y]], 2) - mY
        
        sum_dX2 <- round(sum(dX^2), 4)
        sum_dY2 <- round(sum(dY^2), 4)
        sum_dXdY <- round(sum(dX * dY), 4)
        
        n <- nrow(df)
        var_X_exp <- round(sum_dX2 / (n - 1), 4)
        var_Y_exp <- round(sum_dY2 / (n - 1), 4)
        sd_X_exp <- round(sqrt(var_X_exp), 4)
        sd_Y_exp <- round(sqrt(var_Y_exp), 4)
        
        cross_product_sum_exp <- sum_dXdY
        covariance_exp <- round(sum_dXdY / (n - 1), 4)
        sd_product_exp <-  round(sqrt(var_X_exp) * sqrt(var_Y_exp), 4)
        
        correlation_exp <- round(covariance_exp / sd_product_exp, 4)
        slope_exp <- round(covariance_exp / var_X_exp, 4)
        intercept_exp <- round(mY - slope_exp * mX, 4)
        r_squared_exp <- round(correlation_exp^2, 4)
        alienation_exp <- round(1 - r_squared_exp, 4)
        f_stat_exp <- round((r_squared_exp / 1) / ((1 - r_squared_exp) / (n - 2)), 4)
        model_p_exp <- round(stats::pf(f_stat_exp, 1, n - 2, lower.tail = FALSE), 4)
        
        # Helper: compare student value against known wrong-formula alternatives
        diag <- function(val, patterns, fallback) {
          v <- suppressWarnings(as.numeric(val))
          if (is.na(v)) return(fallback)
          for (p in patterns) {
            ref <- suppressWarnings(as.numeric(p$value))
            tol <- max(0.005, 0.01 * abs(ref))
            if (!is.na(ref) && abs(v - ref) <= tol) return(p$tip)
          }
          fallback
        }

        # Mark fields for Part IV (Steps 5-6)
        if (has_attempted(input$var_X)) {
          mark_field("var_X", check_decimals(to_num("var_X"), var_X_exp, 4), "msg_var_X",
            err_msg = diag(input$var_X, list(
              list(value = round(sum_dX2 / n, 4), tip =
                "<b>Waarom fout:</b> U deelde door n in plaats van n&#8722;1.<br/><b>Oorzaak:</b> Steekproefvariantie vereist de Bessel-correctie (n&#8722;1).<br/><b>Correctie:</b> Var(X) = &#x03a3;(X&#x2212;X&#x0305;)&#178; / (n&#8722;1)."),
              list(value = sd_X_exp, tip =
                "<b>Waarom fout:</b> U vulde SD(X) in &#8212; dit veld vraagt de <em>variantie</em>.<br/><b>Correctie:</b> Var(X) = SD(X)&#178; &#8212; kwadrateer uw SD, of bereken &#x03a3;(X&#x2212;X&#x0305;)&#178; / (n&#8722;1) opnieuw."),
              list(value = var_Y_exp, tip =
                "<b>Waarom fout:</b> U vulde Var(Y) in bij Var(X) &#8212; controleer welke kolom X is.")
            ), "Var(X) onjuist. Var(X) = &#x03a3;(X&#x2212;X&#x0305;)&#178; / (n&#8722;1)."))
        }
        if (has_attempted(input$var_Y)) {
          mark_field("var_Y", check_decimals(to_num("var_Y"), var_Y_exp, 4), "msg_var_Y",
            err_msg = diag(input$var_Y, list(
              list(value = round(sum_dY2 / n, 4), tip =
                "<b>Waarom fout:</b> U deelde door n in plaats van n&#8722;1.<br/><b>Oorzaak:</b> Steekproefvariantie vereist de Bessel-correctie (n&#8722;1).<br/><b>Correctie:</b> Var(Y) = &#x03a3;(Y&#x2212;Y&#x0305;)&#178; / (n&#8722;1)."),
              list(value = sd_Y_exp, tip =
                "<b>Waarom fout:</b> U vulde SD(Y) in &#8212; dit veld vraagt de <em>variantie</em>.<br/><b>Correctie:</b> Var(Y) = SD(Y)&#178; &#8212; kwadrateer uw SD, of bereken &#x03a3;(Y&#x2212;Y&#x0305;)&#178; / (n&#8722;1) opnieuw."),
              list(value = var_X_exp, tip =
                "<b>Waarom fout:</b> U vulde Var(X) in bij Var(Y) &#8212; controleer welke kolom Y is.")
            ), "Var(Y) onjuist. Var(Y) = &#x03a3;(Y&#x2212;Y&#x0305;)&#178; / (n&#8722;1)."))
        }
        if (has_attempted(input$sd_X)) {
          mark_field("sd_X", check_decimals(to_num("sd_X"), sd_X_exp, 4), "msg_sd_X",
            err_msg = diag(input$sd_X, list(
              list(value = var_X_exp, tip =
                "<b>Waarom fout:</b> U vulde Var(X) in &#8212; dit veld vraagt de standaardafwijking.<br/><b>Correctie:</b> SD(X) = &#x221a;Var(X) &#8212; neem de vierkantswortel van uw variantie."),
              list(value = round(sqrt(sum_dX2 / n), 4), tip =
                "<b>Waarom fout:</b> U gebruikte de populatie-SD.<br/><b>Correctie:</b> Gebruik de steekproef-SD: &#x221a;(&#x03a3;(X&#x2212;X&#x0305;)&#178; / (n&#8722;1)) &#8212; deel door n&#8722;1 en neem dan de wortel."),
              list(value = sd_Y_exp, tip =
                "<b>Waarom fout:</b> U vulde SD(Y) in bij SD(X) &#8212; controleer welke kolom X is.")
            ), "SD(X) onjuist. SD(X) = &#x221a;Var(X)."))
        }
        if (has_attempted(input$sd_Y)) {
          mark_field("sd_Y", check_decimals(to_num("sd_Y"), sd_Y_exp, 4), "msg_sd_Y",
            err_msg = diag(input$sd_Y, list(
              list(value = var_Y_exp, tip =
                "<b>Waarom fout:</b> U vulde Var(Y) in &#8212; dit veld vraagt de standaardafwijking.<br/><b>Correctie:</b> SD(Y) = &#x221a;Var(Y) &#8212; neem de vierkantswortel van uw variantie."),
              list(value = round(sqrt(sum_dY2 / n), 4), tip =
                "<b>Waarom fout:</b> U gebruikte de populatie-SD.<br/><b>Correctie:</b> Gebruik de steekproef-SD: &#x221a;(&#x03a3;(Y&#x2212;Y&#x0305;)&#178; / (n&#8722;1)) &#8212; deel door n&#8722;1 en neem dan de wortel."),
              list(value = sd_X_exp, tip =
                "<b>Waarom fout:</b> U vulde SD(X) in bij SD(Y) &#8212; controleer welke kolom Y is.")
            ), "SD(Y) onjuist. SD(Y) = &#x221a;Var(Y)."))
        }
        
        # Mark fields for Part V (Steps 7-9)
        if (has_attempted(input$cross_product_sum)) {
          mark_field("cross_product_sum", check_decimals(to_num("cross_product_sum"), cross_product_sum_exp, 4), "msg_cross_product_sum",
            err_msg = diag(input$cross_product_sum, list(
              list(value = covariance_exp, tip =
                "<b>Waarom fout:</b> U vulde de covariantie in &#8212; dit veld vraagt de kruisproductsom <em>v&#243;&#243;r</em> deling door n&#8722;1.<br/><b>Correctie:</b> Tel de kolom (X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;) op &#8212; deel <em>niet</em> door n&#8722;1."),
              list(value = sum_dX2, tip =
                "<b>Waarom fout:</b> U vulde &#x03a3;(X&#x2212;X&#x0305;)&#178; in &#8212; dit veld vraagt het <em>kruisproduct</em> &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;)."),
              list(value = sum_dY2, tip =
                "<b>Waarom fout:</b> U vulde &#x03a3;(Y&#x2212;Y&#x0305;)&#178; in &#8212; dit veld vraagt het <em>kruisproduct</em> &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;).")
            ), "Kruisproductsom onjuist. &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;)"))
        }
        if (has_attempted(input$covariance)) {
          mark_field("covariance", check_decimals(to_num("covariance"), covariance_exp, 4), "msg_covariance",
            err_msg = diag(input$covariance, list(
              list(value = cross_product_sum_exp, tip =
                "<b>Waarom fout:</b> U vulde de kruisproductsom in &#8212; deel nog door n&#8722;1.<br/><b>Correctie:</b> Cov(X,Y) = &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;) / (n&#8722;1)."),
              list(value = round(sum_dXdY / n, 4), tip =
                "<b>Waarom fout:</b> U deelde door n in plaats van n&#8722;1.<br/><b>Correctie:</b> Cov(X,Y) = &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;) / (n&#8722;1)."),
              list(value = correlation_exp, tip =
                "<b>Waarom fout:</b> U vulde de correlatie r in &#8212; covariantie is r &#215; SD(X) &#215; SD(Y), niet hetzelfde als r.")
            ), "Cov(X,Y) onjuist. Cov(X,Y) = &#x03a3;(X&#x2212;X&#x0305;)(Y&#x2212;Y&#x0305;) / (n&#8722;1)."))
        }
        if (has_attempted(input$sd_product)) {
          mark_field("sd_product", check_decimals(to_num("sd_product"), sd_product_exp, 4), "msg_sd_product",
            err_msg = diag(input$sd_product, list(
              list(value = round(sd_X_exp + sd_Y_exp, 4), tip =
                "<b>Waarom fout:</b> U berekende SD(X) + SD(Y) &#8212; gebruik <em>vermenigvuldiging</em>.<br/><b>Correctie:</b> SD(X) &#215; SD(Y) &#8212; vermenigvuldig de twee standaardafwijkingen."),
              list(value = round(var_X_exp * var_Y_exp, 4), tip =
                "<b>Waarom fout:</b> U gebruikte varianties.<br/><b>Correctie:</b> Gebruik de <em>standaardafwijkingen</em>: SD(X) &#215; SD(Y), niet de varianties.")
            ), "SD-product onjuist. SD(X) &#215; SD(Y)"))
        }
        
        # Mark fields for Part VI (Steps 10-12)
        if (has_attempted(input$correlation)) {
          mark_field("correlation", check_decimals(to_num("correlation"), correlation_exp, 4), "msg_correlation",
            err_msg = diag(input$correlation, list(
              list(value = slope_exp, tip =
                "<b>Waarom fout:</b> U vulde de regressiehelling b in &#8212; dat is Cov/Var(X), niet Cov/(SD(X)&#215;SD(Y)).<br/><b>Correctie:</b> r = Cov(X,Y) / (SD(X) &#215; SD(Y)) &#8212; deel door het SD-product."),
              list(value = round(cross_product_sum_exp / sd_product_exp, 4), tip =
                "<b>Waarom fout:</b> U deelde de kruisproductsom rechtstreeks door het SD-product.<br/><b>Oorzaak:</b> U sloeg de deling door n&#8722;1 over.<br/><b>Correctie:</b> Bereken eerst Cov = kruisproductsom / (n&#8722;1), deel dan door SD(X)&#215;SD(Y).")
            ), "Correlatie r onjuist. r = Cov(X,Y) / (SD(X) &#215; SD(Y))."))
        }
        if (has_attempted(input$slope)) {
          mark_field("slope", check_decimals(to_num("slope"), slope_exp, 4), "msg_slope",
            err_msg = diag(input$slope, list(
              list(value = round(sd_Y_exp / sd_X_exp, 4), tip =
                "<b>Waarom fout:</b> U gebruikte SD(Y)/SD(X) &#8212; de correcte formule gebruikt covariantie en variantie.<br/><b>Correctie:</b> b = Cov(X,Y) / Var(X) &#8212; deel de covariantie door de variantie van X."),
              list(value = correlation_exp, tip =
                "<b>Waarom fout:</b> U vulde de correlatie r in &#8212; de helling b &#8800; r.<br/><b>Correctie:</b> b = Cov(X,Y) / Var(X) &#8212; deel de covariantie door Var(X)."),
              list(value = round(covariance_exp / var_Y_exp, 4), tip =
                "<b>Waarom fout:</b> U deelde door Var(Y) in plaats van Var(X).<br/><b>Correctie:</b> b = Cov(X,Y) / <em>Var(X)</em> &#8212; controleer door welke variantie u deelt.")
            ), "Regressieco&#235;ffici&#235;nt b onjuist. b = Cov(X,Y) / Var(X)."))
        }
        if (has_attempted(input$intercept)) {
          mark_field("intercept", check_decimals(to_num("intercept"), intercept_exp, 4), "msg_intercept",
            err_msg = diag(input$intercept, list(
              list(value = round(mX - slope_exp * mY, 4), tip =
                "<b>Waarom fout:</b> U gebruikte a = X&#x0305; &#8722; b&#183;Y&#x0305; &#8212; de formule vereist Y&#x0305; links.<br/><b>Correctie:</b> a = Y&#x0305; &#8722; b&#183;X&#x0305; &#8212; zet de Y-waarden links in de formule.")
            ), "Intercept a onjuist. a = Y&#x0305; &#8722; b&#183;X&#x0305;."))
        }
        if (has_attempted(input$r_squared)) {
          mark_field("r_squared", check_decimals(to_num("r_squared"), r_squared_exp, 4), "msg_r_squared",
            err_msg = diag(input$r_squared, list(
              list(value = correlation_exp, tip =
                "<b>Waarom fout:</b> U vulde r in &#8212; R&#178; is het <em>kwadraat</em> van r.<br/><b>Correctie:</b> R&#178; = r&#178; &#8212; kwadrateer uw correlatiewaarde."),
              list(value = alienation_exp, tip =
                "<b>Waarom fout:</b> U vulde de vervreemdingsco&#235;ffici&#235;nt in &#8212; dat is het omgekeerde.<br/><b>Correctie:</b> R&#178; = r&#178;, niet 1&#8722;r&#178;.")
            ), "R&#178; onjuist. R&#178; = r&#178;."))
        }
        if (has_attempted(input$alienation)) {
          mark_field("alienation", check_decimals(to_num("alienation"), alienation_exp, 4), "msg_alienation",
            err_msg = diag(input$alienation, list(
              list(value = r_squared_exp, tip =
                "<b>Waarom fout:</b> U vulde R&#178; in &#8212; vervreemding = 1 &#8722; R&#178;, niet R&#178; zelf.<br/><b>Correctie:</b> Trek R&#178; af van 1: 1 &#8722; R&#178;."),
              list(value = correlation_exp, tip =
                "<b>Waarom fout:</b> U vulde r in &#8212; vervreemding = 1 &#8722; r&#178;.<br/><b>Correctie:</b> Kwadrateer eerst r, trek dan af van 1: 1 &#8722; r&#178;.")
            ), "Vervreemdingsco&#235;ffici&#235;nt onjuist. 1 &#8722; R&#178;."))
        }
        if (has_attempted(input$f_stat)) {
          mark_field("f_stat", check_decimals(to_num("f_stat"), f_stat_exp, 4), "msg_f_stat",
            err_msg = diag(input$f_stat, list(
              list(value = model_p_exp, tip =
                "<b>Waarom fout:</b> U vulde de p-waarde in bij F.<br/><b>Correctie:</b> F = (R&#178;/1) / ((1&#8722;R&#178;)/(n&#8722;2))."),
              list(value = round((r_squared_exp / 1) / ((1 - r_squared_exp) / (n - 3)), 4), tip =
                "<b>Waarom fout:</b> U gebruikte n&#8722;3 in plaats van n&#8722;2.<br/><b>Correctie:</b> Voor bivariate regressie geldt df<sub>2</sub> = n&#8722;2.")
            ), "F-statistiek onjuist. Gebruik F = (R&#178;/1) / ((1&#8722;R&#178;)/(n&#8722;2))."))
        }
        if (has_attempted(input$model_p_value)) {
          mark_field("model_p_value", check_decimals(to_num("model_p_value"), model_p_exp, 4), "msg_model_p_value",
            err_msg = diag(input$model_p_value, list(
              list(value = f_stat_exp, tip =
                "<b>Waarom fout:</b> U vulde de F-statistiek in bij de p-waarde.<br/><b>Correctie:</b> p = F.DIST.RT(F;1;n&#8722;2)."),
              list(value = round(stats::pf(f_stat_exp, 1, n - 3, lower.tail = FALSE), 4), tip =
                "<b>Waarom fout:</b> U gebruikte de verkeerde vrijheidsgraden in de F-verdeling.<br/><b>Correctie:</b> Gebruik df<sub>1</sub>=1 en df<sub>2</sub>=n&#8722;2.")
            ), "Model p-waarde onjuist. Gebruik p = F.DIST.RT(F;1;n&#8722;2)."))
        }

        # Reset any unattempted field to neutral — prevents stale green/red after clearing
        for (.fid in c("var_X", "var_Y", "sd_X", "sd_Y",
                       "cross_product_sum", "covariance", "sd_product",
                       "correlation", "slope", "intercept",
                       "r_squared", "alienation", "f_stat", "model_p_value")) {
          if (!has_attempted(input[[.fid]])) {
            session$sendCustomMessage("markField", list(id = .fid, state = "neutral"))
            output[[paste0("msg_", .fid)]] <- renderUI(HTML(""))
          }
        }
      }
      
      # Final validation
      step1_result <- validate_step1()
      step3_result <- validate_step3()
      step4_result <- validate_step4(TRUE)
      step56_result <- validate_step56()
      step79_result <- validate_step79()
      step1012_result <- validate_step1012()
      step13_result <- validate_step13()
      step1415_result <- validate_step1415()
      
      if (identical(input$mode, "Correlation")) {
        all_steps_complete <- step1_result$ok && step3_result$ok && step4_result$ok && 
          step56_result$ok && step79_result$ok && step1012_result$ok
      } else {
        all_steps_complete <- step1_result$ok && step3_result$ok && step4_result$ok && 
          step56_result$ok && step79_result$ok && step1012_result$ok && step1415_result$ok
      }
      
      if (all_steps_complete) {
        unlocked(TRUE)
        session$sendCustomMessage("toggleViz", TRUE)
        NULL
      } else {
        unlocked(FALSE)
        session$sendCustomMessage("toggleViz", FALSE)
        NULL
      }
      
    }, error = function(e) {
      NULL
    })
  })
  
  # Plot generation
  output$plot_block <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)

    if (identical(input$mode, "Correlation")) {
      return(tagList(
        plotOutput("scatter_plot", height = 330)
      ))
    }

    tagList(
      plotOutput("scatter_plot", height = 330),
      plotOutput("resid_plot", height = 210),
      plotOutput("calib_plot", height = 210)
    )
  })
  
  output$scatter_plot <- renderPlot({
    req(unlocked())
    df <- current()
    x <- xvars()[1]
    y <- yvar()
    if (is.null(df) || is.null(x) || is.null(y)) return(NULL)
    plot_title <- if (identical(input$mode, "Correlation")) "Correlatie" else "Bivariate Regressie"
    
    ggplot(df, aes(.data[[x]], .data[[y]])) +
      geom_point(size=3, alpha=0.8, color="steelblue") +
      geom_smooth(method="lm", se=FALSE, linewidth=1.4, color="darkred") +
      labs(x=x, y=y, title=plot_title) + 
      theme_minimal(base_size=13) +
      theme(plot.title = element_text(hjust = 0.5))
  })
  
  output$resid_plot <- renderPlot({
    req(unlocked())
    df <- current()
    x <- xvars()[1]
    y <- yvar()
    if (is.null(df) || is.null(x) || is.null(y)) return(NULL)
    
    fit <- lm(df[[y]] ~ df[[x]])
    ggplot(data.frame(X=df[[x]], Resid=residuals(fit)), aes(X, Resid)) +
      geom_hline(yintercept = 0, linetype = 2, color="red") +
      geom_point(size = 2.6, alpha=0.7) +
      labs(x = x, y = "Residuen (Y − Ŷ)", title="Residuenplot") + 
      theme_minimal(base_size = 12) +
      theme(plot.title = element_text(hjust = 0.5))
  })
  
  output$calib_plot <- renderPlot({
    req(unlocked())
    df <- current()
    x <- xvars()[1]
    y <- yvar()
    if (is.null(df) || is.null(x) || is.null(y)) return(NULL)
    
    fit <- lm(df[[y]] ~ df[[x]])
    ggplot(data.frame(Yhat=fitted(fit), Y=df[[y]]), aes(Yhat, Y)) +
      geom_abline(slope = 1, intercept = 0, linetype = 2, linewidth=0.8, color="red") +
      geom_point(size=2.8, alpha=0.7) +
      labs(x = "Voorspeld (Ŷ)", y = "Geobserveerd (Y)", title="Kalibratieplot") + 
      theme_minimal(base_size=12) +
      theme(plot.title = element_text(hjust = 0.5))
  })
  
  # Stats block
  output$stats_block <- renderUI({
    req(unlocked())
    df <- current()
    x <- xvars()[1]
    y <- yvar()
    if (is.null(df) || is.null(x) || is.null(y)) return(NULL)
    
    fit <- lm(df[[y]] ~ df[[x]])
    r <- cor(df[[x]], df[[y]])

    if (identical(input$mode, "Correlation")) {
      return(
        div(class="accent",
            h5("Statistieken Samenvatting"),
            tags$ul(
              tags$li(paste0("Correlatie (r): ", round(r, 4)))
            )
        )
      )
    }
    n_obs <- nrow(df)
    r2_val <- round(summary(fit)$r.squared, 4)
    f_val <- round((r2_val / 1) / ((1 - r2_val) / (n_obs - 2)), 4)
    p_val <- round(stats::pf(f_val, 1, n_obs - 2, lower.tail = FALSE), 4)
    
    div(class="accent",
        h5("Statistieken Samenvatting"),
        tags$ul(
          tags$li(paste0("Correlatie (r): ", round(r, 2))),
          tags$li(paste0("R²: ", round(summary(fit)$r.squared, 2))),
          tags$li(paste0("F-statistiek: ", f_val)),
          tags$li(paste0("Model p-waarde: ", p_val)),
          tags$li(paste0("Regressiecoëfficiënt (b): ", round(coef(fit)[2], 2))),
          tags$li(paste0("Intercept (a): ", round(coef(fit)[1], 2)))
        )
    )
  })
  
  # Interpretation block
  output$interpret_block <- renderUI({
    req(unlocked())
    df <- current()
    y <- yvar()
    xs <- xvars()
    if (is.null(df) || is.null(y) || length(xs) == 0) return(NULL)
    
    if (identical(input$mode, "Bivariate")) {
      fit <- lm(df[[y]] ~ df[[xs[1]]])
      b <- as.numeric(coef(fit)[2])
      r <- as.numeric(cor(df[[xs[1]]], df[[y]]))
      r2 <- r^2
      
      direction <- if (r > 0.1) "positieve" else if (r < -0.1) "negatieve" else "zwakke"
      strength <- if (abs(r) > 0.7) "sterke" else if (abs(r) > 0.3) "matige" else "zwakke"
      
      # Calculate precise percentages
      r2_percent <- round(100*r2, 2)
      unexplained_percent <- round(100*(1-r2), 2)
      
      # Determine if we should use "approximately" (if rounded significantly)
      r2_raw_percent <- 100*r2
      use_approx <- abs(r2_raw_percent - round(r2_raw_percent)) > 0.1
      
      HTML(sprintf(
        "<div class='accent'><h5>Interpretatie</h5>
        <p>Er is een <b>%s %s</b> samenhang (r = %.4f, R² = %.4f). 
        Een toename van 1 eenheid in <i>%s</i> gaat gemiddeld gepaard met een verandering van <b>%.4f</b> eenheden in <i>%s</i>.</p>
        <p>De determinatiecoëfficiënt R² van %.4f komt overeen met <b>%.2f%%</b> (%.4f × 100) wanneer uitgedrukt als percentage. 
        %s <b>%.2f%%</b> van de variantie in <i>%s</i> wordt verklaard door <i>%s</i>. 
        De resterende <b>%.2f%%</b> is onverklaarde variantie (vervreemdingscoëfficiënt).</p>
        <p><i>Let op: Samenhang betekent niet noodzakelijk causaliteit.</i></p></div>",
        strength, direction, r, r2, xs[1], b, y, 
        r2, r2_percent, r2,
        if(use_approx) "Ongeveer" else "Exact", 
        r2_percent, y, xs[1], unexplained_percent))
    } else {
      # Correlation mode
      r <- cor(df[[xs[1]]], df[[y]])
      strength <- if (abs(r) > 0.7) "sterke" else if (abs(r) > 0.4) "matige" else "zwakke"
      direction <- if (r > 0) "positieve" else "negatieve"
      
      div(class="accent",
          h5("Interpretatie"),
          p(paste0("Er is een ", strength, " ", direction, " lineaire samenhang tussen ", xs[1], " en ", y, ". De correlatiecoëfficiënt r = ", round(r, 4), "."))
      )
    }
  })
}

# Run the application
shinyApp(ui = ui, server = server)
