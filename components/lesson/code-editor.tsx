"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode } from "react";
import type * as Monaco from "monaco-editor";

import { getTopActiveEditorError } from "@/lib/editor-errors/get-active-errors";
import type { ActiveEditorError } from "@/lib/editor-errors/types";
import type { LessonStep } from "@/lib/projects";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type CodeEditorProps = {
  stepId: string;
  modelKey: string;
  value: string;
  onChange: (value: string) => void;
  focus: LessonStep["editorFocus"];
  onActiveErrorChange?: (error: ActiveEditorError | null) => void;
  actions?: ReactNode;
  height?: string;
  language?: string;
  badgeLabel?: string;
  readOnly?: boolean;
};

export type CodeEditorHandle = {
  revealLine: (lineNumber: number) => void;
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

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({
  stepId,
  modelKey,
  value,
  onChange,
  focus,
  onActiveErrorChange,
  actions,
  height = "430px",
  language = "html",
  badgeLabel = "Starter HTML",
  readOnly = false,
}, ref) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const focusDecorationIdsRef = useRef<string[]>([]);
  const helperDecorationIdsRef = useRef<string[]>([]);
  const helperDecorationTimerRef = useRef<number | null>(null);
  const focusRangeRef = useRef<ReturnType<typeof getFocusRange>>(null);
  const modelPath = `file:///devbloom/${modelKey}.${language}`;
  const [editorReadyVersion, setEditorReadyVersion] = useState(0);

  const clearHelperHighlight = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    helperDecorationIdsRef.current = editor.deltaDecorations(helperDecorationIdsRef.current, []);

    if (helperDecorationTimerRef.current) {
      window.clearTimeout(helperDecorationTimerRef.current);
      helperDecorationTimerRef.current = null;
    }
  };

  const revealLine = (lineNumber: number) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    editor.focus();
    editor.setPosition({ lineNumber, column: 1 });
    editor.revealLineInCenter(lineNumber);
    clearHelperHighlight();
    helperDecorationIdsRef.current = editor.deltaDecorations(helperDecorationIdsRef.current, [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: "editor-line-helper-highlight",
          linesDecorationsClassName: "editor-line-helper-gutter",
        },
      },
    ]);
    helperDecorationTimerRef.current = window.setTimeout(() => {
      clearHelperHighlight();
    }, 1800);
  };

  useImperativeHandle(ref, () => ({
    revealLine,
  }));

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const focusRange = getFocusRange(value, focus.matchText);
    focusRangeRef.current = focusRange;

    if (!focusRange) {
      focusDecorationIdsRef.current = editor.deltaDecorations(focusDecorationIdsRef.current, []);
      return;
    }

    focusDecorationIdsRef.current = editor.deltaDecorations(focusDecorationIdsRef.current, [
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

  useEffect(() => {
    onActiveErrorChange?.(null);
    clearHelperHighlight();
  }, [modelKey, onActiveErrorChange]);

  useEffect(() => {
    if (!editorReadyVersion) {
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (!editor || !monaco || !model) {
      return;
    }

    const reportActiveError = () => {
      const activeModel = editor.getModel();

      if (!activeModel) {
        onActiveErrorChange?.(null);
        return;
      }

      onActiveErrorChange?.(getTopActiveEditorError(monaco, activeModel, modelKey));
    };

    reportActiveError();

    const markerSubscription = monaco.editor.onDidChangeMarkers((resources) => {
      if (resources.some((resource) => resource.toString() === model.uri.toString())) {
        reportActiveError();
      }
    });

    return () => {
      markerSubscription.dispose();
    };
  }, [editorReadyVersion, modelKey, onActiveErrorChange]);

  useEffect(() => () => {
    clearHelperHighlight();
    onActiveErrorChange?.(null);
  }, [onActiveErrorChange]);

  return (
    <div className="editor-frame" data-tour-id="lesson-editor">
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
        path={modelPath}
        height={height}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
          setEditorReadyVersion((current) => current + 1);
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
});

CodeEditor.displayName = "CodeEditor";
