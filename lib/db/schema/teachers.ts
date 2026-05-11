import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supabaseAuthUserId: uuid("supabase_auth_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    supabaseAuthUserIdUniqueIdx: uniqueIndex("teachers_supabase_auth_user_id_unique_idx").on(table.supabaseAuthUserId),
    emailUniqueIdx: uniqueIndex("teachers_email_unique_idx").on(table.email),
  }),
);
