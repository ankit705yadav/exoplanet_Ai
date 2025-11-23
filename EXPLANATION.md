# Exoplanet Classification Using Machine Learning

## Project Explanation Document

---

## 1. Introduction

### 1.1 What is an Exoplanet?

An exoplanet is a planet that orbits a star outside our solar system. Since the first confirmed detection in 1992, thousands of exoplanets have been discovered, primarily through NASA's Kepler Space Telescope mission.

### 1.2 Project Objective

This project aims to build a **machine learning-based web application** that classifies celestial objects as:
- **CONFIRMED** exoplanets
- **FALSE POSITIVE** detections
- **CANDIDATE** objects requiring further analysis

The system allows users to upload astronomical data and receive instant predictions using multiple ML algorithms.

### 1.3 Motivation

Manual classification of exoplanet candidates is time-consuming and requires expert astronomers. Machine learning can:
- Automate the classification process
- Handle large volumes of data efficiently
- Provide consistent and reproducible results
- Assist researchers in prioritizing candidates for follow-up observations

---

## 2. Dataset Description

### 2.1 Data Source

The project uses NASA's **Kepler Exoplanet Dataset**, which contains observations from the Kepler Space Telescope's transit photometry method.

### 2.2 Transit Photometry Method

When a planet passes in front of its host star (transit), it causes a slight dimming in the star's brightness. By analyzing these periodic dips, we can:
- Detect potential planets
- Estimate planetary properties (size, orbital period)
- Distinguish real planets from false positives

### 2.3 Key Features Used

| Feature | Description |
|---------|-------------|
| `koi_fpflag_nt` | Not transit-like flag |
| `koi_fpflag_ss` | Stellar eclipse flag |
| `koi_fpflag_co` | Centroid offset flag |
| `koi_fpflag_ec` | Ephemeris match flag |
| `koi_period` | Orbital period (days) |
| `koi_time0bk` | Transit epoch |
| `koi_impact` | Impact parameter |
| `koi_duration` | Transit duration (hours) |
| `koi_depth` | Transit depth (ppm) |
| `koi_prad` | Planetary radius (Earth radii) |
| `koi_teq` | Equilibrium temperature (K) |
| `koi_insol` | Insolation flux |
| `koi_model_snr` | Signal-to-noise ratio |
| `koi_steff` | Stellar effective temperature |
| `koi_slogg` | Stellar surface gravity |
| `koi_srad` | Stellar radius |
| `ra` | Right ascension |
| `dec` | Declination |
| `koi_kepmag` | Kepler magnitude |

### 2.4 Target Variable

`koi_disposition` - The classification label with three possible values:
- CONFIRMED: Verified exoplanet
- FALSE POSITIVE: Not a planet (stellar activity, binary star, etc.)
- CANDIDATE: Requires additional verification

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│                 │    Requests        │                 │
│    Frontend     │ ◄───────────────► │     Backend     │
│    (React)      │                    │    (Flask)      │
│                 │     JSON/CSV       │                 │
└─────────────────┘    Responses       └────────┬────────┘
                                                │
                                                │ Load/Predict
                                                ▼
                                       ┌─────────────────┐
                                       │   ML Models     │
                                       │   (sklearn)     │
                                       │                 │
                                       │ - Random Forest │
                                       │ - Log. Regress. │
                                       │ - SVM           │
                                       │ - Decision Tree │
                                       │ - Naive Bayes   │
                                       └─────────────────┘
```

### 3.2 Technology Stack

#### Backend (Python/Flask)
- **Flask**: Lightweight web framework for REST API
- **scikit-learn**: Machine learning library for model training and prediction
- **pandas**: Data manipulation and preprocessing
- **pickle**: Model serialization and storage

#### Frontend (React/Vite)
- **React**: Component-based UI library
- **Vite**: Fast build tool and development server
- **Recharts**: Data visualization library
- **Axios**: HTTP client for API communication

### 3.3 Component Interaction

1. **User uploads CSV file** → Frontend validates and sends to backend
2. **Backend receives file** → Preprocesses data, loads selected model
3. **Model makes predictions** → Returns results with confidence scores
4. **Frontend displays results** → Charts, tables, and downloadable reports

---

## 4. Machine Learning Models

### 4.1 Models Implemented

#### 4.1.1 Random Forest Classifier

**How it works**: Ensemble method that creates multiple decision trees and combines their predictions through majority voting.

**Advantages**:
- Handles high-dimensional data well
- Robust to overfitting
- Provides feature importance rankings

**Use case**: Best for complex datasets with many features.

#### 4.1.2 Logistic Regression

**How it works**: Linear model that estimates probability of class membership using the logistic (sigmoid) function.

**Advantages**:
- Fast training and prediction
- Interpretable coefficients
- Works well with linearly separable data

**Use case**: Baseline model for comparison.

#### 4.1.3 Support Vector Machine (SVM)

**How it works**: Finds the optimal hyperplane that maximizes the margin between classes.

**Advantages**:
- Effective in high-dimensional spaces
- Memory efficient (uses support vectors)
- Versatile through kernel functions

**Use case**: When clear margin of separation exists.

#### 4.1.4 Decision Tree Classifier

**How it works**: Creates a tree structure where each node represents a feature test, branches represent outcomes, and leaves represent class labels.

**Advantages**:
- Easy to interpret and visualize
- No feature scaling required
- Handles both numerical and categorical data

**Use case**: When interpretability is important.

#### 4.1.5 Naive Bayes Classifier

**How it works**: Probabilistic classifier based on Bayes' theorem with strong independence assumptions between features.

**Advantages**:
- Very fast training and prediction
- Works well with small datasets
- Handles missing data gracefully

**Use case**: Quick baseline with probabilistic outputs.

### 4.2 Model Selection Rationale

Multiple models are provided to:
1. Compare performance across different algorithms
2. Allow users to choose based on accuracy vs. speed trade-offs
3. Demonstrate that no single algorithm is best for all scenarios

---

## 5. Data Preprocessing Pipeline

### 5.1 Preprocessing Steps

```
Raw CSV Data
     │
     ▼
┌─────────────────┐
│ 1. Load Data    │  Read CSV into pandas DataFrame
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Handle       │  Drop rows with NaN values
│    Missing Data │  (or impute with mean/median)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Feature      │  Select relevant columns
│    Selection    │  Remove identifiers (kepid, kepoi_name)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Encode       │  Convert categorical target to
│    Labels       │  numerical values
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Scale        │  StandardScaler for normalization
│    Features     │  (mean=0, std=1)
└────────┬────────┘
         │
         ▼
   Processed Data
```

### 5.2 Why Preprocessing Matters

- **Missing values**: Can cause model errors or biased predictions
- **Feature scaling**: Ensures all features contribute equally (important for SVM, Logistic Regression)
- **Label encoding**: ML algorithms require numerical inputs

---

## 6. Application Features

### 6.1 Dataset Analysis

**Purpose**: Understand the distribution of classes in the uploaded data.

**Output**:
- Pie chart showing raw data distribution (CONFIRMED vs FALSE POSITIVE vs CANDIDATE)
- Pie chart showing model prediction distribution
- Side-by-side comparison

### 6.2 Predictions

**Purpose**: Classify each row in the dataset.

**Output**:
- Prediction for each sample
- Evaluation metrics (Accuracy, Precision, Recall, F1 Score)
- Confusion matrix showing prediction breakdown
- Downloadable CSV with predictions

### 6.3 Visualization Summary

**Purpose**: Visual representation of prediction results.

**Output**:
- Donut charts with class distributions
- Model information and statistics
- Interactive legends

### 6.4 Model Comparison

**Purpose**: Compare all five models simultaneously.

**Output**:
- Bar chart comparing accuracy across models
- Table with detailed metrics for each model
- Helps identify best model for the dataset

---

## 7. Evaluation Metrics

### 7.1 Accuracy

```
Accuracy = (True Positives + True Negatives) / Total Samples
```

**Interpretation**: Overall correctness of predictions. Can be misleading with imbalanced datasets.

### 7.2 Precision

```
Precision = True Positives / (True Positives + False Positives)
```

**Interpretation**: Of all positive predictions, how many were actually positive? High precision means few false alarms.

### 7.3 Recall (Sensitivity)

```
Recall = True Positives / (True Positives + False Negatives)
```

**Interpretation**: Of all actual positives, how many did we correctly identify? High recall means few missed detections.

### 7.4 F1 Score

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Interpretation**: Harmonic mean of precision and recall. Balances both metrics, useful for imbalanced datasets.

### 7.5 Confusion Matrix

A table showing:
- **True Positives (TP)**: Correctly predicted positive
- **True Negatives (TN)**: Correctly predicted negative
- **False Positives (FP)**: Incorrectly predicted positive (Type I error)
- **False Negatives (FN)**: Incorrectly predicted negative (Type II error)

---

## 8. API Design

### 8.1 RESTful Architecture

The backend follows REST principles:
- **Stateless**: Each request contains all necessary information
- **Resource-based**: Endpoints represent actions on data
- **Standard HTTP methods**: POST for data submission

### 8.2 Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/predict` | POST | CSV file, model name | Predictions, metrics, confusion matrix |
| `/analyze` | POST | CSV file, model name | Distribution analysis |
| `/visualize` | POST | CSV file, model name | Visualization data |
| `/compare` | POST | CSV file | All models comparison |
| `/download` | POST | CSV file, model name | CSV with predictions |

### 8.3 Request/Response Format

**Request**: `multipart/form-data`
```
file: <CSV file>
model: random_forest | logistic_regression | svm | decision_tree | naive_bayes
```

**Response**: `application/json`
```json
{
  "predictions": [...],
  "accuracy": 0.95,
  "precision": 0.93,
  "recall": 0.94,
  "f1_score": 0.935,
  "confusion_matrix": [[...], [...], [...]]
}
```

---

## 9. User Interface Design

### 9.1 Design Principles

- **Simplicity**: Clean, uncluttered interface
- **Feedback**: Loading spinners, success/error messages
- **Responsiveness**: Works on different screen sizes

### 9.2 User Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │ → │   Select    │ → │   Choose    │ → │    View     │
│    CSV      │    │    Model    │    │   Action    │    │   Results   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 9.3 Visualization Components

- **Pie/Donut Charts**: Class distribution
- **Bar Charts**: Model comparison
- **Tables**: Detailed predictions and metrics
- **Confusion Matrix**: Grid visualization

---

## 10. Project Workflow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
├──────────────────────────────────────────────────────────────────┤
│  1. User opens web application                                   │
│  2. User uploads CSV file with exoplanet data                    │
│  3. User selects ML model (or compares all)                      │
│  4. User clicks action button (Analyze/Predict/Visualize)        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND PROCESSING                          │
├──────────────────────────────────────────────────────────────────┤
│  1. Receive file and model selection                             │
│  2. Parse CSV and preprocess data                                │
│  3. Load pre-trained model from disk                             │
│  4. Make predictions on input data                               │
│  5. Calculate evaluation metrics                                 │
│  6. Return results as JSON                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      RESULT PRESENTATION                         │
├──────────────────────────────────────────────────────────────────┤
│  1. Frontend receives JSON response                              │
│  2. Parse and format data for display                            │
│  3. Render charts and tables                                     │
│  4. Enable CSV download option                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| Large file uploads | Chunked processing, file size limits |
| Model loading time | Pre-trained models stored as pickle files |
| Imbalanced dataset | Multiple metrics (not just accuracy) |
| Cross-origin requests | Flask-CORS middleware |
| Missing values in data | Automatic handling with dropna() |

---

## 12. Future Enhancements

1. **Deep Learning Models**: Add neural network classifiers
2. **Real-time Updates**: WebSocket for live predictions
3. **User Authentication**: Save prediction history
4. **More Datasets**: Support for TESS mission data
5. **Feature Importance**: Visualize which features matter most
6. **Hyperparameter Tuning**: Allow users to adjust model parameters
7. **Batch Processing**: Handle multiple files simultaneously

---

## 13. Conclusion

This project demonstrates a complete machine learning pipeline:

1. **Data Understanding**: Working with real astronomical data
2. **Model Training**: Implementing multiple classification algorithms
3. **Web Development**: Building full-stack application
4. **API Design**: RESTful backend architecture
5. **Data Visualization**: Interactive charts and metrics

The application provides a practical tool for exoplanet classification while serving as an educational platform for understanding machine learning concepts.

---

## 14. References

1. NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/
2. Kepler Mission: https://www.nasa.gov/mission_pages/kepler/main/index.html
3. scikit-learn Documentation: https://scikit-learn.org/stable/
4. Flask Documentation: https://flask.palletsprojects.com/
5. React Documentation: https://react.dev/

---

*Document prepared for academic presentation purposes.*
