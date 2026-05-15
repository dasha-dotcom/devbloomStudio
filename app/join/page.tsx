import { AppShell } from "@/components/app-shell";
import { goToJoinClassPage } from "@/app/join/actions";

export default function JoinEntryPage() {
  return (
    <AppShell>
      <section className="section student-page-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Student join</span>
            <h1 className="section-title">Enter your class code</h1>
          </div>
          <p className="section-copy">
            Your teacher will give you a class code. Enter it here to choose your name and join.
          </p>
        </div>

        <div className="glass-card" style={{ maxWidth: 520, padding: 24 }}>
          <form action={goToJoinClassPage} className="teacher-auth-form">
            <label className="teacher-auth-field">
              <span>Class code</span>
              <input
                type="text"
                name="classCode"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                required
                className="teacher-input"
              />
            </label>

            <button type="submit" className="button">
              Continue
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
