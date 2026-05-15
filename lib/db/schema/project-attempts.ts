import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { classes } from "@/lib/db/schema/classes";
import { studentProfiles } from "@/lib/db/schema/student-profiles";

export const projectAttempts = pgTable(
  "project_attempts",
  {
    id: uuid("id").primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentProfileId: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    projectSlug: text("project_slug").notNull(),
    contentVersion: text("content_version").notNull(),
    status: text("status").notNull(),
    progressPercent: integer("progress_percent"),
    currentStepId: text("current_step_id").notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    latestReflectionExcerpt: text("latest_reflection_excerpt"),
    stateJson: jsonb("state_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    studentProjectVersionUniqueIdx: uniqueIndex("project_attempts_student_project_version_unique_idx").on(
      table.studentProfileId,
      table.projectSlug,
      table.contentVersion,
    ),
    classIdIdx: index("project_attempts_class_id_idx").on(table.classId),
    studentProfileIdIdx: index("project_attempts_student_profile_id_idx").on(table.studentProfileId),
    classProjectIdx: index("project_attempts_class_project_idx").on(table.classId, table.projectSlug),
    statusIdx: index("project_attempts_status_idx").on(table.status),
    lastActiveAtIdx: index("project_attempts_last_active_at_idx").on(table.lastActiveAt),
    finishedAtIdx: index("project_attempts_finished_at_idx").on(table.finishedAt),
  }),
);
