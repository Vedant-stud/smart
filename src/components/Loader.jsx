import { motion } from "framer-motion";

export default function Loader({ full = false }) {
  return (
    <div
      className={
        full
          ? "min-h-screen flex items-center justify-center bg-[#f7f3e9]"
          : "flex items-center justify-center py-16"
      }
    >
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-forest-200 border-t-forest-700"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        />
        <span className="text-sm text-forest-600 font-medium">Growing your data…</span>
      </div>
    </div>
  );
}
