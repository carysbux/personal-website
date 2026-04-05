import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, dcc, html

# ------------------------------
# LOAD DATA
# ------------------------------

df = pd.read_csv("data/processed/episode_full_dataset.csv")

emotion_cols = ["fear","anger","anticipation","trust","surprise",
                "positive","negative","sadness","disgust","joy"]

target_vars = [
    "IMDb Rating",
    "U.S. Viewers (Millions)",
    "Rotten Tomatoes Rating (Percentage)",
    "Metacritic Ratings",
    "Running Time (Minutes)"
]

# ------------------------------
# RUN ALL REGRESSION MODELS
# ------------------------------

r2_scores = []
coef_matrix = {}

for target in target_vars:
    df_clean = df.dropna(subset=[target])
    X = df_clean[emotion_cols]
    y = df_clean[target]

    model = LinearRegression()
    model.fit(X, y)

    # Store R²
    r2_scores.append({"Target": target, "R²": model.score(X, y)})

    # Save coefficients
    coef_matrix[target] = model.coef_

r2_df = pd.DataFrame(r2_scores)
coef_df = pd.DataFrame(coef_matrix, index=emotion_cols)

# Heatmap-friendly format
coef_abs_df = coef_df.abs()

# ------------------------------
# DASH APP
# ------------------------------

app = Dash(__name__)

app.layout = html.Div([
    html.H1("Episode Emotion Analysis Dashboard", style={"textAlign": "center"}),

    # ---- R² Comparison ----
    html.H2("Model R² Comparison"),
    dcc.Graph(
        figure=px.bar(r2_df, x="Target", y="R²", title="Model Predictive Power (R² Scores)")
    ),

    # ---- Coefficient Heatmap ----
    html.H2("Emotion Influence Heatmap"),
    html.P("Relative Importance of Emotions", style={"margin": "-0.5rem 0 1rem 0", "fontSize": "1.1rem", "color": "#555"}),
    dcc.Graph(
        figure=(
            px.imshow(
                coef_abs_df,
                labels=dict(
                    x="Target Variable",
                    y="Emotion",
                    color="Coefficient Strength"
                )
            )
            .update_xaxes(side="top", tickangle=-25, title=dict(text="Target Variable", standoff=50))
            .update_yaxes(automargin=True)
            .update_layout(
                height=500,
                margin=dict(l=120, r=80, t=200, b=80),
                coloraxis_colorbar=dict(thickness=20, len=0.75),
                autosize=True
            )
        )
    ),


    # ---- Coefficients by Target ----
    html.H2("Emotion Coefficients by Target Variable"),
    dcc.Dropdown(
        id="target-dropdown",
        options=[{"label": t, "value": t} for t in target_vars],
        value="IMDb Rating",
        style={"width": "50%"}
    ),
    dcc.Graph(id="coef-graph"),
])

# ------------------------------
# CALLBACK: update bar chart
# ------------------------------
from dash.dependencies import Input, Output

@app.callback(
    Output("coef-graph", "figure"),
    Input("target-dropdown", "value")
)
def update_coeff_graph(selected_target):
    values = coef_df[selected_target]
    fig = px.bar(
        x=emotion_cols,
        y=values,
        title=f"Regression Coefficients for {selected_target}",
        labels={"x": "Emotion", "y": "Coefficient"}
    )
    return fig


# ------------------------------
# RUN DASH APP
# ------------------------------

server = app.server

if __name__ == "__main__":
    app.run(debug=True)

