from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import pandas as pd
from shiny import App, reactive, render, ui


def clamp_int(value: float | int | None, low: int, high: int, default: int) -> int:
    try:
        out = int(value)
    except (TypeError, ValueError):
        out = default
    return max(low, min(high, out))


def parse_student_number(value: float | int | None) -> float | None:
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(out) or math.isinf(out):
        return None
    return out


def is_close_4dp(a: float | None, b: float | None) -> bool:
    if a is None or b is None:
        return False
    return abs(a - b) <= 0.0005


@dataclass
class Diagnosis:
    status: str
    why: str | None = None
    cause: str | None = None
    correction: str | None = None


def diagnose(student_value: float | None, true_value: float, patterns: list[dict], field_label: str, hint: str) -> Diagnosis:
    if student_value is None:
        return Diagnosis("missing")
    if is_close_4dp(student_value, true_value):
        return Diagnosis("correct")
    for pattern in patterns:
        if is_close_4dp(student_value, pattern["value"]):
            return Diagnosis(
                "wrong",
                why=pattern["why"],
                cause=pattern.get("cause"),
                correction=pattern.get("correction", hint),
            )
    return Diagnosis("wrong", why=f"{field_label} is not correct.", correction=hint)


def feedback_block(diag: Diagnosis):
    if diag.status in {"correct", "missing"}:
        return None
    parts: list[str] = []
    if diag.why:
        parts.append(f"<b>Why this is wrong:</b> {diag.why}")
    if diag.cause:
        parts.append(f"<b>Likely cause:</b> {diag.cause}")
    if diag.correction:
        parts.append(f"<b>How to correct it:</b> {diag.correction}")
    return ui.div(ui.HTML("<br/>".join(parts)), class_="feedback")


def make_dataset(seed: int, n: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    x = rng.normal(loc=55, scale=11, size=n)
    noise = rng.normal(loc=0, scale=8, size=n)
    y = 18 + 0.7 * x + noise
    return pd.DataFrame({"X": np.round(x, 2), "Y": np.round(y, 2)})


def sample_variance(series: pd.Series) -> float:
    return float(((series - series.mean()) ** 2).sum() / (len(series) - 1))


def sample_covariance(x: pd.Series, y: pd.Series) -> float:
    return float(((x - x.mean()) * (y - y.mean())).sum() / (len(x) - 1))


def summarize_dataset(df: pd.DataFrame) -> dict[str, float]:
    x = df["X"]
    y = df["Y"]
    sum_x = float(x.sum())
    sum_y = float(y.sum())
    mean_x = float(x.mean())
    mean_y = float(y.mean())
    ss_x = float(((x - mean_x) ** 2).sum())
    var_x = sample_variance(x)
    sd_x = math.sqrt(var_x)
    sd_y = math.sqrt(sample_variance(y))
    cov_xy = sample_covariance(x, y)
    corr_xy = float(x.corr(y))
    slope = cov_xy / var_x
    r_squared = corr_xy**2
    return {
        "n": float(len(df)),
        "sum_x": sum_x,
        "sum_y": sum_y,
        "mean_x": mean_x,
        "mean_y": mean_y,
        "ss_x": ss_x,
        "var_x": var_x,
        "sd_x": sd_x,
        "sd_y": sd_y,
        "cov_xy": cov_xy,
        "corr_xy": corr_xy,
        "slope": slope,
        "r_squared": r_squared,
    }


app_ui = ui.page_fluid(
    ui.tags.style(
        """
        .app-shell { max-width: 1180px; margin: 0 auto; }
        .hero {
            margin: 20px 0 14px 0;
            padding: 20px 24px;
            background: linear-gradient(135deg, #f2efe5 0%, #dbe8d8 100%);
            border-radius: 18px;
            border: 1px solid #c8d8c5;
        }
        .hero h2 { margin: 0 0 8px 0; color: #21312a; }
        .hero p { margin: 0; color: #2f4338; }
        .step-card {
            background: #fffdf8;
            border: 1px solid #ded7c8;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 8px 24px rgba(38, 53, 38, 0.06);
        }
        .step-card h4 { margin-top: 0; color: #223127; }
        .feedback {
            margin-top: 10px;
            padding: 10px 12px;
            border-radius: 12px;
            background: #fff3eb;
            border-left: 4px solid #b64c1b;
            color: #40251a;
        }
        .ok-box {
            margin-top: 14px;
            padding: 12px 14px;
            border-radius: 12px;
            background: #e8f6e8;
            border-left: 4px solid #2c7a3f;
            color: #1c4d27;
        }
        .formula {
            color: #46584d;
            font-size: 0.95rem;
            margin-bottom: 10px;
        }
        """
    ),
    ui.div(
        ui.div(
            ui.h2("Sample Correlation App in Shiny for Python"),
            ui.p(
                "This pilot mirrors your current teaching flow: generate a dataset, "
                "enter intermediate results, and receive misconception-based feedback."
            ),
            class_="hero",
        ),
        ui.layout_sidebar(
            ui.sidebar(
                ui.input_numeric("seed", "Seed", 123),
                ui.input_numeric("n", "Number of observations", 12, min=8, max=24),
                ui.input_action_button("regenerate", "Generate dataset"),
                ui.hr(),
                ui.p("Use 4 decimals for all answers."),
            ),
            ui.row(
                ui.column(
                    6,
                    ui.h4("Dataset"),
                    ui.output_data_frame("data_view"),
                ),
                ui.column(
                    6,
                    ui.div(
                        ui.h4("Step 1. Means"),
                        ui.p("Mean(X) = sum(X) / n and Mean(Y) = sum(Y) / n", class_="formula"),
                        ui.input_numeric("mean_x", "Mean(X)", value=None, step=0.0001),
                        ui.output_ui("msg_mean_x"),
                        ui.input_numeric("mean_y", "Mean(Y)", value=None, step=0.0001),
                        ui.output_ui("msg_mean_y"),
                        class_="step-card",
                    ),
                    ui.div(
                        ui.h4("Step 2. Variance and SD"),
                        ui.p("Var(X) = sum((X - Xbar)^2) / (n - 1), SD(X) = sqrt(Var(X))", class_="formula"),
                        ui.input_numeric("var_x", "Var(X)", value=None, step=0.0001),
                        ui.output_ui("msg_var_x"),
                        ui.input_numeric("sd_x", "SD(X)", value=None, step=0.0001),
                        ui.output_ui("msg_sd_x"),
                        class_="step-card",
                    ),
                    ui.div(
                        ui.h4("Step 3. Correlation, slope, and R^2"),
                        ui.p(
                            "r = Cov(X,Y) / (SD(X) * SD(Y)), b = Cov(X,Y) / Var(X), R^2 = r^2",
                            class_="formula",
                        ),
                        ui.input_numeric("corr_xy", "Correlation r", value=None, step=0.0001),
                        ui.output_ui("msg_corr_xy"),
                        ui.input_numeric("slope", "Slope b", value=None, step=0.0001),
                        ui.output_ui("msg_slope"),
                        ui.input_numeric("r_squared", "R^2", value=None, step=0.0001),
                        ui.output_ui("msg_r_squared"),
                        class_="step-card",
                    ),
                    ui.output_ui("completion_message"),
                ),
            ),
        ),
        class_="app-shell",
    ),
)


def server(input, output, session):
    current_df = reactive.value(make_dataset(seed=123, n=12))

    @reactive.effect
    @reactive.event(input.regenerate)
    def _refresh_data():
        seed = clamp_int(input.seed(), 1, 999999, 123)
        n = clamp_int(input.n(), 8, 24, 12)
        current_df.set(make_dataset(seed=seed, n=n))

    @reactive.calc
    def truth():
        return summarize_dataset(current_df.get())

    def number_input(input_id: str) -> float | None:
        return parse_student_number(getattr(input, input_id)())

    @render.data_frame
    def data_view():
        return render.DataGrid(current_df.get())

    @render.ui
    def msg_mean_x():
        t = truth()
        student = number_input("mean_x")
        diag = diagnose(
            student,
            t["mean_x"],
            patterns=[
                {
                    "value": t["sum_x"],
                    "why": f"You entered the sum of X ({t['sum_x']:.4f}) instead of the mean.",
                    "cause": "You stopped at sum(X) and did not divide by n.",
                    "correction": f"Mean(X) = {t['sum_x']:.4f} / {int(t['n'])} = {t['mean_x']:.4f}.",
                },
                {
                    "value": t["mean_y"],
                    "why": f"You entered Mean(Y) ({t['mean_y']:.4f}) in the Mean(X) field.",
                    "cause": "The X and Y columns were swapped.",
                    "correction": f"Recalculate the mean from the X column only. Mean(X) = {t['mean_x']:.4f}.",
                },
            ],
            field_label="Mean(X)",
            hint=f"Mean(X) = sum(X) / n = {t['mean_x']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_mean_y():
        t = truth()
        student = number_input("mean_y")
        diag = diagnose(
            student,
            t["mean_y"],
            patterns=[
                {
                    "value": t["sum_y"],
                    "why": f"You entered the sum of Y ({t['sum_y']:.4f}) instead of the mean.",
                    "cause": "You stopped at sum(Y) and did not divide by n.",
                    "correction": f"Mean(Y) = {t['sum_y']:.4f} / {int(t['n'])} = {t['mean_y']:.4f}.",
                },
                {
                    "value": t["mean_x"],
                    "why": f"You entered Mean(X) ({t['mean_x']:.4f}) in the Mean(Y) field.",
                    "cause": "The X and Y columns were swapped.",
                    "correction": f"Recalculate the mean from the Y column only. Mean(Y) = {t['mean_y']:.4f}.",
                },
            ],
            field_label="Mean(Y)",
            hint=f"Mean(Y) = sum(Y) / n = {t['mean_y']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_var_x():
        t = truth()
        student = number_input("var_x")
        pop_var = t["ss_x"] / t["n"]
        diag = diagnose(
            student,
            t["var_x"],
            patterns=[
                {
                    "value": t["ss_x"],
                    "why": f"You entered the sum of squared deviations ({t['ss_x']:.4f}) instead of the variance.",
                    "cause": "You forgot the final division by n - 1.",
                    "correction": f"Var(X) = {t['ss_x']:.4f} / {int(t['n']) - 1} = {t['var_x']:.4f}.",
                },
                {
                    "value": pop_var,
                    "why": f"You divided by n ({int(t['n'])}) instead of n - 1.",
                    "cause": "You used the population formula instead of the sample formula.",
                    "correction": f"Sample variance uses n - 1. Var(X) = {t['ss_x']:.4f} / {int(t['n']) - 1} = {t['var_x']:.4f}.",
                },
                {
                    "value": t["sd_x"],
                    "why": f"You entered SD(X) ({t['sd_x']:.4f}) in the variance field.",
                    "cause": "You took the square root too early.",
                    "correction": f"Variance is before the square root. Var(X) = {t['var_x']:.4f}.",
                },
            ],
            field_label="Var(X)",
            hint=f"Var(X) = sum((X - Xbar)^2) / (n - 1) = {t['var_x']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_sd_x():
        t = truth()
        student = number_input("sd_x")
        sqrt_ss = math.sqrt(t["ss_x"])
        diag = diagnose(
            student,
            t["sd_x"],
            patterns=[
                {
                    "value": t["var_x"],
                    "why": f"You entered Var(X) ({t['var_x']:.4f}) instead of SD(X).",
                    "cause": "You did not take the square root.",
                    "correction": f"SD(X) = sqrt({t['var_x']:.4f}) = {t['sd_x']:.4f}.",
                },
                {
                    "value": sqrt_ss,
                    "why": f"You took the square root of the sum of squares directly ({sqrt_ss:.4f}).",
                    "cause": "You skipped the division by n - 1 before taking the square root.",
                    "correction": f"First compute Var(X), then take the square root: SD(X) = {t['sd_x']:.4f}.",
                },
            ],
            field_label="SD(X)",
            hint=f"SD(X) = sqrt(Var(X)) = {t['sd_x']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_corr_xy():
        t = truth()
        student = number_input("corr_xy")
        diag = diagnose(
            student,
            t["corr_xy"],
            patterns=[
                {
                    "value": t["cov_xy"],
                    "why": f"You entered the covariance ({t['cov_xy']:.4f}) instead of the correlation.",
                    "cause": "You stopped before dividing by SD(X) * SD(Y).",
                    "correction": f"r = Cov(X,Y) / (SD(X) * SD(Y)) = {t['corr_xy']:.4f}.",
                },
                {
                    "value": t["slope"],
                    "why": f"You entered the regression slope ({t['slope']:.4f}) instead of the correlation.",
                    "cause": "Slope uses Var(X) in the denominator, not SD(X) * SD(Y).",
                    "correction": f"Use the correlation formula. r = {t['corr_xy']:.4f}.",
                },
            ],
            field_label="Correlation r",
            hint=f"r = Cov(X,Y) / (SD(X) * SD(Y)) = {t['corr_xy']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_slope():
        t = truth()
        student = number_input("slope")
        diag = diagnose(
            student,
            t["slope"],
            patterns=[
                {
                    "value": t["corr_xy"],
                    "why": f"You entered the correlation ({t['corr_xy']:.4f}) instead of the slope.",
                    "cause": "The slope is not the same as r.",
                    "correction": f"b = Cov(X,Y) / Var(X) = {t['slope']:.4f}.",
                },
                {
                    "value": t["cov_xy"] / (t["sd_x"] ** 2),
                    "why": "You rebuilt the slope from covariance and SD(X)^2 instead of the variance value.",
                    "cause": "That shortcut hides whether the earlier variance step was correct.",
                    "correction": f"Use the direct variance result in the denominator. b = {t['slope']:.4f}.",
                },
                {
                    "value": t["sd_y"] / t["sd_x"],
                    "why": "You used SD(Y) / SD(X) as if the correlation were 1.",
                    "cause": "That formula only becomes the slope when multiplied by r.",
                    "correction": f"Use b = r * SD(Y) / SD(X), or directly Cov(X,Y) / Var(X). b = {t['slope']:.4f}.",
                },
            ],
            field_label="Slope b",
            hint=f"b = Cov(X,Y) / Var(X) = {t['slope']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def msg_r_squared():
        t = truth()
        student = number_input("r_squared")
        diag = diagnose(
            student,
            t["r_squared"],
            patterns=[
                {
                    "value": t["corr_xy"],
                    "why": f"You entered r ({t['corr_xy']:.4f}) instead of R^2.",
                    "cause": "R^2 is the square of the correlation.",
                    "correction": f"R^2 = r^2 = {t['corr_xy']:.4f}^2 = {t['r_squared']:.4f}.",
                },
                {
                    "value": abs(t["corr_xy"]),
                    "why": "You entered the absolute correlation instead of R^2.",
                    "cause": "The sign was removed, but the value was not squared.",
                    "correction": f"Square the correlation. R^2 = {t['r_squared']:.4f}.",
                },
            ],
            field_label="R^2",
            hint=f"R^2 = r^2 = {t['r_squared']:.4f}.",
        )
        return feedback_block(diag)

    @render.ui
    def completion_message():
        t = truth()
        checks = [
            is_close_4dp(number_input("mean_x"), t["mean_x"]),
            is_close_4dp(number_input("mean_y"), t["mean_y"]),
            is_close_4dp(number_input("var_x"), t["var_x"]),
            is_close_4dp(number_input("sd_x"), t["sd_x"]),
            is_close_4dp(number_input("corr_xy"), t["corr_xy"]),
            is_close_4dp(number_input("slope"), t["slope"]),
            is_close_4dp(number_input("r_squared"), t["r_squared"]),
        ]
        if all(checks):
            return ui.div(
                ui.HTML(
                    f"<b>All sampled steps are correct.</b><br/>"
                    f"The relationship is positive with r = {t['corr_xy']:.4f}, "
                    f"b = {t['slope']:.4f}, and R^2 = {t['r_squared']:.4f}."
                ),
                class_="ok-box",
            )
        return None


app = App(app_ui, server)
