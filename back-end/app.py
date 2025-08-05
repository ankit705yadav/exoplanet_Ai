# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import io
import numpy as np

app = Flask(__name__)
# Allow requests to both endpoints from any origin
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
    models = {} # Clear models if any failed to load
# ------------------------------------

@app.route('/analyze', methods=['POST'])
def analyze_disposition():
    print("\n--- Received new analysis request ---")
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    print(f"[+] Received file for analysis: {file.filename}")

    try:
        csv_data = io.StringIO(file.stream.read().decode("UTF8"))
        df = pd.read_csv(csv_data)
        if 'koi_disposition' not in df.columns:
            return jsonify({'error': "CSV must contain a 'koi_disposition' column."}), 400
        
        disposition_counts = df['koi_disposition'].value_counts(normalize=True)
        disposition_percentages = (disposition_counts * 100).round(2).to_dict()
        
        print(f"--> Analysis complete: {disposition_percentages}")
        return jsonify(disposition_percentages)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred during analysis: {str(e)}'}), 500


@app.route('/predict', methods=['POST'])
def predict():
    if not models or not scaler:
        return jsonify({'error': 'Server is not ready for prediction. Models or scaler not loaded.'}), 503

    print("\n--- Received new prediction request ---")
    
    # Get the model name from the request form data
    model_name = request.form.get('model_name', 'RandomForest') # Default to RandomForest if not provided
    print(f"[+] Requested model: {model_name}")

    # Select the requested model from the dictionary
    model = models.get(model_name)
    if not model:
        return jsonify({'error': f"Model '{model_name}' not found on server."}), 404

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    print(f"[+] Received file for prediction: {file.filename}")

    try:
        data = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        required_features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_insol', 'koi_prad']
        
        data.dropna(subset=required_features, inplace=True)
        if data.empty:
            return jsonify({'error': 'The uploaded CSV has no rows with complete data for prediction.'}), 400

        features_data = data[required_features]
        
        # Use scaled data for all models for consistency
        scaled_features = scaler.transform(features_data)
        
        all_predictions = model.predict(scaled_features)
        
        exoplanet_count = int(np.sum(all_predictions))
        no_exoplanet_count = len(all_predictions) - exoplanet_count
        
        result = {
            'model_used': model_name,
            'exoplanet_detected_count': exoplanet_count,
            'no_exoplanet_detected_count': no_exoplanet_count,
            'total_rows_predicted': len(all_predictions)
        }

        print(f"--> Prediction complete: {result}")
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred during prediction: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server with Analysis and Prediction endpoints...")
    app.run(debug=True, port=5000)
