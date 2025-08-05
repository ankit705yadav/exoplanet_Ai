# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import io
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- Load All Models and Scaler ---
MODEL_NAMES = ['RandomForest', 'LogisticRegression', 'SVM', 'DecisionTree', 'NaiveBayes']
models = {}
scaler = None

print("--- Loading all models and scaler ---")
try:
    for name in MODEL_NAMES:
        model_path = f"{name}_model.pkl"
        models[name] = joblib.load(model_path)
        print(f"[+] Loaded model: {model_path}")
    
    scaler = joblib.load('scaler.pkl')
    print("[+] Loaded scaler: scaler.pkl")
    print("--- All models loaded successfully. ---")
except FileNotFoundError as e:
    print(f"[!!!] Error loading files: {e}. Make sure all model and scaler .pkl files are present.")
    models = {}
# ------------------------------------

@app.route('/analyze', methods=['POST'])
def analyze_disposition():
    # ... (This function remains unchanged)
    print("\n--- Received new analysis request ---")
    file = request.files.get('file')
    if not file: return jsonify({'error': 'No file provided'}), 400
    try:
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        if 'koi_disposition' not in df.columns: return jsonify({'error': "CSV must contain 'koi_disposition' column."}), 400
        counts = df['koi_disposition'].value_counts(normalize=True)
        percentages = (counts * 100).round(2).to_dict()
        return jsonify(percentages)
    except Exception as e: return jsonify({'error': f'Analysis error: {str(e)}'}), 500

@app.route('/predict', methods=['POST'])
def predict():
    # ... (This function remains unchanged)
    if not models or not scaler: return jsonify({'error': 'Server not ready for prediction.'}), 503
    print("\n--- Received new prediction request ---")
    model_name = request.form.get('model_name', 'RandomForest')
    model = models.get(model_name)
    if not model: return jsonify({'error': f"Model '{model_name}' not found."}), 404
    file = request.files.get('file')
    if not file: return jsonify({'error': 'No file provided'}), 400
    try:
        data = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        required_features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_insol', 'koi_prad']
        data.dropna(subset=required_features, inplace=True)
        if data.empty: return jsonify({'error': 'No valid rows for prediction.'}), 400
        features_data = data[required_features]
        scaled_features = scaler.transform(features_data)
        all_predictions = model.predict(scaled_features)
        exoplanet_count = int(np.sum(all_predictions))
        result = {
            'model_used': model_name,
            'exoplanet_detected_count': exoplanet_count,
            'no_exoplanet_detected_count': len(all_predictions) - exoplanet_count,
            'total_rows_predicted': len(all_predictions)
        }
        return jsonify(result)
    except Exception as e: return jsonify({'error': f'Prediction error: {str(e)}'}), 500

@app.route('/visualize', methods=['POST'])
def visualize_data():
    print("\n--- Received new visualization request ---")
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    print(f"[+] Received file for visualization: {file.filename}")

    try:
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        df.dropna(subset=['koi_prad', 'koi_period', 'koi_steff', 'koi_disposition'], inplace=True)

        # 1. Planet Radius Distribution (Histogram)
        prad_bins = [0, 2, 6, 15, 30, 100, 2500]
        prad_labels = ['<2 (Earths)', '2-6 (Super-Earths)', '6-15 (Neptunes)', '15-30 (Jupiters)', '30-100 (Giants)', '>100 (Stars/Errors)']
        df['prad_category'] = pd.cut(df['koi_prad'], bins=prad_bins, labels=prad_labels, right=False)
        radius_dist = df['prad_category'].value_counts().sort_index().to_dict()
        radius_dist_data = [{'name': k, 'count': v} for k, v in radius_dist.items()]

        # 2. Orbital Period vs. Planet Radius (Scatter Plot) - Sampled for performance
        scatter_df = df[df['koi_disposition'] == 'CONFIRMED'].sample(n=min(500, len(df)), random_state=42)
        scatter_data = scatter_df[['koi_period', 'koi_prad']].rename(columns={'koi_period': 'period', 'koi_prad': 'radius'}).to_dict('records')

        # 3. Star Temperature Distribution (Histogram)
        steff_bins = [0, 3700, 5200, 6000, 7500, 10000, 50000]
        steff_labels = ['<3.7K (M-type)', '3.7-5.2K (K-type)', '5.2-6K (G-type)', '6-7.5K (F-type)', '7.5-10K (A-type)', '>10K (B/O-type)']
        df['steff_category'] = pd.cut(df['koi_steff'], bins=steff_bins, labels=steff_labels, right=False)
        steff_dist = df['steff_category'].value_counts().sort_index().to_dict()
        steff_dist_data = [{'name': k, 'count': v} for k, v in steff_dist.items()]

        # Combine all data into a single JSON response
        visualization_result = {
            'radius_distribution': radius_dist_data,
            'period_vs_radius': scatter_data,
            'star_temp_distribution': steff_dist_data
        }
        
        print("--> Visualization data prepared successfully.")
        return jsonify(visualization_result)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred during visualization: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server with Analysis, Prediction, and Visualization endpoints...")
    app.run(debug=True, port=5000)
