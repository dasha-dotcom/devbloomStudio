import { buildPreviewDocument } from "@/lib/preview";

import type {
  ImageOption,
  LessonProjectConfig,
  LessonStep,
  ThemeOption,
} from "@/lib/projects/types";

const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const allAboutMeStarterCode = `<main class="page-shell">
  <span class="badge">My Project</span>
  <h1>Something I Love</h1>
  <p>
    This is something I really enjoy. It makes me happy, and I'd love to share why it's awesome.
  </p>

  <img
    src="image:abstract-warm"
    alt="A colorful abstract design"
  />

  <section class="highlights">
    <h2>What's great about it</h2>
    <ul>
      <li>First thing that makes it special</li>
      <li>Second thing I really like</li>
      <li>Third reason it's my favorite</li>
    </ul>
  </section>
</main>`;

export const allAboutMeLessonSteps: LessonStep[] = [
  {
    id: "welcome",
    order: 1,
    shortTitle: "Welcome",
    sidebarCopy: "Pick a topic to start your page.",
    countsTowardProgress: false,
    kicker: "Project intro",
    title: "Pick your topic",
    body:
      "What do you want your page to be about? Choose something you like: a game, animal, sport, show, hobby, food, tech, or anything else. Next, you'll make the title.",
    hint: "Need ideas? Try your favorite game, animal, sport, show, hobby, food, or piece of tech.",
    editorFocus: {
      label: "Look around and plan",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: false,
  },
  {
    id: "title",
    order: 2,
    shortTitle: "Title",
    sidebarCopy: "Change the big title.",
    kicker: "Headings",
    title: "Change the big title",
    body:
      "Your mission: change the big title. Find `<h1>Something I Love</h1>`. Change only the words inside the `<h1>` tag. Keep `<h1>` and `</h1>`. Watch the big title change in the preview. The `<h1>` tag makes the biggest title on your page.",
    hint: "Try a short title like `Why I Love Soccer` or `All About Cats`.",
    example: "<h1>Something I Love</h1>\n<h1>Why I Love Soccer</h1>\n<h1>All About Cats</h1>",
    editorFocus: {
      label: "The <h1> heading",
      matchText: "<h1>",
      helperText: "Find the title line. Replace the words between the tags. Keep `<h1>` and `</h1>`.",
    },
    prediction: {
      question: "What do you think will change?",
      options: ["The big title on the page", "The background color", "The picture"],
      answerIndex: 0,
      positiveFeedback: "Yes. Now change the title and watch the preview.",
      neutralFeedback: "Now test it. Change the title and watch the preview.",
    },
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedInTargetRegion",
      region: {
        startAfter: "<h1>",
        endBefore: "</h1>",
      },
    },
    passMessage: "Great — you created a real page heading.",
    notYetMessage: "Edit the words inside the <h1> tag to create your title.",
    showEditor: true,
  },
  {
    id: "about",
    order: 3,
    shortTitle: "Intro",
    sidebarCopy: "Change the intro paragraph.",
    kicker: "Paragraphs",
    title: "Change the intro paragraph",
    body:
      "Your mission: change the intro paragraph. Find the paragraph in the code. Change the words between `<p>` and `</p>`. Keep `<p>` and `</p>`. Watch the intro text change in the preview. A `<p>` tag makes a paragraph.",
    hint: "Think: What is your topic? Why do you like it? What makes it special?",
    example:
      "<p>This is something I really enjoy...</p>\n<p>I like soccer because it is exciting and fun to play.</p>",
    editorFocus: {
      label: "The first <p> paragraph",
      matchText: "<p>",
      helperText: "Find the intro paragraph. Replace the sentences. Do not delete `<p>` or `</p>`.",
    },
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedInTargetRegion",
      region: {
        startAfter: "<p>",
        endBefore: "</p>",
      },
    },
    passMessage: "Perfect — your intro paragraph appeared on the page.",
    notYetMessage: "Edit the text inside the first paragraph tag to write your intro.",
    showEditor: true,
  },
  {
    id: "highlights",
    order: 4,
    shortTitle: "Highlights",
    sidebarCopy: "Change the bullet list.",
    kicker: "Lists",
    title: "Change the bullet list",
    body:
      "Your mission: change the three bullet points. Find the three `<li>` items in the code. Change only the words inside each `<li>` item. Keep `<li>` and `</li>`. Do this for all 3 bullet points. Watch the list update in the preview. Each `<li>` makes one bullet point on your page.",
    hint: "Before: `<li>First thing that makes it special</li>` After: `<li>Fun to play with friends</li>`",
    example: "<li>First thing that makes it special</li>\n<li>Fun to play with friends</li>",
    editorFocus: {
      label: "The <li> list items",
      matchText: "<li>",
      helperText: "Find the list items. Replace the words. Do not delete `<li>` or `</li>`.",
    },
    prediction: {
      question: "Which part of your page will this control?",
      options: ["The highlights list", "The colors and theme", "The title size"],
      answerIndex: 0,
      positiveFeedback: "Yes. Now change the list items and watch the preview.",
      neutralFeedback: "Now test it. Change the list items and watch the preview.",
    },
    feedbackMode: "checkpoint",
    isGate: true,
    allowNextWhen: "pass",
    checkpoint: {
      title: "Connect lists to HTML",
      body: "First edit the `<li>` items above. Then answer these questions about the list code.",
      submitLabel: "Check my answers",
      questions: [
        {
          id: "list-tag",
          prompt: "Which tag makes one item in the list?",
          options: ["<li>", "<h1>", "<img>"],
          correctOptionIndex: 0,
        },
        {
          id: "add-item",
          prompt: "Which code would add another item to the list?",
          options: ["<p>Board games</p>", "<li>Board games</li>", "<img src=\"board-games\" />"],
          correctOptionIndex: 1,
        },
      ],
    },
    passMessage: "Excellent — you connected the list to the right HTML tag.",
    closeMessage: "You're close. Look for the tag that wraps each list item.",
    notYetMessage: "Find the tag that creates each item in the highlights list.",
    showEditor: true,
  },
  {
    id: "image",
    order: 5,
    shortTitle: "Image",
    sidebarCopy: "Choose an image style.",
    kicker: "Images",
    title: "Choose a picture style",
    body:
      "Choose a picture style for your page. Click one image card below. Watch the preview change. The `<img>` tag shows a picture on your page.",
    hint: "Pick the picture style that fits your topic best.",
    editorFocus: {
      label: "The <img> tag",
      matchText: "<img",
      helperText:
        "You do not need to type here. Click an image card below and watch the picture change.",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: true,
    showImagePicker: true,
  },
  {
    id: "theme",
    order: 6,
    shortTitle: "Theme",
    sidebarCopy: "Pick your color theme.",
    kicker: "Colors & mood",
    title: "Pick a color theme",
    body:
      "Do not edit the code in this step. Click a theme card below. Watch the colors change in the preview. The HTML stays the same. The theme changes the colors and style.",
    hint: "Try a few theme cards and see which one fits your page best.",
    editorFocus: {
      label: "No code editing here",
      helperText: "No code editing here — just choose a theme card.",
    },
    prediction: {
      question: "What will a theme change?",
      options: ["Only the colors and look", "The words on the page", "The list items"],
      answerIndex: 0,
      positiveFeedback: "Yes. Now test it: click a theme card.",
      neutralFeedback: "Now test it: click a theme card and watch the colors change.",
    },
    feedbackMode: "none",
    isGate: false,
    showEditor: true,
    showThemePicker: true,
  },
  {
    id: "final-touches",
    order: 7,
    shortTitle: "Polish",
    sidebarCopy: "Make one final edit.",
    kicker: "One small change",
    title: "Make one final edit",
    body:
      "Pick ONE small change from the list. Make that change in the code. Then check it off. This should take about 1 minute. One tiny improvement is enough. Only change words between tags. Keep the `< >` code parts.",
    hint: "Choose one place to edit: the `<h1>` title, the `<p>` intro, or one `<li>` bullet point.",
    editorFocus: {
      label: "Title, intro, or list",
      helperText: "Choose one place to edit: `<h1>` title, `<p>` intro, or `<li>` bullet list.",
    },
    checklist: [
      'Change the title: "Why Roblox Is So Fun"',
      'Add one intro sentence: "My favorite part is playing with my friends."',
      "Add one bullet point: `<li>It has cool characters</li>`",
    ],
    feedbackMode: "autoCheck",
    isGate: false,
    successCriteria: {
      type: "changedFromStepStart",
    },
    passMessage: "Perfect — you added your personal style to the page.",
    notYetMessage: "Make one small improvement, or skip ahead if you're happy with your page.",
    showEditor: true,
  },
  {
    id: "finish",
    order: 8,
    shortTitle: "Finish",
    sidebarCopy: "Celebrate what you built.",
    kicker: "You're done",
    title: "You built a real webpage",
    body:
      "You made a mini website with real HTML. Before you celebrate, write one quick developer note.",
    hint: "Example: the title, intro paragraph, bullet list, or image.",
    editorFocus: {
      label: "Your finished page",
    },
    feedbackMode: "reflection",
    isGate: false,
    reflectionPrompt: "One thing I changed in the HTML was...",
    reflectionPlaceholder: "For example: the title, intro paragraph, bullet list, or image.",
    passMessage: "Great reflection. You identified exactly how HTML shaped your page.",
    notYetMessage: "Take a moment to name one thing that HTML created or controlled on your page.",
    showEditor: false,
  },
];

export const allAboutMeThemeOptions: ThemeOption[] = [
  {
    id: "sunshine",
    name: "Sunshine",
    description: "Warm, bright, and full of cheerful energy.",
    swatches: ["#ffca5f", "#ff8b72", "#fff6dd"],
    previewGradient: "linear-gradient(180deg, #fff6dc, #fff0d1)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #fff6dc, #fff0d1)",
      "--card-bg": "rgba(255,255,255,0.82)",
      "--card-border": "rgba(255, 171, 96, 0.28)",
      "--accent": "#ff8d55",
      "--accent-soft": "#ffe0b6",
      "--headline": "#643319",
      "--body": "#6f4a33",
      "--shadow": "0 24px 45px rgba(255, 170, 90, 0.18)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blues with calm explorer vibes.",
    swatches: ["#67c9ff", "#86ebd6", "#eefaff"],
    previewGradient: "linear-gradient(180deg, #ecfbff, #dff3ff)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #ecfbff, #dff3ff)",
      "--card-bg": "rgba(255,255,255,0.8)",
      "--card-border": "rgba(73, 171, 224, 0.22)",
      "--accent": "#2f97c7",
      "--accent-soft": "#c9f0ff",
      "--headline": "#0f4060",
      "--body": "#4c6f88",
      "--shadow": "0 24px 45px rgba(73, 171, 224, 0.16)",
    },
  },
  {
    id: "space",
    name: "Space",
    description: "Deep color, neon glow, and starry drama.",
    swatches: ["#7a70ff", "#ff78ba", "#161233"],
    previewGradient: "linear-gradient(180deg, #161233, #21194b)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #161233, #21194b)",
      "--card-bg": "rgba(25, 20, 55, 0.74)",
      "--card-border": "rgba(163, 141, 255, 0.2)",
      "--accent": "#ff78ba",
      "--accent-soft": "rgba(255, 120, 186, 0.16)",
      "--headline": "#ffffff",
      "--body": "#d4d2ef",
      "--shadow": "0 24px 48px rgba(11, 8, 26, 0.45)",
    },
  },
  {
    id: "jungle",
    name: "Jungle",
    description: "Leafy, adventurous, and extra fresh.",
    swatches: ["#7ccc7a", "#ffd66e", "#edf8ea"],
    previewGradient: "linear-gradient(180deg, #edf8ea, #e2f3df)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #edf8ea, #e2f3df)",
      "--card-bg": "rgba(255,255,255,0.8)",
      "--card-border": "rgba(87, 155, 91, 0.2)",
      "--accent": "#4d9b55",
      "--accent-soft": "#dcf2cf",
      "--headline": "#24472d",
      "--body": "#4e6b55",
      "--shadow": "0 24px 45px rgba(87, 155, 91, 0.16)",
    },
  },
  {
    id: "retro",
    name: "Retro",
    description: "Warm vintage vibes with timeless style.",
    swatches: ["#d4a574", "#c85a17", "#e8d4c0"],
    previewGradient: "linear-gradient(180deg, #e8d4c0, #ead9cc)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #e8d4c0, #ead9cc)",
      "--card-bg": "rgba(255,255,255,0.75)",
      "--card-border": "rgba(200, 90, 23, 0.2)",
      "--accent": "#b8860b",
      "--accent-soft": "#f4d9c0",
      "--headline": "#5c3d25",
      "--body": "#704a2c",
      "--shadow": "0 24px 45px rgba(200, 90, 23, 0.12)",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, modern, and sophisticated.",
    swatches: ["#f5f5f5", "#2c2c2c", "#cccccc"],
    previewGradient: "linear-gradient(180deg, #f9f9f9, #f0f0f0)",
    cssVars: {
      "--page-bg": "linear-gradient(180deg, #f9f9f9, #f0f0f0)",
      "--card-bg": "rgba(255,255,255,0.95)",
      "--card-border": "rgba(44, 44, 44, 0.1)",
      "--accent": "#1a1a1a",
      "--accent-soft": "#e8e8e8",
      "--headline": "#1a1a1a",
      "--body": "#4a4a4a",
      "--shadow": "0 24px 45px rgba(0, 0, 0, 0.08)",
    },
  },
];

export const allAboutMeImageOptions: ImageOption[] = [
  {
    id: "abstract-warm",
    name: "Warm Vibes",
    description: "Warm abstract shapes and colors.",
    alt: "Warm abstract design with orange and pink tones",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#ffb347"/>
            <stop offset="1" stop-color="#ff6b9d"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="80" cy="60" r="35" fill="#ffd89b" opacity="0.8"/>
        <rect x="180" y="100" width="90" height="90" rx="15" fill="#ff9db5" opacity="0.7"/>
        <polygon points="140,180 160,130 180,180" fill="#fff4e6" opacity="0.9"/>
        <circle cx="240" cy="80" r="25" fill="#ffeaa7" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: "abstract-cool",
    name: "Cool Vibes",
    description: "Cool abstract shapes and colors.",
    alt: "Cool abstract design with blue and teal tones",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#74b9ff"/>
            <stop offset="1" stop-color="#0984e3"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="100" cy="80" r="40" fill="#81ecec" opacity="0.8"/>
        <rect x="160" y="120" width="100" height="85" rx="12" fill="#74b9ff" opacity="0.7"/>
        <polygon points="60,200 40,150 80,150" fill="#a8e6cf" opacity="0.9"/>
        <circle cx="220" cy="60" r="22" fill="#55efc4" opacity="0.7"/>
      </svg>
    `),
  },
  {
    id: "geometric-grid",
    name: "Geometric Grid",
    description: "Geometric patterns with retro flair.",
    alt: "Geometric grid pattern in retro colors",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#ffd93d"/>
            <stop offset="1" stop-color="#ff6b9d"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <rect x="40" y="40" width="40" height="40" fill="#6bcf7f" opacity="0.8"/>
        <rect x="100" y="40" width="40" height="40" fill="#4d96ff" opacity="0.8"/>
        <rect x="160" y="40" width="40" height="40" fill="#ff6b9d" opacity="0.8"/>
        <rect x="220" y="40" width="40" height="40" fill="#ffd93d" opacity="0.8"/>
        <rect x="40" y="100" width="40" height="40" fill="#4d96ff" opacity="0.8"/>
        <rect x="100" y="100" width="40" height="40" fill="#ff6b9d" opacity="0.8"/>
        <rect x="160" y="100" width="40" height="40" fill="#ffd93d" opacity="0.8"/>
        <rect x="220" y="100" width="40" height="40" fill="#6bcf7f" opacity="0.8"/>
        <rect x="40" y="160" width="40" height="40" fill="#ff6b9d" opacity="0.8"/>
        <rect x="100" y="160" width="40" height="40" fill="#ffd93d" opacity="0.8"/>
        <rect x="160" y="160" width="40" height="40" fill="#6bcf7f" opacity="0.8"/>
        <rect x="220" y="160" width="40" height="40" fill="#4d96ff" opacity="0.8"/>
      </svg>
    `),
  },
  {
    id: "neon-lines",
    name: "Neon Lines",
    description: "Bold neon lines and glow effects.",
    alt: "Neon glowing lines and shapes on dark background",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#1a1a2e"/>
            <stop offset="1" stop-color="#16213e"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="100" cy="70" r="30" fill="none" stroke="#00ff00" stroke-width="3" filter="url(#glow)"/>
        <line x1="160" y1="40" x2="240" y2="120" stroke="#ff00ff" stroke-width="3" filter="url(#glow)"/>
        <rect x="50" y="140" width="60" height="60" fill="none" stroke="#00ffff" stroke-width="2" filter="url(#glow)"/>
        <circle cx="240" cy="170" r="35" fill="none" stroke="#ffff00" stroke-width="2" filter="url(#glow)"/>
      </svg>
    `),
  },
  {
    id: "nature-collage",
    name: "Nature Collage",
    description: "Nature-inspired organic shapes and colors.",
    alt: "Nature-inspired collage with organic elements",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#a8e6cf"/>
            <stop offset="1" stop-color="#dcedc1"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <path d="M50 200 Q50 150 80 140 Q100 135 110 160 Q120 145 140 155 Q130 180 150 190 Z" fill="#56ab91" opacity="0.8"/>
        <circle cx="180" cy="80" r="35" fill="#ffd93d" opacity="0.9"/>
        <path d="M220 200 L240 140 L260 200 Z" fill="#56ab91" opacity="0.8"/>
        <ellipse cx="100" cy="60" rx="25" ry="40" fill="#ff6b9d" opacity="0.7"/>
        <circle cx="250" cy="160" r="20" fill="#81ecec" opacity="0.8"/>
      </svg>
    `),
  },
];

const updateImageTagInCode = (currentCode: string, image: ImageOption) => {
  const imageTagMatch = currentCode.match(/<img[\s\S]*?\/>/);

  if (!imageTagMatch) {
    return currentCode;
  }

  const updatedImageTag = imageTagMatch[0]
    .replace(/src="[^"]*"/, `src="image:${image.id}"`)
    .replace(/alt="[^"]*"/, `alt="${image.alt}"`);

  return currentCode.replace(imageTagMatch[0], updatedImageTag);
};

export const allAboutMeProject: LessonProjectConfig = {
  slug: "all-about-me",
  contentVersion: "v1",
  editorLanguage: "html",
  editorBadgeLabel: "Starter HTML",
  projectCard: {
    title: "Make a Page About Something You Like",
    description:
      "Pick your topic and build a real mini website about it. Learn HTML with headings, paragraphs, lists, images, and custom colors.",
    level: "Beginner",
    whatYouMake: "A mini webpage about your favorite thing",
    time: "20-25 min",
    artGradient: "linear-gradient(135deg, #ffd981, #ff8e78 52%, #6ecbff)",
  },
  starterCode: allAboutMeStarterCode,
  steps: allAboutMeLessonSteps,
  sidebar: {
    eyebrow: "Beginner project",
    title: "Make a Page About Something You Like",
    description:
      "Pick something you like and build a mini website with real HTML.",
  },
  introCard: {
    title: "Start with one idea",
    body:
      "Choose your topic first. Then you'll make a title, intro, list, picture, and theme.",
    pills: ["Pick a topic", "Edit HTML", "Watch the preview"],
  },
  finish: {
    eyebrow: "Project complete",
    title: "You built a real webpage.",
    body:
      "You made a mini website with real HTML. You changed the title, intro, list, picture, and colors step by step.",
    learnedBadges: [
      "Learned: headings",
      "Learned: paragraphs",
      "Learned: lists",
      "Learned: images",
    ],
  },
  onboardingTour: {
    enabled: true,
    triggerStepIndex: 1,
    showEveryTime: true,
    steps: [
      {
        targetId: "lesson-mission",
        title: "Read the developer mission",
        body: "This will tell you your task for each step and how to edit the code.",
      },
      {
        targetId: "lesson-prediction",
        title: "Make a prediction",
        body: "Pause and guess what the code will do.",
      },
      {
        targetId: "lesson-editor",
        title: "Edit the code",
        body: "This is where you change the page like a developer.",
      },
      {
        targetId: "lesson-preview",
        title: "Watch the preview",
        body: "Your preview shows what your code changed.",
      },
      {
        targetId: "lesson-progress",
        title: "Track your progress",
        body: "This shows how far you are in the project. It fills up as you edit the code and complete questions in each step.",
      },
      {
        targetId: "lesson-next-step",
        title: "Go next when you're done",
        body: "Finish the tasks on this page first. When you are done, click Next step to move to the next part of the project.",
      },
    ],
  },
  defaultThemeId: "ocean",
  themeOptions: allAboutMeThemeOptions,
  defaultImageId: "abstract-warm",
  imageOptions: allAboutMeImageOptions,
  previewTitle: ({ selectedThemeId }) => `Theme: ${selectedThemeId}`,
  buildPreviewDocument: ({ code, selectedThemeId, selectedImageId }) =>
    buildPreviewDocument({
      mode: "html",
      code,
      themeId: selectedThemeId,
      imageId: selectedImageId,
      themeOptions: allAboutMeThemeOptions,
      imageOptions: allAboutMeImageOptions,
      baseCss: `
        body {
          margin: 0;
          min-height: 100vh;
          padding: 24px;
          font-family: "Trebuchet MS", "Avenir Next", Arial, sans-serif;
          background: var(--page-bg);
          color: var(--body);
        }

        .page-shell {
          max-width: 720px;
          margin: 0 auto;
          padding: 28px;
          border-radius: 28px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          box-shadow: var(--shadow);
        }

        .badge {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          font-size: 14px;
        }

        h1,
        h2 {
          color: var(--headline);
          letter-spacing: -0.03em;
        }

        h1 {
          font-size: clamp(2.2rem, 6vw, 3.4rem);
          margin: 18px 0 12px;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 1.35rem;
        }

        p,
        li {
          font-size: 1.04rem;
          line-height: 1.7;
        }

        img {
          width: 100%;
          max-width: 280px;
          display: block;
          margin: 22px 0;
          border-radius: 24px;
          border: 4px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 18px 35px rgba(15, 24, 43, 0.14);
        }

        ul {
          margin: 0;
          padding-left: 22px;
        }

        .highlights {
          margin-top: 22px;
          padding: 20px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.36);
        }
      `,
    }),
  onSelectImage: updateImageTagInCode,
};
