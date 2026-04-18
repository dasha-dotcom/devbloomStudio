"use client";

import { useState } from "react";

type StepChecklistProps = {
  items: string[];
};

export function StepChecklist({ items }: StepChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (item: string) => {
    setCheckedItems((current) => ({
      ...current,
      [item]: !current[item],
    }));
  };

  return (
    <div className="step-checklist-card">
      <div className="prediction-kicker">Try these edits</div>
      <strong className="prediction-question">Pick one or more tiny improvements.</strong>
      <div className="step-checklist">
        {items.map((item) => {
          const isChecked = Boolean(checkedItems[item]);

          return (
            <label
              key={item}
              className={`step-checklist-item ${isChecked ? "active" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleItem(item)}
              />
              <span>{item}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
