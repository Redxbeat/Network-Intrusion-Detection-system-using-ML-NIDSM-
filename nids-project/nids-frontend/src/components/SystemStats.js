/**
 * SystemStats.js
 * --------------------------------------------
 * Displays real-time system performance metrics
 * (CPU, Memory, Disk, Network) in animated charts.
 * --------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, Row, Col, ProgressBar } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SystemStats = () => {
  const [cpu, setCpu] = useState(0);
  const [memory, setMemory] = useState(0);
  const [disk, setDisk] = useState(0);
  const [network, setNetwork] = useState([]);
  const [timestamps, setTimestamps] = useState([]);

  // Poll real system stats from backend
  const fetchSystemStats = async () => {
    try {
      const base = require("../api").API_BASE; // require to avoid top-level import issues during CRA build
      const res = await fetch(`${base}/api/system`);
      const data = await res.json();

      const now = new Date().toLocaleTimeString();
      setCpu(data.cpu);
      setMemory(data.memory);
      setDisk(data.disk);

      setTimestamps((prev) => [...prev.slice(-10), now]);
      setNetwork((prev) => [...prev.slice(-10), data.net_speed]);
    } catch (err) {
      console.error("Error fetching system stats:", err);
    }
  };

  useEffect(() => {
    // Fetch immediately, then poll every 4s
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const lineData = {
    labels: timestamps,
    datasets: [
      {
        label: "Network Activity (KB/s)",
        data: network,
        fill: true,
        backgroundColor: "rgba(0, 255, 255, 0.1)",
        borderColor: "#00FFFF",
        tension: 0.4,
      },
    ],
  };

  const gaugeData = (label, value, color) => ({
    labels: [label, ""],
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [color, "#333"],
        borderWidth: 0,
      },
    ],
  });

  const gaugeOptions = {
    rotation: -90,
    circumference: 180,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-white mt-4"
    >
      <Row>
        {/* CPU Gauge */}
        <Col md={3}>
          <Card bg="dark" text="white" className="shadow-sm p-2">
            <Card.Header>🧠 CPU Usage</Card.Header>
            <Card.Body>
              <Doughnut
                data={gaugeData("CPU", cpu, cpu > 80 ? "#ff4d4d" : "#00FF99")}
                options={gaugeOptions}
              />
              <h5 className="text-center mt-3">{cpu.toFixed(1)}%</h5>
              <ProgressBar
                now={cpu}
                variant={cpu > 80 ? "danger" : "info"}
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Memory Gauge */}
        <Col md={3}>
          <Card bg="dark" text="white" className="shadow-sm p-2">
            <Card.Header>💾 Memory Usage</Card.Header>
            <Card.Body>
              <Doughnut
                data={gaugeData("Memory", memory, memory > 80 ? "#ff4d4d" : "#00FF99")}
                options={gaugeOptions}
              />
              <h5 className="text-center mt-3">{memory.toFixed(1)}%</h5>
              <ProgressBar
                now={memory}
                variant={memory > 80 ? "danger" : "success"}
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Disk Gauge */}
        <Col md={3}>
          <Card bg="dark" text="white" className="shadow-sm p-2">
            <Card.Header>🧱 Disk Usage</Card.Header>
            <Card.Body>
              <Doughnut
                data={gaugeData("Disk", disk, disk > 85 ? "#ff4d4d" : "#00FF99")}
                options={gaugeOptions}
              />
              <h5 className="text-center mt-3">{disk.toFixed(1)}%</h5>
              <ProgressBar
                now={disk}
                variant={disk > 85 ? "danger" : "info"}
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Network Graph */}
        <Col md={3}>
          <Card bg="dark" text="white" className="shadow-sm p-2">
            <Card.Header>🌐 Network Throughput</Card.Header>
            <Card.Body>
              <Line data={lineData} options={{ responsive: true }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default SystemStats;
