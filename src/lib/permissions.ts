export type Role = "SUPER_ADMIN" | "POOL_OWNER" | "STAFF";

export const PERMISSIONS = {
  // Bookings
  BOOKINGS_VIEW: "bookings:view",
  BOOKINGS_CREATE: "bookings:create",
  BOOKINGS_EDIT: "bookings:edit",
  BOOKINGS_CANCEL_REQUEST: "bookings:cancel_request",
  BOOKINGS_CANCEL_APPROVE: "bookings:cancel_approve", // Separate permission!

  // Payments & Walk-ins
  PAYMENTS_VIEW: "payments:view",
  PAYMENTS_CREATE: "payments:create",
  REFUNDS_DECIDE: "refunds:decide", // Owner/SuperAdmin only
  WALKIN_MANAGE: "walkin:manage",

  // Operations
  MAINTENANCE_VIEW: "maintenance:view",
  MAINTENANCE_LOG: "maintenance:log",
  CLOSING_SUBMIT: "closing:submit",
  CLOSING_REVIEW: "closing:review", // Owner/SuperAdmin only

  // Administration & Reports
  STAFF_MANAGE: "staff:manage", // Owner/SuperAdmin only
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
  SETTINGS_MANAGE: "settings:manage", // Owner/SuperAdmin only
  COMPLAINTS_MANAGE: "complaints:manage",
  AUDIT_VIEW: "audit:view",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default permissions assigned to each role
export const ROLE_DEFAULT_PERMISSIONS: Record<Role, PermissionCode[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  POOL_OWNER: Object.values(PERMISSIONS),
  STAFF: [
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL_REQUEST,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.WALKIN_MANAGE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_LOG,
    PERMISSIONS.CLOSING_SUBMIT,
    PERMISSIONS.COMPLAINTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

/**
 * Checks if a user has the required permission based on role and custom permissions.
 * Hard rule: Refunds and Settings can NEVER be executed by non-Owners.
 */
export function hasPermission(
  userRole: Role | string,
  userPermissionsJson: string | null | undefined,
  requiredPermission: PermissionCode
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "POOL_OWNER") {
    return true;
  }

  // Hard safety boundary: Refunds & Settings changes are OWNER-ONLY
  if (
    requiredPermission === PERMISSIONS.REFUNDS_DECIDE ||
    requiredPermission === PERMISSIONS.SETTINGS_MANAGE ||
    requiredPermission === PERMISSIONS.STAFF_MANAGE ||
    requiredPermission === PERMISSIONS.CLOSING_REVIEW
  ) {
    return false;
  }

  if (userRole === "STAFF") {
    let customPerms: string[] = [];
    if (userPermissionsJson) {
      try {
        customPerms = JSON.parse(userPermissionsJson);
      } catch {
        customPerms = [];
      }
    }
    // If staff has custom permissions assigned, check that; otherwise default permissions
    if (customPerms.length > 0) {
      return customPerms.includes(requiredPermission);
    }
    return ROLE_DEFAULT_PERMISSIONS.STAFF.includes(requiredPermission);
  }

  return false;
}
