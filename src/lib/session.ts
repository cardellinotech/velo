import { auth } from "./auth";
import type { Session } from "next-auth";

export async function requireAuth(): Promise<string> {
  let session: Session | null;
  try {
    session = await auth() as Session | null;
  } catch (err) {
    console.error("[requireAuth] auth() threw:", err);
    throw new Error("UNAUTHORIZED");
  }
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}
