"use client";

import { useActionState } from "react";

import {
  createStudentProfileAction,
  type CreateStudentProfileActionState,
} from "@/app/teacher/actions";

type CreateStudentFormProps = {
  classId: string;
};

const initialState: CreateStudentProfileActionState = {};

export function CreateStudentForm({ classId }: CreateStudentFormProps) {
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
        {state.createdStudentPin ? (
          <div className="teacher-pin-card">
            <strong>{state.createdStudentName}</strong>
            <p className="muted teacher-panel-copy">Show this PIN to the student now. It will not be shown again.</p>
            <code className="teacher-pin-value">{state.createdStudentPin}</code>
          </div>
        ) : null}

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Creating..." : "Create student"}
        </button>
      </form>
    </div>
  );
}
