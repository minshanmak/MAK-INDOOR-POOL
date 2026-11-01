import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPoolDate } from "@/lib/timezone";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignedUser: { select: { name: true } } },
  });

  const feedbacks = await prisma.customerFeedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    complaints,
    feedbacks,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // 1. Log a new complaint
  if (action === "CREATE_COMPLAINT") {
    const { category, description, customerName, customerPhone } = body;
    if (!category || !description || !customerName || !customerPhone) {
      return NextResponse.json({ error: "Category, description, customer name and phone are required." }, { status: 400 });
    }

    const todayClean = getPoolDate().replace(/-/g, "");
    const count = await prisma.complaint.count();
    const ticketNumber = `CMP-${todayClean}-${String(count + 1).padStart(4, "0")}`;

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        category,
        description,
        customerName,
        customerPhone,
        status: "OPEN",
        assignedUserId: user.userId,
      },
    });

    return NextResponse.json({ success: true, complaint });
  }

  // 2. Resolve complaint
  if (action === "RESOLVE_COMPLAINT") {
    const { complaintId, resolution, status = "RESOLVED" } = body;
    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        resolution,
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, complaint: updated });
  }

  // 3. Approve Customer Feedback for Public Display (Owner / SuperAdmin only)
  if (action === "APPROVE_FEEDBACK") {
    if (user.role !== "POOL_OWNER" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only owner can approve feedback for public display." }, { status: 403 });
    }
    const { feedbackId, isApproved } = body;
    const updated = await prisma.customerFeedback.update({
      where: { id: feedbackId },
      data: { isApprovedForPublic: Boolean(isApproved) },
    });
    return NextResponse.json({ success: true, feedback: updated });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

