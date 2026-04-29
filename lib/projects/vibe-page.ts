import { buildPreviewDocument } from "@/lib/preview";

import type { LessonProjectConfig, LessonStep } from "@/lib/projects/types";

export const vibePageStarterCode = `body {
  background-color: #eef6ff;
}

.hero-title {
  color: #20355f;
  font-size: 52px;
}

.vibe-card {
  background: rgba(255, 255, 255, 0.76);
  padding: 24px;
  border-radius: 26px;
  box-shadow: 0 18px 36px rgba(28, 45, 82, 0.12);
}

.mood-note {
  color: #54708f;
}`;

export const vibePageLessonSteps: LessonStep[] = [
  {
    id: "welcome",
    order: 1,
    shortTitle: "Welcome",
    sidebarCopy: "See the styling mission.",
    kicker: "Project intro",
    title: "Turn a plain page into a full vibe",
    body:
      "This time, the page structure is already there. Your job is to style it with real CSS so it feels like your own mood, energy, and color story.",
    hint: "HTML decides what is on the page. CSS decides how it looks.",
    challenge: "By the end, make the page feel clearly ocean, space, cozy, neon, forest, sunset, or your own mix.",
    editorFocus: {
      label: "Look at the CSS starter",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: false,
  },
  {
    id: "background",
    order: 2,
    shortTitle: "Background",
    sidebarCopy: "Change the page color.",
    kicker: "CSS basics",
    title: "Start with the background",
    body:
      "Background color is one of the fastest ways to change a webpage mood. Edit the color inside the body rule and watch the whole scene shift.",
    hint: "In CSS, colors can be written as simple names like red or blue, or as hex codes like #ff0000—you can look up a hex color if you want a specific shade.",
    example: "background-color: #0f172f;",
    editorFocus: {
      label: "The body background-color rule",
      matchText: "background-color",
    },
    prediction: {
      question: "What part of the page will change first?",
      options: ["The whole page background", "Only the card", "Only the heading"],
      answerIndex: 0,
      positiveFeedback: "Exactly. Body styles can affect the whole page.",
      neutralFeedback: "Try the color change and see how much space it controls.",
    },
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedInTargetRegion",
      region: {
        startAfter: "background-color:",
        endBefore: ";",
      },
    },
    passMessage: "Nice — that changed the page background.",
    notYetMessage: "This step is asking about the body background color. Change the value after `background-color:`.",
    showEditor: true,
  },
  {
    id: "title",
    order: 3,
    shortTitle: "Title",
    sidebarCopy: "Style the big heading.",
    kicker: "Text style",
    title: "Make the title stand out",
    body:
      "Now style the main title. Change its color, size, or both so the page starts to show more personality.",
    hint: "Big changes to the title can make the same words feel calm, loud, dreamy, or electric.",
    example: "font-size: 64px;",
    editorFocus: {
      label: "The .hero-title rule",
      matchText: ".hero-title",
    },
    feedbackMode: "checkpoint",
    isGate: true,
    allowNextWhen: "pass",
    checkpoint: {
      title: "Notice what the selector does",
      body: "This step is about how CSS knows what to style. Answer the quick checkpoint before moving on.",
      questions: [
        {
          id: "selector-part",
          prompt: "Which part of a CSS rule decides what gets styled?",
          options: ["The selector", "The color value", "The semicolon"],
          correctOptionIndex: 0,
        },
        {
          id: "selector-example",
          prompt: "In `.hero-title { color: #20355f; }`, which part points to the big title?",
          options: [".hero-title", "color", "#20355f"],
          correctOptionIndex: 0,
        },
      ],
    },
    passMessage: "Nice — you identified the selector that tells CSS what to style.",
    closeMessage: "You're close. This step is about the selector, not the color value.",
    notYetMessage: "Something still needs attention here. Look at which part names the title rule.",
    showEditor: true,
  },
  {
    id: "card",
    order: 4,
    shortTitle: "Card",
    sidebarCopy: "Style the content panel.",
    kicker: "Panels and spacing",
    title: "Shape the vibe card",
    body:
      "The card is your main content panel. Try changing the background, padding, roundness, or shadow to make it feel soft, bold, cozy, sleek, or glowing.",
    hint: "Padding controls the space inside the card. Border radius controls how rounded the corners are.",
    editorFocus: {
      label: "The .vibe-card rule",
      matchText: ".vibe-card",
    },
    checklist: [
      "Try a new card background color",
      "Change the padding number",
      "Make the corners more or less rounded",
    ],
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedInTargetRegion",
      region: {
        startAfter: ".vibe-card {",
        endBefore: "}",
      },
    },
    passMessage: "Nice — you changed the card styling.",
    notYetMessage: "This step is about the `.vibe-card` rule. Change one style inside that block.",
    showEditor: true,
  },
  {
    id: "polish",
    order: 5,
    shortTitle: "Vibe",
    sidebarCopy: "Push the mood further.",
    kicker: "Mood polish",
    title: "Push the mood further",
    body:
      "Small CSS details can completely change the energy. Adjust the card shadow or the mood note color until the page feels more like a clear vibe instead of a plain starter.",
    hint: "In CSS, box-shadow adds a shadow around an element using values for horizontal shift, vertical shift, blur, and color, so you can tweak the numbers to change how soft or far the shadow looks.",
    editorFocus: {
      label: "The box-shadow or .mood-note styles",
      matchText: "box-shadow",
      helperText:
        "Box shadow adds a glow or shadow around an element. Bigger blur usually feels softer.",
    },
    prediction: {
      question: "What will happen if you change the box-shadow?",
      options: ["The card can feel softer or more dramatic", "The words will change", "The HTML structure will change"],
      answerIndex: 0,
      positiveFeedback: "Yes. CSS can change the feeling without changing the content.",
      neutralFeedback: "Try it and notice how the same card starts to feel different.",
    },
    feedbackMode: "checkpoint",
    isGate: false,
    checkpoint: {
      title: "Connect the rule to the page",
      body: "Use one quick question to connect the selector to the part of the page it affects.",
      questions: [
        {
          id: "mood-note-target",
          prompt: "If you edit the `.mood-note` rule, which part of the page changes?",
          options: ["The small note inside the card", "The whole page background", "Every heading on the page"],
          correctOptionIndex: 0,
        },
      ],
    },
    passMessage: "Nice — you matched the selector to the right part of the page.",
    closeMessage: "You're close. This rule only styles one small part, not the whole page.",
    notYetMessage: "Check which part of the page the `.mood-note` rule points to.",
    showEditor: true,
  },
  {
    id: "final-touches",
    order: 6,
    shortTitle: "Touches",
    sidebarCopy: "Make it yours.",
    kicker: "Final touches",
    title: "Make two purposeful final changes",
    body:
      "Choose one or two final CSS tweaks that make your page feel clearly yours. You do not need a huge makeover. Even a few thoughtful style choices can totally transform it.",
    hint: "Try combining a new background color with a different card style for a stronger before-and-after.",
    editorFocus: {
      label: "Any CSS rule you want to personalize",
    },
    checklist: [
      "Pick a color combo that matches one vibe",
      "Adjust one spacing or roundness value",
      "Change one text or shadow detail for extra mood",
    ],
    feedbackMode: "none",
    isGate: false,
    showEditor: true,
  },
  {
    id: "finish",
    order: 7,
    shortTitle: "Finish",
    sidebarCopy: "Celebrate your styling.",
    kicker: "You did it",
    title: "Finish and celebrate",
    body:
      "You styled a real webpage with CSS. Check out the final result, then head to the celebration screen to see how far your design came.",
    hint: "If you want a stronger transformation, go back and make one more bold color or card change.",
    editorFocus: {
      label: "Your finished design",
    },
    feedbackMode: "reflection",
    isGate: false,
    reflectionPrompt: "How does CSS know which part of the page to style?",
    reflectionPlaceholder: "You can mention selectors, class names, or a rule from this lesson.",
    passMessage: "Nice reflection. You connected CSS styling to the selector idea.",
    notYetMessage: "Take a moment to describe how a CSS rule finds the part to style.",
    showEditor: false,
  },
];

const vibePageScaffold = `<main class="vibe-shell">
  <span class="badge">Vibe Page</span>
  <h1 class="hero-title">Cozy Ocean Hangout</h1>
  <p class="hero-text">
    A mini webpage all about mood, color, and the feeling I want people to get in one quick glance.
  </p>

  <section class="vibe-card">
    <h2>My vibe recipe</h2>
    <ul class="vibe-list">
      <li>Soft colors</li>
      <li>Rounded corners</li>
      <li>A calm, glowy card</li>
    </ul>
    <p class="mood-note">Tiny CSS changes can totally change the mood of a page.</p>
  </section>
</main>`;

const vibePageBaseCss = `
  body {
    margin: 0;
    min-height: 100vh;
    padding: 28px;
    font-family: "Trebuchet MS", "Avenir Next", Arial, sans-serif;
    transition: background-color 160ms ease;
  }

  .vibe-shell {
    max-width: 760px;
    margin: 0 auto;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.56);
    border: 1px solid rgba(255, 255, 255, 0.72);
    color: #3a4765;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .hero-title {
    margin: 18px 0 10px;
    line-height: 0.95;
    letter-spacing: -0.04em;
  }

  .hero-text,
  .mood-note,
  .vibe-list li {
    font-size: 1.06rem;
    line-height: 1.7;
  }

  .hero-text {
    max-width: 56ch;
    color: #44587a;
    margin: 0 0 22px;
  }

  .vibe-card h2 {
    margin: 0 0 12px;
    font-size: 1.3rem;
    color: #263857;
  }

  .vibe-list {
    margin: 0;
    padding-left: 22px;
    color: #314560;
  }

  .mood-note {
    margin: 16px 0 0;
    font-weight: 700;
  }
`;

export const vibePageProject: LessonProjectConfig = {
  slug: "vibe-page",
  editorLanguage: "css",
  editorBadgeLabel: "Starter CSS",
  starterCode: vibePageStarterCode,
  steps: vibePageLessonSteps,
  sidebar: {
    eyebrow: "Beginner project",
    title: "Vibe Page",
    description:
      "Style a mini webpage with real CSS so colors, text, spacing, and card design all work together to create a mood.",
  },
  introCard: {
    title: "Project goal",
    body:
      "By the end, you’ll style a simple webpage with CSS and see how a few visual changes can totally transform the same page structure.",
    pills: ["Real CSS", "Mood design", "Before-and-after magic"],
  },
  finish: {
    eyebrow: "Project complete",
    title: "You styled a real webpage with CSS.",
    body:
      "You changed colors, text styling, spacing, and the main content card using real CSS rules. Same HTML structure. Totally different look.",
    learnedBadges: [
      "Learned: background color",
      "Learned: text styling",
      "Learned: spacing",
      "Learned: card design",
    ],
  },
  buildPreviewDocument: ({ code }) =>
    buildPreviewDocument({
      mode: "css",
      code,
      scaffoldHtml: vibePageScaffold,
      baseCss: vibePageBaseCss,
    }),
  previewTitle: () => "CSS live preview",
};
