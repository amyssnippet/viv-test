import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoutes = ({ Component, isUserLoggedIn }) => {
  return isUserLoggedIn ? (
    <Component />
  ) : (
    <Navigate to="/auth" replace />
  );
};

export default ProtectedRoutes;