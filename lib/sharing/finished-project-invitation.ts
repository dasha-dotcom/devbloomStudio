export const FINISHED_PROJECT_INVITE_SOURCE = "finished_project";

type FinishedProjectInvitationInput = {
  origin: string;
  projectSlug: string;
  projectTitle: string;
};

export type FinishedProjectInvitation = {
  message: string;
  url: string;
};

export const canCreateFinishedProjectInvitation = (adultConfirmed: boolean) => adultConfirmed === true;

export function buildFinishedProjectInvitation({
  origin,
  projectSlug,
  projectTitle,
}: FinishedProjectInvitationInput): FinishedProjectInvitation {
  const publicOrigin = new URL("/", origin).origin;
  const invitationUrl = new URL(`/projects/${encodeURIComponent(projectSlug)}`, publicOrigin);
  invitationUrl.searchParams.set("invite", FINISHED_PROJECT_INVITE_SOURCE);

  const safeProjectTitle = projectTitle.trim() || "a coding project";
  const url = invitationUrl.toString();

  return {
    url,
    message: `I finished ${safeProjectTitle} in DevBloom Studio. A parent or teacher invited you to try the same free coding project: ${url}`,
  };
}

export function isFinishedProjectInvitation(search: string): boolean {
  return new URLSearchParams(search).get("invite") === FINISHED_PROJECT_INVITE_SOURCE;
}
