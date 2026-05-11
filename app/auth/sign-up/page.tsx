import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { signUpTeacher } from "@/app/auth/actions";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell>
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Teacher sign up</span>
            <h1 className="section-title">Create your teacher account</h1>
          </div>
          <p className="section-copy">
            This sets up teacher auth only. Classes and student profiles will come in the next phase.
          </p>
        </div>

        <div className="glass-card" style={{ maxWidth: 520, padding: 24 }}>
          {error ? (
            <p className="feedback-gate-note" style={{ marginTop: 0 }}>
              {error}
            </p>
          ) : null}

          <form action={signUpTeacher} className="teacher-auth-form">
            <label className="teacher-auth-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="email" required className="teacher-input" />
            </label>

            <label className="teacher-auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="teacher-input"
              />
            </label>

            <button type="submit" className="button">
              Create account
            </button>
          </form>

          <p className="muted" style={{ marginBottom: 0 }}>
            Already have an account? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
}
