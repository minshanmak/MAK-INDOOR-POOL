import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Owner or Super Admin can manage staff
  if (user.role !== "POOL_OWNER" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Staff management requires Owner privileges" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      ...s,
      permissions: JSON.parse(s.permissions || "[]"),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "POOL_OWNER" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Owner only action" }, { status: 403 });
  }

  const body = await req.json();
  const { action, userId, name, phone, email, password, role, permissions, status } = body;

  if (action === "CREATE") {
    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Name, phone, and initial password are required." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, { email: email || undefined }] },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this phone or email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        passwordHash,
        role: role || "STAFF",
        status: "ACTIVE",
        permissions: JSON.stringify(permissions || []),
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: newUser.id,
        action: "CREATE",
        performedByUserId: user.userId,
        userRole: user.role,
        details: `Created new staff account for ${name} (${phone}) with role ${role || "STAFF"}`,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  }

  if (action === "UPDATE_STATUS") {
    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: updated.id,
        action: "UPDATE",
        performedByUserId: user.userId,
        userRole: user.role,
        details: `Changed status of user ${updated.name} to ${status}`,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
