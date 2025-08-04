# train_models.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
import joblib
import warnings

# Suppress convergence warnings for Logistic Regression
warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')

# --- 1. Load and Prepare Data ---
# Load the dataset (ensure 'cumulative.csv' is in the same folder)
print("Loading dataset...")
df = pd.read_csv('cumulative.csv')

# Use only rows with a definitive disposition
df = df[df['koi_disposition'].isin(['CONFIRMED', 'FALSE POSITIVE'])]

# A very basic preprocessing
df = df.dropna(subset=['koi_disposition', 'koi_period', 'koi_duration', 'koi_depth', 'koi_insol', 'koi_prad'])
features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_insol', 'koi_prad']
X = df[features]
y = (df['koi_disposition'] == 'CONFIRMED').astype(int)

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
print(f"Data split into {len(X_train)} training and {len(X_test)} testing samples.")

# --- 2. Scale Features ---
# Feature scaling is important for models like Logistic Regression and SVM
print("\nScaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save the scaler object so we can use it in our web app
joblib.dump(scaler, 'scaler.pkl')
print("Scaler saved as scaler.pkl")


# --- 3. Define and Train Models ---
print("\n--- Training Multiple Models ---")

# Define the models to be trained
models = {
    'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
    'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000),
    'SVM': SVC(probability=True, random_state=42), # probability=True is needed for predict_proba
    'DecisionTree': DecisionTreeClassifier(random_state=42),
    'NaiveBayes': GaussianNB()
}

# Loop through the models, train, evaluate, and save each one
for name, model in models.items():
    print(f"\nTraining {name}...")
    
    # Use scaled data for Logistic Regression and SVM
    if name in ['LogisticRegression', 'SVM']:
        model.fit(X_train_scaled, y_train)
        accuracy = model.score(X_test_scaled, y_test)
    else:
        # Use original data for tree-based and Naive Bayes models
        model.fit(X_train, y_train)
        accuracy = model.score(X_test, y_test)

    print(f"-> {name} Accuracy: {accuracy:.4f}")

    # Save the trained model to a file
    filename = f"{name}_model.pkl"
    joblib.dump(model, filename)
    print(f"-> Model saved as {filename}")

print("\n--- Model training complete! ---")
