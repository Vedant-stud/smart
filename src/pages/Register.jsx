import { motion } from "framer-motion";
import { Leaf, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = [
  { value: "farmer", label: "Farmer" },
  { value: "agronomist", label: "Agronomist" },
  { value: "researcher", label: "Researcher" },
  { value: "admin", label: "Administrator" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "farmer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.full_name, form.email, form.password, form.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f7f3e9] py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-forest-800 flex items-center justify-center mb-3">
            <Leaf size={22} className="text-wheat-200" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-forest-950">Create your account</h1>
          <p className="text-forest-600 text-sm mt-1">Start managing your farms with AI guidance</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-4">
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-soil-700 bg-soil-50 border border-soil-200 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}
          <div>
            <label className="label-text">Full name</label>
            <input required className="input-field" value={form.full_name} onChange={update("full_name")} placeholder="Asha Patil" />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={update("email")} placeholder="you@farm.com" />
          </div>
          <div>
            <label className="label-text">Password</label>
            <input type="password" required minLength={6} className="input-field" value={form.password} onChange={update("password")} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="label-text">Role</label>
            <select className="input-field" value={form.role} onChange={update("role")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary w-full mt-2">
            <UserPlus size={17} />
            {loading ? "Creating account…" : "Create account"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-forest-600 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-forest-800 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
