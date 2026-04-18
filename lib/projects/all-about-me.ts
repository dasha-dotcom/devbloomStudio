import { buildPreviewDocument } from "@/lib/preview";

import type {
  ImageOption,
  LessonProjectConfig,
  LessonStep,
  ThemeOption,
} from "@/lib/projects/types";

const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const allAboutMeStarterCode = `<main class="page-shell">
  <span class="badge">All About Me</span>
  <h1>Hi, I'm Nova!</h1>
  <p>
    I love drawing characters, learning cool facts, and making colorful things on screen.
  </p>

  <img
    src="image:spark"
    alt="A stylized bright portrait illustration"
  />

  <section class="favorites">
    <h2>My favorite things</h2>
    <ul>
      <li>Fruit smoothies</li>
      <li>Ocean colors</li>
      <li>Making playlists</li>
    </ul>
  </section>
</main>`;

export const allAboutMeLessonSteps: LessonStep[] = [
  {
    id: "welcome",
    order: 1,
    shortTitle: "Welcome",
    sidebarCopy: "See what you’ll build.",
    kicker: "Project intro",
    title: "Build your own mini website",
    body:
      "You’re about to make an All About Me page using real HTML. Each step changes one part of the page, so you can see exactly how your code turns into a website.",
    hint: "The preview on the right is your project. The code editor is where you shape it.",
    challenge: "When you reach the end, add one extra detail that feels very you.",
    editorFocus: {
      label: "Look around",
    },
    showEditor: false,
  },
  {
    id: "title",
    order: 2,
    shortTitle: "Title",
    sidebarCopy: "Change the big heading.",
    kicker: "Headings",
    title: "Add your title",
    body:
      "Find the big heading inside the <h1> tag and change it to your own greeting. This becomes the first thing people see on your page.",
    hint: "Only change the words between <h1> and </h1>.",
    example: "<h1>Hi, I'm Zara!</h1>",
    editorFocus: {
      label: "The <h1> heading",
      matchText: "<h1>",
    },
    prediction: {
      question: "What do you think will change?",
      options: ["The big title", "The picture", "The background color"],
      answerIndex: 0,
      positiveFeedback: "Nice guess — now try it and see.",
      neutralFeedback: "Try it and compare the preview.",
    },
    showEditor: true,
  },
  {
    id: "about",
    order: 3,
    shortTitle: "About You",
    sidebarCopy: "Write a short intro.",
    kicker: "Paragraphs",
    title: "Write about yourself",
    body:
      "Now edit the paragraph to say a few fun things about you. One or two sentences is perfect.",
    hint: "Try: what you enjoy, what you’re curious about, or what makes you unique.",
    example:
      "<p>I like building tiny worlds, listening to music, and finding the best snacks.</p>",
    editorFocus: {
      label: "The first <p> paragraph",
      matchText: "<p>",
    },
    showEditor: true,
  },
  {
    id: "favorites",
    order: 4,
    shortTitle: "Favorites",
    sidebarCopy: "Edit your list items.",
    kicker: "Lists",
    title: "Add your favorites",
    body:
      "Lists are great for quick facts. Update the three <li> items with your favorite things so your page feels more personal right away.",
    hint: "Each <li> is one list item. You can change the words inside each one.",
    example: "<li>Basketball</li>",
    editorFocus: {
      label: "The <li> list items",
      matchText: "<li>",
    },
    prediction: {
      question: "Which part of your page will this code control?",
      options: ["Your favorites list", "The page theme", "The image size"],
      answerIndex: 0,
      positiveFeedback: "That fits — now edit the list and watch it update.",
      neutralFeedback: "Make one list change and see what part updates.",
    },
    showEditor: true,
  },
  {
    id: "image",
    order: 5,
    shortTitle: "Image",
    sidebarCopy: "Choose a picture style.",
    kicker: "Images",
    title: "Pick an image",
    body:
      "Choose one of the ready-made images below. The <img> tag in your code is what tells the page which picture to show.",
    hint: "You can swap images as many times as you want.",
    editorFocus: {
      label: "The <img> tag",
      matchText: "<img",
      helperText:
        "This line controls the picture on your page. The <img> tag shows a picture on a webpage.",
    },
    showEditor: true,
    showImagePicker: true,
  },
  {
    id: "theme",
    order: 6,
    shortTitle: "Theme",
    sidebarCopy: "Choose a visual mood.",
    kicker: "Style mood",
    title: "Pick a theme",
    body:
      "Your HTML stays the same, but the page can still feel totally different. Pick a theme that matches your energy.",
    hint: "This changes colors and styling only. Your content stays yours.",
    editorFocus: {
      label: "Your whole page",
    },
    prediction: {
      question: "What will a theme change?",
      options: ["Only the look", "The words on the page", "The list items"],
      answerIndex: 0,
      positiveFeedback: "Exactly — now try a few and compare the mood.",
      neutralFeedback: "Pick a theme and notice what changes versus what stays the same.",
    },
    showEditor: true,
    showThemePicker: true,
  },
  {
    id: "final-touches",
    order: 7,
    shortTitle: "Improve",
    sidebarCopy: "Polish a few details.",
    kicker: "Improve your page",
    title: "Final Touches: Improve Your Page",
    body:
      "Use this step like a mini polish pass. Pick a few small improvements from the checklist, then make your page sound even more like you.",
    hint: "You do not need huge changes. One or two thoughtful edits is enough.",
    editorFocus: {
      label: "Anything you want to improve",
    },
    checklist: [
      "Make one sentence more specific",
      "Add one more favorite",
      "Check that your heading sounds like you",
    ],
    showEditor: true,
  },
  {
    id: "finish",
    order: 8,
    shortTitle: "Finish",
    sidebarCopy: "Celebrate your project.",
    kicker: "You did it",
    title: "Finish and celebrate",
    body:
      "You built a real webpage from code. Take a look at what you made, then open the celebration screen to see your finished project.",
    hint: "If you want, go back one step first and make one more tiny improvement.",
    editorFocus: {
      label: "Your finished page",
    },
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
];

export const allAboutMeImageOptions: ImageOption[] = [
  {
    id: "spark",
    name: "Spark Portrait",
    description: "A bright creative portrait with sketchbook energy.",
    alt: "A stylized bright portrait illustration",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#ffca70"/>
            <stop offset="1" stop-color="#ff7c8f"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="110" cy="92" r="42" fill="#fff1d8"/>
        <path d="M70 188c18-40 58-54 98-54s71 13 89 54" fill="#fff1d8"/>
        <path d="M84 80c11-31 52-44 79-21 14 12 20 26 17 46-11-8-20-11-38-11-22 0-39 6-58 17-8-9-8-18 0-31z" fill="#61354e"/>
        <circle cx="220" cy="54" r="18" fill="#fff2b2" opacity=".7"/>
        <circle cx="250" cy="88" r="9" fill="#8ef0e0" opacity=".8"/>
      </svg>
    `),
  },
  {
    id: "wave",
    name: "Ocean Explorer",
    description: "A cool portrait with calm blue shapes and waves.",
    alt: "A stylized ocean-themed portrait illustration",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#87ddff"/>
            <stop offset="1" stop-color="#4ca7df"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="158" cy="86" r="40" fill="#f9e8d1"/>
        <path d="M97 186c15-36 51-54 90-54s77 15 96 54" fill="#f9e8d1"/>
        <path d="M116 73c8-26 36-42 62-36 22 5 42 29 36 62-20-13-38-18-58-18-14 0-27 2-44 9-5-5-4-11 4-17z" fill="#174d68"/>
        <path d="M0 175c31-13 59-13 90 0s59 13 90 0 59-13 90 0 59 13 90 0v65H0z" fill="#e6fbff" opacity=".65"/>
      </svg>
    `),
  },
  {
    id: "cosmic",
    name: "Cosmic Dreamer",
    description: "A bold portrait with stars, glow, and space vibes.",
    alt: "A stylized cosmic portrait illustration",
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#18133a"/>
            <stop offset="1" stop-color="#6947d4"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="36" fill="url(#bg)"/>
        <circle cx="160" cy="93" r="42" fill="#ffe8d0"/>
        <path d="M101 186c18-38 56-54 93-54 38 0 73 15 94 54" fill="#ffe8d0"/>
        <path d="M117 76c8-26 30-42 56-42 28 0 47 14 57 38 5 11 6 21 2 33-18-13-39-20-70-20-19 0-36 4-50 12-5-7-3-14 5-21z" fill="#0d0a25"/>
        <circle cx="72" cy="56" r="2.5" fill="#fff"/>
        <circle cx="90" cy="38" r="1.8" fill="#fff"/>
        <circle cx="256" cy="54" r="2.5" fill="#fff"/>
        <circle cx="230" cy="35" r="1.8" fill="#fff"/>
        <circle cx="245" cy="94" r="8" fill="#ff7cc3" opacity=".55"/>
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
  editorLanguage: "html",
  editorBadgeLabel: "Starter HTML",
  starterCode: allAboutMeStarterCode,
  steps: allAboutMeLessonSteps,
  sidebar: {
    eyebrow: "Beginner project",
    title: "All About Me Page",
    description:
      "Build a real mini website with your own title, favorite things, image, and a style that fits your vibe.",
  },
  introCard: {
    title: "Project goal",
    body:
      "By the end, your page will include a heading, intro, image, and favorites list, all styled with the theme you choose.",
    pills: ["Real HTML", "Live preview", "Creative themes"],
  },
  finish: {
    eyebrow: "Project complete",
    title: "You built a real webpage.",
    body:
      "You used real HTML to add a heading, paragraph, list, image, and your own style. That means you didn't just click around a template. You coded it.",
    learnedBadges: [
      "Learned: headings",
      "Learned: paragraphs",
      "Learned: lists",
      "Learned: images",
    ],
  },
  defaultThemeId: "ocean",
  themeOptions: allAboutMeThemeOptions,
  defaultImageId: "spark",
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

        .favorites {
          margin-top: 22px;
          padding: 20px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.36);
        }
      `,
    }),
  onSelectImage: updateImageTagInCode,
};
