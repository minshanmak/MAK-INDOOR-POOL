import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Apple Wallet Web Service: Device Registration for Push Updates
 */
export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    };
  }
) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("ApplePass ")) {
      return new NextResponse(null, { status: 401 });
    }

    // Return 200 (already registered) or 201 (new registration)
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    };
  }
) {
  return new NextResponse(null, { status: 200 });
}
