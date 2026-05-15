import { db } from "../src/lib/db";
import { users } from "../src/lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <password>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email });

  if (result.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Password updated for: ${result[0].email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
