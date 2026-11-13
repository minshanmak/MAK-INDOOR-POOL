import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Apple Wallet Web Service: Client Diagnostic Logs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.warn("[Apple Wallet Log]:", body?.logs);
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 200 });
  }
}
