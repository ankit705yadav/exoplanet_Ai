# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}}) # Explicit CORS for better compatibility

# --- Configuration ---
# Change this variable to test different models you've trained.
# Options: 'RandomForest', 'LogisticRegression', 'SVM', 'DecisionTree', 'NaiveBayes'
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

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Server is not ready. Model or scaler not loaded.'}), 503

    print("\n--- Received new prediction request ---")

    # 1. Get the file from the POST request
    file = request.files.get('file')
    if not file:
        print("[!] No file provided in the request.")
        return jsonify({'error': 'No file provided'}), 400
    print(f"[+] Received file: {file.filename}")

    try:
        # 2. Read and validate the incoming data
        data = pd.read_csv(file)
        print("[+] CSV read into pandas DataFrame.")

        required_features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_insol', 'koi_prad']
        
        # --- FIX IS HERE ---
        # Drop any rows with missing values in the required columns
        original_rows = len(data)
        data.dropna(subset=required_features, inplace=True)
        cleaned_rows = len(data)
        print(f"[+] Cleaned data: Removed {original_rows - cleaned_rows} rows with missing values.")
        # --------------------

        if data.empty:
            print("[!] CSV has no valid data rows after cleaning.")
            return jsonify({'error': 'The uploaded CSV contains no rows with complete data for the required features.'}), 400

        if not all(feature in data.columns for feature in required_features):
            print(f"[!] Missing required columns. Required: {required_features}")
            return jsonify({'error': f'CSV must contain the following columns: {required_features}'}), 400
        
        features_data = data[required_features]

        # 3. Preprocess the data
        print("[+] Scaling input data...")
        scaled_features = scaler.transform(features_data)
        print("[+] Data scaled successfully.")

        # 4. Make prediction
        print(f"[+] Making prediction with {MODEL_NAME} model...")
        prediction = model.predict(scaled_features)
        confidence_scores = model.predict_proba(scaled_features)
        print("[+] Prediction complete.")

        # 5. Format and send the response
        is_exoplanet = bool(prediction[0])
        confidence = float(max(confidence_scores[0]))

        result = {
            'result': "Exoplanet Detected!" if is_exoplanet else "No Exoplanet Detected",
            'confidence': round(confidence, 2),
            'isExoplanet': is_exoplanet
        }
        print(f"--> Sending response: {result}")
        return jsonify(result)

    except Exception as e:
        print(f"[!!!] An error occurred: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, port=5000)
