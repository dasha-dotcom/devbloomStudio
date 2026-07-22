import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Coding for Kids in the Classroom | DevBloom Studio",
  description:
    "A student coding platform for teachers to create classes, share class codes and 6-digit PINs, and review saved coding progress and reflections.",
  alternates: {
    canonical: "https://devbloom-studio.vercel.app/teachers",
  },
};

const teacherFaqItems = [
  {
    question: "Do students need email accounts?",
    answer:
      "No. A teacher adds each student to the class roster. Students enter the class code, choose their name, and use a private six-digit PIN to join.",
  },
  {
    question: "What happens when a student leaves a lesson?",
    answer:
      "Classroom project attempts are saved to the student's profile. Students can resume an attempt, while the teacher can see its latest progress and activity.",
  },
  {
    question: "What can a teacher review?",
    answer:
      "Teachers can open a student's saved attempts to see progress, the current step, predictions, checkpoints, reflections, and a read-only preview of the project.",
  },
  {
    question: "Which coding skills are in the current projects?",
    answer:
      "The current guided projects introduce HTML, CSS, and JavaScript through small website builds with live preview, checkpoints, and reflection prompts.",
  },
] as const;

export default function TeachersLandingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: teacherFaqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <main>
        <section className="teachers-hero" aria-labelledby="teachers-hero-title">
          <div className="teachers-hero-copy">
            <span className="eyebrow">Coding for kids in the classroom</span>
            <h1 id="teachers-hero-title">
              See how students think, not just what they finish.
            </h1>
            <p>
              DevBloom Studio is a student coding platform for teachers who want
              a simple classroom setup and a clearer view of learning. Create a
              class, share a join code and six-digit PINs, then review each
              student&apos;s saved work and reflections.
            </p>
            <div className="teachers-hero-actions">
              <Link href="/teacher" className="button primary-cta">
                Open teacher dashboard
              </Link>
              <Link href="/projects" className="text-link">
                Preview the student lessons
              </Link>
            </div>
            <ul className="teacher-proof-list" aria-label="Classroom setup summary">
              <li>No student email accounts</li>
              <li>Saved classroom attempts</li>
              <li>Read-only teacher review</li>
            </ul>
          </div>

          <div className="teacher-dashboard-visual glass-card" aria-label="Example teacher dashboard view">
            <div className="teacher-visual-toolbar">
              <div>
                <span className="teacher-visual-kicker">Example teacher view</span>
                <strong>Creative coding club</strong>
              </div>
              <span className="teacher-code-chip">Code BLOOM8</span>
            </div>

            <div className="teacher-visual-summary">
              <div>
                <span>Roster</span>
                <strong>3 students</strong>
              </div>
              <div>
                <span>Latest activity</span>
                <strong>2 active attempts</strong>
              </div>
            </div>

            <div className="teacher-roster-preview">
              <article className="teacher-roster-row">
                <span className="teacher-avatar" aria-hidden>A</span>
                <div>
                  <strong>Student A</strong>
                  <span>Make a Page About Something You Like</span>
                </div>
                <div className="teacher-row-status">
                  <strong>75%</strong>
                  <span>Reflection saved</span>
                </div>
              </article>
              <article className="teacher-roster-row">
                <span className="teacher-avatar avatar-mint" aria-hidden>B</span>
                <div>
                  <strong>Student B</strong>
                  <span>Build a Vibe Page</span>
                </div>
                <div className="teacher-row-status">
                  <strong>40%</strong>
                  <span>Step 3 active</span>
                </div>
              </article>
              <article className="teacher-roster-row">
                <span className="teacher-avatar avatar-sky" aria-hidden>C</span>
                <div>
                  <strong>Student C</strong>
                  <span>No project attempt yet</span>
                </div>
                <div className="teacher-row-status muted-status">
                  <strong>New</strong>
                  <span>Ready to start</span>
                </div>
              </article>
            </div>

            <p className="teacher-sample-note">Sample data shown for illustration.</p>
          </div>
        </section>

        <section className="section teacher-workflow-section" aria-labelledby="teacher-workflow-title">
          <div className="section-head">
            <div>
              <span className="eyebrow">Classroom workflow</span>
              <h2 id="teacher-workflow-title" className="section-title">
                From roster to review in three clear steps.
              </h2>
            </div>
            <p className="section-copy">
              The classroom flow keeps sign-in light for students while saving
              the work a teacher needs to revisit later.
            </p>
          </div>

          <div className="teacher-workflow-grid">
            <article className="teacher-workflow-card workflow-card-featured">
              <span className="teacher-workflow-number">01</span>
              <div>
                <h3>Create a class and roster</h3>
                <p>
                  Name the class, choose its reflection mode, and add student
                  display names. DevBloom generates a join code for the class.
                </p>
              </div>
              <div className="class-setup-preview" aria-hidden>
                <span>Class name</span>
                <strong>Creative coding club</strong>
                <span>Join code generated</span>
              </div>
            </article>

            <article className="teacher-workflow-card">
              <span className="teacher-workflow-number">02</span>
              <h3>Share the code and PINs</h3>
              <p>
                Students open the join page, enter the class code, choose their
                roster name, and use their six-digit PIN. They do not need an
                email login.
              </p>
            </article>

            <article className="teacher-workflow-card">
              <span className="teacher-workflow-number">03</span>
              <h3>Open saved student work</h3>
              <p>
                Return to the roster to see each student&apos;s latest project,
                progress, current step, recent activity, and completed attempts.
              </p>
            </article>
          </div>
        </section>

        <section className="section teacher-visibility-section" aria-labelledby="teacher-visibility-title">
          <div className="teacher-visibility-copy">
            <span className="eyebrow">Student progress visibility</span>
            <h2 id="teacher-visibility-title" className="section-title">
              Open the attempt behind the percentage.
            </h2>
            <p>
              A progress number is only the start. The teacher view opens the
              saved attempt so you can look at the student&apos;s path through the
              project and the thinking they recorded along the way.
            </p>
            <dl className="teacher-visibility-list">
              <div>
                <dt>At a glance</dt>
                <dd>Project status, progress, current step, and recent activity</dd>
              </div>
              <div>
                <dt>Inside an attempt</dt>
                <dd>Predictions, checkpoints, reflections, and step completion</dd>
              </div>
              <div>
                <dt>Finished work</dt>
                <dd>A sandboxed, read-only preview of the student&apos;s saved page</dd>
              </div>
            </dl>
          </div>

          <div className="attempt-visual" aria-label="Example saved student attempt">
            <div className="attempt-visual-head">
              <div>
                <span>Saved attempt</span>
                <strong>Build a Vibe Page</strong>
              </div>
              <span className="attempt-progress">75% complete</span>
            </div>
            <div className="attempt-visual-grid">
              <div className="attempt-signal">
                <span>Current step</span>
                <strong>Style the page</strong>
              </div>
              <div className="attempt-signal">
                <span>Checkpoint</span>
                <strong>Passed</strong>
              </div>
              <div className="attempt-signal attempt-reflection">
                <span>Latest reflection</span>
                <p>
                  &quot;I changed the background color to make the page feel calmer.&quot;
                </p>
              </div>
            </div>
            <div className="attempt-preview-window">
              <div className="attempt-preview-bar">
                <span>Read-only preview</span>
                <span className="preview-dot-row" aria-hidden><i /><i /><i /></span>
              </div>
              <div className="attempt-preview-page">
                <span>MY VIBE PAGE</span>
                <strong>Calm, curious, creative.</strong>
                <div className="attempt-preview-swatches" aria-hidden>
                  <i /><i /><i />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section teacher-student-section" aria-labelledby="teacher-student-title">
          <div className="teacher-student-panel">
            <div>
              <span className="eyebrow">What students do</span>
              <h2 id="teacher-student-title" className="section-title">
                Build in real code. Pause to explain it.
              </h2>
              <p>
                Students work through guided HTML, CSS, and JavaScript projects
                in the browser. They edit code, see the page change live, answer
                predictions and checkpoints, then write short reflections about
                what their code did.
              </p>
              <Link href="/projects" className="text-link">
                Explore the current projects
              </Link>
            </div>
            <div className="student-loop" aria-label="Student lesson loop">
              <span><strong>1</strong>Edit real code</span>
              <span><strong>2</strong>See the live page</span>
              <span><strong>3</strong>Check understanding</span>
              <span><strong>4</strong>Reflect on the result</span>
            </div>
          </div>
        </section>

        <section className="section faq-section teacher-faq-section" aria-labelledby="teacher-faq-title">
          <div className="faq-intro">
            <span className="eyebrow">Teacher questions</span>
            <h2 id="teacher-faq-title" className="section-title">
              The practical details before you set up a class.
            </h2>
            <p>
              A quick look at student access, saved work, and what is available
              in the current lesson library.
            </p>
          </div>

          <div className="faq-list">
            {teacherFaqItems.map(({ question, answer }, index) => (
              <article className="faq-item" key={question}>
                <span className="faq-number" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
