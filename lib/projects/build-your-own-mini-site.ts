import { buildPreviewDocument } from "@/lib/preview";

import type {
  BuilderSelections,
  BuilderQuestion,
  LessonProjectConfig,
  LessonStep,
} from "@/lib/projects/types";

type TopicTemplate = {
  id: string;
  badge: string;
  title: string;
  intro: string;
  sectionTitle: string;
  listItems: string[];
  artEmoji: string;
  artLabel: string;
  artAlt: string;
  moodMessage: string;
  surpriseMessage: string;
  messageSwap: [string, string];
};

type VibeTemplate = {
  id: string;
  cssVars: Record<string, string>;
};

type InteractionTemplate = {
  id: string;
  buttonLabel: string;
  buildJavaScript: (topic: TopicTemplate) => string;
  starterMessage: (topic: TopicTemplate) => string;
};

type FinalRemixSections = {
  html: string;
  css: string;
  javascript: string;
};

const SECTION_MARKERS = {
  html: "@@DEVBLOOM_HTML@@",
  css: "@@DEVBLOOM_CSS@@",
  javascript: "@@DEVBLOOM_JS@@",
} as const;

const BASE_CSS = `
  body {
    margin: 0;
    min-height: 100vh;
    padding: 24px;
    font-family: "Trebuchet MS", "Avenir Next", Arial, sans-serif;
    background: #eaf4ff;
    color: #22314d;
  }

  .remix-page {
    position: relative;
    overflow: hidden;
    min-height: calc(100vh - 48px);
    padding: clamp(20px, 4vw, 34px);
    border-radius: 34px;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.55), transparent 28%),
      var(--page-bg);
    transition:
      background 220ms ease,
      color 220ms ease,
      transform 220ms ease;
  }

  .remix-page::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background:
      radial-gradient(circle at 80% 16%, rgba(255, 255, 255, 0.72), transparent 16%),
      radial-gradient(circle at 14% 82%, rgba(255, 255, 255, 0.42), transparent 20%);
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .remix-grid {
    position: relative;
    z-index: 1;
    width: min(100%, 920px);
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }

  .hero-card,
  .details-card,
  .action-card {
    padding: 22px;
    border-radius: var(--card-radius);
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    box-shadow: var(--card-shadow);
    backdrop-filter: blur(12px);
    transition:
      background 220ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease,
      transform 220ms ease;
  }

  .hero-card {
    display: grid;
    gap: 18px;
  }

  .hero-top {
    display: grid;
    gap: 18px;
  }

  .remix-badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--accent);
    font-size: 0.86rem;
    font-weight: 800;
    letter-spacing: 0.03em;
  }

  h1,
  h2 {
    margin: 0;
    color: var(--headline);
    letter-spacing: -0.04em;
  }

  h1 {
    font-size: clamp(2.2rem, 6vw, 4.5rem);
    line-height: 0.95;
  }

  h2 {
    font-size: 1.35rem;
  }

  p,
  li,
  button {
    font-size: 1.03rem;
    line-height: 1.7;
  }

  .intro-text,
  .dynamic-message,
  .details-list {
    color: var(--body-text);
  }

  .hero-art {
    min-height: 180px;
    display: grid;
    place-items: center;
    gap: 8px;
    padding: 18px;
    text-align: center;
    border-radius: calc(var(--card-radius) - 8px);
    background: var(--art-bg);
    color: var(--headline);
    transition:
      background 220ms ease,
      box-shadow 220ms ease,
      transform 220ms ease;
  }

  .art-emoji {
    font-size: clamp(3rem, 10vw, 4.8rem);
    line-height: 1;
    transition: transform 220ms ease;
  }

  .art-label {
    font-weight: 700;
  }

  .details-list {
    margin: 14px 0 0;
    padding-left: 20px;
  }

  .action-card {
    display: grid;
    gap: 16px;
  }

  .remix-button {
    appearance: none;
    border: 0;
    width: fit-content;
    padding: 14px 20px;
    border-radius: calc(var(--card-radius) - 12px);
    font: inherit;
    font-weight: 800;
    letter-spacing: 0.01em;
    cursor: pointer;
    background: var(--button-bg);
    color: var(--button-text);
    box-shadow: var(--button-shadow);
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .remix-button:hover {
    transform: translateY(-1px);
  }

  .remix-button:active {
    transform: translateY(1px);
  }

  .dynamic-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: calc(var(--card-radius) - 14px);
    background: var(--message-bg);
    border: 1px solid rgba(255, 255, 255, 0.32);
    font-weight: 700;
    transition:
      background 220ms ease,
      border-color 220ms ease,
      color 220ms ease,
      transform 220ms ease;
  }

  .remix-page.alt-mode {
    --page-bg: linear-gradient(142deg, #190b2f 0%, #ff4f8b 46%, #ffe45c 100%);
    --card-bg: rgba(20, 8, 34, 0.82);
    --card-border: rgba(255, 255, 255, 0.42);
    --card-shadow: 0 30px 70px rgba(255, 79, 139, 0.42);
    --headline: #fff9d7;
    --body-text: #fff0f8;
    --accent: #ffe45c;
    --badge-bg: rgba(255, 228, 92, 0.18);
    --art-bg: linear-gradient(135deg, rgba(255, 228, 92, 0.92), rgba(255, 79, 139, 0.76));
    --button-bg: linear-gradient(135deg, #ffe45c, #ffffff);
    --button-text: #190b2f;
    --button-shadow: 0 18px 36px rgba(255, 228, 92, 0.34);
    --message-bg: rgba(255, 255, 255, 0.16);
    transform: translateY(-3px);
  }

  .remix-page.alt-mode::before,
  .remix-page.surprise-mode::before,
  .remix-page.message-mode::before {
    opacity: 1;
  }

  .remix-page.alt-mode .hero-card {
    transform: rotate(-1deg);
  }

  .remix-page.alt-mode .details-card,
  .remix-page.alt-mode .action-card {
    transform: rotate(1deg);
  }

  .remix-page.alt-mode .hero-art {
    box-shadow:
      inset 0 0 0 2px rgba(255, 255, 255, 0.4),
      0 22px 42px rgba(25, 11, 47, 0.32);
    transform: scale(1.04);
  }

  .remix-page.alt-mode .art-emoji {
    transform: rotate(-8deg) scale(1.16);
  }

  .remix-page.surprise-mode {
    background:
      radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.88), transparent 18%),
      linear-gradient(145deg, #11235f 0%, #7b2ff7 52%, #f107a3 100%);
  }

  .remix-page.surprise-mode .hero-card,
  .remix-page.surprise-mode .details-card {
    transform: scale(0.97);
    filter: saturate(0.82);
  }

  .remix-page.surprise-mode .action-card {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.72);
    box-shadow: 0 28px 70px rgba(241, 7, 163, 0.42);
    transform: scale(1.04);
  }

  .remix-page.surprise-mode .dynamic-message {
    background: var(--surprise-bg);
    color: #31113f;
    border-color: rgba(241, 7, 163, 0.26);
    transform: translateY(-2px);
  }

  .remix-page.message-mode {
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.62) 0 10px, transparent 10px 22px),
      var(--page-bg);
  }

  .remix-page.message-mode .hero-top {
    align-items: center;
  }

  .remix-page.message-mode .hero-art {
    transform: rotate(3deg) scale(0.96);
  }

  .remix-page.message-mode .action-card {
    border-color: var(--accent);
    box-shadow:
      var(--card-shadow),
      0 0 0 6px rgba(255, 255, 255, 0.2);
  }

  .remix-page.message-mode .dynamic-message {
    background: var(--button-bg);
    color: var(--button-text);
    transform: translateX(8px);
  }

  @media (min-width: 760px) {
    .hero-top {
      grid-template-columns: 1.4fr 0.95fr;
      align-items: stretch;
    }
  }
`;

const topicTemplates: Record<string, TopicTemplate> = {
  hobby: {
    id: "hobby",
    badge: "Favorite Hobby",
    title: "My Hobby Corner",
    intro:
      "This mini site is all about a hobby that makes me lose track of time in the best way.",
    sectionTitle: "Why I keep coming back to it",
    listItems: ["It helps me create", "I keep learning new tricks", "It always gives me a fresh idea"],
    artEmoji: "🎨",
    artLabel: "Poster art for my hobby zone",
    artAlt: "A bright hobby poster with creative energy",
    moodMessage: "Click to switch the page into an even bolder hobby mood.",
    surpriseMessage: "Surprise: my hobby would totally get its own club room in this mini site.",
    messageSwap: [
      "Today I want this site to feel playful and full of motion.",
      "Now it feels more focused, like a studio ready for the next big idea.",
    ],
  },
  "dream-place": {
    id: "dream-place",
    badge: "Dream Place",
    title: "Welcome to My Dream Place",
    intro:
      "If I could teleport anywhere for one amazing day, this is the place I would choose first.",
    sectionTitle: "What I would do there",
    listItems: ["Explore every corner", "Take a million photos", "Notice all the tiny details"],
    artEmoji: "🌴",
    artLabel: "Travel postcard from my dream place",
    artAlt: "A postcard-style travel scene from a dream destination",
    moodMessage: "Click to switch the page into a second travel mood.",
    surpriseMessage: "Surprise: I already know the snack I would bring on this dream adventure.",
    messageSwap: [
      "This message shows the first travel idea on my mini site.",
      "This new message feels like the next stop on the same adventure.",
    ],
  },
  animal: {
    id: "animal",
    badge: "Favorite Animal",
    title: "Favorite Animal Spotlight",
    intro:
      "This page celebrates an animal I think is fascinating, funny, clever, or just plain awesome.",
    sectionTitle: "Three reasons it stands out",
    listItems: ["Its look is unforgettable", "Its behavior is interesting", "I could read facts about it for hours"],
    artEmoji: "🦊",
    artLabel: "Animal spotlight illustration",
    artAlt: "A playful animal spotlight artwork",
    moodMessage: "Click to switch this animal page into a second mood.",
    surpriseMessage: "Surprise: my favorite fact about this animal deserves its own giant sign.",
    messageSwap: [
      "This message starts with one reason I picked this animal.",
      "This message changes to a second reason and keeps the page feeling alive.",
    ],
  },
  "perfect-day": {
    id: "perfect-day",
    badge: "Perfect Day",
    title: "My Perfect Day Plan",
    intro:
      "If I could design one ideal day from morning to night, this is the version I would build.",
    sectionTitle: "My must-have moments",
    listItems: ["A great start", "One unforgettable highlight", "A finish that feels calm and happy"],
    artEmoji: "☀️",
    artLabel: "Moodboard for my perfect day",
    artAlt: "A moodboard collage for a perfect day",
    moodMessage: "Click to switch this page into a second perfect-day mood.",
    surpriseMessage: "Surprise: there is definitely a favorite snack break hidden in this plan.",
    messageSwap: [
      "This message shows the first version of my dream day.",
      "This new message swaps in a different part of the plan.",
    ],
  },
};

const vibeTemplates: Record<string, VibeTemplate> = {
  ocean: {
    id: "ocean",
    cssVars: {
      "--page-bg": "linear-gradient(160deg, #e0f8ff 0%, #9fe5ff 48%, #53addd 100%)",
      "--card-bg": "rgba(255, 255, 255, 0.56)",
      "--card-border": "rgba(106, 186, 220, 0.28)",
      "--card-shadow": "0 26px 50px rgba(39, 113, 168, 0.20)",
      "--card-radius": "30px",
      "--headline": "#13466c",
      "--body-text": "#3c6788",
      "--accent": "#0f78ab",
      "--badge-bg": "rgba(255, 255, 255, 0.72)",
      "--art-bg": "linear-gradient(180deg, rgba(255,255,255,0.54), rgba(222,247,255,0.75))",
      "--button-bg": "linear-gradient(135deg, #0f78ab, #39a9d8)",
      "--button-text": "#f5fdff",
      "--button-shadow": "0 18px 28px rgba(15, 120, 171, 0.28)",
      "--message-bg": "rgba(239, 251, 255, 0.72)",
      "--surprise-bg": "rgba(200, 241, 255, 0.84)",
    },
  },
  space: {
    id: "space",
    cssVars: {
      "--page-bg": "linear-gradient(165deg, #130f2f 0%, #2a1c67 52%, #6033a5 100%)",
      "--card-bg": "rgba(20, 15, 53, 0.72)",
      "--card-border": "rgba(153, 131, 255, 0.26)",
      "--card-shadow": "0 28px 58px rgba(8, 7, 30, 0.52)",
      "--card-radius": "30px",
      "--headline": "#ffffff",
      "--body-text": "#d6d0ff",
      "--accent": "#ff8fd4",
      "--badge-bg": "rgba(255, 255, 255, 0.08)",
      "--art-bg": "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(101,67,189,0.34))",
      "--button-bg": "linear-gradient(135deg, #ff8fd4, #8c77ff)",
      "--button-text": "#1a1438",
      "--button-shadow": "0 18px 32px rgba(140, 119, 255, 0.28)",
      "--message-bg": "rgba(255, 255, 255, 0.08)",
      "--surprise-bg": "rgba(255, 143, 212, 0.18)",
    },
  },
  cozy: {
    id: "cozy",
    cssVars: {
      "--page-bg": "linear-gradient(160deg, #fff1df 0%, #ffd7c6 48%, #ffc59d 100%)",
      "--card-bg": "rgba(255, 252, 247, 0.72)",
      "--card-border": "rgba(217, 153, 114, 0.28)",
      "--card-shadow": "0 24px 46px rgba(173, 113, 84, 0.18)",
      "--card-radius": "32px",
      "--headline": "#6d3926",
      "--body-text": "#86533f",
      "--accent": "#c56d44",
      "--badge-bg": "rgba(255, 245, 235, 0.9)",
      "--art-bg": "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,234,212,0.9))",
      "--button-bg": "linear-gradient(135deg, #be6e44, #e19367)",
      "--button-text": "#fffaf4",
      "--button-shadow": "0 16px 28px rgba(190, 110, 68, 0.20)",
      "--message-bg": "rgba(255, 244, 233, 0.84)",
      "--surprise-bg": "rgba(255, 229, 204, 0.95)",
    },
  },
  neon: {
    id: "neon",
    cssVars: {
      "--page-bg": "linear-gradient(160deg, #05131b 0%, #0f3040 40%, #153a2a 100%)",
      "--card-bg": "rgba(8, 20, 28, 0.72)",
      "--card-border": "rgba(113, 255, 220, 0.22)",
      "--card-shadow": "0 28px 58px rgba(2, 11, 16, 0.52)",
      "--card-radius": "28px",
      "--headline": "#f7fffd",
      "--body-text": "#c6fff4",
      "--accent": "#6affd5",
      "--badge-bg": "rgba(106, 255, 213, 0.12)",
      "--art-bg": "linear-gradient(180deg, rgba(106,255,213,0.08), rgba(16,50,66,0.62))",
      "--button-bg": "linear-gradient(135deg, #6affd5, #27c8ff)",
      "--button-text": "#04202b",
      "--button-shadow": "0 18px 32px rgba(39, 200, 255, 0.22)",
      "--message-bg": "rgba(106, 255, 213, 0.10)",
      "--surprise-bg": "rgba(39, 200, 255, 0.18)",
    },
  },
};

const interactionTemplates: Record<string, InteractionTemplate> = {
  "switch-the-mood": {
    id: "switch-the-mood",
    buttonLabel: "Flip the Whole Mood",
    starterMessage: (topic) => topic.moodMessage,
    buildJavaScript: (topic) => `const page = document.querySelector(".remix-page");
const button = document.getElementById("remix-button");
const message = document.getElementById("dynamic-message");

const firstState = {
  message: ${JSON.stringify(topic.moodMessage)},
  buttonLabel: "Flip the Whole Mood",
  pageClass: "remix-page",
};

const secondState = {
  message: "Everything flipped: new colors, bigger energy, and a totally different mood.",
  buttonLabel: "Flip It Back",
  pageClass: "remix-page alt-mode",
};

let showingFirstState = true;

function applyState(state) {
  message.textContent = state.message;
  button.textContent = state.buttonLabel;
  page.className = state.pageClass;
}

button.addEventListener("click", () => {
  showingFirstState = !showingFirstState;

  if (showingFirstState) {
    applyState(firstState);
  } else {
    applyState(secondState);
  }
});

applyState(firstState);
`,
  },
  "reveal-a-surprise": {
    id: "reveal-a-surprise",
    buttonLabel: "Pop the Spotlight",
    starterMessage: () => "Click the button to make one hidden detail take over the spotlight.",
    buildJavaScript: (topic) => `const page = document.querySelector(".remix-page");
const button = document.getElementById("remix-button");
const message = document.getElementById("dynamic-message");

const startMessage = "Click the button to make one hidden detail take over the spotlight.";
const surpriseMessage = ${JSON.stringify(topic.surpriseMessage)};
const startButtonLabel = "Pop the Spotlight";
const surpriseButtonLabel = "Reset the Spotlight";

let showingSurprise = false;

button.addEventListener("click", () => {
  showingSurprise = !showingSurprise;
  page.classList.toggle("surprise-mode", showingSurprise);
  message.textContent = showingSurprise ? surpriseMessage : startMessage;
  button.textContent = showingSurprise ? surpriseButtonLabel : startButtonLabel;
});

message.textContent = startMessage;
button.textContent = startButtonLabel;
`,
  },
  "change-the-message": {
    id: "change-the-message",
    buttonLabel: "Display a New Message",
    starterMessage: (topic) => topic.messageSwap[0],
    buildJavaScript: (topic) => `const page = document.querySelector(".remix-page");
const button = document.getElementById("remix-button");
const message = document.getElementById("dynamic-message");

const firstMessage = ${JSON.stringify(topic.messageSwap[0])};
const secondMessage = ${JSON.stringify(topic.messageSwap[1])};
const firstButtonLabel = "Display a New Message";
const secondButtonLabel = "Bring Back the First";

let showingFirstMessage = true;

button.addEventListener("click", () => {
  showingFirstMessage = !showingFirstMessage;
  page.classList.toggle("message-mode", !showingFirstMessage);
  message.textContent = showingFirstMessage ? firstMessage : secondMessage;
  button.textContent = showingFirstMessage ? firstButtonLabel : secondButtonLabel;
});

message.textContent = firstMessage;
button.textContent = firstButtonLabel;
`,
  },
};

const builderQuestions: BuilderQuestion[] = [
  {
    id: "topic",
    title: "1. Pick your topic",
    body: "Start with a theme that feels broad enough to remix but specific enough to spark ideas.",
    defaultOptionId: "hobby",
    options: [
      {
        id: "hobby",
        label: "Favorite Hobby",
        description: "Build around something you love doing again and again.",
        emoji: "🎨",
        accentColor: "#ff8f78",
        previewGradient: "linear-gradient(135deg, rgba(255, 143, 120, 0.22), rgba(255, 217, 129, 0.42))",
      },
      {
        id: "dream-place",
        label: "Dream Place",
        description: "Turn one amazing destination into your own mini travel page.",
        emoji: "🌴",
        accentColor: "#59b8df",
        previewGradient: "linear-gradient(135deg, rgba(89, 184, 223, 0.26), rgba(198, 255, 240, 0.36))",
      },
      {
        id: "animal",
        label: "Favorite Animal",
        description: "Make a spotlight page for an animal you find fascinating.",
        emoji: "🦊",
        accentColor: "#f09d53",
        previewGradient: "linear-gradient(135deg, rgba(240, 157, 83, 0.24), rgba(255, 226, 173, 0.42))",
      },
      {
        id: "perfect-day",
        label: "Perfect Day",
        description: "Remix the best day you can imagine into a mini site.",
        emoji: "☀️",
        accentColor: "#ffb24f",
        previewGradient: "linear-gradient(135deg, rgba(255, 178, 79, 0.24), rgba(255, 232, 164, 0.4))",
      },
    ],
  },
  {
    id: "vibe",
    title: "2. Pick your visual vibe",
    body: "Choose a mood direction. The starter CSS will use it right away, and you can still remix it later.",
    defaultOptionId: "ocean",
    options: [
      {
        id: "ocean",
        label: "Ocean",
        description: "Cool, bright, splashy, and calm at the same time.",
        emoji: "🌊",
        accentColor: "#49a5d5",
        previewGradient: "linear-gradient(135deg, rgba(91, 202, 244, 0.30), rgba(218, 246, 255, 0.55))",
      },
      {
        id: "space",
        label: "Space",
        description: "Deep color, glow, and big dramatic energy.",
        emoji: "🚀",
        accentColor: "#a98cff",
        previewGradient: "linear-gradient(135deg, rgba(169, 140, 255, 0.28), rgba(255, 143, 212, 0.32))",
      },
      {
        id: "cozy",
        label: "Cozy",
        description: "Soft, warm, welcoming, and a little dreamy.",
        emoji: "🧸",
        accentColor: "#df8a62",
        previewGradient: "linear-gradient(135deg, rgba(255, 213, 188, 0.36), rgba(255, 244, 223, 0.62))",
      },
      {
        id: "neon",
        label: "Neon",
        description: "Electric highlights, glow, and late-night studio vibes.",
        emoji: "⚡",
        accentColor: "#56f0d0",
        previewGradient: "linear-gradient(135deg, rgba(86, 240, 208, 0.22), rgba(39, 200, 255, 0.24))",
      },
    ],
  },
  {
    id: "interaction",
    title: "3. Pick your interaction",
    body: "Keep it small. One button, one clear result, and code you can actually understand.",
    defaultOptionId: "switch-the-mood",
    options: [
      {
        id: "switch-the-mood",
        label: "Flip the Whole Mood",
        description: "One click turns the whole page into a bold opposite color world.",
        emoji: "🎛️",
        accentColor: "#7e8fff",
        previewGradient: "linear-gradient(135deg, rgba(25, 11, 47, 0.34), rgba(255, 79, 139, 0.34), rgba(255, 228, 92, 0.34))",
      },
      {
        id: "reveal-a-surprise",
        label: "Pop the Spotlight",
        description: "The page dims back while one surprise detail jumps forward.",
        emoji: "🎁",
        accentColor: "#f98580",
        previewGradient: "linear-gradient(135deg, rgba(17, 35, 95, 0.28), rgba(123, 47, 247, 0.28), rgba(241, 7, 163, 0.3))",
      },
      {
        id: "change-the-message",
        label: "Display a New Message",
        description: "A new message slides into focus with a brighter action panel.",
        emoji: "💬",
        accentColor: "#53c9a4",
        previewGradient: "linear-gradient(135deg, rgba(83, 201, 164, 0.26), rgba(255, 255, 255, 0.42), rgba(198, 255, 240, 0.36))",
      },
    ],
  },
];

const finalRemixLessonSteps: LessonStep[] = [
  {
    id: "builder",
    order: 1,
    shortTitle: "Starter",
    sidebarCopy: "Choose your topic, vibe, and interaction.",
    kicker: "Build your starter",
    title: "Build your own mini site starter",
    body:
      "Choose one topic, one visual vibe, and one simple interaction. As you click the cards, your personalized starter project appears in the preview.",
    hint: "This is not a blank page. The quiz builds your starter for you so you can remix it step by step.",
    challenge: "Pick a combo that feels fun now. You can still personalize the details in the next steps.",
    editorFocus: {
      label: "Your starter preview",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: false,
    showBuilder: true,
  },
  {
    id: "content",
    order: 2,
    shortTitle: "Content",
    sidebarCopy: "Make the words and art yours.",
    kicker: "Make the content yours",
    title: "Edit the HTML content",
    body:
      "This step reconnects to Lesson 1. Change the title, intro paragraph, list items, and art label so the page sounds like your version of the idea. In this step, HTML creates the action card elements, but JavaScript controls the button and dynamic message text when the page runs.",
    hint: "Stay inside the words between the tags first. Personalize the heading, intro, list, and art text here, and leave the action-card button/message wording for the JavaScript step.",
    tip: {
      title: "How to add an emoji",
      short: "Try your computer's emoji shortcut: Mac: Control + Command + Space. Windows: Windows key + Period. Chromebook: Search/Launcher + Shift + Space. You can also copy and paste an emoji from the internet.",
    },
    example: "<h1>Welcome to My Dream Aquarium City</h1>",
    editorFocus: {
      label: "The heading, paragraph, list, and art text",
      matchText: "<h1>",
    },
    showEditor: true,
    editorTabs: [
      {
        id: "html",
        label: "Content",
        language: "html",
        badgeLabel: "Final Project HTML",
      },
    ],
    defaultEditorTabId: "html",
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStarter",
    },
    passMessage: "Nice — the HTML content sounds more like your version now.",
    notYetMessage:
      "Add one personal content change to the HTML, like the title, intro, list, or art label. The action-card text gets updated in JavaScript later.",
  },
  {
    id: "style",
    order: 3,
    shortTitle: "Style",
    sidebarCopy: "Remix the colors and feel.",
    kicker: "Style the look",
    title: "Edit the CSS style",
    body:
      "This step reconnects to Lesson 2. Change one or two big style choices like the color variables, button look, or card roundness so the vibe feels clearly yours.",
    hint: "Try changing the accent color or the page background first. Those give the biggest before-and-after quickly.",
    example: "--accent: #ff6f91;",
    editorFocus: {
      label: "The color variables and button style",
      matchText: ":root",
    },
    showEditor: true,
    editorTabs: [
      {
        id: "css",
        label: "Style",
        language: "css",
        badgeLabel: "Final Project CSS",
      },
    ],
    defaultEditorTabId: "css",
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStarter",
    },
    passMessage: "Nice — the styling now has your own visual direction.",
    notYetMessage: "Change at least one style value so the page looks more like your version.",
  },
  {
    id: "interactive",
    order: 4,
    shortTitle: "Interaction",
    sidebarCopy: "Personalize the button behavior.",
    kicker: "Make it interactive",
    title: "Edit the JavaScript interaction",
    body:
      "This step reconnects to Lesson 3. The action-card button and message are JavaScript-controlled content. Change the text through the starter JavaScript variables, then test the interaction in the preview.",
    hint:
      "Edit the text inside quotes first. Depending on your starter, customize `firstState.message` and `firstState.buttonLabel`, or `startMessage` and `startButtonLabel`, or `firstMessage` and `firstButtonLabel`. Keep the click structure in place so the project stays stable.",
    example: 'const surpriseMessage = "The best part is the giant hidden waterfall cave.";',
    editorFocus: {
      label: "The JS messages and button labels",
      matchText: "const",
    },
    showEditor: true,
    editorTabs: [
      {
        id: "javascript",
        label: "Interaction",
        language: "javascript",
        badgeLabel: "Final Project JavaScript",
      },
    ],
    defaultEditorTabId: "javascript",
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStarter",
    },
    passMessage: "Nice — you personalized the interaction layer too.",
    notYetMessage:
      "Change one JS-controlled message or button value so the interaction feels more like yours.",
  },
  {
    id: "remix",
    order: 5,
    shortTitle: "Remix",
    sidebarCopy: "Polish any part you want.",
    kicker: "Remix challenge",
    title: "Remix challenge: add one more personal move",
    body:
      "Now choose what you want to improve next. You can jump between content, style, and interaction, then make one final mini remix that feels like your signature.",
    hint:
      "Use the tabs above the editor to switch between HTML, CSS, and JavaScript without opening a giant combined file. HTML creates the action card, and JavaScript changes its message/button text.",
    editorFocus: {
      label: "Any slice you want to remix",
    },
    checklist: [
      "Add one extra detail to the content",
      "Improve one style choice so the vibe feels stronger",
      "Rename the button from the JavaScript tab so it sounds more like your page",
      "Test the interaction twice in the preview",
    ],
    showEditor: true,
    editorTabs: [
      {
        id: "html",
        label: "Content",
        language: "html",
        badgeLabel: "Final Project HTML",
      },
      {
        id: "css",
        label: "Style",
        language: "css",
        badgeLabel: "Final Project CSS",
      },
      {
        id: "javascript",
        label: "Interaction",
        language: "javascript",
        badgeLabel: "Final Project JavaScript",
      },
    ],
    defaultEditorTabId: "html",
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStarter",
    },
    passMessage: "Nice — you added one more intentional remix move.",
    notYetMessage: "You can leave this open, or make one more small remix in HTML, CSS, or JavaScript.",
  },
  {
    id: "finish",
    order: 6,
    shortTitle: "Showcase",
    sidebarCopy: "Celebrate your full remix project.",
    kicker: "Finish and showcase",
    title: "Finish and showcase your mini site",
    body:
      "You combined structure, style, and interaction in one project. Take a final look, then open the showcase screen to celebrate your capstone build.",
    hint: "If one detail still feels unfinished, go back one step and polish it before you finish.",
    editorFocus: {
      label: "Your finished mini site",
    },
    feedbackMode: "reflection",
    isGate: false,
    reflectionPrompt: "What did you customize in HTML, CSS, and JavaScript?",
    reflectionPlaceholder: "Name one thing you changed in each layer, or describe the layers you used most.",
    passMessage: "Nice reflection. You connected the project back to the three layers you used.",
    notYetMessage: "Take a moment to name what you customized across HTML, CSS, and JavaScript.",
    showEditor: false,
  },
];

const buildCssVars = (cssVars: Record<string, string>) =>
  Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

const buildHtmlStarter = (topic: TopicTemplate) => `<main class="remix-page">
  <div class="remix-grid">
    <section class="hero-card">
      <span class="remix-badge">${topic.badge}</span>

      <div class="hero-top">
        <div class="hero-copy">
          <h1>${topic.title}</h1>
          <p class="intro-text">
            ${topic.intro}
          </p>
        </div>

        <div class="hero-art" role="img" aria-label="${topic.artAlt}">
          <span class="art-emoji">${topic.artEmoji}</span>
          <span class="art-label">${topic.artLabel}</span>
        </div>
      </div>
    </section>

    <section class="details-card">
      <h2>${topic.sectionTitle}</h2>
      <ul class="details-list">
        <li>${topic.listItems[0]}</li>
        <li>${topic.listItems[1]}</li>
        <li>${topic.listItems[2]}</li>
      </ul>
    </section>

    <section class="action-card">
      <!-- JavaScript updates this button text when the preview runs. -->
      <button id="remix-button" class="remix-button" type="button">
        Button
      </button>
      <!-- JavaScript also replaces this starter message in the live preview. -->
      <p id="dynamic-message" class="dynamic-message">
        This message is controlled by JavaScript.
      </p>
    </section>
  </div>
</main>`;

const buildCssStarter = (vibe: VibeTemplate) => `:root {
${buildCssVars(vibe.cssVars)}
}

.remix-button {
  letter-spacing: 0.02em;
}

.dynamic-message {
  max-width: 48ch;
}
`;

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const combineFinalRemixCode = ({ html, css, javascript }: FinalRemixSections) =>
  [
    SECTION_MARKERS.html,
    html.trim(),
    SECTION_MARKERS.css,
    css.trim(),
    SECTION_MARKERS.javascript,
    javascript.trim(),
  ].join("\n");

const parseFinalRemixCode = (code: string): FinalRemixSections => {
  const sectionsPattern = new RegExp(
    `${escapeForRegex(SECTION_MARKERS.html)}\\n([\\s\\S]*?)\\n${escapeForRegex(
      SECTION_MARKERS.css,
    )}\\n([\\s\\S]*?)\\n${escapeForRegex(SECTION_MARKERS.javascript)}\\n([\\s\\S]*)$`,
  );
  const match = code.match(sectionsPattern);

  if (!match) {
    return {
      html: code,
      css: "",
      javascript: "",
    };
  }

  return {
    html: match[1],
    css: match[2],
    javascript: match[3],
  };
};

const replaceCodeSlice = (
  currentCode: string,
  editorTabId: string,
  nextSliceCode: string,
) => {
  const currentSections = parseFinalRemixCode(currentCode);

  if (editorTabId === "html") {
    currentSections.html = nextSliceCode;
  }

  if (editorTabId === "css") {
    currentSections.css = nextSliceCode;
  }

  if (editorTabId === "javascript") {
    currentSections.javascript = nextSliceCode;
  }

  return combineFinalRemixCode(currentSections);
};

const getTemplateSelections = (builderSelections: BuilderSelections) => ({
  topic: topicTemplates[builderSelections.topic] ?? topicTemplates.hobby,
  vibe: vibeTemplates[builderSelections.vibe] ?? vibeTemplates.ocean,
  interaction:
    interactionTemplates[builderSelections.interaction] ?? interactionTemplates["switch-the-mood"],
});

const buildFinalRemixStarterCode = (builderSelections: BuilderSelections) => {
  const { topic, vibe, interaction } = getTemplateSelections(builderSelections);

  return combineFinalRemixCode({
    html: buildHtmlStarter(topic),
    css: buildCssStarter(vibe),
    javascript: interaction.buildJavaScript(topic),
  });
};

const buildFinalRemixPreviewDocument = (code: string) => {
  const sections = parseFinalRemixCode(code);

  return buildPreviewDocument({
    mode: "html",
    code: sections.html,
    baseCss: `${BASE_CSS}\n${sections.css}`,
    baseScript: sections.javascript,
  });
};

export const buildYourOwnMiniSiteProject: LessonProjectConfig = {
  slug: "build-your-own-mini-site",
  contentVersion: "v1",
  editorLanguage: "html",
  editorBadgeLabel: "Final Project HTML",
  projectCard: {
    title: "Build Your Own Mini Site",
    description:
      "Create a final remix project by choosing a topic, visual vibe, and interaction, then personalize the HTML, CSS, and JavaScript step by step.",
    level: "Capstone",
    whatYouMake: "A one-page creative mini site",
    time: "25-30 min",
    artGradient: "linear-gradient(135deg, #6ee7d7, #65b8ff 34%, #a67dff 68%, #ffab7a)",
  },
  starterCode: buildFinalRemixStarterCode({
    topic: "hobby",
    vibe: "ocean",
    interaction: "switch-the-mood",
  }),
  resetBehavior: "active-tab",
  builder: {
    title: "Creative starter builder",
    body:
      "Choose three ingredients. DevBloom will turn them into a small starter project you can remix without getting lost in a blank screen.",
    questions: builderQuestions,
  },
  getStarterCode: ({ builderSelections }) => buildFinalRemixStarterCode(builderSelections),
  getEditorCodeSlice: ({ code, editorTabId }) => {
    const sections = parseFinalRemixCode(code);

    if (editorTabId === "css") {
      return sections.css;
    }

    if (editorTabId === "javascript") {
      return sections.javascript;
    }

    return sections.html;
  },
  applyEditorCodeSlice: ({ currentCode, nextSliceCode, editorTabId }) =>
    replaceCodeSlice(currentCode, editorTabId, nextSliceCode),
  steps: finalRemixLessonSteps,
  sidebar: {
    eyebrow: "Capstone project",
    title: "Build Your Own Mini Site",
    description:
      "Use HTML, CSS, and JavaScript together to remix a personalized one-page project with your own topic, vibe, and interaction.",
  },
  introCard: {
    title: "Project goal",
    body:
      "By the end, you’ll have one finished mini site that combines structure, style, and interaction without starting from a blank page.",
    pills: ["HTML + CSS + JS", "Personalized starter", "Capstone remix"],
  },
  finish: {
    eyebrow: "Capstone complete",
    title: "You built a full mini site.",
    body:
      "You chose a topic, set a visual vibe, added an interaction, and remixed the code across HTML, CSS, and JavaScript. That is a real creative coding project from start to finish.",
    learnedBadges: [
      "Combined: structure + style + interaction",
      "Built: a personalized starter",
      "Remixed: HTML, CSS, and JavaScript",
      "Finished: your own mini site",
    ],
  },
  previewSandbox: "allow-same-origin allow-scripts",
  buildPreviewDocument: ({ code }) => buildFinalRemixPreviewDocument(code),
  previewTitle: () => "Final remix preview",
};
