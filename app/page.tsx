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
          <span className="eyebrow">Creative coding for ages 10-14</span>
          <h1>Make cool things with real code.</h1>
          <p>
            DevBloom Studio helps kids build creative projects step by step. You
            edit real code, see your webpage change live, and finish with something
            that feels truly yours.
          </p>
          <div className="hero-actions">
            <Link href="/projects" className="button">
              Choose a project
            </Link>
            <Link href={getProjectHref(defaultProject.slug)} className="button-ghost">
              Jump into the lesson
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-pill">
              <strong>1 focused lesson</strong>
              <span>Small steps, real progress</span>
            </div>
            <div className="stat-pill">
              <strong>Live preview</strong>
              <span>See every change instantly</span>
            </div>
            <div className="stat-pill">
              <strong>Creative themes</strong>
              <span>Make it look like your style</span>
            </div>
          </div>
        </div>
        <HeroPreview />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">Start simple. Make something real.</h2>
          </div>
          <p className="section-copy">
            This isn&apos;t a giant course full of menus and distractions. You choose
            one project, follow the guided steps, and build a real webpage with
            code that you can actually understand.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <div className="step-number">1</div>
            <strong>Pick a project</strong>
            <p>
              Choose a creative challenge designed for beginners and start building
              right away.
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">2</div>
            <strong>Edit real code</strong>
            <p>
              Change the important parts of the page with beginner-friendly hints
              and a live preview.
            </p>
          </article>
          <article className="step-card">
            <div className="step-number">3</div>
            <strong>Finish proud</strong>
            <p>
              Personalize the final result, choose a theme, and leave with a
              webpage that feels like yours.
            </p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
