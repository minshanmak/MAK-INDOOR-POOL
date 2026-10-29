import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Phone or email, and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // Find user by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanIdentifier }, { email: cleanIdentifier.toLowerCase() }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your phone/email and password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This staff account has been deactivated. Please contact the pool owner." },
        { status: 403 }
      );
    }

    const now = new Date();

    // Check temporary lockout
    if (user.lockoutUntil && user.lockoutUntil > now) {
      const waitMin = Math.ceil((user.lockoutUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Account temporarily locked for ${waitMin} minutes.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failed = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | null = null;
      if (failed >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failed,
          lockoutUntil,
        },
      });

      return NextResponse.json(
        {
          error: failed >= 5
            ? "Too many failed attempts. Account locked for 15 minutes."
            : `Invalid credentials. (${5 - failed} attempts remaining before temporary lockout)`,
        },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const sessionToken = await createSessionToken({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role as any,
      permissions: user.permissions,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || "[]"),
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("mak_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during login." }, { status: 500 });
  }
}
