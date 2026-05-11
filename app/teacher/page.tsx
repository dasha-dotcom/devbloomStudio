import { signOutTeacher } from "@/app/auth/actions";
import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";

export default async function TeacherDashboardPage() {
  const teacher = await getCurrentTeacher();

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Teacher dashboard</span>
          <h1 className="section-title">Welcome back</h1>
        </div>
        <p className="section-copy">
          Teacher auth is connected. Class setup and student roster management are the next step.
        </p>
      </div>

      <div className="steps-grid">
        <article className="step-card">
          <div className="step-number">1</div>
          <strong>Signed-in teacher</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {teacher.email}
          </p>
        </article>

        <article className="step-card">
          <div className="step-number">2</div>
          <strong>Teacher profile</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Profile created and linked to your Supabase auth user.
          </p>
        </article>

        <article className="step-card">
          <div className="step-number">3</div>
          <strong>Classes placeholder</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            No classes yet. Class creation will be added in Phase 2B.
          </p>
        </article>
      </div>

      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <strong>Class area</strong>
        <p className="muted">
          This is intentionally minimal for Phase 2A. The backend auth and database scaffold are ready for class
          management next.
        </p>

        <form action={signOutTeacher}>
          <button type="submit" className="button-ghost">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
