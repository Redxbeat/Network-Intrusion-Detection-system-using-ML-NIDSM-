import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const IntrusionChart = () => {
  const [chartData, setChartData] = useState([]);

  const fetchAlerts = async () => {
    const res = await axios.get(`${API_BASE}/api/alerts`);
    setChartData((prev) => [...prev.slice(-15), res.data.filter((a) => a.label === 1).length]);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const data = {
    labels: Array.from({ length: chartData.length }, (_, i) => i + 1),
    datasets: [
      {
        label: "Intrusion Activity",
        data: chartData,
        borderColor: "#FF3366",
        backgroundColor: "rgba(255,51,102,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="chart-card">
      <h5 className="text-info mb-3">📊 Intrusion Activity Trend</h5>
      <Line data={data} options={{ responsive: true }} />
    </div>
  );
};

export default IntrusionChart;
