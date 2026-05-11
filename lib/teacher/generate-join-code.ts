import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6) {
  return Array.from({ length }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join("");
}
