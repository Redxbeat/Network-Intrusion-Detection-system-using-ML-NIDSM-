import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { motion } from "framer-motion";
import NeonGauge from "./NeonGauge";
import IntrusionChart from "./IntrusionChart";
import IntrusionTable from "./IntrusionTable";
import { apiClient } from "../api";
import BackendStatus from "./BackendStatus";
import "./dashboard.css";

const MainDashboard = () => {
  const [sysStats, setSysStats] = useState({ cpu: 0, memory: 0, disk: 0, net_speed: 0 });
  const [summary, setSummary] = useState({ intrusions: 0, normal: 0, total: 0 });

  const fetchSystem = async () => {
    try {
      const res = await apiClient.get(`/api/system`);
      setSysStats(res.data || {});
    } catch (err) {
      console.error("Error fetching system:", err?.message || err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get(`/api/alerts`);
      const data = res.data || [];
      const intrusions = data.filter((a) => a.label === 1).length;
      const normal = data.filter((a) => a.label === 0).length;
      setSummary({ intrusions, normal, total: data.length });
    } catch (err) {
      console.error("Error fetching alerts:", err?.message || err);
    }
  };

  useEffect(() => {
    fetchSystem();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchSystem();
      fetchAlerts();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <Container fluid>
        <Row>
          <Col>
            <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="dashboard-title"
            >
              🛡️ Cyber Intrusion Detection Command Center
            </motion.h2>
          </Col>
          <Col className="text-end align-self-center">
            <BackendStatus />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={3}><NeonGauge title="CPU Usage" value={sysStats.cpu} color="#00FFFF" /></Col>
          <Col md={3}><NeonGauge title="Memory Usage" value={sysStats.memory} color="#33FF66" /></Col>
          <Col md={3}><NeonGauge title="Disk Usage" value={sysStats.disk} color="#FFAA33" /></Col>
          <Col md={3}><NeonGauge title="Network Speed (MB/s)" value={sysStats.net_speed} color="#FF3366" /></Col>
        </Row>

        <Row className="mt-4">
          <Col md={8}><IntrusionChart /></Col>
          <Col md={4}>
            <Card className="summary-card text-center">
              <Card.Body>
                <h5>Total Alerts: <span className="neon-text">{summary.total}</span></h5>
                <h5>Intrusions: <span className="danger-text">{summary.intrusions}</span></h5>
                <h5>Normal: <span className="success-text">{summary.normal}</span></h5>
              </Card.Body>
            </Card>
            <Card className="map-card mt-3">
              <Card.Body>
                <h5>🌍 Intrusion Map (Static)</h5>
                <img src="/map-placeholder.png" alt="Map" className="map-placeholder" />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col><IntrusionTable /></Col>
        </Row>
      </Container>
    </div>
  );
};

export default MainDashboard;
