"use client";

import { useActionState } from "react";

import { joinStudentClassAction, type JoinStudentActionState } from "@/app/join/actions";

type JoinFormStudent = {
  id: string;
  displayName: string;
};

type JoinFormProps = {
  classCode: string;
  className: string;
  students: JoinFormStudent[];
};

const initialState: JoinStudentActionState = {};

export function JoinForm({ classCode, className, students }: JoinFormProps) {
  const joinAction = joinStudentClassAction.bind(null, classCode);
  const [state, formAction, isPending] = useActionState(joinAction, initialState);

  return (
    <div className="glass-card teacher-panel student-join-panel">
      <strong>Join {className}</strong>
      <p className="muted teacher-panel-copy">
        Pick your name, then enter your 6-digit PIN to continue.
      </p>

      <form action={formAction} className="teacher-auth-form">
        <label className="teacher-auth-field">
          <span>Your name</span>
          <select name="studentId" defaultValue="" required className="teacher-input">
            <option value="" disabled>
              Select your profile
            </option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="teacher-auth-field">
          <span>PIN</span>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            className="teacher-input"
          />
        </label>

        {state.error ? <p className="feedback-gate-note teacher-inline-note">{state.error}</p> : null}

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Joining..." : "Join class"}
        </button>
      </form>
    </div>
  );
}
