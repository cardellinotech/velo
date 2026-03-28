"use client";

import { FormEvent, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message.includes("Invalid") ? "Invalid email or password." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79, 70, 229, 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 100%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), #FAFBFC",
      }} />
      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.35]" style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 mb-5">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
            Velo
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Welcome back. Sign in to continue.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-white/80 backdrop-blur-sm p-7 shadow-elevated">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              minLength={8}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error/5 border border-error/10 px-3 py-2">
                <p className="text-sm text-error" role="alert">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2 h-11">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Track work. Track time. Get paid.
        </p>
      </div>
    </div>
  );
}
