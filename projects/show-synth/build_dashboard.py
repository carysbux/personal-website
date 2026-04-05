"""
Build static HTML dashboard for GitHub Pages.
Run: python build_dashboard.py

Requires: data/processed/episode_full_dataset.csv (generate via notebooks 1→2→3→4→6)
Output: docs/index.html

Uses exact same logic as notebooks 7 and 8.
"""

import pandas as pd
import json
from pathlib import Path
from sklearn.linear_model import LinearRegression

# ------------------------------
# LOAD DATA (same as notebooks)
# ------------------------------

DATA_PATH = Path("data/processed/episode_full_dataset.csv")
OUTPUT_PATH = Path("docs/index.html")

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"{DATA_PATH} not found. Run notebooks 1→2→3→4→6 to generate it."
    )

df = pd.read_csv(DATA_PATH)

emotion_cols = [
    "fear", "anger", "anticipation", "trust", "surprise",
    "positive", "negative", "sadness", "disgust", "joy"
]

target_vars = [
    "IMDb Rating",
    "U.S. Viewers (Millions)",
    "Rotten Tomatoes Rating (Percentage)",
    "Metacritic Ratings",
    "Running Time (Minutes)"
]

target_slugs = ["imdb", "viewers", "rotten", "metacritic", "runtime"]

# ------------------------------
# RUN REGRESSION (same as notebook 8 cell 6)
# ------------------------------

r2_scores = []
coef_matrix = {}

for target in target_vars:
    df_clean = df.dropna(subset=[target])
    X = df_clean[emotion_cols]
    y = df_clean[target]

    model = LinearRegression()
    model.fit(X, y)

    r2_scores.append({"Target": target, "R²": model.score(X, y)})
    coef_matrix[target] = model.coef_.tolist()

r2_df = pd.DataFrame(r2_scores)
coef_df = pd.DataFrame(coef_matrix, index=emotion_cols)
coef_abs_df = coef_df.abs()

# ------------------------------
# BUILD FIGURES
# ------------------------------

# 1. R² bar chart - use plain arrays to avoid binary encoding
r2_values = [round(r, 6) for r in r2_df["R²"].tolist()]
r2_labels = r2_df["Target"].tolist()
best_target = r2_df.loc[r2_df["R²"].idxmax(), "Target"]
r2_summary = f"Among these targets, emotion scores best predict {best_target} (highest R²), so that model is the strongest for future predictions."

# 2. Heatmap - use plain arrays
heatmap_z = [[round(v, 4) for v in row] for row in coef_abs_df.values.tolist()]
heatmap_x = coef_abs_df.columns.tolist()
heatmap_y = coef_abs_df.index.tolist()

# 3. Coefficient data per target - plain arrays for JS
coef_data = {}
for target, slug in zip(target_vars, target_slugs):
    coef_data[slug] = [round(v, 4) for v in coef_df[target].tolist()]

# Summaries per target (shown under dropdown)
summaries = {
    "imdb": "Viewers on IMDb seem to reward episodes that feel more positive or emotionally uplifting. Episodes that lean heavily into negativity or shocking twists tend to score a bit lower.",
    "viewers": "Big emotional drama and shocking moments attract larger audiences. However, episodes that lean too heavily into disgust turn viewers away.",
    "rotten": "Disgust has the largest positive coefficient for Rotten Tomatoes. Critics penalize episodes with too much shock or anger/negativity.",
    "metacritic": "Surprise is negatively associated with Metacritic ratings. Similiar to Rotten Tomatoes, viewers and critics enjoy stronger emotions, positive or negative.",
    "runtime": "Longer episodes tend to build tension through fear and major twists. Anticipation and negative emotion correlate with shorter running times.",
}

# ------------------------------
# PREPARE DATA FOR JS RENDERING (plain JSON, no binary encoding)
# ------------------------------

r2_labels_js = json.dumps(r2_labels)
r2_values_js = json.dumps(r2_values)
heatmap_z_js = json.dumps(heatmap_z)
heatmap_x_js = json.dumps(heatmap_x)
heatmap_y_js = json.dumps(heatmap_y)

# ------------------------------
# BUILD PAGE WITH SINGLE COEF CHART + Plotly.react
# ------------------------------

dropdown_options = "".join(
    f'<option value="{slug}">{label}</option>'
    for slug, label in zip(target_slugs, target_vars)
)

# Embed data as JSON for JavaScript
emotion_cols_js = json.dumps(emotion_cols)
coef_data_js = json.dumps(coef_data)
target_labels_js = json.dumps(dict(zip(target_slugs, target_vars)))
summaries_js = json.dumps(summaries)

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Episode Emotion Analysis Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        * {{ box-sizing: border-box; }}
        body {{
            font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 960px;
            margin: 0 auto;
            padding: 2rem;
            background: #1a1a1a;
            color: #cccccc;
        }}
        .main-header {{
            text-align: center;
            margin-bottom: 1rem;
        }}
        .header-subtitle {{
            font-family: "Space Grotesk", sans-serif;
            font-size: 0.75rem;
            font-weight: 500;
            letter-spacing: 0.2em;
            color: #51E2B7;
            text-transform: uppercase;
            margin-bottom: 0.35rem;
        }}
        h1 {{
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
            font-size: 2.25rem;
            text-align: center;
            margin: 0;
            line-height: 1.2;
        }}
        h1 .gradient {{
            display: inline-block;
            background: linear-gradient(90deg, #FF6B00 0%, #FFB000 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        h1 .light {{ color: #ffffff; }}
        h2 {{ color: #4ecdc4; margin-top: 2.5rem; margin-bottom: 1rem; }}
        h3 {{ color: #7fdbda; margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.1rem; }}
        .intro-section, .end-section {{
            background: #303030;
            border-radius: 8px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }}
        .intro-section p, .end-section p, .end-section ul {{ margin: 0.5rem 0; color: #cccccc; line-height: 1.6; }}
        .end-section ul {{ padding-left: 1.5rem; }}
        .target-summary {{
            font-size: 0.95rem; color: #b0b0b0; line-height: 1.5;
            margin: 0.75rem 0 1rem 0; max-width: 640px;
        }}
        .chart-container {{
            background: #303030;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }}
        .plotly-graph-div {{ width: 100% !important; max-width: 100%; background: transparent !important; }}
        #target-dropdown {{
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid #444;
            background: #303030;
            color: #cccccc;
            min-width: 280px;
            margin-bottom: 1rem;
        }}
    </style>
</head>
<body>
    <div class="main-header">
        <p class="header-subtitle">Data Science Project</p>
        <h1><span class="gradient">Episode Emotion Analysis</span> <span class="light">Dashboard</span></h1>
        <p style="text-align: center; color: #a0a0a0; font-size: 0.95rem; margin-top: 0.5rem; max-width: 560px; margin-left: auto; margin-right: auto;">Sentiment analysis of Game of Thrones — emotional tone vs. episode ratings</p>
    </div>

    <div class="intro-section">
        <h2>Introduction</h2>
        <p>This dashboard explores the relationship between emotional tone in Game of Thrones episode synopses and various success metrics. Using sentiment analysis, we extract emotion scores from each episode's plot description and run linear regression against ratings and viewership data.</p>
        <h3>Goals</h3>
        <p>• Identify which emotions in episode synopses correlate with higher ratings (IMDb, Rotten Tomatoes, Metacritic).</p>
        <p>• Understand how emotional tone relates to U.S. viewership and episode running time.</p>
        <p>• Visualize the relative importance of each emotion across different target variables.</p>
    </div>

    <h2>Emotion Coefficients by Target Variable</h2>
    <select id="target-dropdown">
        {dropdown_options}
    </select>
    <p id="target-summary" class="target-summary"></p>
    <div class="chart-container">
        <div id="coef-chart" style="height:400px;"></div>
    </div>

    <h2>Model R² Comparison</h2>
    <p class="target-summary">{r2_summary}</p>
    <div class="chart-container">
        <div id="r2-chart" style="height:400px;"></div>
    </div>

    <h2>Emotion Influence Heatmap</h2>
    <p style="margin: -0.5rem 0 1rem 0; font-size: 1.1rem; color: #b0b0b0;">Relative Importance of Emotions</p>
    <div class="chart-container">
        <div id="heatmap-chart" style="height:800px; width:100%;"></div>
    </div>

    <div class="end-section">
        <h2>Issues</h2>
        <ul>
            <li>R² scores are modest; emotion scores alone explain a limited share of variance in ratings.</li>
            <li>Small sample size (73 episodes) limits statistical power.</li>
            <li>Synopsis text may not fully capture on-screen emotional content.</li>
        </ul>
        <h3>In the Future</h3>
        <ul>
            <li>Expand to dialogue or subtitle analysis for richer emotion signals.</li>
            <li>Include season-level or character-level aggregations.</li>
            <li>Test non-linear models or interaction terms.</li>
        </ul>
    </div>

    <script>
        var emotionCols = {emotion_cols_js};
        var coefData = {coef_data_js};
        var targetLabels = {target_labels_js};
        var summaries = {summaries_js};
        var r2Labels = {r2_labels_js};
        var r2Values = {r2_values_js};
        var heatmapZ = {heatmap_z_js};
        var heatmapX = {heatmap_x_js};
        var heatmapY = {heatmap_y_js};

        // R² chart
        Plotly.newPlot("r2-chart", [
            {{ x: r2Labels, y: r2Values, type: "bar", marker: {{ color: "#4ecdc4" }} }}
        ], {{
            title: {{ text: "Model Predictive Power (R² Scores)", font: {{ color: "#ffffff" }} }},
            margin: {{ t: 60, b: 120 }},
            height: 400,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "#303030",
            font: {{ family: "Space Grotesk, sans-serif", color: "#cccccc" }},
            xaxis: {{ title: {{ text: "Target", font: {{ color: "#b0b0b0" }} }}, gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.2)", tickfont: {{ color: "#cccccc" }} }},
            yaxis: {{ title: {{ text: "R²", font: {{ color: "#b0b0b0" }} }}, gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.2)", tickfont: {{ color: "#cccccc" }} }}
        }}, {{ responsive: true }});

        // Heatmap - Plotly dark mode style, high-contrast colorscale
        Plotly.newPlot("heatmap-chart", [{{
            z: heatmapZ,
            x: heatmapX,
            y: heatmapY,
            type: "heatmap",
            colorscale: [
                [0, "#2d1b4e"],
                [0.2, "#4a148c"],
                [0.4, "#7b1fa2"],
                [0.6, "#e65100"],
                [0.8, "#ff9800"],
                [1, "#ffeb3b"]
            ],
            zmin: Math.min(...heatmapZ.flat()),
            zmax: Math.max(...heatmapZ.flat()),
            line: {{ width: 1, color: "rgba(255,255,255,0.2)" }},
            colorbar: {{ title: "Coefficient Strength", thickness: 20, len: 0.75, tickfont: {{ color: "#e0e0e0", size: 11 }}, titlefont: {{ color: "#ffffff" }}, bgcolor: "rgba(0,0,0,0)", outlinewidth: 0 }},
            hovertemplate: "Target Variable: %{{x}}<br>Emotion: %{{y}}<br>Coefficient Strength: %{{z}}<extra></extra>"
        }}], {{
            xaxis: {{ title: {{ text: "Target Variable", standoff: 50, font: {{ color: "#e0e0e0" }} }}, side: "top", tickangle: -25, gridcolor: "rgba(255,255,255,0.15)", tickfont: {{ color: "#e0e0e0" }} }},
            yaxis: {{ title: {{ text: "Emotion", font: {{ color: "#e0e0e0" }} }}, autorange: "reversed", gridcolor: "rgba(255,255,255,0.15)", tickfont: {{ color: "#e0e0e0" }} }},
            margin: {{ l: 120, r: 80, t: 200, b: 80 }},
            autosize: true,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "#2a2a2a",
            font: {{ family: "Space Grotesk, sans-serif", color: "#e0e0e0" }}
        }}, {{ responsive: true }});

        function updateCoefChart(slug) {{
            var values = coefData[slug];
            var label = targetLabels[slug];
            document.getElementById("target-summary").textContent = summaries[slug] || "";
            var trace = {{
                x: emotionCols,
                y: values,
                type: "bar",
                marker: {{ color: "#ff6b35" }}
            }};
            var layout = {{
                title: {{ text: "Regression Coefficients for " + label, font: {{ color: "#ffffff" }} }},
                xaxis: {{ title: {{ text: "Emotion", font: {{ color: "#b0b0b0" }} }}, gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.2)", tickfont: {{ color: "#cccccc" }} }},
                yaxis: {{ title: {{ text: "Coefficient", font: {{ color: "#b0b0b0" }} }}, gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.2)", tickfont: {{ color: "#cccccc" }} }},
                margin: {{ t: 60, b: 80 }},
                height: 400,
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "#303030",
                font: {{ family: "Space Grotesk, sans-serif", color: "#cccccc" }}
            }};
            Plotly.react("coef-chart", [trace], layout, {{ responsive: true }});
        }}

        document.getElementById("target-dropdown").addEventListener("change", function() {{
            updateCoefChart(this.value);
        }});

        // Initial render
        updateCoefChart("imdb");
    </script>
</body>
</html>
"""

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(page, encoding="utf-8")
print(f"Dashboard built: {OUTPUT_PATH}")
