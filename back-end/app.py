# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app) # This is to allow requests from your React app

# Load the pre-trained model
model = joblib.load('exoplanet_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    # Get the file from the POST request
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        # For this example, we assume the CSV has columns: 'koi_period', 'koi_duration', 'koi_depth'
        # In a real scenario, you'd process the raw light curve (flux data)
        # to extract these features.
        # Here, we'll simulate this by reading a CSV with these features.
        data = pd.read_csv(file)

        # Ensure the required columns are present
        required_features = ['koi_period', 'koi_duration', 'koi_depth']
        if not all(feature in data.columns for feature in required_features):
             return jsonify({'error': 'CSV must contain koi_period, koi_duration, and koi_depth columns'}), 400

        prediction = model.predict(data[required_features])
        confidence_scores = model.predict_proba(data[required_features])

        # For simplicity, we'll return the result for the first row
        is_exoplanet = bool(prediction[0])
        confidence = float(max(confidence_scores[0]))

        result = {
            'result': "Exoplanet Detected!" if is_exoplanet else "No Exoplanet Detected",
            'confidence': round(confidence, 2),
            'isExoplanet': is_exoplanet
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
