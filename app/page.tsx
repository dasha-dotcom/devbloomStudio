import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HeroPreview } from "@/components/hero-preview";
import { getAllProjects, getProjectHref } from "@/lib/projects";

export default function LandingPage() {
  const defaultProject = getAllProjects()[0];

  return (
    <AppShell>
      <section className="hero">
        <div>
          <span className="eyebrow">
            AI-supported coding lessons for ages 9-12
          </span>
          <h1>Build creative websites. Understand your code.</h1>
          <p>
            DevBloom Studio helps kids learn HTML, CSS, and JavaScript through
            creative web projects. Students edit real code, see their webpage
            change live, answer checkpoints, and use an AI reflection coach to
            explain what their code did.
          </p>
          <div className="hero-actions">
            <Link href={getProjectHref(defaultProject.slug)} className="button">
              Try a lesson
            </Link>
            <Link href="/teacher" className="button-ghost">
              See teacher tools
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-pill">
              <strong>Guided coding lessons</strong>
              <span>
                Learn HTML, CSS, and JavaScript through small creative missions.
              </span>
            </div>
            <div className="stat-pill">
              <strong>Live code preview</strong>
              <span>
                Edit real code and instantly see how the webpage changes.
              </span>
            </div>
            <div className="stat-pill">
              <strong>AI reflection coach</strong>
              <span>
                Sprout helps students explain their work without giving answers
                away.
              </span>
            </div>
          </div>
        </div>
        <HeroPreview />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">Build, check, remix, reflect.</h2>
          </div>
          <p className="section-copy">
            DevBloom is not a giant course full of menus and distractions.
            Students choose one project, follow guided steps, customize the
            result, and explain what they learned.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <div className="step-number">1</div>
            <strong>Pick a mission</strong>
            <p>Choose a creative beginner project.</p>
          </article>
          <article className="step-card">
            <div className="step-number">2</div>
            <strong>Edit real code</strong>
            <p>
              Change HTML, CSS, or JavaScript with beginner-friendly hints.
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">3</div>
            <strong>Reflect with Sprout</strong>
            <p>
              Use AI-guided questions to explain what your code changed.
            </p>
          </article>
        </div>
      </section>

      <section className="section reflection-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">AI reflection coach</span>
            <h2 className="section-title">
              Meet Sprout, the AI reflection coach.
            </h2>
          </div>
          <p className="section-copy">
            Sprout does not write code or reflections for students. Instead, it
            asks short guiding questions that help students connect their code
            choices to the final webpage.
          </p>
        </div>

        <div className="reflection-card glass-card">
          <div className="sprout-card">
            <span className="sprout-label">Sprout</span>
            <h3>Explain the code, not just the finished page.</h3>
            <p>
              The reflection loop helps students move from simple observations
              to clear coding reasoning about properties, values, and design
              choices.
            </p>
          </div>
          <div className="reflection-chat" aria-label="Sprout reflection example">
            <div className="reflection-bubble student-bubble">
              <span>Student writes</span>
              <p>I changed the color.</p>
            </div>
            <div className="reflection-bubble sprout-bubble">
              <span>Sprout asks</span>
              <p>
                Which CSS property did you change, and how did it affect the mood
                of your page?
              </p>
            </div>
            <div className="reflection-bubble improved-bubble">
              <span>Student improves</span>
              <p>
                I changed the background-color in CSS, which made my page feel
                calmer because I chose light blue.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Teacher insight</span>
            <h2 className="section-title">
              Teachers can see more than a finished project.
            </h2>
          </div>
          <p className="section-copy">
            DevBloom saves student attempts, reflections, and progress so
            teachers can see not only what students built, but what they
            understood.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <div className="step-number">1</div>
            <strong>Class codes and PINs</strong>
            <p>Students can join a class without complicated accounts.</p>
          </article>
          <article className="step-card">
            <div className="step-number">2</div>
            <strong>Saved attempts</strong>
            <p>
              Progress is saved so students can resume or teachers can review
              work.
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">3</div>
            <strong>Reflection review</strong>
            <p>
              Teachers can read student explanations and spot where students need
              support.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="final-cta glass-card">
          <div>
            <span className="eyebrow">Start building</span>
            <h2 className="section-title">Ready to build something real?</h2>
            <p>
              Start with one beginner-friendly project and see how code changes
              the page.
            </p>
          </div>
          <div className="hero-actions final-cta-actions">
            <Link href="/projects" className="button">
              Choose a project
            </Link>
            <Link href="/teacher" className="button-ghost">
              Open teacher dashboard
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
