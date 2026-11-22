import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import MobileNav from "./MobileNav.jsx";
import PageTransition from "./PageTransition.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
