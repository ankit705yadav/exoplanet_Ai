# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import io

app = Flask(__name__)
# Allow requests to both endpoints from any origin
CORS(app, resources={r"/*": {"origins": "*"}})

# --- Configuration ---
MODEL_NAME = 'RandomForest'
MODEL_PATH = f"{MODEL_NAME}_model.pkl"
SCALER_PATH = 'scaler.pkl'
# --- End Configuration ---

# --- Load Model and Scaler ---
print(f"Loading model: {MODEL_PATH}")
try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model and scaler loaded successfully.")
except FileNotFoundError:
    print(f"Error: Make sure '{MODEL_PATH}' and '{SCALER_PATH}' are in the same directory.")
    model = None
    scaler = None
# -----------------------------

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
    if not model or not scaler:
        return jsonify({'error': 'Server is not ready for prediction. Model or scaler not loaded.'}), 503

    print("\n--- Received new prediction request ---")
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
        scaled_features = scaler.transform(features_data)
        
        prediction = model.predict(scaled_features)
        confidence_scores = model.predict_proba(scaled_features)
        
        is_exoplanet = bool(prediction[0])
        confidence = float(max(confidence_scores[0]))
        
        result = {
            'result': "Exoplanet Detected!" if is_exoplanet else "No Exoplanet Detected",
            'confidence': round(confidence, 2),
            'isExoplanet': is_exoplanet
        }
        print(f"--> Prediction complete: {result}")
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred during prediction: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server with Analysis and Prediction endpoints...")
    app.run(debug=True, port=5000)
