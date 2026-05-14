import { auth } from "./auth";

export async function requireAuth(): Promise<string> {
  let session: Awaited<ReturnType<typeof auth>>;
  try {
    session = await auth();
  } catch (err) {
    console.error("[requireAuth] auth() threw:", err);
    throw new Error("UNAUTHORIZED");
  }
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}
