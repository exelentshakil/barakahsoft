"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Password first, magic link as the fallback.
//
// The magic link was the only way in, which is a round trip through an inbox
// on every sign-in — tolerable for one operator signing in once a week,
// genuinely obstructive while several people are testing several brands and
// switching between them. Being signed in still is not being authorised:
// middleware checks the accounts table for THIS host's tenant either way.
//
// The link stays because it is the recovery path when a password is forgotten,
// and because a new operator can be invited without a password being sent
// anywhere.

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  // Read directly off window.location instead of useSearchParams so this
  // page doesn't need a Suspense boundary for one query param.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "not_authorized") {
      setError("That email is not authorised for this site.");
    }
  }, []);

  function nextPath(): string {
    return new URLSearchParams(window.location.search).get("next") || "/admin";
  }

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // A full navigation rather than a router push: middleware has to run to
    // check the accounts row for this host's tenant, and a client-side
    // transition would skip it and land on a dashboard that then bounces.
    window.location.assign(nextPath());
  }

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLinkLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLinkLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card className="shadow-popover">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              Check {email} for a sign-in link.
            </p>
          ) : (
            <form onSubmit={signInWithPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <button
                type="button"
                onClick={() => void sendMagicLink()}
                disabled={linkLoading}
                className="w-full text-center text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {linkLoading ? "Sending…" : "Email me a sign-in link instead"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
