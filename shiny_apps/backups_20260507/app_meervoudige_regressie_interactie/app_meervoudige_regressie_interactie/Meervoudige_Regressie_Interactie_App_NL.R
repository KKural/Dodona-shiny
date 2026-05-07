suppressPackageStartupMessages({
  library(shiny)
  library(ggplot2)
  library(magrittr)
  library(rhandsontable)
})

MAX_SAMPLE_SIZE <- 40

`%||%` <- function(a, b) if (is.null(a)) b else a

safe_seed <- function(seed_in) {
  s <- suppressWarnings(as.numeric(seed_in))
  if (length(s) == 0 || is.na(s) || s <= 0) return(NULL)
  as.integer(abs(floor(s)) %% .Machine$integer.max)
}

clamp_vec <- function(v, lo, hi) pmin(hi, pmax(lo, v))

check_decimals <- function(user_val, true_val, digits = 4) {
  if (is.null(user_val) || is.null(true_val) || is.na(user_val) || is.na(true_val)) return(NA)
  round(user_val, digits) == round(true_val, digits)
}

has_attempted <- function(val) {
  !is.null(val) && nzchar(trimws(as.character(val))) && !is.na(suppressWarnings(as.numeric(val)))
}

scale_latent <- function(z, center, spread, bounds) {
  zz <- if (length(z) < 2 || sd(z) == 0) z else as.numeric(scale(z))
  round(clamp_vec(center + spread * zz, bounds[1], bounds[2]), 2)
}

scenarios <- list(
  list(
    id = "program_collective",
    title = "Programma-intensiteit x collectieve effectiviteit",
    vignette = "Onderzoek of programma-intensiteit sterker samenhangt met lagere inbraakcijfers in buurten met hogere collectieve effectiviteit.",
    entity = "Buurt",
    vars = list(x1 = "ProgrammaIntensiteit", x2 = "CollectieveEffectiviteit", y = "InbraakCijfer"),
    design = list(x1_center = 50, x1_scale = 14, x1_bounds = c(0, 100),
                  x2_center = 5.2, x2_scale = 2.0, x2_bounds = c(0, 10),
                  y_base = 26, b1 = -0.20, b2 = -1.05, b3 = -0.10,
                  rho = 0.30, noise = 3.4, y_bounds = c(0, 100))
  ),
  list(
    id = "policing_disorder",
    title = "Politie-aanwezigheid x buurtwanorde",
    vignette = "Onderzoek of extra politie-aanwezigheid vooral effect heeft in buurten met meer wanorde.",
    entity = "Straat",
    vars = list(x1 = "PolitieAanwezigheid", x2 = "WanordeIndex", y = "MeldingenAanPolitie"),
    design = list(x1_center = 22, x1_scale = 7, x1_bounds = c(0, 40),
                  x2_center = 5.5, x2_scale = 2.2, x2_bounds = c(0, 10),
                  y_base = 58, b1 = -0.55, b2 = 2.20, b3 = -0.09,
                  rho = 0.20, noise = 5.5, y_bounds = c(0, 120))
  ),
  list(
    id = "school_peers",
    title = "Schoolbinding x delinquente peers",
    vignette = "Onderzoek of schoolbinding vooral beschermend werkt wanneer blootstelling aan delinquente peers lager is.",
    entity = "Student",
    vars = list(x1 = "SchoolBinding", x2 = "DelinquentePeers", y = "DelictScore"),
    design = list(x1_center = 4.2, x1_scale = 1.1, x1_bounds = c(1, 7),
                  x2_center = 4.8, x2_scale = 2.1, x2_bounds = c(0, 10),
                  y_base = 46, b1 = -3.60, b2 = 2.10, b3 = 0.45,
                  rho = -0.15, noise = 6.0, y_bounds = c(0, 100))
  ),
  list(
    id = "reentry_support",
    title = "Nazorg x werkhervatting",
    vignette = "Onderzoek of nazorg sterker samenhangt met lager recidiverisico wanneer werkhervatting hoger is.",
    entity = "Deelnemer",
    vars = list(x1 = "NazorgUren", x2 = "WerkHervatting", y = "RecidiveRisico"),
    design = list(x1_center = 16, x1_scale = 5.5, x1_bounds = c(0, 35),
                  x2_center = 5.1, x2_scale = 2.0, x2_bounds = c(0, 10),
                  y_base = 54, b1 = -0.85, b2 = -1.50, b3 = -0.12,
                  rho = 0.25, noise = 5.2, y_bounds = c(0, 100))
  )
)

scenario_choices <- setNames(vapply(scenarios, `[[`, "", "id"), vapply(scenarios, `[[`, "", "title"))
get_sc <- function(id) Filter(function(x) identical(x$id, id), scenarios)[[1]]

make_data <- function(sc, n, seed = NULL) {
  n <- max(5, min(MAX_SAMPLE_SIZE, as.integer(n %||% 12)))
  ss <- safe_seed(seed)
  if (!is.null(ss)) set.seed(ss)
  rho <- sc$design$rho
  z1 <- rnorm(n)
  z2 <- rho * z1 + sqrt(max(0, 1 - rho^2)) * rnorm(n)
  x1 <- scale_latent(z1, sc$design$x1_center, sc$design$x1_scale, sc$design$x1_bounds)
  x2 <- scale_latent(z2, sc$design$x2_center, sc$design$x2_scale, sc$design$x2_bounds)
  x1c <- x1 - mean(x1)
  x2c <- x2 - mean(x2)
  int_term <- x1c * x2c
  y <- sc$design$y_base + sc$design$b1 * x1c + sc$design$b2 * x2c + sc$design$b3 * int_term + rnorm(n, 0, sc$design$noise)
  y <- round(clamp_vec(y, sc$design$y_bounds[1], sc$design$y_bounds[2]), 2)
  data.frame(
    Entity = paste(sc$entity, seq_len(n)),
    setNames(list(x1), sc$vars$x1),
    setNames(list(x2), sc$vars$x2),
    setNames(list(y), sc$vars$y),
    check.names = FALSE
  )
}

calc_truth <- function(df, y_var, x_vars) {
  X1 <- round(as.numeric(df[[x_vars[1]]]), 2)
  X2 <- round(as.numeric(df[[x_vars[2]]]), 2)
  Y  <- round(as.numeric(df[[y_var]]), 2)
  x1_bar <- round(mean(X1), 4); x2_bar <- round(mean(X2), 4); y_bar <- round(mean(Y), 4)
  x1c <- round(X1 - x1_bar, 4); x2c <- round(X2 - x2_bar, 4); yc <- round(Y - y_bar, 4)
  int_term <- round(x1c * x2c, 4)
  S11 <- round(sum(round(x1c^2, 4)), 4); S22 <- round(sum(round(x2c^2, 4)), 4); S33 <- round(sum(round(int_term^2, 4)), 4)
  S12 <- round(sum(round(x1c * x2c, 4)), 4); S13 <- round(sum(round(x1c * int_term, 4)), 4); S23 <- round(sum(round(x2c * int_term, 4)), 4)
  S1y <- round(sum(round(x1c * yc, 4)), 4); S2y <- round(sum(round(x2c * yc, 4)), 4); S3y <- round(sum(round(int_term * yc, 4)), 4)
  SST <- round(sum(round(yc^2, 4)), 4)
  X <- cbind(1, x1c, x2c, int_term)
  beta <- tryCatch(round(as.numeric(qr.solve(X, Y)), 4), error = function(e) rep(NA_real_, 4))
  names(beta) <- c("a", "b1", "b2", "b3")
  if (any(is.na(beta))) return(NULL)
  yhat <- round(as.numeric(X %*% beta), 4)
  SSE <- round(sum(round((Y - yhat)^2, 4)), 4)
  R2 <- if (SST == 0) 0 else round(1 - round(SSE / SST, 4), 4)
  X_add <- cbind(1, x1c, x2c)
  beta_add <- as.numeric(qr.solve(X_add, Y))
  yhat_add <- round(as.numeric(X_add %*% beta_add), 4)
  SSE_add <- round(sum(round((Y - yhat_add)^2, 4)), 4)
  R2_add <- if (SST == 0) 0 else round(1 - round(SSE_add / SST, 4), 4)
  delta_R2 <- round(R2 - R2_add, 4)
  x2_sd <- round(sd(x2c), 4); if (is.na(x2_sd) || x2_sd == 0) x2_sd <- 1
  list(
    x1_bar = x1_bar, x2_bar = x2_bar, y_bar = y_bar,
    S11 = S11, S22 = S22, S33 = S33, S12 = S12, S13 = S13, S23 = S23, S1y = S1y, S2y = S2y, S3y = S3y, SST = SST,
    a = beta["a"], b1 = beta["b1"], b2 = beta["b2"], b3 = beta["b3"],
    yhat = yhat, R2 = R2, R2_add = R2_add, delta_R2 = delta_R2, alienation = round(1 - R2, 4),
    x1c = x1c, x2c = x2c, int_term = int_term,
    x2_sd = x2_sd,
    slope_low = round(beta["b1"] + beta["b3"] * (-x2_sd), 4),
    slope_mean = round(beta["b1"], 4),
    slope_high = round(beta["b1"] + beta["b3"] * x2_sd, 4)
  )
}

ui <- fluidPage(
  tags$head(tags$style(HTML("
    body { background: #F6FAFF; }
    .card { background: white; padding: 14px 16px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,.08); margin-bottom: 14px; }
    .title { font-weight: 800; color: #3F51B5; }
    .muted { color: #666; }
    input.invalid { border: 2px solid #D50000 !important; background: #ffebee !important; }
    input.valid { border: 2px solid #00C853 !important; background: #e8f5e9 !important; }
    .disabled { opacity: .5; pointer-events: none; }
  "))),
  tags$head(tags$script(HTML("
    Shiny.addCustomMessageHandler('toggleViz', function(show) {
      var el = document.getElementById('viz_block'); if (!el) return;
      if (show) { el.classList.remove('disabled'); } else { el.classList.add('disabled'); }
    });
    Shiny.addCustomMessageHandler('markField', function(msg) {
      var el = document.getElementById(msg.id); if (!el) return;
      el.classList.remove('invalid', 'valid');
      if (msg.state === 'invalid') el.classList.add('invalid');
      if (msg.state === 'valid') el.classList.add('valid');
    });
  "))),
  titlePanel(div(class = "title", "Interactiemodel - oefeningen")),
  sidebarLayout(
    sidebarPanel(
      width = 4,
      div(class = "card",
          h4("Instellingen"),
          selectInput("scenario", "Scenario", choices = scenario_choices),
          numericInput("n", paste0("Steekproefgrootte N (5-", MAX_SAMPLE_SIZE, ")"), value = 12, min = 5, max = MAX_SAMPLE_SIZE, step = 1),
          textInput("seed", "Datasetcode (seed, optioneel)", value = ""),
          fluidRow(
            column(6, actionButton("gen", "Genereer dataset", class = "btn btn-success")),
            column(6, actionButton("rand", "Willekeurig scenario"))
          ),
          br(),
          div(class = "muted", HTML("Model: <code>Y = a + b1*X1c + b2*X2c + b3*(X1c*X2c)</code>"))
      ),
      div(class = "card",
          h4("Kernstappen"),
          tags$ol(
            tags$li("Bereken X1-, X2- en Y-gemiddelden."),
            tags$li("Bereken centred predictors en de interactieterm."),
            tags$li("Bereken de sommen van kwadraten en kruisproducten."),
            tags$li("Schat a, b1, b2 en b3."),
            tags$li("Bereken voorspellingen, R^2 en delta R^2.")
          )
      )
    ),
    mainPanel(
      div(class = "card", h4("Dataset"), rHandsontableOutput("data_view")),
      div(class = "card", h4("Scenario"), uiOutput("vignette")),
      div(class = "card",
          h4("Stap 1 - Gemiddelden"),
          numericInput("mean_X1", "Gemiddelde X1", value = NA, step = 0.0001), uiOutput("msg_mean_X1"),
          numericInput("mean_X2", "Gemiddelde X2", value = NA, step = 0.0001), uiOutput("msg_mean_X2"),
          numericInput("mean_Y", "Gemiddelde Y", value = NA, step = 0.0001), uiOutput("msg_mean_Y")
      ),
      div(class = "card",
          h4("Stap 2 - Totalen voor het interactiemodel"),
          numericInput("tot_S11", "S11 = Sigma(X1c^2)", value = NA, step = 0.0001), uiOutput("msg_tot_S11"),
          numericInput("tot_S22", "S22 = Sigma(X2c^2)", value = NA, step = 0.0001), uiOutput("msg_tot_S22"),
          numericInput("tot_S33", "S33 = Sigma(INT^2)", value = NA, step = 0.0001), uiOutput("msg_tot_S33"),
          numericInput("tot_S12", "S12 = Sigma(X1c*X2c)", value = NA, step = 0.0001), uiOutput("msg_tot_S12"),
          numericInput("tot_S13", "S13 = Sigma(X1c*INT)", value = NA, step = 0.0001), uiOutput("msg_tot_S13"),
          numericInput("tot_S23", "S23 = Sigma(X2c*INT)", value = NA, step = 0.0001), uiOutput("msg_tot_S23"),
          numericInput("tot_S1Y", "S1Y = Sigma(X1c*Yc)", value = NA, step = 0.0001), uiOutput("msg_tot_S1Y"),
          numericInput("tot_S2Y", "S2Y = Sigma(X2c*Yc)", value = NA, step = 0.0001), uiOutput("msg_tot_S2Y"),
          numericInput("tot_S3Y", "S3Y = Sigma(INT*Yc)", value = NA, step = 0.0001), uiOutput("msg_tot_S3Y"),
          numericInput("tot_SST", "SST = Sigma(Yc^2)", value = NA, step = 0.0001), uiOutput("msg_tot_SST")
      ),
      div(class = "card",
          h4("Stap 3 - Coefficienten"),
          numericInput("coef_a", "Intercept a", value = NA, step = 0.0001), uiOutput("msg_coef_a"),
          numericInput("coef_b1", "b1", value = NA, step = 0.0001), uiOutput("msg_coef_b1"),
          numericInput("coef_b2", "b2", value = NA, step = 0.0001), uiOutput("msg_coef_b2"),
          numericInput("coef_b3", "b3 (interactie)", value = NA, step = 0.0001), uiOutput("msg_coef_b3")
      ),
      div(class = "card",
          h4("Stap 4 - Voorspellingen"),
          div(class = "muted", "Gebruik de read-only centred predictors en INT in de tabel."),
          rHandsontableOutput("pred_table"),
          uiOutput("msg_predictions")
      ),
      div(class = "card",
          h4("Stap 5 - Model fit"),
          numericInput("fit_R2", "R^2 volledig model", value = NA, step = 0.0001), uiOutput("msg_fit_R2"),
          numericInput("fit_delta_R2", "Delta R^2", value = NA, step = 0.0001), uiOutput("msg_fit_delta_R2"),
          numericInput("fit_alienation", "Vervreemdingscoefficient", value = NA, step = 0.0001), uiOutput("msg_fit_alienation")
      ),
      uiOutput("success"),
      div(class = "card", h4("Visualisaties"), div(id = "viz_block", class = "disabled",
          plotOutput("interaction_plot", height = 360),
          plotOutput("calib_plot", height = 280),
          plotOutput("resid_plot", height = 240),
          uiOutput("interpret")
      ))
    )
  )
)

server <- function(input, output, session) {
  current <- reactiveVal(data.frame())
  xvars <- reactiveVal(character(0))
  yvar <- reactiveVal(NULL)
  pred_store <- reactiveVal(NULL)
  unlocked <- reactiveVal(FALSE)
  tick <- reactiveVal(0L)
  bump <- function() tick(isolate(tick()) + 1L)

  mark_field <- function(id, ok, msg_id, err = "") {
    state <- if (isTRUE(ok)) "valid" else if (identical(ok, FALSE)) "invalid" else "neutral"
    session$sendCustomMessage("markField", list(id = id, state = state))
    output[[msg_id]] <- renderUI({
      if (state == "valid") div(style = "color:#00C853;font-weight:700;", "OK")
      else if (state == "invalid") div(style = "color:#D50000;font-weight:700;", err)
      else NULL
    })
  }

  reset_inputs <- function() {
    ids <- c("mean_X1","mean_X2","mean_Y","tot_S11","tot_S22","tot_S33","tot_S12","tot_S13","tot_S23","tot_S1Y","tot_S2Y","tot_S3Y","tot_SST","coef_a","coef_b1","coef_b2","coef_b3","fit_R2","fit_delta_R2","fit_alienation")
    msgs <- c("msg_mean_X1","msg_mean_X2","msg_mean_Y","msg_tot_S11","msg_tot_S22","msg_tot_S33","msg_tot_S12","msg_tot_S13","msg_tot_S23","msg_tot_S1Y","msg_tot_S2Y","msg_tot_S3Y","msg_tot_SST","msg_coef_a","msg_coef_b1","msg_coef_b2","msg_coef_b3","msg_fit_R2","msg_fit_delta_R2","msg_fit_alienation","msg_predictions")
    for (id in ids) {
      session$sendInputMessage(id, list(value = ""))
      session$sendCustomMessage("markField", list(id = id, state = "neutral"))
    }
    for (id in msgs) output[[id]] <- renderUI(NULL)
    pred_store(NULL)
    unlocked(FALSE)
    session$sendCustomMessage("toggleViz", FALSE)
  }

  make_current <- function(random = FALSE) {
    sc <- if (random) sample(scenarios, 1)[[1]] else get_sc(input$scenario)
    if (random) updateSelectInput(session, "scenario", selected = sc$id)
    df <- make_data(sc, input$n, input$seed)
    current(df)
    xvars(names(df)[2:3])
    yvar(names(df)[4])
    reset_inputs()
    bump()
  }

  observeEvent(input$gen, make_current(FALSE))
  observeEvent(input$rand, make_current(TRUE))
  observe({ if (nrow(current()) == 0) make_current(FALSE) })
  observeEvent(reactiveValuesToList(input), bump(), ignoreInit = FALSE)

  output$data_view <- renderRHandsontable({
    df <- current(); if (nrow(df) == 0) return(NULL)
    rhandsontable(df, rowHeaders = FALSE, readOnly = TRUE, width = 800)
  })

  output$vignette <- renderUI({
    sc <- get_sc(input$scenario)
    HTML(paste0(
      "<b>", sc$title, "</b><br>",
      sc$vignette,
      "<br><br>",
      "x₁ = <b>", sc$vars$x1, "</b> | x₂ = <b>", sc$vars$x2, "</b> | Y = <b>", sc$vars$y, "</b>"
    ))
  })

  output$pred_table <- renderRHandsontable({
    df <- current(); xs <- xvars(); y <- yvar()
    if (nrow(df) == 0 || length(xs) != 2 || is.null(y)) return(NULL)
    truth <- calc_truth(df, y, xs)
    pred_name <- "Yhat = a + b1*X1c + b2*X2c + b3*INT"
    stored <- pred_store()
    yhat_col <- if (!is.null(stored) && pred_name %in% names(stored)) stored[[pred_name]] else rep(NA_real_, nrow(df))
    tbl <- data.frame(Entity = df[[1]], X1c = truth$x1c, X2c = truth$x2c, INT = truth$int_term, Y = df[[y]], Yhat = yhat_col, check.names = FALSE)
    names(tbl) <- c(names(df)[1], "X1c", "X2c", "INT", y, pred_name)
    rhandsontable(tbl, rowHeaders = FALSE, width = 1000, height = 36 + 24 * nrow(tbl)) %>%
      hot_col(1, readOnly = TRUE) %>% hot_col(2, readOnly = TRUE) %>% hot_col(3, readOnly = TRUE) %>% hot_col(4, readOnly = TRUE) %>% hot_col(5, readOnly = TRUE) %>%
      hot_col(6, type = "numeric", format = "0.0000", allowInvalid = TRUE)
  })

  observeEvent(input$pred_table, { if (!is.null(input$pred_table)) pred_store(hot_to_r(input$pred_table)) })

  observeEvent(tick(), {
    df <- current(); xs <- xvars(); y <- yvar()
    if (nrow(df) == 0 || length(xs) != 2 || is.null(y)) return()
    truth <- calc_truth(df, y, xs)

    vals <- list(
      mean_X1 = truth$x1_bar, mean_X2 = truth$x2_bar, mean_Y = truth$y_bar,
      tot_S11 = truth$S11, tot_S22 = truth$S22, tot_S33 = truth$S33, tot_S12 = truth$S12, tot_S13 = truth$S13, tot_S23 = truth$S23, tot_S1Y = truth$S1y, tot_S2Y = truth$S2y, tot_S3Y = truth$S3y, tot_SST = truth$SST,
      coef_a = truth$a, coef_b1 = truth$b1, coef_b2 = truth$b2, coef_b3 = truth$b3,
      fit_R2 = truth$R2, fit_delta_R2 = truth$delta_R2, fit_alienation = truth$alienation
    )

    for (id in names(vals)) {
      if (has_attempted(input[[id]])) {
        mark_field(id, check_decimals(suppressWarnings(as.numeric(input[[id]])), vals[[id]], 4), paste0("msg_", id), paste(id, "is onjuist."))
      }
    }

    pred_tbl <- pred_store()
    pred_name <- "Yhat = a + b1*X1c + b2*X2c + b3*INT"
    if (!is.null(pred_tbl) && pred_name %in% names(pred_tbl)) {
      user_preds <- suppressWarnings(as.numeric(pred_tbl[[pred_name]]))
      idx <- which(!is.na(user_preds))
      output$msg_predictions <- renderUI({
        if (length(idx) == 0) return(NULL)
        if (all(round(user_preds[idx], 4) == round(truth$yhat[idx], 4))) div(style = "color:#00C853;font-weight:700;", "Voorspellingen OK")
        else div(style = "color:#D50000;font-weight:700;", "Sommige voorspellingen zijn fout.")
      })
    }

    required <- names(vals)
    all_attempted <- all(vapply(required, function(id) has_attempted(input[[id]]), logical(1)))
    all_ok <- all(vapply(required, function(id) isTRUE(check_decimals(suppressWarnings(as.numeric(input[[id]])), vals[[id]], 4)), logical(1)))
    unlocked(all_attempted && all_ok)
    session$sendCustomMessage("toggleViz", all_attempted && all_ok)
  })

  output$success <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    div(class = "card", style = "background:#E8F5E9;border:2px solid #4CAF50;", h4("Volledig interactiemodel correct uitgewerkt"))
  })

  output$interaction_plot <- renderPlot({
    req(unlocked())
    df <- current(); xs <- xvars(); y <- yvar(); truth <- calc_truth(df, y, xs)
    X1 <- df[[xs[1]]]; X2 <- df[[xs[2]]]; Y <- df[[y]]
    x_seq <- seq(min(X1), max(X1), length.out = 100)
    levels <- data.frame(label = c("Lage X2 (-1 SD)", "Gemiddelde X2", "Hoge X2 (+1 SD)"), x2c = c(-truth$x2_sd, 0, truth$x2_sd))
    lines <- do.call(rbind, lapply(seq_len(nrow(levels)), function(i) {
      x1c <- x_seq - truth$x1_bar
      x2c <- levels$x2c[i]
      data.frame(x = x_seq, yhat = truth$a + truth$b1 * x1c + truth$b2 * x2c + truth$b3 * (x1c * x2c), group = levels$label[i])
    }))
    ggplot(data.frame(X1 = X1, Y = Y), aes(X1, Y)) +
      geom_point(color = "#607D8B", alpha = 0.7, size = 3) +
      geom_line(data = lines, aes(x = x, y = yhat, color = group), linewidth = 1.2) +
      labs(title = "Interactieplot", x = xs[1], y = y, color = "X2-niveau") +
      theme_minimal(base_size = 12)
  })

  output$calib_plot <- renderPlot({
    req(unlocked())
    df <- current(); xs <- xvars(); y <- yvar(); truth <- calc_truth(df, y, xs)
    ggplot(data.frame(Y = df[[y]], Yhat = truth$yhat), aes(Yhat, Y)) +
      geom_abline(slope = 1, intercept = 0, linetype = 2, color = "#D32F2F") +
      geom_point(color = "#1976D2", alpha = 0.75, size = 3) +
      geom_smooth(method = "lm", se = FALSE, color = "#388E3C") +
      labs(title = "Kalibratieplot", x = "Voorspeld", y = "Geobserveerd") +
      theme_minimal(base_size = 12)
  })

  output$resid_plot <- renderPlot({
    req(unlocked())
    df <- current(); xs <- xvars(); y <- yvar(); truth <- calc_truth(df, y, xs)
    ggplot(data.frame(Yhat = truth$yhat, resid = round(df[[y]] - truth$yhat, 4)), aes(Yhat, resid)) +
      geom_hline(yintercept = 0, color = "#D32F2F") +
      geom_point(color = "#5E35B1", alpha = 0.75, size = 3) +
      geom_smooth(se = FALSE, linetype = 2, color = "#F57C00") +
      labs(title = "Residuenplot", x = "Voorspeld", y = "Residuen") +
      theme_minimal(base_size = 12)
  })

  output$interpret <- renderUI({
    if (!isTRUE(unlocked())) return(NULL)
    df <- current(); xs <- xvars(); y <- yvar(); truth <- calc_truth(df, y, xs)
    direction <- if (truth$b3 > 0) "positief" else if (truth$b3 < 0) "negatief" else "nagenoeg nul"
    HTML(sprintf(
      "<b>Interpretatie</b><ul>
       <li>Model: %s ~ X1c + X2c + INT</li>
       <li>b1 = %.4f, b2 = %.4f, b3 = %.4f</li>
       <li>De interactie is <b>%s</b>.</li>
       <li>Simple slope bij lage X2: %.4f</li>
       <li>Simple slope bij gemiddelde X2: %.4f</li>
       <li>Simple slope bij hoge X2: %.4f</li>
       <li>R^2 = %.4f, Delta R^2 = %.4f, Vervreemdingscoefficient = %.4f</li>
       </ul>",
      y, truth$b1, truth$b2, truth$b3, direction, truth$slope_low, truth$slope_mean, truth$slope_high, truth$R2, truth$delta_R2, truth$alienation
    ))
  })
}

shinyApp(ui, server)
