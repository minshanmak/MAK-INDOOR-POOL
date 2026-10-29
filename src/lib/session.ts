import { cookies } from "next/headers";
import { verifySessionToken, SessionPayload } from "./auth";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("mak_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
