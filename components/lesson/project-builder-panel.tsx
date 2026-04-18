import type { BuilderSelections, LessonBuilderConfig } from "@/lib/projects";

type ProjectBuilderPanelProps = {
  builder: LessonBuilderConfig;
  selections: BuilderSelections;
  onSelect: (questionId: string, optionId: string) => void;
};

export function ProjectBuilderPanel({
  builder,
  selections,
  onSelect,
}: ProjectBuilderPanelProps) {
  return (
    <section className="step-panel project-builder-panel">
      <div className="builder-header">
        <strong>{builder.title}</strong>
        <p className="muted">{builder.body}</p>
      </div>

      <div className="builder-groups">
        {builder.questions.map((question) => (
          <div key={question.id} className="builder-group">
            <div className="builder-copy">
              <span className="eyebrow">Pick one</span>
              <h3>{question.title}</h3>
              <p className="muted">{question.body}</p>
            </div>

            <div className="builder-option-grid">
              {question.options.map((option) => {
                const isSelected = selections[question.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`builder-option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelect(question.id, option.id)}
                    style={{
                      ["--builder-accent" as string]: option.accentColor ?? "#6ecbff",
                      ["--builder-gradient" as string]:
                        option.previewGradient ??
                        "linear-gradient(135deg, rgba(110, 203, 255, 0.2), rgba(255, 217, 129, 0.32))",
                    }}
                  >
                    <div className="builder-option-preview" aria-hidden>
                      <span>{option.emoji ?? "✦"}</span>
                    </div>
                    <div className="builder-option-copy">
                      <strong>{option.label}</strong>
                      <p>{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
