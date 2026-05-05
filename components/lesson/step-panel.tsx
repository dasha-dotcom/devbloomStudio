import { PredictionCard } from "@/components/lesson/prediction-card";
import { StepChecklist } from "@/components/lesson/step-checklist";
import { TipBox } from "@/components/lesson/tip-box";
import type { LessonStep } from "@/lib/projects";

type StepPanelProps = {
  step: LessonStep;
  predictionAnswer: number | null;
  onPredictionAnswer: (index: number) => void;
};

export function StepPanel({ step, predictionAnswer, onPredictionAnswer }: StepPanelProps) {
  return (
    <section className="step-panel">
      <div className="step-kicker">
        Step {step.order} · {step.kicker}
      </div>
      <h2 className="step-title">{step.title}</h2>
      <p className="step-body">{step.body}</p>
      <TipBox tip={step.tip} />
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
