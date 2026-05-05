# Static Teaching Apps — Deployment Guide

## 1. Project Overview

### Purpose

Interactive statistics apps for undergraduate criminology students at Ghent University. Topics covered:

- **ANOVA** — one-way analysis of variance with deviation table
- **Correlation & Regression** — bivariate and multiple regression
- **Partial Correlation** — controlling for third variables

### Migration from R Shiny → Static HTML + JS

The apps were originally built in R Shiny (hosted via `shiny-server`). They have been rewritten as **pure static HTML + JavaScript** (no server-side R required) to eliminate dependency on an active R process per session.

| Aspect | R Shiny | Static JS |
|---|---|---|
| Server requirement | R + shiny-server | Nginx only |
| Concurrent users | ~20–50 before slowdown | 100–600+ |
| Deployment | R package + restart | `rsync` + `nginx -s reload` |
| State management | Reactive session | In-memory JS (`state` object) |

### Scalability Goal

Support **100–600 simultaneous students** during supervised lab sessions without degradation.

---

## 2. Architecture

```
Local machine (VS Code)
        │
        │  git push
        ▼
  GitHub repository
  (github.com/…/Dodona)
        │
        │  git pull (on VM)
        ▼
  Ubuntu VM
  ├── ~/deploy_static_apps.sh   ← deployment script
  └── /var/www/html/
      ├── app_anova/            ← served by Nginx
      ├── app_correlatie_regressie/
      ├── app_meervoudige_regressie/
      ├── app_meervoudige_regressie_interactie/
      └── app_partiele_correlatie/

  Nginx (port 80 / 443)
  └── location /app_anova/ → alias /var/www/html/app_anova/
```

---

## 3. App Structure

Every app follows the same layout:

```
app_<name>/
└── static/
    ├── index.html      # entry point — all markup and HOT table containers
    ├── app.js          # all logic: scenario data, rendering, validation
    └── style.css       # layout and component styles
```

The **ANOVA app** additionally contains:

```
app_anova/
├── static/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── www/
    ├── images/         # supplementary figures
    └── pdfs/           # formula sheets, reference tables
```

### Key JS Libraries (loaded via CDN — no build step required)

| Library | Version | Purpose |
|---|---|---|
| Handsontable | 14.6.0 | Interactive data tables |
| Chart.js | 4.x | Boxplot, SS decomposition, CI charts |

---

## 4. Deployment Workflow

### One-time Setup (VM)

```bash
# Clone the repo on the VM (first time only)
cd ~
git clone https://github.com/<your-org>/Dodona.git

# Create web root directories
sudo mkdir -p /var/www/html/app_anova
sudo mkdir -p /var/www/html/app_correlatie_regressie
sudo mkdir -p /var/www/html/app_meervoudige_regressie
sudo mkdir -p /var/www/html/app_meervoudige_regressie_interactie
sudo mkdir -p /var/www/html/app_partiele_correlatie
```

### Deploy Script

Save as `~/deploy_static_apps.sh` on the VM:

```bash
#!/bin/bash
set -euo pipefail

REPO_DIR="$HOME/Dodona/shiny_apps"
WEB_ROOT="/var/www/html"
WEB_USER="www-data"

echo "==> Pulling latest changes from GitHub..."
cd "$REPO_DIR"
git pull origin main

echo "==> Syncing apps to web root..."

rsync -av --delete \
  "$REPO_DIR/app_anova/static/" \
  "$WEB_ROOT/app_anova/"

rsync -av --delete \
  "$REPO_DIR/app_anova/www/" \
  "$WEB_ROOT/app_anova/www/"

rsync -av --delete \
  "$REPO_DIR/app_correlatie_regressie/static/" \
  "$WEB_ROOT/app_correlatie_regressie/"

rsync -av --delete \
  "$REPO_DIR/app_meervoudige_regressie/static/" \
  "$WEB_ROOT/app_meervoudige_regressie/"

rsync -av --delete \
  "$REPO_DIR/app_meervoudige_regressie_interactie/static/" \
  "$WEB_ROOT/app_meervoudige_regressie_interactie/"

rsync -av --delete \
  "$REPO_DIR/app_partiele_correlatie/static/" \
  "$WEB_ROOT/app_partiele_correlatie/"

echo "==> Setting permissions..."
sudo chown -R "$WEB_USER:$WEB_USER" "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

echo "==> Reloading Nginx..."
sudo nginx -s reload

echo ""
echo "✓ Deployment complete."
echo "  Apps live at http://<your-vm-ip>/app_anova/ etc."
```

Make it executable (one-time):

```bash
chmod +x ~/deploy_static_apps.sh
```

### Routine Deployment (Every Time)

```bash
# 1. On your local machine — commit and push changes
git add .
git commit -m "fix: update ANOVA HOT5 alignment"
git push origin main

# 2. SSH into the VM
ssh <user>@<vm-ip>

# 3. Run the deploy script
~/deploy_static_apps.sh
```

---

## 5. Nginx Configuration

Edit `/etc/nginx/sites-available/default` (or your site config):

```nginx
server {
    listen 80;
    server_name <your-domain-or-ip>;

    # ── Static teaching apps ──────────────────────────────────────────

    location /app_anova/ {
        alias /var/www/html/app_anova/;
        index index.html;
        try_files $uri $uri/ /app_anova/index.html;
    }

    location /app_correlatie_regressie/ {
        alias /var/www/html/app_correlatie_regressie/;
        index index.html;
        try_files $uri $uri/ /app_correlatie_regressie/index.html;
    }

    location /app_meervoudige_regressie/ {
        alias /var/www/html/app_meervoudige_regressie/;
        index index.html;
        try_files $uri $uri/ /app_meervoudige_regressie/index.html;
    }

    location /app_meervoudige_regressie_interactie/ {
        alias /var/www/html/app_meervoudige_regressie_interactie/;
        index index.html;
        try_files $uri $uri/ /app_meervoudige_regressie_interactie/index.html;
    }

    location /app_partiele_correlatie/ {
        alias /var/www/html/app_partiele_correlatie/;
        index index.html;
        try_files $uri $uri/ /app_partiele_correlatie/index.html;
    }

    # ── Fallback: legacy R Shiny apps (if still running on port 3838) ──

    location /shiny/ {
        proxy_pass http://127.0.0.1:3838/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 60s;
    }
}
```

Apply the config:

```bash
sudo nginx -t          # test config syntax
sudo nginx -s reload   # apply without downtime
```

---

## 6. Common Issues & Fixes

### Firewall blocking port 80 or 443

```bash
sudo ufw allow 'Nginx Full'
sudo ufw status
```

If using a cloud VM (GCP, AWS, Azure), also check the **instance firewall rules** in the console — inbound TCP 80/443 must be allowed.

---

### Wrong files deployed (scp vs git mismatch)

**Symptom:** Changes visible locally but not on the server.

**Cause:** File was uploaded manually via `scp` to a path that `rsync` then overwrites, or vice versa.

**Fix:** Always use the deploy script. Never `scp` individual files after the workflow is established. If you did, just re-run `~/deploy_static_apps.sh`.

---

### Browser caching showing stale version

**Fix:** Hard-refresh in the browser:

```
Windows / Linux:  Ctrl + Shift + R
macOS:            Cmd + Shift + R
```

For persistent cache busting during development, open DevTools → Network tab → check **Disable cache**.

---

### Chart.js not loaded / charts blank

**Symptom:** Boxplot or SS chart containers are empty; console shows `Chart is not defined`.

**Cause:** CDN unreachable (no internet on VM or in classroom network), or a typo in the `<script>` tag.

**Fix:**

1. Check the CDN URL in `index.html` matches the installed version.
2. If the classroom network blocks CDNs, self-host Chart.js:

```bash
# Download once to the app's static folder
curl -o /var/www/html/app_anova/chart.min.js \
  https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js
```

Then update `index.html`:

```html
<!-- Replace CDN reference with local path -->
<script src="chart.min.js"></script>
```

---

### `file://` vs `http://` issues

**Symptom:** App works when opened as a local file but breaks on the server (or vice versa).

**Cause:** Relative paths behave differently under `file://`. JS `fetch()` calls are blocked by CORS when using `file://`.

**Rule:** Always test via `http://localhost/...` or the VM URL — never by double-clicking `index.html`.

Quick local test server:

```bash
# From the app's static/ folder
python -m http.server 8080
# Then open http://localhost:8080
```

---

## 7. Final Workflow (Summary)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Edit code locally (VS Code)                                │
│                                                                 │
│   2. git add . && git commit -m "…" && git push origin main     │
│                                                                 │
│   3. ssh <user>@<vm-ip>                                         │
│                                                                 │
│   4. ~/deploy_static_apps.sh                                    │
│                                                                 │
│   5. Open browser → http://<vm-ip>/app_anova/   ✓ Done         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

That's it. No R process, no package installs, no service restarts beyond `nginx -s reload`.

---

## 8. Future Improvements

| Improvement | Description | Effort |
|---|---|---|
| **GitHub Actions auto-deploy** | Push to `main` triggers SSH + deploy script automatically via a CI workflow | Medium |
| **HTTPS / TLS** | Add Let's Encrypt certificate via `certbot --nginx` | Low |
| **CDN caching** | Put Cloudflare or similar in front of Nginx; cache static assets at edge nodes near Ghent | Medium |
| **Self-hosted JS libs** | Bundle Handsontable + Chart.js locally to remove CDN dependency in restricted networks | Low |
| **Load testing** | Run `locust` or `k6` against the VM at 600 concurrent users to verify Nginx holds | Medium |
| **Versioned deploys** | Tag each release in Git; keep previous deploy in `/var/www/html/<app>_prev/` for instant rollback | Low |

---

*Last updated: May 2026 — UGent Criminology, Interactive Statistics Lab*
