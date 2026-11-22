import { motion } from "framer-motion";
import { AlertTriangle, Bell, CheckSquare, Sprout, Tractor } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import client from "../api/client";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PALETTE = ["#487f4f", "#e5a83e", "#c77b4c", "#1b4332", "#93bb98", "#946426"];

const SEVERITY_STYLES = {
  info: "border-forest-200 bg-forest-50 text-forest-700",
  warning: "border-wheat-300 bg-wheat-50 text-wheat-800",
  critical: "border-soil-300 bg-soil-50 text-soil-700",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([client.get("/api/analytics/summary"), client.get("/api/alerts")])
      .then(([summaryRes, alertsRes]) => {
        setSummary(summaryRes.data);
        setAlerts(alertsRes.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    await client.patch(`/api/alerts/${id}/read`);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  };

  if (loading) return <Loader />;

  const isEmpty = summary && summary.active_farms === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-forest-950">
          Welcome back, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-forest-600 mt-1">Here's how your farms are doing today.</p>
      </div>

      {isEmpty ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-10 text-center">
          <Tractor className="mx-auto text-forest-400 mb-3" size={36} />
          <h2 className="text-xl font-display font-semibold text-forest-950">No farms yet</h2>
          <p className="text-forest-600 mt-1 mb-5">Add your first farm to unlock recommendations, weather alerts, and analytics.</p>
          <Link to="/farms" className="btn-primary inline-flex">
            Add a farm
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Tractor} label="Active farms" value={summary.active_farms} accent="forest" />
            <StatCard icon={Sprout} label="Active crops" value={summary.active_crops} accent="wheat" />
            <StatCard icon={CheckSquare} label="Open tasks" value={summary.open_tasks} accent="forest" />
            <StatCard icon={AlertTriangle} label="Unread alerts" value={summary.unread_alerts} accent="soil" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
              <h3 className="font-display font-semibold text-forest-950 mb-4">Active crops by type</h3>
              {summary.crop_distribution.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={summary.crop_distribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={3}>
                      {summary.crop_distribution.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfeadf" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-forest-500 text-sm py-10 text-center">No active crops yet.</p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <h3 className="font-display font-semibold text-forest-950 mb-4">Growth stage distribution</h3>
              {summary.growth_stage_distribution.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summary.growth_stage_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfeadf" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#2b4f31" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#2b4f31" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfeadf" }} />
                    <Bar dataKey="value" fill="#487f4f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-forest-500 text-sm py-10 text-center">No active crops yet.</p>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-forest-500">Total cultivated area</p>
                <p className="text-2xl font-display font-semibold text-forest-950">{summary.total_area_acres} acres</p>
              </div>
              <Link to="/chatbot" className="btn-secondary">
                Ask the AI advisor
              </Link>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={17} className="text-forest-700" />
                <h3 className="font-display font-semibold text-forest-950">Recent alerts</h3>
              </div>
              {alerts.length === 0 ? (
                <p className="text-sm text-forest-500 py-4 text-center">No alerts yet — check weather for a farm to generate one.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <motion.button
                      key={a.id}
                      onClick={() => !a.is_read && markRead(a.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`w-full text-left border rounded-xl px-3.5 py-2.5 text-sm transition-opacity ${
                        SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info
                      } ${a.is_read ? "opacity-50" : ""}`}
                    >
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">{a.message}</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
