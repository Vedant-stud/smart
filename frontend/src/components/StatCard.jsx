import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

function AnimatedNumber({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({ icon: Icon, label, value, accent = "forest", suffix = "" }) {
  const accentMap = {
    forest: "bg-forest-800 text-wheat-50",
    wheat: "bg-wheat-500 text-forest-950",
    soil: "bg-soil-500 text-wheat-50",
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="card p-5 flex items-center gap-4"
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-display font-semibold text-forest-950 leading-none">
          <AnimatedNumber value={value} />
          {suffix}
        </p>
        <p className="text-sm text-forest-600 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
