import { buildPreviewDocument } from "@/lib/preview";

import type { LessonProjectConfig, LessonStep } from "@/lib/projects/types";

const CLASSNAME_LINE_PATTERN = /^\s*page\.className = mood\.className;\s*\n?/m;

const removeMoodClassLine = (code: string) => code.replace(CLASSNAME_LINE_PATTERN, "");

export const moodSwitchStarterCode = `const page = document.querySelector(".mood-page");
const badge = document.getElementById("mood-badge");
const title = document.getElementById("mood-title");
const message = document.getElementById("mood-message");
const emoji = document.getElementById("mood-emoji");
const button = document.getElementById("mood-button");

const oceanMood = {
  badge: "Ocean Mood",
  title: "Ocean Vibes",
  message: "Cool waves, sea sparkle, and calm explorer energy.",
  emoji: "🌊",
  buttonLabel: "Switch to Space",
  className: "mood-page ocean-mode",
};

const spaceMood = {
  badge: "Space Mood",
  title: "Space Mode",
  message: "Bright stars, rocket dreams, and giant idea energy.",
  emoji: "🚀",
  buttonLabel: "Back to Ocean",
  className: "mood-page space-mode",
};

let isOceanMood = true;

function applyMood(mood) {
  badge.textContent = mood.badge;
  title.textContent = mood.title;
  message.textContent = mood.message;
  emoji.textContent = mood.emoji;
  button.textContent = mood.buttonLabel;
  page.className = mood.className;
}

button.addEventListener("click", () => {
  isOceanMood = !isOceanMood;

  if (isOceanMood) {
    applyMood(oceanMood);
  } else {
    applyMood(spaceMood);
  }
});

applyMood(oceanMood);
`;

export const moodSwitchLessonSteps: LessonStep[] = [
  {
    id: "welcome",
    order: 1,
    shortTitle: "Welcome",
    sidebarCopy: "See your first JavaScript project.",
    kicker: "Project intro",
    title: "Make a webpage react to a click",
    body:
      "This project is your first JavaScript interaction lesson. The page is already built for you, and your code will make it switch moods when the button is clicked.",
    hint: "Try the button in the preview right away. Then you’ll edit the JavaScript that controls what happens.",
    challenge: "By the end, make both moods feel clearly different and fully yours.",
    editorFocus: {
      label: "Look at the starter JavaScript",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: false,
  },
  {
    id: "second-mood",
    order: 2,
    shortTitle: "Second Mood",
    sidebarCopy: "Edit the mood that appears after the click.",
    kicker: "First edit",
    title: "Change the second mood",
    body:
      "The `spaceMood` object controls what the page becomes after the button is clicked. Change its title or message first so your page reveals a new mood when you test it.",
    hint: "Edit just the words inside the quotes in `spaceMood`, then click the preview button to see your change appear.",
    example: 'message: "Stars, glow, and giant idea energy."',
    editorFocus: {
      label: "The spaceMood object",
      matchText: "const spaceMood",
      helperText:
        "This object stores the title, message, emoji, button words, and style class for the second mood.",
    },
    prediction: {
      question: "What will your `spaceMood` edits change?",
      options: ["What appears after the click", "Only the starting ocean page", "The whole editor layout"],
      answerIndex: 0,
      positiveFeedback: "Right. This object controls the page after the button switches moods.",
      neutralFeedback: "Make one change in `spaceMood`, then click the preview button to check it.",
    },
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedInTargetRegion",
      region: {
        startAfter: "const spaceMood = {",
        endBefore: "};",
      },
    },
    passMessage: "Nice — you changed the values that show after the click.",
    notYetMessage: "This step is about the `spaceMood` object. Change one of the values inside that block.",
    showEditor: true,
  },
  {
    id: "button-words",
    order: 3,
    shortTitle: "Button Words",
    sidebarCopy: "Change what the button says.",
    kicker: "Button text",
    title: "Change the button words",
    body:
      "Code can control button words too. Find `buttonLabel` inside a mood object and change what the button says when that mood is showing.",
    hint: "Start with one `buttonLabel`, test it, then change the other one if you want both directions to sound polished.",
    example: 'buttonLabel: "Launch into Space"',
    editorFocus: {
      label: "The buttonLabel lines",
      matchText: 'buttonLabel: "Switch to Space"',
      helperText:
        "Each mood object includes button words. When that mood is active, JavaScript puts this text onto the button.",
    },
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "anyOf",
      criteria: [
        {
          type: "codeExcludes",
          value: 'buttonLabel: "Switch to Space"',
        },
        {
          type: "codeExcludes",
          value: 'buttonLabel: "Back to Ocean"',
        },
      ],
    },
    passMessage: "Nice — you changed the button words.",
    notYetMessage: "Look for a `buttonLabel` line and change the text inside the quotes.",
    showEditor: true,
  },
  {
    id: "click",
    order: 4,
    shortTitle: "Click Code",
    sidebarCopy: "See how the click starts the change.",
    kicker: "Interaction",
    title: "How the click works",
    body:
      "This line tells the page what to do when someone clicks the button. You do not need to rewrite it. Just connect this code to what you already tested in the preview.",
    hint: "Read the click line, then press the preview button once to match the code to the action on screen.",
    editorFocus: {
      label: "The click event listener",
      matchText: 'button.addEventListener("click"',
      helperText:
        "An event listener waits for something to happen. Here, it waits for a click and then runs the code inside.",
    },
    activity: {
      type: "selection",
      title: "Choose what the click is doing",
      body:
        "Use these two quick questions to connect the click code to what happens on the page.",
      questions: [
        {
          id: "event",
          title: "1. Which event starts this code?",
          options: ["Hover over", "Click", "Scroll"],
          answerIndex: 1,
          positiveFeedback: "Yes. This project listens for a click on the button.",
          neutralFeedback: "Look at `addEventListener(\"click\", ...)` and compare it to your choices.",
        },
        {
          id: "results",
          title: "2. After that event happens, what changes on the page?",
          options: ["Only the style changes", "Only the text changes", "Text and style both change"],
          answerIndex: 2,
          positiveFeedback: "Right. One click updates the words and the page mood together.",
          neutralFeedback: "Test the preview again and count how many parts of the page change together.",
        },
      ],
    },
    feedbackMode: "checkpoint",
    isGate: true,
    allowNextWhen: "pass",
    checkpoint: {
      title: "Show what the click line means",
      body: "Connect the event listener code to what you saw in the preview.",
      questions: [
        {
          id: "event",
          prompt: "Which event starts this code?",
          options: ["Hover over", "Click", "Scroll"],
          correctOptionIndex: 1,
        },
        {
          id: "results",
          prompt: "After that event happens, what changes on the page?",
          options: ["Only the style changes", "Only the text changes", "Text and style both change"],
          correctOptionIndex: 2,
        },
      ],
    },
    passMessage: "Nice — you connected the click event to what changes on the page.",
    closeMessage: "You're close. Press the preview button again and notice how many parts change together.",
    notYetMessage: "Something still needs attention here. Look at `addEventListener(\"click\", ...)` and compare it to the page behavior.",
    showEditor: true,
  },
  {
    id: "whole-mood",
    order: 5,
    shortTitle: "Big Switch",
    sidebarCopy: "Switch the whole vibe.",
    kicker: "Whole page change",
    title: "Switch the whole mood",
    body:
      "This step hides one important line: `page.className = mood.className;`. Make a prediction, then test the button and notice what still changes and what no longer switches correctly.",
    hint: "The missing line will come back automatically in the next step. For now, use the preview to figure out what it controls.",
    editorFocus: {
      label: "The missing className line",
      helperText:
        "The line that swaps the page style is hidden for this step on purpose. Click the preview button to test what happens without it.",
    },
    prediction: {
      question: "What do you think this missing line controls?",
      options: ["The style and look of the page", "The text content", "The button click itself"],
      answerIndex: 0,
      positiveFeedback: "Exactly. That line controls the visual mode of the page.",
      neutralFeedback:
        "Try the button and compare what still changes versus what stays stuck. That will show what the line controls.",
    },
    feedbackMode: "checkpoint",
    isGate: true,
    allowNextWhen: "pass",
    checkpoint: {
      title: "Notice what the hidden line controls",
      body: "Use the missing-line experiment to decide what changes the page style instead of its words.",
      questions: [
        {
          id: "style-line",
          prompt: "Which part changes the page style instead of the words?",
          options: ["`page.className = mood.className;`", "`title.textContent = mood.title;`", "`button.textContent = mood.buttonLabel;`"],
          correctOptionIndex: 0,
        },
      ],
    },
    passMessage: "Nice — you spotted the line that switches the visual mood.",
    closeMessage: "You're close. The style switch happens where the page class gets replaced.",
    notYetMessage: "Check which line changes the page class. That line controls the visual mode.",
    editorReadOnly: true,
    showEditor: true,
  },
  {
    id: "make-it-yours",
    order: 6,
    shortTitle: "Personalize",
    sidebarCopy: "Make both moods yours.",
    kicker: "Creative remix",
    title: "Make it yours",
    body:
      "Now personalize both moods. Change mood names, messages, emoji, and button labels so the before-and-after feels clearly yours.",
    hint: "Keep the structure the same. You’re customizing the values, not rebuilding the whole JavaScript file.",
    editorFocus: {
      label: "The oceanMood and spaceMood objects",
      matchText: "const oceanMood",
    },
    checklist: [
      "Rename at least one mood",
      "Change at least one emoji",
      "Make the two messages feel clearly different",
      "Polish at least one button label",
      "Test the button twice",
    ],
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStarter",
    },
    passMessage: "Nice — your mood objects now feel more personal.",
    notYetMessage: "Change at least one mood value so the before-and-after feels more like yours.",
    showEditor: true,
  },
  {
    id: "finish",
    order: 7,
    shortTitle: "Finish",
    sidebarCopy: "Celebrate your interaction.",
    kicker: "You did it",
    title: "Finish and celebrate",
    body:
      "You made a real webpage interactive with JavaScript. Your button now changes words, emoji, and the whole page mood with a click.",
    hint: "If you want, go back one step and make one last tiny wording change before finishing.",
    editorFocus: {
      label: "Your interactive page",
    },
    feedbackMode: "reflection",
    isGate: false,
    reflectionPrompt: "What causes the page to change when the button is clicked?",
    reflectionPlaceholder: "You can mention the click event, the mood objects, or the line that updates the page.",
    passMessage: "Nice reflection. You connected the click to the code that updates the page.",
    notYetMessage: "Take a moment to describe what causes the page to change after the click.",
    showEditor: false,
  },
];

const moodSwitchScaffold = `<main class="mood-page ocean-mode">
  <div class="mood-card">
    <div class="mood-topline">
      <span id="mood-badge" class="mood-badge">Ocean Mood</span>
      <span id="mood-emoji" class="mood-emoji" aria-hidden="true">🌊</span>
    </div>

    <h1 id="mood-title" class="mood-title">Ocean Vibes</h1>
    <p id="mood-message" class="mood-message">
      Cool waves, sea sparkle, and calm explorer energy.
    </p>

    <button id="mood-button" class="mood-button" type="button">
      Switch to Space
    </button>

    <div class="mood-orbs" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</main>`;

const moodSwitchBaseCss = `
  :root {
    color-scheme: light;
  }

  body {
    margin: 0;
    min-height: 100vh;
    padding: 24px;
    font-family: "Trebuchet MS", "Avenir Next", Arial, sans-serif;
    background: #e6f7ff;
  }

  .mood-page {
    min-height: calc(100vh - 48px);
    display: grid;
    place-items: center;
    border-radius: 32px;
    overflow: hidden;
    transition:
      background 220ms ease,
      color 220ms ease;
  }

  .mood-card {
    width: min(100%, 640px);
    padding: 28px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.44);
    backdrop-filter: blur(14px);
    transition:
      background 220ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease,
      transform 220ms ease;
  }

  .mood-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .mood-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .mood-emoji {
    font-size: clamp(2.8rem, 8vw, 4.6rem);
    line-height: 1;
    filter: drop-shadow(0 8px 18px rgba(8, 27, 61, 0.18));
  }

  .mood-title {
    margin: 18px 0 12px;
    font-size: clamp(2.4rem, 7vw, 4.6rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .mood-message {
    max-width: 32ch;
    margin: 0 0 24px;
    font-size: 1.08rem;
    line-height: 1.7;
  }

  .mood-button {
    appearance: none;
    border: 0;
    padding: 14px 20px;
    border-radius: 999px;
    font: inherit;
    font-weight: 800;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease,
      color 160ms ease;
  }

  .mood-button:hover {
    transform: translateY(-1px);
  }

  .mood-button:active {
    transform: translateY(1px);
  }

  .mood-orbs {
    display: flex;
    gap: 12px;
    margin-top: 26px;
  }

  .mood-orbs span {
    width: 14px;
    height: 14px;
    border-radius: 999px;
  }

  .ocean-mode {
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.72), transparent 34%),
      linear-gradient(160deg, #dff8ff 0%, #87dfff 45%, #4ca0de 100%);
    color: #14466c;
  }

  .ocean-mode .mood-card {
    background: rgba(255, 255, 255, 0.48);
    box-shadow: 0 24px 46px rgba(39, 113, 168, 0.22);
  }

  .ocean-mode .mood-badge {
    background: rgba(255, 255, 255, 0.72);
    color: #1670a0;
  }

  .ocean-mode .mood-title {
    color: #103f63;
  }

  .ocean-mode .mood-message {
    color: #2b6288;
  }

  .ocean-mode .mood-button {
    background: #0f6ea3;
    color: #f3fbff;
    box-shadow: 0 16px 28px rgba(15, 110, 163, 0.28);
  }

  .ocean-mode .mood-orbs span:nth-child(1) {
    background: #ffffff;
  }

  .ocean-mode .mood-orbs span:nth-child(2) {
    background: #72d9ff;
  }

  .ocean-mode .mood-orbs span:nth-child(3) {
    background: #0f6ea3;
  }

  .space-mode {
    background:
      radial-gradient(circle at top right, rgba(255, 148, 207, 0.26), transparent 30%),
      radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.28), transparent 18%),
      linear-gradient(160deg, #120f2d 0%, #22195d 52%, #44217f 100%);
    color: #ebe9ff;
  }

  .space-mode .mood-card {
    background: rgba(18, 13, 47, 0.68);
    border-color: rgba(156, 140, 255, 0.28);
    box-shadow: 0 28px 60px rgba(8, 7, 30, 0.48);
  }

  .space-mode .mood-badge {
    background: rgba(255, 255, 255, 0.08);
    color: #ff91cf;
  }

  .space-mode .mood-title {
    color: #ffffff;
  }

  .space-mode .mood-message {
    color: #d4d0ff;
  }

  .space-mode .mood-button {
    background: linear-gradient(135deg, #ff8ccd, #8f7bff);
    color: #130f2f;
    box-shadow: 0 18px 30px rgba(143, 123, 255, 0.28);
  }

  .space-mode .mood-orbs span:nth-child(1) {
    background: #ff91cf;
  }

  .space-mode .mood-orbs span:nth-child(2) {
    background: #8f7bff;
  }

  .space-mode .mood-orbs span:nth-child(3) {
    background: #ffffff;
  }
`;

export const moodSwitchProject: LessonProjectConfig = {
  slug: "mood-switch",
  editorLanguage: "javascript",
  editorBadgeLabel: "Starter JavaScript",
  starterCode: moodSwitchStarterCode,
  steps: moodSwitchLessonSteps,
  sidebar: {
    eyebrow: "Beginner project",
    title: "Mood Switch",
    description:
      "Use real JavaScript to make one button switch a mini webpage between two bold moods with different text, emoji, and styling.",
  },
  introCard: {
    title: "Project goal",
    body:
      "By the end, your page will react to a click and switch between two creative moods, proving that JavaScript can make a webpage interactive.",
    pills: ["Real JavaScript", "Click interaction", "Big visual payoff"],
  },
  finish: {
    eyebrow: "Project complete",
    title: "You made a webpage interactive with JavaScript.",
    body:
      "Your code listens for a click, switches between two moods, and updates the text, emoji, button label, and page styling all at once.",
    learnedBadges: [
      "Learned: click events",
      "Learned: changing text",
      "Learned: toggling state",
      "Learned: switching page mood",
    ],
  },
  previewSandbox: "allow-same-origin allow-scripts",
  transformStepCode: ({ code, step }) =>
    step.id === "whole-mood" ? removeMoodClassLine(code) : code,
  buildPreviewDocument: ({ code }) =>
    buildPreviewDocument({
      mode: "javascript",
      code,
      scaffoldHtml: moodSwitchScaffold,
      baseCss: moodSwitchBaseCss,
    }),
  previewTitle: () => "JavaScript live preview",
};
