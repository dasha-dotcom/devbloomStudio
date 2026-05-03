"use client";

import { Fragment, type ReactNode, useState } from "react";

type TipProps = {
  title?: string;
  short: string;
  long?: string;
};

type TipBoxProps = {
  tip?: TipProps;
};

function renderInlineText(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-yellow-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-yellow-100 px-1 py-0.5 font-mono text-[0.85em] text-yellow-900"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function TipBox({ tip }: TipBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasContent = Boolean(tip?.short || tip?.long);
  const shortContent = tip?.short ? renderInlineText(tip.short) : null;
  const longContent = tip?.long ? renderInlineText(tip.long) : null;

  if (!tip) return null;

  return (
    <div className="tip-box bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      {tip.title && (
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">{tip.title}</h4>
      )}
      {hasContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-yellow-600 hover:text-yellow-800 underline focus:outline-none focus:ring-2 focus:ring-yellow-500"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse tip details" : "Expand tip details"}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
      {isExpanded && (
        <div className="mt-2">
          {tip.short && <p className="text-sm text-yellow-700 mb-2">{shortContent}</p>}
          {tip.long && <p className="text-sm text-yellow-700">{longContent}</p>}
        </div>
      )}
    </div>
  );
}
