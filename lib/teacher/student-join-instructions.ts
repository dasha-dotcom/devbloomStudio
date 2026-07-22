export type StudentJoinInstructions = {
  origin: string;
  classCode: string;
  studentName: string;
  pin: string;
};

export function getStudentJoinUrl(origin: string, classCode: string) {
  return new URL(`/join/${encodeURIComponent(classCode)}`, origin).toString();
}

export function buildStudentJoinInstructions({
  origin,
  classCode,
  studentName,
  pin,
}: StudentJoinInstructions) {
  return [
    "Join your DevBloom Studio class",
    `Open: ${getStudentJoinUrl(origin, classCode)}`,
    `Class code: ${classCode}`,
    `Student name: ${studentName}`,
    `PIN: ${pin}`,
    "",
    "Keep this PIN private. It will not be shown to your teacher again.",
  ].join("\n");
}
