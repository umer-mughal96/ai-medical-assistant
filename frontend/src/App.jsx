import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import PatientsPage from "./pages/PatientsPage.jsx";
import CasesPage from "./pages/CasesPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthenticated = !!token;
  const isLoginRoute = location.pathname === "/login";

  const getPageTitle = () => {
    if (location.pathname.startsWith("/patients/") && location.pathname.includes("/cases")) {
      return "Cases";
    }
    if (location.pathname.startsWith("/cases/") && location.pathname.includes("/chat")) {
      return "Diagnosis Chat";
    }
    if (location.pathname.startsWith("/patients")) {
      return "Patients";
    }
    if (location.pathname === "/login") {
      return "Authentication";
    }
    return "Dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">AI Medical Assistant</h1>
          <p className="app-subtitle">{getPageTitle()}</p>
        </div>
        <nav className="app-nav">
          {isAuthenticated && (
            <Link to="/patients">
              Patients
            </Link>
          )}
          {!isAuthenticated && !isLoginRoute && (
            <Link to="/login">
              Login / Register
            </Link>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/patients" />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:patientId/cases"
            element={
              <ProtectedRoute>
                <CasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:caseId/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
