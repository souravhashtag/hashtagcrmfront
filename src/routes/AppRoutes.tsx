import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
import Dashboard from '../features/dashboard/pages/Dashboard';
import { useNavigate } from 'react-router-dom';

const AppRoutes = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('token') ? true : false
  );

  // Uncomment if you need to react to token changes while the app is running
  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   setIsAuthenticated(!!token);
  // }, []);

  //console.log('Authentication status:', isAuthenticated);
  const base = process.env.REACT_APP_URL || "/";
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path={base} 
        element={isAuthenticated ? <Navigate to={`${base}dashboard`} replace /> : <Login />} 
      />

      {isAuthenticated ? (
        <>
          <Route path={`${base}dashboard`} element={<Dashboard />} />
          <Route path="/get-token" element={<div id="keyContainer">{localStorage.getItem('token')}</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/reports" element={<div>Reports Page</div>} />
        </>
      ) : (
        <Route path="*" element={<Navigate to={`${base}`} replace />} />
      )}

      {/* Catch all other routes */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? base+"dashboard" : base} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;