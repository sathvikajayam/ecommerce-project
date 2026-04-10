const SUPER_ADMIN_EMAIL = "admin@example.com";

export const getStoredAdminUser = () => {
  try {
    const raw = localStorage.getItem("adminUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const isAdminUser = (user = getStoredAdminUser()) => {
  return !!user?.isAdmin;
};

export const hasAdminPermission = (resource, action, user = getStoredAdminUser()) => {
  if (!isAdminUser(user)) return false;
  if (user.role === "super_admin") return true;
  if ((user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL) return true;

  // Keep behavior in sync with backend strict permission checks.
  if (!user.permissions || typeof user.permissions !== "object") {
    return false;
  }

  return user.permissions?.[resource]?.[action] === true;
};

export const hasAnyAdminPermission = (checks = [], user = getStoredAdminUser()) => {
  return checks.some((check) => hasAdminPermission(check.resource, check.action, user));
};
