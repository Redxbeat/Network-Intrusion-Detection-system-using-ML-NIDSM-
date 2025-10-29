/**
 * IntrusionTable.js
 * --------------------------------------------
 * Displays real-time intrusion alerts in a neon-styled
 * cyber dashboard table with auto-refresh and animations.
 * --------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Spinner } from "react-bootstrap";
import "./dashboard.css";

const IntrusionTable = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from backend API
  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get(`/api/alerts`);
      setAlerts(res.data || []);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching alerts:", error.message || error);
      setAlerts([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="neon-table-container mt-4"
    >
      <h4 className="text-center text-info mb-3 neon-glow">🧠 Real-Time Intrusion Log</h4>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="info" />
          <p className="text-muted mt-3">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-muted text-center">No intrusion data detected yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="table table-dark table-bordered table-hover align-middle shadow-sm neon-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>RF</th>
                <th>SVM</th>
                <th>ANN</th>
                <th>Score</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {alerts.map((a) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      backgroundColor:
                        a.label === 1
                          ? "rgba(255, 50, 50, 0.15)"
                          : "rgba(0, 255, 128, 0.05)",
                    }}
                  >
                    <td>{a.id}</td>
                    <td className="text-info">{a.src_ip}</td>
                    <td className="text-warning">{a.dst_ip}</td>
                    <td>{a.rf ? a.rf.toFixed(2) : "-"}</td>
                    <td>{a.svm ? a.svm.toFixed(2) : "-"}</td>
                    <td>{a.ann ? a.ann.toFixed(2) : "-"}</td>
                    <td className="text-light">{a.score?.toFixed(2)}</td>
                    <td>
                      {a.label === 1 ? (
                        <Badge bg="danger" className="neon-badge">
                          Intrusion
                        </Badge>
                      ) : (
                        <Badge bg="success" className="neon-badge">
                          Normal
                        </Badge>
                      )}
                    </td>
                    <td>{new Date(a.ts * 1000).toLocaleTimeString()}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default IntrusionTable;
