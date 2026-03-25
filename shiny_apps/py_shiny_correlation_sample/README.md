# Shiny for Python pilot

This is a small pilot app that mirrors the teaching pattern of the R apps:

- random dataset generation
- step-by-step numeric inputs
- deterministic misconception feedback
- completion message when all checked answers are correct

## Local run

```powershell
cd "C:\Users\kukumar\OneDrive - UGent\My Projects\Dodona\py_shiny_correlation_sample"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
shiny run --reload app.py
```

The default local URL is usually `http://127.0.0.1:8000`.

## Deploy to shinyapps.io

Install the deployment CLI in the same virtual environment:

```powershell
pip install rsconnect-python
```

Add your shinyapps.io account once:

```powershell
rsconnect add --account <account-name> --name <nickname> --server shinyapps.io --token <token> --secret <secret>
```

Deploy the app directory:

```powershell
rsconnect deploy shiny . --name <nickname> --title py-shiny-correlation-pilot
```

## Notes

- This app is intentionally small. It is meant to help compare the Shiny for Python workflow with the existing R Shiny apps.
- Feedback is deterministic and local. No LLM or network service is used by the app itself.
