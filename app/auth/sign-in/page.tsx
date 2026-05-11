import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { signInTeacher } from "@/app/auth/actions";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, success } = await searchParams;

  return (
    <AppShell>
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Teacher login</span>
            <h1 className="section-title">Sign in to your teacher dashboard</h1>
          </div>
          <p className="section-copy">
            Use your email and password to manage classes and student progress.
          </p>
        </div>

        <div className="glass-card" style={{ maxWidth: 520, padding: 24 }}>
          {success ? (
            <p className="muted" style={{ marginTop: 0 }}>
              {success}
            </p>
          ) : null}
          {error ? (
            <p className="feedback-gate-note" style={{ marginTop: 0 }}>
              {error}
            </p>
          ) : null}

          <form action={signInTeacher} className="teacher-auth-form">
            <label className="teacher-auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" required className="teacher-input" />
            </label>

            <label className="teacher-auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="teacher-input"
              />
            </label>

            <button type="submit" className="button">
              Sign in
            </button>
          </form>

          <p className="muted" style={{ marginBottom: 0 }}>
            Need an account? <Link href="/auth/sign-up">Create one</Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
}
