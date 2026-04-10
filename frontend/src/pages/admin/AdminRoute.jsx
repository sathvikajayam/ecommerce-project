import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredAdminUser, isAdminUser } from "../../utils/adminPermissions";

const AdminRoute = ({ children }) => {
  const user = getStoredAdminUser();
  if (!isAdminUser(user)) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default AdminRoute;
