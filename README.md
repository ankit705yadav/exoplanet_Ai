# Exoplanet AI Hub

A full-stack machine learning application for classifying exoplanets using NASA Kepler dataset. Upload CSV data and get predictions using multiple ML models.

## Features

- **Multiple ML Models**: Choose from 5 different classifiers
  - Random Forest
  - Logistic Regression
  - Support Vector Machine (SVM)
  - Decision Tree
  - Naive Bayes

- **Dataset Analysis**: View data distribution with model-based predictions
- **Predictions**: Get exoplanet classifications with confidence scores
- **Visualization**: Interactive charts showing prediction summaries
- **Model Comparison**: Compare all models side-by-side
- **Export**: Download predictions as CSV

## Tech Stack

### Backend
- Python 3
- Flask (REST API)
- scikit-learn (ML models)
- pandas (data processing)
- Flask-CORS (cross-origin support)

### Frontend
- React 18
- Vite (build tool)
- Recharts (visualizations)
- Axios (HTTP client)

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd back-end

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd front-end

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
cd back-end
python3 app.py
```

The API server will start at `http://127.0.0.1:5000`

### Start Frontend Server

```bash
cd front-end
npm run dev
```

The frontend will start at `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` in your browser
2. Upload a CSV file containing exoplanet data
3. Select a machine learning model from the dropdown
4. Choose an action:
   - **Analyze Dataset**: View data distribution and model predictions
   - **Get Predictions**: Classify exoplanets with the selected model
   - **Visualize Summary**: See prediction charts
   - **Compare All Models**: Evaluate all models simultaneously
5. Download predictions as CSV if needed

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Get predictions from selected model |
| `/analyze` | POST | Analyze dataset with model predictions |
| `/visualize` | POST | Get visualization data |
| `/compare` | POST | Compare all models |
| `/download` | POST | Download predictions as CSV |

### Request Format

All endpoints accept `multipart/form-data` with:
- `file`: CSV file
- `model`: Model name (random_forest, logistic_regression, svm, decision_tree, naive_bayes)

## Dataset Format

The CSV file should contain Kepler exoplanet features. Expected columns include:
- `koi_fpflag_nt`, `koi_fpflag_ss`, `koi_fpflag_co`, `koi_fpflag_ec`
- `koi_period`, `koi_time0bk`, `koi_impact`
- `koi_duration`, `koi_depth`, `koi_prad`
- `koi_teq`, `koi_insol`, `koi_model_snr`
- `koi_steff`, `koi_slogg`, `koi_srad`
- `ra`, `dec`, `koi_kepmag`

Target column: `koi_disposition` (CONFIRMED, FALSE POSITIVE, CANDIDATE)

## Project Structure

```
exoplanet_Ai/
├── back-end/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── models/             # Trained ML models (.pkl files)
│
├── front-end/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styles
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
│
└── README.md
```

## Metrics

The application provides the following evaluation metrics:
- **Accuracy**: Overall prediction correctness
- **Precision**: True positive rate among positive predictions
- **Recall**: True positive rate among actual positives
- **F1 Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: Detailed prediction breakdown

## License

MIT License
