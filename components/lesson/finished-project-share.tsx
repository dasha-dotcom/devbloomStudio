"use client";

import { useMemo, useState } from "react";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  buildFinishedProjectInvitation,
  canCreateFinishedProjectInvitation,
} from "@/lib/sharing/finished-project-invitation";

type FinishedProjectShareProps = {
  projectSlug: string;
  projectTitle: string;
};

type CopyState = "idle" | "copied" | "error";

export function FinishedProjectShare({ projectSlug, projectTitle }: FinishedProjectShareProps) {
  const [isAdultStepOpen, setIsAdultStepOpen] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [isInvitationCreated, setIsInvitationCreated] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const invitation = useMemo(() => {
    if (!isInvitationCreated || typeof window === "undefined") {
      return null;
    }

    return buildFinishedProjectInvitation({
      origin: window.location.origin,
      projectSlug,
      projectTitle,
    });
  }, [isInvitationCreated, projectSlug, projectTitle]);

  const createInvitation = () => {
    if (!canCreateFinishedProjectInvitation(isAdultConfirmed)) {
      return;
    }

    setIsInvitationCreated(true);
    setCopyState("idle");
  };

  const copyInvitation = async () => {
    if (!invitation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invitation.message);
      setCopyState("copied");
      captureAnalyticsEvent("project_invitation_copied", {
        project_slug: projectSlug,
        invitation_source: "finished_project",
      });
    } catch {
      setCopyState("error");
    }
  };

  return (
    <section className="finish-share-card" aria-labelledby="finish-share-title">
      <div className="finish-share-heading">
        <div>
          <span className="finish-share-kicker">Share with care</span>
          <h2 id="finish-share-title">Invite someone to try this project</h2>
          <p>
            A parent or teacher can create an invitation to the same public lesson. Your code,
            notebook, class details, and account information stay private.
          </p>
        </div>
        <span className="finish-share-lock" aria-hidden="true">Private by default</span>
      </div>

      {!isAdultStepOpen ? (
        <button
          type="button"
          className="button finish-share-primary"
          onClick={() => setIsAdultStepOpen(true)}
        >
          Ask an adult to share
        </button>
      ) : null}

      {isAdultStepOpen && !isInvitationCreated ? (
        <div className="finish-share-consent">
          <strong>For a parent or teacher</strong>
          <label className="finish-share-checkbox">
            <input
              type="checkbox"
              checked={isAdultConfirmed}
              onChange={(event) => setIsAdultConfirmed(event.target.checked)}
            />
            <span>I am a parent or teacher, and I choose to create this invitation.</span>
          </label>
          <button
            type="button"
            className="button finish-share-primary"
            disabled={!canCreateFinishedProjectInvitation(isAdultConfirmed)}
            onClick={createInvitation}
          >
            Create invitation
          </button>
        </div>
      ) : null}

      {invitation ? (
        <div className="finish-share-invitation">
          <div className="finish-share-boundary">
            <p><strong>Included:</strong> project name and public lesson link</p>
            <p><strong>Not included:</strong> code, reflections, name, class, PIN, or account details</p>
          </div>
          <label className="finish-share-message-label" htmlFor="finish-share-message">
            Invitation preview
          </label>
          <textarea
            id="finish-share-message"
            className="finish-share-message"
            value={invitation.message}
            readOnly
            rows={4}
          />
          <button type="button" className="button finish-share-primary" onClick={() => void copyInvitation()}>
            {copyState === "copied" ? "Invitation copied" : "Copy invitation"}
          </button>
          <p className={`finish-share-status finish-share-status-${copyState}`} aria-live="polite">
            {copyState === "copied"
              ? "The adult can now paste the invitation into a message they choose."
              : copyState === "error"
                ? "Copy did not work. Select the invitation text and copy it manually."
                : "Nothing is sent automatically."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
