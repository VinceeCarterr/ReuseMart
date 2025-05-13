import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();

  const raw = localStorage.getItem('profile');
  let profile;
  try {
    profile = raw ? JSON.parse(raw) : null;
  } catch {
    profile = null;
  }

  if (!profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const role = (profile.role || profile.jabatan || '').toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());

  //send to 403
  if (!allowed.includes(role)) {
    return <Navigate to="/unauthorize" replace />;
  }

  return children;
}
