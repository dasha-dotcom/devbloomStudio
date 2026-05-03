import type * as Monaco from "monaco-editor";

export type EditorErrorCategory =
  | "missingSemicolon"
  | "missingColonOrDelimiter"
  | "unmatchedQuote"
  | "unmatchedBracket"
  | "unexpectedToken"
  | "unknownSyntaxIssue";

export type ActiveEditorError = {
  category: EditorErrorCategory;
  title: string;
  body: string;
  hint: string;
  lineNumber: number | null;
  startColumn: number | null;
  endLineNumber: number | null;
  endColumn: number | null;
  rawMessage: string;
  signature: string;
  marker: Monaco.editor.IMarkerData;
};
