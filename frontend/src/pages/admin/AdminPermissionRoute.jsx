import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredAdminUser, hasAnyAdminPermission, isAdminUser } from "../../utils/adminPermissions";

const AdminPermissionRoute = ({ children, anyOf = [], redirectTo = "/admin/dashboard" }) => {
  const user = getStoredAdminUser();

  if (!isAdminUser(user)) {
    return <Navigate to="/admin/login" replace />;
  }

  if (anyOf.length === 0 || hasAnyAdminPermission(anyOf, user)) {
    return children;
  }

  return <Navigate to={redirectTo} replace />;
};

export default AdminPermissionRoute;
