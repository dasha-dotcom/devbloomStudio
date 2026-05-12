import { index, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

import { classes } from "@/lib/db/schema/classes";
import { studentProfiles } from "@/lib/db/schema/student-profiles";

export const studentSessions = pgTable(
  "student_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionTokenHashUniqueIdx: uniqueIndex("student_sessions_session_token_hash_unique_idx").on(table.sessionTokenHash),
    studentProfileIdIdx: index("student_sessions_student_profile_id_idx").on(table.studentProfileId),
    classIdIdx: index("student_sessions_class_id_idx").on(table.classId),
    expiresAtIdx: index("student_sessions_expires_at_idx").on(table.expiresAt),
    lastActiveAtIdx: index("student_sessions_last_active_at_idx").on(table.lastActiveAt),
  }),
);
