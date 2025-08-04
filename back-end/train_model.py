# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load the dataset (download from Kaggle and place in your backend folder)
df = pd.read_csv('cumulative.csv')

# A very basic preprocessing
# We'll use only a few features for this example
df = df.dropna(subset=['koi_disposition', 'koi_period', 'koi_duration', 'koi_depth'])
features = ['koi_period', 'koi_duration', 'koi_depth']
X = df[features]
y = (df['koi_disposition'] == 'CONFIRMED').astype(int)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a RandomForest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print(f"Model Accuracy: {model.score(X_test, y_test)}")

# Save the trained model
joblib.dump(model, 'exoplanet_model.pkl')
print("Model saved as exoplanet_model.pkl")
