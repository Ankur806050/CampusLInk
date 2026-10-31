/**
 * Restrict a route to specific roles.
 * authenticate must run before this middleware.
 *
 * Examples:
 * authorizeRoles("TPO")
 * authorizeRoles("STUDENT")
 * authorizeRoles("RECRUITER", "TPO")
 */
export function authorizeRoles(...allowedRoles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    if (req.user.accountStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_NOT_ACTIVE",
        message: "Your account must be approved before you can perform this action.",
      });
    }

    return next();
  };
}
