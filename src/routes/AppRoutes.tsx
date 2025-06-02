import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
import Dashboard from '../features/dashboard/pages/Dashboard';
import Sidebar from '../features/common/Sidebar';
import Layout from '../features/common/Layout';

const ProtectedRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const [isAuthenticated] = useState(!!localStorage.getItem('token'));
  const base = process.env.REACT_APP_URL || "/";

  return (
    <Routes>
      {/* Public Route */}
      <Route path={base} element={isAuthenticated ? <Navigate to={`${base}dashboard`} /> : <Login />} />

      {/* Protected Routes (uses Layout with Sidebar) */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<Layout />}>
          <Route path={`${base}dashboard`} element={<Dashboard />} />
          <Route path="/get-token" element={<div id="keyContainer">{localStorage.getItem('token')}</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/reports" element={<div>Reports Page</div>} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? `${base}dashboard` : base} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
