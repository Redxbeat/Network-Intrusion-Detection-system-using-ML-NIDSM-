import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
import tensorflow as tf
import joblib

print("📦 Loading preprocessed data...")
train_df = pd.read_csv("./data/processed_train.csv")
test_df = pd.read_csv("./data/processed_test.csv")

X_train = train_df.drop(columns=['label'])
y_train = train_df['label']
X_test = test_df.drop(columns=['label'])
y_test = test_df['label']

# === Random Forest ===
print("🌲 Training Random Forest...")
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
y_rf = rf.predict(X_test)
print("RF Accuracy:", accuracy_score(y_test, y_rf))
joblib.dump(rf, "models/rf_model.joblib")

# === SVM ===
print("🌀 Training SVM (subset for speed)...")
svm = SVC(kernel='rbf', probability=True)
svm.fit(X_train[:10000], y_train[:10000])
y_svm = svm.predict(X_test[:10000])
print("SVM Accuracy:", accuracy_score(y_test[:10000], y_svm))
joblib.dump(svm, "models/svm_model.joblib")

# === ANN ===
print("🧠 Training ANN...")
ann = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(X_train.shape[1],)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])
ann.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
ann.fit(X_train, y_train, epochs=10, batch_size=128, validation_split=0.1)
loss, acc = ann.evaluate(X_test, y_test)
print("ANN Accuracy:", acc)
ann.save("models/ann_model.keras")  # Changed extension to .keras

print("✅ Models trained and saved successfully.")
