"use client";

import { useActionState } from "react";

import { createClassAction, type CreateClassActionState } from "@/app/teacher/actions";

const initialState: CreateClassActionState = {};

export function CreateClassForm() {
  const [state, formAction, isPending] = useActionState(createClassAction, initialState);

  return (
    <div className="glass-card teacher-panel">
      <strong>Create a class</strong>
      <p className="muted teacher-panel-copy">Give your class a short name. A join code will be generated automatically.</p>

      <form action={formAction} className="teacher-auth-form">
        <label className="teacher-auth-field">
          <span>Class name</span>
          <input type="text" name="name" maxLength={80} required className="teacher-input" />
        </label>

        {state.error ? <p className="feedback-gate-note teacher-inline-note">{state.error}</p> : null}
        {state.success ? <p className="teacher-success-note teacher-inline-note">{state.success}</p> : null}

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Creating..." : "Create class"}
        </button>
      </form>
    </div>
  );
}
