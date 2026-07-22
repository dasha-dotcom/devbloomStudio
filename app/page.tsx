import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HeroPreview } from "@/components/hero-preview";
import { getAllProjects, getProjectHref } from "@/lib/projects";

const faqItems = [
  {
    question: "How do I set up a class?",
    answer:
      "Create a teacher account, add a class and its student roster, then share the class code and each student's six-digit PIN. Students can open the class join page and continue to their assigned projects.",
  },
  {
    question: "Do students need their own email accounts?",
    answer:
      "No. Classroom students enter a teacher-created class code, choose their name from the roster, and sign in with a six-digit PIN. Public lessons can be opened without any student account.",
  },
  {
    question: "How do student access and privacy work?",
    answer:
      "Public lesson progress stays in the current browser. Classroom attempts and reflections are saved with the student's class profile so their teacher can review progress; students use a class code and private PIN instead of an email login.",
  },
  {
    question: "What coding skills do the lessons cover?",
    answer:
      "The current projects introduce HTML, CSS, and JavaScript through guided website builds. Students edit real code, watch the page change, answer checkpoints, and explain their choices in short reflections.",
  },
  {
    question: "What can teachers see?",
    answer:
      "Teachers can open class rosters, review saved project attempts and reflections, and see where each student is in a lesson. Student project previews are read-only in the teacher view.",
  },
  {
    question: "What is free to try?",
    answer:
      "All four current guided projects can be opened from the public project library. No account or credit card is required to try those public lessons.",
  },
] as const;

export default function LandingPage() {
  const projects = getAllProjects();
  const defaultProject = projects[0];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
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
            <Link
              href={getProjectHref(defaultProject.slug)}
              className="button primary-cta"
            >
              Try a lesson
            </Link>
            <Link href="/teacher" className="text-link">
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

      <section className="section" aria-labelledby="lesson-access-title">
        <div className="access-panel">
          <div className="access-copy">
            <span className="eyebrow">Lesson access</span>
            <h2 id="lesson-access-title" className="section-title">
              {projects.length} projects. Free to try today.
            </h2>
            <p>
              Open a guided coding project and start building in your browser.
              No account or credit card is required for the public lessons.
            </p>
            <Link
              href={getProjectHref(defaultProject.slug)}
              className="button primary-cta"
            >
              Try a lesson
            </Link>
          </div>
          <div className="access-summary" aria-label="Free lesson access details">
            <span className="access-label">Current lesson access</span>
            <strong className="access-price">Free</strong>
            <ul>
              <li>{projects.length} guided coding projects</li>
              <li>No student account required</li>
              <li>No credit card required</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section faq-section" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="eyebrow">For families and classrooms</span>
          <h2 id="faq-title" className="section-title">
            Questions before you start?
          </h2>
          <p>
            The practical details parents and teachers usually want before a
            student opens a project.
          </p>
        </div>

        <div className="faq-list">
          {faqItems.map(({ question, answer }, index) => (
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
    </AppShell>
  );
}
