import type * as Monaco from "monaco-editor";

import type { ActiveEditorError, EditorErrorCategory } from "@/lib/editor-errors/types";

const getCategoryFromMessage = (message: string): EditorErrorCategory => {
  const normalized = message.toLowerCase();

  if (normalized.includes("semicolon")) {
    return "missingSemicolon";
  }

  if (
    normalized.includes("unterminated string") ||
    normalized.includes("unterminated string literal") ||
    normalized.includes("unexpected eof") ||
    normalized.includes("unterminated template literal") ||
    normalized.includes("string literal") ||
    normalized.includes("quote")
  ) {
    return "unmatchedQuote";
  }

  if (
    normalized.includes("expected ':'") ||
    normalized.includes("colon expected") ||
    normalized.includes("property value expected") ||
    normalized.includes("identifier expected") ||
    normalized.includes("declaration expected") ||
    normalized.includes("expected declaration") ||
    normalized.includes("css") && normalized.includes("expected")
  ) {
    return "missingColonOrDelimiter";
  }

  if (
    normalized.includes("expected '}'") ||
    normalized.includes("expected ')'") ||
    normalized.includes("expected ']'") ||
    normalized.includes("'}' expected") ||
    normalized.includes("')' expected") ||
    normalized.includes("']' expected") ||
    normalized.includes("end of file expected")
  ) {
    return "unmatchedBracket";
  }

  if (
    normalized.includes("unexpected token") ||
    normalized.includes("expression expected") ||
    normalized.includes("parsing error")
  ) {
    return "unexpectedToken";
  }

  return "unknownSyntaxIssue";
};

const buildHint = (category: EditorErrorCategory) => {
  if (category === "missingSemicolon") {
    return "This line may be missing a semicolon at the end.";
  }

  if (category === "missingColonOrDelimiter") {
    return "This line may be missing a colon, semicolon, or another small punctuation mark.";
  }

  if (category === "unmatchedQuote") {
    return "A quote mark might be missing its match.";
  }

  if (category === "unmatchedBracket") {
    return "A bracket or curly brace may not be closed yet.";
  }

  if (category === "unexpectedToken") {
    return "Something on this line may not be written the way the browser expects. Check punctuation like quotes, commas, or brackets.";
  }

  return "Check punctuation like quotes, brackets, colons, or semicolons on this line.";
};

const buildBody = (lineNumber: number | null) => {
  if (lineNumber) {
    return `The page got stuck reading one of your lines. Try checking line ${lineNumber}.`;
  }

  return "The page got stuck reading part of your code. Try checking the line Monaco marked.";
};

export const normalizeEditorError = (
  marker: Monaco.editor.IMarkerData,
  modelKey: string,
): ActiveEditorError => {
  const category = getCategoryFromMessage(marker.message);
  const lineNumber = marker.startLineNumber ?? null;
  const startColumn = marker.startColumn ?? null;
  const endLineNumber = marker.endLineNumber ?? null;
  const endColumn = marker.endColumn ?? null;

  return {
    category,
    title: "Something is off in your code",
    body: buildBody(lineNumber),
    hint: buildHint(category),
    lineNumber,
    startColumn,
    endLineNumber,
    endColumn,
    rawMessage: marker.message,
    signature: [
      modelKey,
      category,
      lineNumber ?? "line",
      startColumn ?? "col",
      marker.message,
    ].join(":"),
    marker,
  };
};
