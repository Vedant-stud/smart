import { AnimatePresence, motion } from "framer-motion";
import {
  CheckSquare,
  CloudSun,
  Camera,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Sprout,
  Tractor,
  X,
} from "lucide-react";
import { useState } from "react";
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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-forest-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-forest-800 flex items-center justify-center">
            <Leaf size={16} className="text-wheat-200" />
          </div>
          <p className="font-display font-semibold text-forest-950">Smart Crop</p>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 text-forest-700">
          <Menu size={22} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-forest-950/40 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl p-5 flex flex-col"
            >
              <button onClick={() => setOpen(false)} className="self-end p-2 text-forest-600">
                <X size={20} />
              </button>
              <nav className="flex-1 space-y-1 mt-4">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                        isActive ? "bg-wheat-200/70 text-forest-950" : "text-forest-600"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-forest-600 hover:text-soil-600 px-1 pb-2"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
