"use client";

import { useActionState, useState } from "react";

import {
  createStudentProfileAction,
  type CreateStudentProfileActionState,
} from "@/app/teacher/actions";
import { buildStudentJoinInstructions } from "@/lib/teacher/student-join-instructions";

type CreateStudentFormProps = {
  classId: string;
  classCode: string;
};

const initialState: CreateStudentProfileActionState = {};

type CopyStatus = "idle" | "copied" | "manual";

type StudentPinCardProps = {
  classCode: string;
  studentName: string;
  pin: string;
};

function StudentPinCard({ classCode, studentName, pin }: StudentPinCardProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [manualInstructions, setManualInstructions] = useState("");

  const copyWithBrowserFallback = (instructions: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = instructions;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  };

  const copyInstructions = async () => {
    const instructions = buildStudentJoinInstructions({
      origin: window.location.origin,
      classCode,
      studentName,
      pin,
    });

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(instructions);
      setCopyStatus("copied");
    } catch {
      if (copyWithBrowserFallback(instructions)) {
        setCopyStatus("copied");
        return;
      }

      setManualInstructions(instructions);
      setCopyStatus("manual");
    }
  };

  return (
    <div className="teacher-pin-card">
      <div className="teacher-pin-card-heading">
        <div>
          <strong>{studentName}</strong>
          <p className="muted teacher-panel-copy">
            Copy these private sign-in details now. The PIN will not be shown again.
          </p>
        </div>
        <code className="teacher-pin-value">{pin}</code>
      </div>

      <button
        type="button"
        className="button-ghost teacher-copy-button"
        onClick={copyInstructions}
      >
        {copyStatus === "copied" ? "Instructions copied" : "Copy student instructions"}
      </button>

      {copyStatus === "manual" ? (
        <textarea
          ref={(element) => {
            element?.focus();
            element?.select();
          }}
          className="teacher-copy-fallback"
          aria-label={`Sign-in instructions for ${studentName}`}
          value={manualInstructions}
          readOnly
        />
      ) : null}

      <p
        className={`teacher-copy-status${copyStatus === "manual" ? " teacher-copy-status-error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {copyStatus === "copied"
          ? "Copied. Send the instructions privately to the student."
          : copyStatus === "manual"
            ? "Automatic copy is unavailable. The instructions are selected so you can copy them manually."
            : "Includes the join link, class code, student name, and PIN."}
      </p>
    </div>
  );
}

export function CreateStudentForm({ classId, classCode }: CreateStudentFormProps) {
  const createStudentForClass = createStudentProfileAction.bind(null, classId);
  const [state, formAction, isPending] = useActionState(createStudentForClass, initialState);

  return (
    <div className="glass-card teacher-panel">
      <strong>Add a student</strong>
      <p className="muted teacher-panel-copy">
        Enter a display name. Leave the PIN blank to generate a 6-digit code automatically.
      </p>

      <form action={formAction} className="teacher-auth-form">
        <label className="teacher-auth-field">
          <span>Student name</span>
          <input type="text" name="displayName" maxLength={80} required className="teacher-input" />
        </label>

        <label className="teacher-auth-field">
          <span>PIN (optional)</span>
          <input type="text" name="pin" inputMode="numeric" pattern="\d{6}" className="teacher-input" />
        </label>

        {state.error ? <p className="feedback-gate-note teacher-inline-note">{state.error}</p> : null}
        {state.success ? <p className="teacher-success-note teacher-inline-note">{state.success}</p> : null}
        {state.createdStudentName && state.createdStudentPin ? (
          <StudentPinCard
            key={`${state.createdStudentName}:${state.createdStudentPin}`}
            classCode={classCode}
            studentName={state.createdStudentName}
            pin={state.createdStudentPin}
          />
        ) : null}

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Creating..." : "Create student"}
        </button>
      </form>
    </div>
  );
}
