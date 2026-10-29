import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

describe("Access Control & Authorization Rules", () => {
  it("grants Pool Owner full operational permissions including refunds and settings", () => {
    expect(hasPermission("POOL_OWNER", null, PERMISSIONS.REFUNDS_DECIDE)).toBe(true);
    expect(hasPermission("POOL_OWNER", null, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission("POOL_OWNER", null, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)).toBe(true);
  });

  it("grants Super Admin full platform permissions", () => {
    expect(hasPermission("SUPER_ADMIN", null, PERMISSIONS.REFUNDS_DECIDE)).toBe(true);
    expect(hasPermission("SUPER_ADMIN", null, PERMISSIONS.STAFF_MANAGE)).toBe(true);
  });

  it("strictly prohibits Staff from approving refunds under all conditions", () => {
    // Even if permission list erroneously included it
    const maliciousStaffPerms = JSON.stringify([PERMISSIONS.REFUNDS_DECIDE, PERMISSIONS.SETTINGS_MANAGE]);
    expect(hasPermission("STAFF", maliciousStaffPerms, PERMISSIONS.REFUNDS_DECIDE)).toBe(false);
    expect(hasPermission("STAFF", maliciousStaffPerms, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it("allows Staff basic operational permissions by default", () => {
    expect(hasPermission("STAFF", null, PERMISSIONS.BOOKINGS_VIEW)).toBe(true);
    expect(hasPermission("STAFF", null, PERMISSIONS.BOOKINGS_CREATE)).toBe(true);
    expect(hasPermission("STAFF", null, PERMISSIONS.BOOKINGS_CANCEL_REQUEST)).toBe(true);
    expect(hasPermission("STAFF", null, PERMISSIONS.WALKIN_MANAGE)).toBe(true);
  });

  it("requires explicit cancel_approve permission for Staff to approve cancellations", () => {
    // Default staff cannot approve cancellations
    expect(hasPermission("STAFF", null, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)).toBe(false);

    // Staff granted explicit cancel_approve
    const approvedStaff = JSON.stringify([PERMISSIONS.BOOKINGS_CANCEL_APPROVE]);
    expect(hasPermission("STAFF", approvedStaff, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)).toBe(true);
  });
});

