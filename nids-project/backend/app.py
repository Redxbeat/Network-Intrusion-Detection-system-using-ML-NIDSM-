"""
app.py
------
Main Flask backend for the Full Stack NIDS project.
Handles:
 - Intrusion prediction API (/api/predict)
 - Health check (/api/health)
 - Alert log retrieval (/api/alerts)
 - SQLite database logging
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import time
import os
from model_utils import predict_ensemble

# ==============================================
# 🧠 Flask Application Setup
# ==============================================
app = Flask(__name__)
CORS(app)  # Allow requests from React frontend and capture agent

# ==============================================
# 🗂️ Database Configuration
# ==============================================
DB_PATH = os.path.join(os.path.dirname(__file__), "alerts.db")

def init_db():
    """Create alerts database table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        src_ip TEXT,
        dst_ip TEXT,
        score REAL,
        label INTEGER,
        rf REAL,
        svm REAL,
        ann REAL,
        ts INTEGER
    )
    """)
    conn.commit()
    conn.close()

# Initialize DB at startup
init_db()

# ==============================================
# ⚙️ API ROUTES
# ==============================================

@app.route("/api/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend running successfully"}), 200


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Endpoint for intrusion prediction.
    Input JSON:
    {
        "src_ip": "192.168.1.10",
        "dst_ip": "8.8.8.8",
        "features": [pkt_count, bytes, duration, avg_pkt_size, bytes_per_sec]
    }
    Output:
    {
        "rf": 0.4,
        "svm": 0.5,
        "ann": 0.7,
        "score": 0.54,
        "label": 1,
        "status": "Intrusion"
    }
    """
    try:
        data = request.get_json(force=True)
        src_ip = data.get("src_ip", "unknown")
        dst_ip = data.get("dst_ip", "unknown")
        features = data.get("features", [])

        if not features or not isinstance(features, list):
            return jsonify({"error": "Invalid feature vector"}), 400

        # Predict intrusion score
        result = predict_ensemble(features)

        # Save alert to database
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO alerts (src_ip, dst_ip, score, label, rf, svm, ann, ts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            src_ip,
            dst_ip,
            result["score"],
            result["label"],
            result["rf"],
            result["svm"],
            result["ann"],
            int(time.time())
        ))
        conn.commit()
        conn.close()

        print(f"[+] Flow from {src_ip} → {dst_ip} | Label: {result['status']} | Score: {result['score']:.2f}")
        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in /api/predict:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Return the last 50 alerts from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 50")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        print("❌ Error reading alerts:", e)
        return jsonify({"error": str(e)}), 500


# ==============================================
# �️ System Resource Monitoring Endpoint
# ==============================================
import psutil

@app.route("/api/system", methods=["GET"])
def system_stats():
    """
    Returns current system performance metrics.
    {
        "cpu": 45.7,
        "memory": 68.3,
        "disk": 42.1,
        "net_sent": 1234567,
        "net_recv": 2345678,
        "net_speed": 210.4
    }
    """
    try:
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent

        net_io = psutil.net_io_counters()
        net_sent = net_io.bytes_sent
        net_recv = net_io.bytes_recv
        net_speed = (net_sent + net_recv) / (1024 * 1024)  # MB total transfer

        return jsonify({
            "cpu": cpu,
            "memory": memory,
            "disk": disk,
            "net_sent": net_sent,
            "net_recv": net_recv,
            "net_speed": round(net_speed, 2)
        }), 200

    except Exception as e:
        print("❌ Error reading system stats:", e)
        return jsonify({"error": str(e)}), 500


# ==============================================
# �🚀 MAIN ENTRY POINT
# ==============================================
if __name__ == "__main__":
    # Use host='0.0.0.0' so it’s accessible from Windows client or capture agent
    print("🚀 Starting NIDS Backend Server on port 8000...")
    app.run(host="0.0.0.0", port=8000, debug=True)
