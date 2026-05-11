import { randomInt, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PIN_PATTERN = /^\d{6}$/;

export const isValidStudentPin = (value: string) => PIN_PATTERN.test(value);

export const generateStudentPin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export async function hashStudentPin(pin: string) {
  if (!isValidStudentPin(pin)) {
    throw new Error("PIN must be exactly 6 digits.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(pin, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyStudentPin(pin: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(pin, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}
