import React from "react";
import GaugeChart from "react-gauge-chart";
import { motion } from "framer-motion";

const NeonGauge = ({ title, value, color }) => {
  return (
    <motion.div
      className="neon-gauge"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h6 className="text-center text-info">{title}</h6>
      <GaugeChart
        id={`gauge-${title}`}
        nrOfLevels={20}
        colors={[color, "#333"]}
        percent={value / 100}
        arcWidth={0.3}
        needleColor="#00FFFF"
      />
      <p className="text-center mt-2">{value.toFixed(1)}%</p>
    </motion.div>
  );
};

export default NeonGauge;
