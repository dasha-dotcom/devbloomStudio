export const STUDENT_SESSION_COOKIE_NAME = "devbloom_student_session";
export const STUDENT_SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

export function getStudentSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    expires: expiresAt,
  };
}
