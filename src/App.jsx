import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Crops from "./pages/Crops.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Disease from "./pages/Disease.jsx";
import Farms from "./pages/Farms.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Tasks from "./pages/Tasks.jsx";
import Weather from "./pages/Weather.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/disease" element={<Disease />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
