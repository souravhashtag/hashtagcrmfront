import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
//import Dashboard from '../features/dashboard/pages/Dashboard';

const AppRoutes = () => {
  const isAuthenticated = true; // example

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {isAuthenticated ? (
        <>
          {/* <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" />} /> */}
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes;
