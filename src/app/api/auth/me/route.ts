import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      permissions: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    const response = NextResponse.json({ authenticated: false, error: "Account inactive" }, { status: 403 });
    response.cookies.delete("mak_session");
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      permissions: JSON.parse(user.permissions || "[]"),
    },
  });
}
