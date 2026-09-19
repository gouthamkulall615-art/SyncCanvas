import { Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Workspace from "../pages/Workspace";

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Authenticated Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Collaborative Workspace */}
      <Route path="/workspace/:token" element={<Workspace />} />
    </Routes>
  );
}