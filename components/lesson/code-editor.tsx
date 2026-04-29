"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type * as Monaco from "monaco-editor";

import type { LessonStep } from "@/lib/projects";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type CodeEditorProps = {
  stepId: string;
  value: string;
  onChange: (value: string) => void;
  focus: LessonStep["editorFocus"];
  actions?: ReactNode;
  height?: string;
  language?: string;
  badgeLabel?: string;
  readOnly?: boolean;
};

const getFocusRange = (value: string, matchText?: string) => {
  if (!matchText) {
    return null;
  }

  const matchIndex = value.indexOf(matchText);

  if (matchIndex === -1) {
    return null;
  }

  const startLine = value.slice(0, matchIndex).split("\n").length;
  const matchLineCount = matchText.split("\n").length;

  return {
    startLine,
    endLine: startLine + matchLineCount - 1,
  };
};

export function CodeEditor({
  stepId,
  value,
  onChange,
  focus,
  actions,
  height = "430px",
  language = "html",
  badgeLabel = "Starter HTML",
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const focusRangeRef = useRef<ReturnType<typeof getFocusRange>>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const focusRange = getFocusRange(value, focus.matchText);
    focusRangeRef.current = focusRange;

    if (!focusRange) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
      return;
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: new monaco.Range(focusRange.startLine, 1, focusRange.endLine, 1),
        options: {
          isWholeLine: true,
          className: "editor-line-focus",
          linesDecorationsClassName: "editor-line-focus-gutter",
        },
      },
    ]);
  }, [focus, value]);

  useEffect(() => {
    const editor = editorRef.current;
    const focusRange = focusRangeRef.current;

    if (!editor || !focusRange) {
      return;
    }

    editor.revealLineInCenter(focusRange.startLine);
  }, [stepId]);

  return (
    <div className="editor-frame">
      <div className="editor-topbar">
        <div className="editor-meta">
          <span className="editor-badge">{badgeLabel}</span>
          <span className="editor-focus">Focus: {focus.label}</span>
        </div>
        {actions ? <div className="pane-actions">{actions}</div> : null}
      </div>
      {focus.helperText ? <div className="editor-helper">{focus.helperText}</div> : null}
      <MonacoEditor
        language={language}
        height={height}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
        theme="vs-dark"
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 18, bottom: 18 },
          contextmenu: false,
          roundedSelection: true,
          automaticLayout: true,
          smoothScrolling: true,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          readOnly,
        }}
      />
    </div>
  );
}
