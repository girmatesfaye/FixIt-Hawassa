import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import WorkerProfilePage from "./pages/WorkerProfilePage";
import MessagesPage from "./pages/MessagesPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import WorkerHubPage from "./pages/WorkerHubPage";
import EditWorkerProfilePage from "./pages/EditWorkerProfilePage";
import AdminLayout from "./admin/AdminLayout";
import UserManagementPage from "./admin/UserManagementPage";
import ReportManagementPage from "./admin/ReportManagementPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import CategoryManagementPage from "./admin/CategoryManagementPage";
import {
  clearSession,
  getAuthToken,
  getStoredRole,
  getTokenExpiryMs,
  isTokenExpired,
  refreshAuthSession,
  saveSession,
  UserRole,
} from "./services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(() =>
    getStoredRole(),
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getAuthToken()) && getStoredRole() !== null;
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const applyLogout = () => {
    clearSession();
    setUserRole(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = getAuthToken();
    const storedRole = getStoredRole();

    if (!token || !storedRole || isTokenExpired(token)) {
      applyLogout();
      setIsCheckingAuth(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          user?: { role?: UserRole };
        } | null;

        if (!response.ok || !result?.user?.role) {
          throw new Error("Unauthorized");
        }

        saveSession(token, result.user.role);
        setUserRole(result.user.role);
        setIsAuthenticated(true);
      })
      .catch(() => {
        applyLogout();
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const token = getAuthToken();
      if (!token) {
        applyLogout();
        return;
      }

      if (isTokenExpired(token)) {
        applyLogout();
        return;
      }

      const expiryMs = getTokenExpiryMs(token);
      if (!expiryMs) {
        applyLogout();
        return;
      }

      // Refresh token when less than 15 minutes remain.
      if (expiryMs - Date.now() <= 15 * 60 * 1000) {
        const refreshed = await refreshAuthSession();
        if (!refreshed) {
          applyLogout();
          return;
        }

        saveSession(refreshed.token, refreshed.role);
        setUserRole(refreshed.role);
        setIsAuthenticated(true);
      }
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleLogin = (role: UserRole = "client") => {
    const token = getAuthToken();
    if (!token) {
      applyLogout();
      return;
    }

    saveSession(token, role);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    applyLogout();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={<RegisterPage onRegisterSuccess={handleLogin} />}
        />
        <Route path="/verify" element={<VerifyPage onVerify={handleLogin} />} />

        {/* Client & Worker Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userRole === "client" ? (
              <DashboardPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/request-service"
          element={
            isAuthenticated && userRole === "client" ? (
              <ServiceRequestPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/search-results"
          element={
            isAuthenticated && userRole === "client" ? (
              <SearchResultsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/messages"
          element={
            isAuthenticated &&
            (userRole === "client" || userRole === "worker") ? (
              <MessagesPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/my-requests"
          element={
            isAuthenticated && userRole === "client" ? (
              <MyRequestsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/worker-hub"
          element={
            isAuthenticated && userRole === "worker" ? (
              <WorkerHubPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/worker/edit-profile"
          element={
            isAuthenticated && userRole === "worker" ? (
              <EditWorkerProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/worker/:id" element={<WorkerProfilePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === "admin" ? (
              <AdminLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Navigate to="users" />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="reports" element={<ReportManagementPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="settings"
            element={<div className="p-8">Settings (Coming Soon)</div>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
