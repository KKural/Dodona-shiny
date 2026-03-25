# get_shinyapps_token.R
# ──────────────────────────────────────────────────────────────────────────────
# HOW TO GET YOUR shinyapps.io CREDENTIALS
# Run this script interactively in RStudio to retrieve your token and test a
# local deployment before wiring up GitHub Actions.
# ──────────────────────────────────────────────────────────────────────────────

# ── STEP 1: Install rsconnect if you don't have it ────────────────────────────
if (!requireNamespace("rsconnect", quietly = TRUE)) {
  install.packages("rsconnect")
}
library(rsconnect)


# ── STEP 2: Get your token from shinyapps.io ──────────────────────────────────
#
#  1. Go to  https://www.shinyapps.io  and log in.
#  2. Click your username (top-right) → "Tokens".
#  3. Click "Add Token" (or use an existing one).
#  4. Click "Show" → copy the three values shown:
#       - Account name  → SHINYAPPS_ACCOUNT
#       - Token         → SHINYAPPS_TOKEN
#       - Secret        → SHINYAPPS_SECRET
#
#  You can also click "Show secret" and copy the ready-made rsconnect::setAccountInfo()
#  call directly into the console.


# ── STEP 3: Authenticate locally ──────────────────────────────────────────────
# Paste your actual values here (do NOT commit this file once filled in):

# Recommended: store credentials in ~/.Renviron (never in this file):
#   SHINYAPPS_ACCOUNT=statistiek-in-de-criminologie
#   SHINYAPPS_TOKEN=your_new_token_here
#   SHINYAPPS_SECRET=your_new_secret_here
# Then restart R so readRenviron takes effect, and run:
readRenviron("~/.Renviron")

rsconnect::setAccountInfo(
  name   = Sys.getenv("SHINYAPPS_ACCOUNT"),  # statistiek-in-de-criminologie
  token  = Sys.getenv("SHINYAPPS_TOKEN"),
  secret = Sys.getenv("SHINYAPPS_SECRET")
)


# ── STEP 4: Test local deployment ─────────────────────────────────────────────
# Point appDir at the folder containing your app.R (or ui.R + server.R).
# Change the path and appName to match your setup.

rsconnect::deployApp(
  appDir         = "shiny_app",          # relative to this script's location
  appName        = "my-shiny-app",       # URL slug on shinyapps.io — rename as desired
  account        = Sys.getenv("SHINYAPPS_ACCOUNT"),  # statistiek-in-de-criminologie
  forceUpdate    = TRUE,
  launch.browser = TRUE                  # opens the deployed app when done
)


# ── STEP 5: Add secrets to GitHub ─────────────────────────────────────────────
#
#  Once the local deployment works, add the three values as repository secrets:
#
#  1. Go to your GitHub repo → Settings → Secrets and variables → Actions.
#  2. Click "New repository secret" for each of the following:
#
#     Name                  Value
#     ──────────────────    ─────────────────────────────
#     SHINYAPPS_ACCOUNT     your shinyapps.io account name
#     SHINYAPPS_TOKEN       the token string
#     SHINYAPPS_SECRET      the secret string
#
#  3. Push a change to shiny_app/ on the main branch to trigger the workflow.
#     Check progress under your repo's "Actions" tab.


# ── NOTES ─────────────────────────────────────────────────────────────────────
#
#  • Never commit token/secret values to git. Use .Renviron for local storage:
#      SHINYAPPS_ACCOUNT=...
#      SHINYAPPS_TOKEN=...
#      SHINYAPPS_SECRET=...
#    Then load with: readRenviron("~/.Renviron")
#
#  • The GitHub Actions workflow (.github/workflows/deploy-shiny.yml) reads the
#    same three values from GitHub Secrets automatically on every push to main
#    that touches the shiny_app/ folder.
#
#  • To check which apps are currently deployed:
rsconnect::applications()
