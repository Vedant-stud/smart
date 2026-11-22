import { motion } from "framer-motion";
import { Leaf, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f7f3e9]">
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
          <h1 className="text-2xl font-display font-semibold text-forest-950">Smart Crop Advisor</h1>
          <p className="text-forest-600 text-sm mt-1">Sign in to your farm workspace</p>
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
            <label className="label-text">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@farm.com"
            />
          </div>
          <div>
            <label className="label-text">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            <LogIn size={17} />
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-forest-600 mt-5">
          New to Smart Crop Advisor?{" "}
          <Link to="/register" className="text-forest-800 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
