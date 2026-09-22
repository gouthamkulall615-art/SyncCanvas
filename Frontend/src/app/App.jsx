import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Workspace from "../pages/Workspace";
import Features from "../pages/Features";
import Integrations from "../pages/Integrations";
import Changelog from "../pages/Changelog";
import Roadmap from "../pages/Roadmap";
import Docs from "../pages/Docs";
import Community from "../pages/Community";
import Support from "../pages/Support";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import NotFound from "../pages/NotFound";

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

      {/* Product Routes */}
      <Route path="/features" element={<Features />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/roadmap" element={<Roadmap />} />

      {/* Resource Routes */}
      <Route path="/docs" element={<Docs />} />
      <Route path="/documentation" element={<Docs />} />
      <Route path="/community" element={<Community />} />
      <Route path="/support" element={<Support />} />

      {/* Legal Routes */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/terms-of-service" element={<Terms />} />

      {/* 404 Not Found Page */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}