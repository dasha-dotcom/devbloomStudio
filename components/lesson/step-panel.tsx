import { useEffect, useRef } from "react";

import { PredictionCard } from "@/components/lesson/prediction-card";
import { StepChecklist } from "@/components/lesson/step-checklist";
import { TipBox } from "@/components/lesson/tip-box";
import { hasSubstantiveReflection } from "@/lib/lesson-feedback";
import type { LessonStep } from "@/lib/projects";

type StepPanelProps = {
  step: LessonStep;
  predictionAnswer: number | null;
  onPredictionAnswer: (index: number) => void;
  textEntryValue: string;
  onTextEntryChange: (value: string) => void;
};

export function StepPanel({
  step,
  predictionAnswer,
  onPredictionAnswer,
  textEntryValue,
  onTextEntryChange,
}: StepPanelProps) {
  const textEntryInputRef = useRef<HTMLInputElement | null>(null);
  const isTextEntryFilled =
    step.textEntry?.passState === "substantiveReflection"
      ? hasSubstantiveReflection(textEntryValue)
      : textEntryValue.trim().length > 0;

  useEffect(() => {
    if (!step.textEntry?.autoFocus) {
      return;
    }

    const focusFrameId = window.requestAnimationFrame(() => {
      textEntryInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrameId);
  }, [step.id, step.textEntry?.autoFocus]);

  return (
    <section className="step-panel">
      <div data-tour-id="lesson-mission">
        <div className="step-kicker">
          Step {step.order} · {step.kicker}
        </div>
        <h2 className="step-title">{step.title}</h2>
        <p className="step-body">{step.body}</p>
      </div>
      <TipBox tip={step.tip} />
      {step.textEntry ? (
        <div className="step-text-entry">
          <label className="step-text-entry-label" htmlFor={`step-text-entry-${step.id}`}>
            {step.textEntry.label}
          </label>
          <input
            ref={textEntryInputRef}
            id={`step-text-entry-${step.id}`}
            type="text"
            className={`step-text-entry-input${isTextEntryFilled ? " filled" : ""}`}
            value={textEntryValue}
            onChange={(event) => onTextEntryChange(event.target.value)}
            placeholder={step.textEntry.placeholder ?? "Write your idea here."}
            maxLength={step.textEntry.maxLength}
          />
          {step.textEntry.note ? <p className="step-text-entry-note">{step.textEntry.note}</p> : null}
        </div>
      ) : null}
      {step.prediction ? (
        <PredictionCard
          key={step.id}
          prediction={step.prediction}
          selectedIndex={predictionAnswer}
          onSelect={onPredictionAnswer}
        />
      ) : null}
      {step.checklist ? <StepChecklist key={`${step.id}-checklist`} items={step.checklist} /> : null}
      {step.hint ? <div className="hint-box">Hint: {step.hint}</div> : null}
      {step.example ? <pre className="inline-example">{step.example}</pre> : null}
      {step.challenge ? (
        <div className="challenge-box">Optional challenge: {step.challenge}</div>
      ) : null}
    </section>
  );
}
