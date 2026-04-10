const SUPER_ADMIN_EMAIL = "admin@example.com";

export const hasPermission = (user, resource, action) => {
  if (!user || !user.isAdmin) return false;
  if (user.role === "super_admin") return true;
  if ((user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL) return true;

  // Strict mode: if permissions are missing, deny access.
  if (!user.permissions || typeof user.permissions !== "object") {
    return false;
  }

  return user.permissions?.[resource]?.[action] === true;
};

export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (hasPermission(req.user, resource, action)) {
      return next();
    }

    return res.status(403).json({
      message: `Permission denied: ${resource}.${action} required`,
    });
  };
};

// Allows access if the admin has ANY of the listed actions for the resource.
// Used on listing GET routes so admins with create/edit/delete (but not view)
// can still load the management page data.
export const requireAnyPermission = (resource, actions = []) => {
  return (req, res, next) => {
    const granted = actions.some((action) =>
      hasPermission(req.user, resource, action)
    );

    if (granted) {
      return next();
    }

    return res.status(403).json({
      message: `Permission denied: requires one of ${resource}.[${actions.join("|")}]`,
    });
  };
};
