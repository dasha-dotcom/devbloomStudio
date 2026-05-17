"use client";

import { useEffect, useRef, useState } from "react";

import type { LessonOnboardingTourStep } from "@/lib/projects";

type LessonTourProps = {
  isOpen: boolean;
  steps: LessonOnboardingTourStep[];
  onSkip: () => void;
  onFinish: () => void;
};

type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const HIGHLIGHT_PADDING = 14;
const VIEWPORT_PADDING = 20;
const DIALOG_WIDTH = 320;
const DIALOG_GAP = 16;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const getTargetSelector = (targetId: string) => `[data-tour-id="${targetId}"]`;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches ? "auto" : "smooth";

export function LessonTour({ isOpen, steps, onSkip, onFinish }: LessonTourProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const [dialogStyle, setDialogStyle] = useState<
    | {
        top: number;
        left: number;
        maxHeight: number;
      }
    | undefined
  >(undefined);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const activeStep = steps[activeStepIndex];

  useEffect(() => {
    if (!isOpen || !activeStep) {
      return;
    }

    const target = document.querySelector<HTMLElement>(getTargetSelector(activeStep.targetId));

    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const viewportTop = VIEWPORT_PADDING * 2;
    const viewportBottom = window.innerHeight - VIEWPORT_PADDING * 2;
    const isTargetVisible = rect.top >= viewportTop && rect.bottom <= viewportBottom;

    if (isTargetVisible) {
      return;
    }

    target.scrollIntoView({
      behavior: getScrollBehavior(),
      block:
        rect.height > window.innerHeight - VIEWPORT_PADDING * 4
          ? "start"
          : "center",
      inline: "nearest",
    });
  }, [activeStep, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeStep) {
      return;
    }

    const updateTargetRect = () => {
      const target = document.querySelector<HTMLElement>(getTargetSelector(activeStep.targetId));

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: Math.max(VIEWPORT_PADDING, rect.top - HIGHLIGHT_PADDING),
        left: Math.max(VIEWPORT_PADDING, rect.left - HIGHLIGHT_PADDING),
        width: rect.width + HIGHLIGHT_PADDING * 2,
        height: rect.height + HIGHLIGHT_PADDING * 2,
      });
    };

    const frameId = window.requestAnimationFrame(updateTargetRect);
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [activeStep, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.focus();
  }, [activeStepIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || activeElement === dialog) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onSkip]);

  useEffect(() => {
    if (!isOpen || !targetRect) {
      return;
    }

    const updateDialogStyle = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const measuredDialogHeight = dialogRef.current?.offsetHeight ?? 260;
      const availableHeight = Math.max(180, viewportHeight - VIEWPORT_PADDING * 2);
      const nextLeft = clamp(
        targetRect.left,
        VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, viewportWidth - DIALOG_WIDTH - VIEWPORT_PADDING),
      );
      const spaceBelow = viewportHeight - (targetRect.top + targetRect.height) - VIEWPORT_PADDING;
      const spaceAbove = targetRect.top - VIEWPORT_PADDING;

      let nextTop = targetRect.top + targetRect.height + DIALOG_GAP;

      if (spaceBelow < measuredDialogHeight && spaceAbove >= measuredDialogHeight) {
        nextTop = targetRect.top - measuredDialogHeight - DIALOG_GAP;
      }

      nextTop = clamp(
        nextTop,
        VIEWPORT_PADDING,
        Math.max(
          VIEWPORT_PADDING,
          viewportHeight - Math.min(measuredDialogHeight, availableHeight) - VIEWPORT_PADDING,
        ),
      );

      setDialogStyle({
        top: nextTop,
        left: nextLeft,
        maxHeight: availableHeight,
      });
    };

    const frameId = window.requestAnimationFrame(updateDialogStyle);
    window.addEventListener("resize", updateDialogStyle);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateDialogStyle);
    };
  }, [isOpen, targetRect]);

  if (!isOpen || !activeStep) {
    return null;
  }

  const isLastStep = activeStepIndex === steps.length - 1;

  return (
    <div className="lesson-tour-root" aria-hidden={false}>
      {targetRect ? (
        <>
          <div
            className="lesson-tour-overlay lesson-tour-overlay-top"
            style={{
              top: 0,
              left: 0,
              width: "100vw",
              height: targetRect.top,
            }}
          />
          <div
            className="lesson-tour-overlay lesson-tour-overlay-left"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div
            className="lesson-tour-overlay lesson-tour-overlay-right"
            style={{
              top: targetRect.top,
              left: targetRect.left + targetRect.width,
              width: `calc(100vw - ${targetRect.left + targetRect.width}px)`,
              height: targetRect.height,
            }}
          />
          <div
            className="lesson-tour-overlay lesson-tour-overlay-bottom"
            style={{
              top: targetRect.top + targetRect.height,
              left: 0,
              width: "100vw",
              height: `calc(100vh - ${targetRect.top + targetRect.height}px)`,
            }}
          />
        </>
      ) : (
        <div className="lesson-tour-overlay lesson-tour-overlay-full" />
      )}
      {targetRect ? (
        <div
          className="lesson-tour-highlight"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={dialogRef}
        className={`lesson-tour-dialog${targetRect ? " is-anchored" : " is-centered"}`}
        style={targetRect ? dialogStyle : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-tour-title"
        aria-describedby="lesson-tour-body"
        tabIndex={-1}
      >
        <div className="lesson-tour-kicker">
          Guided tour {activeStepIndex + 1} of {steps.length}
        </div>
        <h2 id="lesson-tour-title" className="lesson-tour-title">
          {activeStep.title}
        </h2>
        <p id="lesson-tour-body" className="lesson-tour-body">
          {activeStep.body}
        </p>

        <div className="lesson-tour-footer">
          <button
            type="button"
            className="button-ghost lesson-tour-skip"
            onClick={onSkip}
          >
            Skip
          </button>

          <div className="lesson-tour-actions">
            <button
              type="button"
              className="button-ghost"
              onClick={() => setActiveStepIndex((current) => Math.max(0, current - 1))}
              disabled={activeStepIndex === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                if (isLastStep) {
                  onFinish();
                  return;
                }

                setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1));
              }}
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
