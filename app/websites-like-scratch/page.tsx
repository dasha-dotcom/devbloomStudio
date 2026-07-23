import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import styles from "./page.module.css";

const title = "7 Websites Like Scratch for Kids Ready for Real Code";
const description =
  "Compare seven Scratch alternatives for kids, from block coding and game design to guided HTML, CSS, JavaScript, and classroom-ready lessons.";
const canonicalUrl =
  "https://devbloom-studio.vercel.app/websites-like-scratch";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title,
    description,
    type: "article",
    url: canonicalUrl,
  },
};

const faqItems = [
  {
    question: "What is the best next step after Scratch?",
    answer:
      "The best next step depends on what a child wants to make. Kids who still enjoy visual storytelling can stay with blocks in Snap! or MakeCode. Kids who are curious about websites can move into short, guided HTML and CSS projects before adding JavaScript.",
  },
  {
    question: "When should a child move from block coding to text coding?",
    answer:
      "Move when the child understands basic sequencing, events, and repetition and is asking what real code looks like. The transition works best when the first text project is small, visual, and forgiving, not a blank editor.",
  },
  {
    question: "Are there free websites like Scratch?",
    answer:
      "Yes. Scratch, Code.org, Microsoft MakeCode, Khan Academy, and DevBloom Studio all have learning experiences that can be opened without buying a course. Account requirements and access terms vary by platform.",
  },
  {
    question: "Is HTML a good first text language for kids?",
    answer:
      "HTML is a friendly bridge into typed code because one small change produces an immediate visual result. CSS adds design choices, while JavaScript can follow once the child wants the page to react to clicks or other events.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  mainEntityOfPage: canonicalUrl,
  datePublished: "2026-07-23",
  dateModified: "2026-07-23",
  author: {
    "@type": "Organization",
    name: "DevBloom Studio",
  },
  publisher: {
    "@type": "Organization",
    name: "DevBloom Studio",
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function WebsitesLikeScratchPage() {
  return (
    <AppShell>
      <article className={styles.article}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqStructuredData),
          }}
        />

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>Scratch alternatives for ages 9-12</span>
            <h1>7 websites like Scratch, chosen by what your child wants next</h1>
            <p className={styles.dek}>
              Scratch is excellent for learning logic through blocks. The right
              next website should keep that creative momentum while opening one
              new door, whether that is deeper blocks, game design, Python, or
              real HTML, CSS, and JavaScript.
            </p>
            <div className={styles.actions}>
              <Link href="/projects/all-about-me" className="button">
                Try a free HTML lesson
              </Link>
              <Link href="#comparison" className={styles.textLink}>
                Compare all seven
              </Link>
            </div>
          </div>

          <aside className={styles.quickPick} aria-label="Quick recommendations">
            <h2>Pick by the next goal</h2>
            <dl>
              <div>
                <dt>Build a real webpage</dt>
                <dd>DevBloom Studio</dd>
              </div>
              <div>
                <dt>Keep creating with blocks</dt>
                <dd>Snap! or Microsoft MakeCode</dd>
              </div>
              <div>
                <dt>Follow a broad classroom course</dt>
                <dd>Code.org</dd>
              </div>
              <div>
                <dt>Learn typed code through a game</dt>
                <dd>CodeCombat</dd>
              </div>
            </dl>
          </aside>
        </header>

        <div className={styles.content}>
          <p className={styles.standfirst}>
            The short answer: choose the tool that makes the next concept feel
            visible. For a child who loves Scratch stories, a more advanced block
            environment may be right. For a child asking how websites work,
            guided web projects are a better bridge than another block-only
            course.
          </p>

          <section className={styles.section}>
            <h2>What to look for after Scratch</h2>
            <p>
              Scratch removes syntax mistakes so beginners can focus on
              sequencing, events, loops, and creative problem-solving. That is
              useful groundwork. Trouble starts when adults treat moving on as a
              race toward the most advanced language. A child can understand
              loops and still freeze in front of an empty text editor.
            </p>
            <p>
              A good Scratch alternative changes one variable at a time. It
              might keep blocks but add more powerful ideas. It might introduce
              typed code inside a game. It might use HTML so every edit changes
              something the learner can see. The format matters as much as the
              language.
            </p>
            <p>Before choosing, ask four practical questions:</p>
            <ul>
              <li>
                Does the child want to make stories, games, websites, apps, or
                hardware projects?
              </li>
              <li>
                Do they want free exploration, or do they work better with
                short guided steps?
              </li>
              <li>
                Are they ready to type code, read error messages, and fix small
                punctuation mistakes?
              </li>
              <li>
                Does a teacher or parent need to see progress, saved work, or
                explanations?
              </li>
            </ul>
            <p>
              The comparison below uses those questions rather than pretending
              one platform is best for every child.
            </p>
          </section>

          <section className={styles.section} id="comparison">
            <h2>Seven Scratch alternatives compared</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Best for</th>
                    <th>Coding style</th>
                    <th>Good next step when...</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>DevBloom Studio</strong>
                    </td>
                    <td>Creative first websites</td>
                    <td>HTML, CSS, JavaScript</td>
                    <td>The learner wants real code with visible results</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Code.org</strong>
                    </td>
                    <td>Broad classroom progression</td>
                    <td>Blocks plus later text tools</td>
                    <td>A teacher wants a large, structured curriculum</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Tynker</strong>
                    </td>
                    <td>Variety and themed courses</td>
                    <td>Blocks and text across courses</td>
                    <td>The child wants Minecraft, games, or a broad catalog</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>CodeCombat</strong>
                    </td>
                    <td>Game-led typed coding</td>
                    <td>Python and JavaScript</td>
                    <td>A learner enjoys quests more than website design</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Microsoft MakeCode</strong>
                    </td>
                    <td>Arcade games and hardware</td>
                    <td>Blocks with JavaScript or Python views</td>
                    <td>The next project is a game, micro:bit, or device</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Snap!</strong>
                    </td>
                    <td>More powerful block programming</td>
                    <td>Advanced visual blocks</td>
                    <td>The learner is not ready to leave blocks</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Khan Academy</strong>
                    </td>
                    <td>Independent learners who like instruction</td>
                    <td>JavaScript, HTML, and CSS</td>
                    <td>The child can follow lessons with less adult support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Which website is the best fit?</h2>
            <div className={styles.toolList}>
              <article className={styles.tool}>
                <span className={styles.toolNumber}>1</span>
                <h3>DevBloom Studio: best for a first real webpage</h3>
                <p>
                  DevBloom Studio is designed for beginners ages 9-12 who are
                  ready to type real web code but still need a guided path. A
                  learner edits HTML, CSS, and JavaScript beside a live preview,
                  so the effect of each change stays visible. Projects are short
                  and creative rather than part of a large course catalog.
                </p>
                <p>
                  The first lesson asks the learner to build a page about
                  something they already like. Later projects add styling and a
                  small JavaScript interaction. Checkpoints, predictions, hints,
                  and reflection prompts keep the experience from turning into
                  copy-and-paste.
                </p>
                <p>
                  <strong>Choose it when:</strong> your child understands basic
                  coding ideas in Scratch and now wants to see what HTML, CSS, or
                  JavaScript looks like. Teachers can also create classes, use
                  class codes and student PINs, save attempts, and review
                  progress and reflections.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the main goal is
                  game design, robotics, Minecraft modding, or a long curriculum
                  with hundreds of lessons. DevBloom currently offers a focused
                  starter sequence, not a broad coding library.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>2</span>
                <h3>Code.org: best for a broad classroom sequence</h3>
                <p>
                  Code.org offers a large collection of age-based computer
                  science courses, Hour of Code activities, and teacher
                  resources. It is a strong choice when a school wants one
                  familiar platform that can support several grades and
                  different levels of experience.
                </p>
                <p>
                  <strong>Choose it when:</strong> a teacher needs a broad,
                  structured program with many ready-made activities. It also
                  makes sense for a learner who still benefits from blocks but
                  wants to encounter app or web concepts later.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the child is
                  specifically asking to design a personal website right now.
                  A smaller, web-focused lesson can feel more direct than
                  navigating a large curriculum.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>3</span>
                <h3>Tynker: best for choice and themed learning</h3>
                <p>
                  Tynker combines block-based experiences with courses that
                  cover subjects such as game creation, Minecraft, robotics,
                  Python, and web development. Its breadth is the point. A child
                  can follow an interest without leaving the same learning
                  platform.
                </p>
                <p>
                  <strong>Choose it when:</strong> variety is what keeps your
                  child engaged, especially if Minecraft or game projects are
                  the hook. It can also suit families looking for a longer
                  course path rather than a single short project.
                </p>
                <p>
                  <strong>Choose something else when:</strong> you want a quiet,
                  narrow bridge into real web code with fewer menus and choices.
                  Access varies across Tynker&apos;s courses, so check the current
                  plan details before choosing it for a class or family.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>4</span>
                <h3>CodeCombat: best for learning text code through a game</h3>
                <p>
                  CodeCombat puts typed programming inside a fantasy game. The
                  learner writes commands to move a character, solve puzzles,
                  and progress through levels. That makes Python or JavaScript
                  feel purposeful from the first line.
                </p>
                <p>
                  <strong>Choose it when:</strong> your child is motivated by
                  quests, levels, and problem-solving. It is a natural option
                  for learners who want to leave blocks but are not interested
                  in visual web design.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the child wants
                  to make a page that feels personal, choose colors and layouts,
                  or understand how websites are built. Game commands teach a
                  different creative path.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>5</span>
                <h3>Microsoft MakeCode: best for arcade games and devices</h3>
                <p>
                  Microsoft MakeCode keeps the approachable block model while
                  connecting it to Arcade games and physical computing devices
                  such as micro:bit. Learners can often switch between block and
                  text views, which helps them see how familiar logic maps to
                  JavaScript or Python.
                </p>
                <p>
                  <strong>Choose it when:</strong> the next exciting project is
                  a playable game, a tiny device, or a hardware experiment. It
                  is especially useful when a club or classroom already has
                  compatible equipment.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the goal is
                  learning the structure, styling, and interaction layers of a
                  webpage. MakeCode is strongest when the project matches one of
                  its supported editors.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>6</span>
                <h3>Snap!: best for going deeper without leaving blocks</h3>
                <p>
                  Snap! looks familiar to a Scratch learner but supports more
                  advanced computer science ideas inside a visual programming
                  environment. It can extend the runway for a child who enjoys
                  blocks and wants more power without taking on text syntax yet.
                </p>
                <p>
                  <strong>Choose it when:</strong> the learner is still creating
                  confidently with blocks and the next need is conceptual depth,
                  not a new language. Staying visual is not falling behind.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the child is
                  asking to write the kind of code used in websites or other
                  production tools. Snap! strengthens programming thinking, but
                  it does not make typing syntax the main experience.
                </p>
              </article>

              <article className={styles.tool}>
                <span className={styles.toolNumber}>7</span>
                <h3>Khan Academy: best for self-directed older beginners</h3>
                <p>
                  Khan Academy includes introductory computer programming
                  material covering JavaScript drawing and animation as well as
                  HTML and CSS. The format suits learners who are comfortable
                  following explanations and working through lessons with less
                  moment-to-moment guidance.
                </p>
                <p>
                  <strong>Choose it when:</strong> your child likes instructional
                  lessons, can work independently, and wants a free path into
                  programming concepts.
                </p>
                <p>
                  <strong>Choose something else when:</strong> the learner needs
                  a shorter creative mission, a highly visual next action, or a
                  teacher workflow built around one classroom attempt.
                </p>
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Why websites are a gentle bridge into text coding</h2>
            <p>
              The move from blocks to text creates two challenges at once.
              Learners must keep thinking about programming logic while also
              learning syntax. Web development softens that jump because HTML
              and CSS produce a visible result quickly. Change a heading and the
              heading changes. Pick a background color and the page responds.
            </p>
            <p>
              That feedback loop matters for ages 9-12. A blank terminal asks a
              beginner to imagine the outcome. A live webpage shows the outcome
              beside the code. JavaScript can come later, once the learner wants
              a button, theme switch, or other interaction.
            </p>
            <figure className={styles.imageFigure}>
              <Image
                src="/seo/devbloom-live-lesson.png"
                alt="DevBloom lesson with guided steps beside a live webpage preview"
                width={1440}
                height={793}
                className={styles.imageFrame}
                sizes="(max-width: 900px) 100vw, 860px"
              />
              <figcaption>
                A DevBloom lesson keeps the next instruction and the live result
                on the same screen. Screenshot captured from the public lesson.
              </figcaption>
            </figure>
            <p>
              The projects also need to stay small. A first text-coding win
              should fit into one sitting and leave room for personal choices.
              That is why DevBloom starts with a page about something the learner
              already likes rather than a generic exercise.
            </p>
            <figure className={styles.imageFigure}>
              <Image
                src="/seo/devbloom-project-library.png"
                alt="DevBloom project library with beginner HTML, CSS, and JavaScript projects"
                width={1440}
                height={793}
                className={styles.imageFrame}
                sizes="(max-width: 900px) 100vw, 860px"
              />
              <figcaption>
                The current public library moves from HTML structure to CSS
                styling, a JavaScript interaction, and a small capstone.
              </figcaption>
            </figure>
          </section>

          <section className={styles.section}>
            <h2>How to tell if your child is ready to move on from Scratch</h2>
            <p>
              There is no graduation test. Look for curiosity, not age alone. A
              child may be ready for a first text project when they can explain
              what an event does, predict what a loop will repeat, and make a
              small change without needing every block selected for them.
            </p>
            <div className={styles.fitGrid}>
              <article className={styles.fitCard}>
                <h3>Stay with blocks a little longer if...</h3>
                <p>
                  Syntax frustration would overwhelm the fun, the learner still
                  needs help ordering basic steps, or they are happily making
                  more ambitious stories and games in Scratch.
                </p>
              </article>
              <article className={styles.fitCard}>
                <h3>Try a text project now if...</h3>
                <p>
                  The learner asks what real code looks like, wants to build a
                  website, enjoys typing, or is ready to fix small mistakes with
                  patient hints.
                </p>
              </article>
            </div>
            <p>
              You do not have to replace Scratch. Many learners use blocks for
              quick game ideas and text code for websites or other projects.
              The goal is a wider creative toolkit, not a ceremony that declares
              one kind of coding more legitimate.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Questions parents and teachers ask</h2>
            {faqItems.map((item) => (
              <div key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>

          <section className={`${styles.section} ${styles.decision}`}>
            <span className={styles.kicker}>A 20-25 minute first step</span>
            <h2>See whether real web code feels like the right next challenge</h2>
            <p>
              Start with one guided HTML project. Your child can choose the topic,
              edit real code, and watch the page change without creating a
              student account.
            </p>
            <div className={styles.actions}>
              <Link href="/projects/all-about-me" className="button">
                Try the free HTML lesson
              </Link>
              <Link href="/projects" className={styles.textLink}>
                See all projects
              </Link>
            </div>
          </section>

          <p className={styles.disclosure}>
            Last reviewed July 23, 2026. Scratch, Code.org, Tynker, CodeCombat,
            Microsoft MakeCode, Snap!, and Khan Academy are trademarks or names
            of their respective owners. DevBloom Studio is not affiliated with
            those organizations. Product access and features can change, so
            check each provider&apos;s current site before choosing it for a class.
          </p>
        </div>
      </article>
    </AppShell>
  );
}
