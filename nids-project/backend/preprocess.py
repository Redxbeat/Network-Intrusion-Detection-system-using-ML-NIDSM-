import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
import os

def load_and_merge_unsw(data_dir):
    """Load and merge all UNSW NB15 CSV files in folder"""
    files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]
    all_dfs = []
    for file in files:
        path = os.path.join(data_dir, file)
        print(f"Loading: {file}")
        df = pd.read_csv(path, low_memory=False)
        print(f"Columns in {file}:", df.columns.tolist())
        all_dfs.append(df)
    full_df = pd.concat(all_dfs, ignore_index=True)
    print(f"✅ Combined shape: {full_df.shape}")
    return full_df


def preprocess_unsw(df):
    """Clean, encode and normalize UNSW-NB15 dataset"""
    print("🔧 Starting preprocessing...")

    # Get the last column as label (standard format for UNSW-NB15)
    label_series = df.iloc[:, -1]  # Get the last column
    df = df.drop(df.columns[-1], axis=1)  # Remove the last column from features
    
    # Drop IP address columns (first and third columns)
    df = df.drop(df.columns[[0, 2]], axis=1)
    
    # Handle missing values and '-' values
    df = df.replace('-', 0)
    df = df.fillna(0)
    
    # Convert all columns to numeric, replacing errors with 0
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Encode categorical columns (positions 2 and 4 in original data)
    categorical_positions = [2, 4]  # proto and state columns
    for pos in categorical_positions:
        le = LabelEncoder()
        df.iloc[:, pos] = le.fit_transform(df.iloc[:, pos].astype(str))
    
    print("Encoded categorical features")
    
    # Convert label to numeric and ensure it's binary
    y = pd.to_numeric(label_series, errors='coerce').fillna(0).astype(int)
    
    # Separate features and label
    X = df

    # Normalize numeric features
    scaler = MinMaxScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

    print(f"✅ Features: {X_scaled.shape}, Labels: {y.shape}")
    return X_scaled, y


def split_and_save(X, y, output_dir):
    """Split into train/test and save"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Merge features + labels back to CSVs
    train_df = X_train.copy()
    train_df['label'] = y_train.values
    test_df = X_test.copy()
    test_df['label'] = y_test.values

    os.makedirs(output_dir, exist_ok=True)
    train_path = os.path.join(output_dir, "processed_train.csv")
    test_path = os.path.join(output_dir, "processed_test.csv")

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"💾 Saved training data: {train_path}")
    print(f"💾 Saved testing data: {test_path}")


if __name__ == "__main__":
    data_dir = "./data"
    output_dir = "./data"

    df = load_and_merge_unsw(data_dir)
    X, y = preprocess_unsw(df)
    split_and_save(X, y, output_dir)

    print("✅ Preprocessing complete! You can now train your models.")
