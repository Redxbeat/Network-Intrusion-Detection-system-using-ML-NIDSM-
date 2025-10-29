// src/components/TopRightAlert.js
import React, { useEffect, useState, useRef } from "react";
import { apiClient } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import "./dashboard.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 900;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    setTimeout(() => { o.stop(); ctx.close(); }, 600);
  } catch (e) {
    console.warn("Audio API not available", e);
  }
}

const TopRightAlert = ({ pollInterval = 4000 }) => {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState(null);
  const lastIdRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // initialize lastIdRef from initial alerts
    const init = async () => {
      try {
        const res = await apiClient.get(`/api/alerts`);
        const rows = res.data || [];
        if (rows.length > 0) lastIdRef.current = rows[0].id;
      } catch (err) {
        console.error("Error init alerts:", err?.message || err);
      }
    };
    init();

    const interval = setInterval(async () => {
      try {
  const res = await apiClient.get(`/api/alerts`);
        const rows = res.data || [];
        if (rows.length === 0) return;
        const top = rows[0];
        if (top.id > lastIdRef.current) {
          // New alert seen
          lastIdRef.current = top.id;
          if (top.label === 1) {
            setPayload(top);
            setVisible(true);
            playBeep();
            // auto-hide after 10s
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setVisible(false), 10000);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, pollInterval);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pollInterval]);

  return (
    <AnimatePresence>
      {visible && payload && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.4 }}
          className="topright-alert"
        >
          <div className="alert-header">
            <span className="alert-title">⚠️ Intrusion Detected</span>
            <span className="alert-time">{new Date(payload.ts * 1000).toLocaleTimeString()}</span>
          </div>
          <div className="alert-body">
            <div><strong>Source:</strong> <span className="neon-text">{payload.src_ip}</span></div>
            <div><strong>Destination:</strong> <span className="neon-text">{payload.dst_ip}</span></div>
            <div><strong>Score:</strong> {payload.score.toFixed(2)} &nbsp; <strong>Email:</strong> {payload.email_sent ? "Sent" : "Not sent"}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopRightAlert;
