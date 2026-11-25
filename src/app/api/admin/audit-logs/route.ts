import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard security check: Only POOL_OWNER or SUPER_ADMIN or users with AUDIT_VIEW permission
    const isOwnerOrAdmin = user.role === "POOL_OWNER" || user.role === "SUPER_ADMIN";
    const hasAuditPerm = hasPermission(user.role, user.permissions, PERMISSIONS.AUDIT_VIEW);
    if (!isOwnerOrAdmin && !hasAuditPerm) {
      return NextResponse.json(
        { error: "Forbidden: Only Pool Owner or Super Admin can access audit logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (entityType && entityType !== "ALL") {
      where.entityType = entityType;
    }

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(`${dateFrom}T00:00:00+05:30`);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(`${dateTo}T23:59:59+05:30`);
      }
    }

    if (search) {
      where.OR = [
        { details: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { userRole: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        {
          performedByUser: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [logs, total, entityCounts] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          performedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ["entityType"],
        _count: { _all: true },
      }),
    ]);

    const entitySummary: Record<string, number> = {};
    for (const ec of entityCounts) {
      entitySummary[ec.entityType] = ec._count._all;
    }

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      entitySummary,
    });
  } catch (err: any) {
    console.error("Error loading audit logs:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
