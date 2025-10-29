"""
capture_agent.py
----------------
Captures live network packets using Scapy, extracts flow features,
and sends them to the backend Flask API for intrusion detection.
"""

from scapy.all import sniff, IP, TCP, UDP
import requests
import time
import json
from collections import defaultdict

# ======== CONFIGURATION ========
BACKEND_API = "http://localhost:8000/api/predict"   # Flask backend API endpoint
FLUSH_INTERVAL = 10      # seconds between batch flushes
FLOW_TIMEOUT = 30        # seconds to consider a flow inactive
MIN_PACKETS = 3          # minimum packets before classifying
LOG_FILE = "capture_log.txt"   # local log file for detections
# ===============================

flows = defaultdict(lambda: {
    "start": time.time(),
    "end": time.time(),
    "pkt_count": 0,
    "bytes": 0,
    "proto": 0
})

def process_packet(pkt):
    """Extract flow info from packets and update flow statistics"""
    if not IP in pkt:
        return

    ip = pkt[IP]
    proto = ip.proto
    src = ip.src
    dst = ip.dst
    sport = getattr(pkt, 'sport', 0)
    dport = getattr(pkt, 'dport', 0)

    # Define a flow key
    key = (src, sport, dst, dport, proto)

    # Update flow record
    f = flows[key]
    f["pkt_count"] += 1
    f["bytes"] += len(pkt)
    f["proto"] = proto
    f["end"] = time.time()

def flush_flows():
    """Send complete flow features to backend for detection"""
    now = time.time()
    expired = [key for key, f in flows.items() if now - f["end"] > FLOW_TIMEOUT]

    for key in expired:
        src, sport, dst, dport, proto = key
        f = flows[key]
        duration = f["end"] - f["start"]
        pkt_count = f["pkt_count"]
        bytes_ = f["bytes"]

        # Skip very small flows
        if pkt_count < MIN_PACKETS:
            del flows[key]
            continue

        # Derived metrics
        avg_pkt_size = bytes_ / pkt_count
        bytes_per_sec = bytes_ / duration if duration > 0 else bytes_

        # Prepare feature vector for ML model
        features = [pkt_count, bytes_, duration, avg_pkt_size, bytes_per_sec]

        # Prepare JSON payload
        data = {
            "src_ip": src,
            "dst_ip": dst,
            "features": features
        }

        try:
            res = requests.post(BACKEND_API, json=data, timeout=5)
            if res.status_code == 200:
                result = res.json()
                label = result.get("label")
                score = result.get("score")
                status = result.get("status", "Unknown")

                log_entry = f"[{time.ctime()}] {src} → {dst} | Score: {score:.2f} | Status: {status}\n"
                print(log_entry.strip())

                # Save to log
                with open(LOG_FILE, "a") as fh:
                    fh.write(log_entry)

            else:
                print(f"⚠️ Backend error: {res.status_code}")

        except Exception as e:
            print(f"❌ Could not send flow: {e}")

        # Remove flow from memory
        del flows[key]

def start_capture(interface=None):
    """Start live packet capture"""
    print("🚀 Starting packet capture...")
    print("Press Ctrl+C to stop.")

    # Background flusher thread
    import threading
    def flush_loop():
        while True:
            time.sleep(FLUSH_INTERVAL)
            flush_flows()

    t = threading.Thread(target=flush_loop, daemon=True)
    t.start()

    # Start sniffing
    sniff(prn=process_packet, store=False, iface=interface)

if __name__ == "__main__":
    # Change 'Wi-Fi' or 'Ethernet' interface name as per your system
    # On Linux, use 'eth0' or 'wlan0'
    start_capture(interface=None)  # None → captures all
