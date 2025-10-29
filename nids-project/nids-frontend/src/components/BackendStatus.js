import React, { useEffect, useState } from "react";
import { Badge, Spinner } from "react-bootstrap";
import { apiClient } from "../api";

const BackendStatus = ({ pollInterval = 4000 }) => {
  const [status, setStatus] = useState("unknown");
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await apiClient.get(`/api/health`);
      if (res && res.data && res.data.status === "ok") {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (err) {
      setStatus("offline");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const iv = setInterval(check, pollInterval);
    return () => clearInterval(iv);
  }, [pollInterval]);

  if (status === "online")
    return (
      <Badge bg="success" className="px-3 py-2">
        Backend: Online
      </Badge>
    );

  if (checking)
    return (
      <Badge bg="secondary" className="px-3 py-2">
        <Spinner animation="border" size="sm" />&nbsp; Checking...
      </Badge>
    );

  return (
    <Badge bg="danger" className="px-3 py-2">
      Backend: Offline
    </Badge>
  );
};

export default BackendStatus;
