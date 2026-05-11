import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

const buildDb = (client: ReturnType<typeof postgres>) =>
  drizzle({
    client,
    schema,
  });

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof buildDb>;
};

export function getDb() {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client =
    globalForDb.postgresClient ??
    postgres(connectionString, {
      prepare: false,
    });

  const db = buildDb(client);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgresClient = client;
    globalForDb.drizzleDb = db;
  }

  return db;
}
