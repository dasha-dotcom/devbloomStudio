import type { ImageOption, ThemeOption } from "@/lib/projects";

export type PreviewDocumentConfig = {
  mode: "html" | "css" | "javascript";
  code: string;
  themeId?: string;
  imageId?: string;
  themeOptions?: ThemeOption[];
  imageOptions?: ImageOption[];
  scaffoldHtml?: string;
  baseCss?: string;
  baseScript?: string;
};

const DEFAULT_BASE_CSS = `
  * {
    box-sizing: border-box;
  }

  html, body {
    min-height: 100%;
  }
`;

const resolveImageSources = (
  html: string,
  imageOptions: ImageOption[],
  selectedImageId: string | undefined,
) => {
  const fallbackImage = imageOptions[0];

  if (!fallbackImage) {
    return html;
  }

  return html
    .replace(/src="image:([^"]+)"/g, (_match, imageId: string) => {
      const image = imageOptions.find((item) => item.id === imageId) ?? fallbackImage;

      return `src="${image.src}"`;
    })
    .replaceAll(
      "__IMAGE__",
      (imageOptions.find((item) => item.id === selectedImageId) ?? fallbackImage).src,
    );
};

const buildThemeVariables = (themeId: string | undefined, themeOptions: ThemeOption[]) => {
  const fallbackTheme = themeOptions[0];
  const theme = themeOptions.find((item) => item.id === themeId) ?? fallbackTheme;

  if (!theme) {
    return "";
  }

  return Object.entries(theme.cssVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");
};

const buildPreviewFromConfig = ({
  mode,
  code,
  themeId,
  imageId,
  themeOptions = [],
  imageOptions = [],
  scaffoldHtml = "",
  baseCss = "",
  baseScript = "",
}: PreviewDocumentConfig) => {
  const bodyHtml = resolveImageSources(
    mode === "html" ? code : scaffoldHtml,
    imageOptions,
    imageId,
  );
  const learnerCss = mode === "css" ? code : "";
  const learnerScript = mode === "javascript" ? code : "";
  const cssVars = buildThemeVariables(themeId, themeOptions);
  const scriptTag =
    baseScript || learnerScript
      ? `
    <script>
      ${baseScript}
      ${learnerScript}
    </script>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        ${cssVars}
      }

      ${DEFAULT_BASE_CSS}

      ${baseCss}

      ${learnerCss}
    </style>
  </head>
  <body>
    ${bodyHtml}
    ${scriptTag}
  </body>
</html>`;
};

export function buildPreviewDocument(config: PreviewDocumentConfig): string {
  return buildPreviewFromConfig(config);
}
