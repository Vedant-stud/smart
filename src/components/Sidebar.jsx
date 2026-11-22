import { motion } from "framer-motion";
import {
  Camera,
  LayoutDashboard,
  MessageCircle,
  Sprout,
  Tractor,
  CheckSquare,
  CloudSun,
  LogOut,
  Leaf,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/farms", label: "Farms", icon: Tractor },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/chatbot", label: "AI Advisor", icon: MessageCircle },
  { to: "/disease", label: "Disease Scan", icon: Camera },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-forest-100 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="h-9 w-9 rounded-xl bg-forest-800 flex items-center justify-center">
          <Leaf size={18} className="text-wheat-200" />
        </div>
        <div>
          <p className="font-display font-semibold text-forest-950 leading-none">Smart Crop</p>
          <p className="text-xs text-forest-500 tracking-wide">Advisor</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-forest-950" : "text-forest-600 hover:text-forest-900 hover:bg-forest-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl bg-wheat-200/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-5 border-t border-forest-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-soil-200 flex items-center justify-center text-soil-800 font-semibold font-display">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-forest-950 truncate">{user?.full_name}</p>
            <p className="text-xs text-forest-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-forest-600 hover:text-soil-600 transition-colors w-full px-1"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
