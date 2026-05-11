import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { classes } from "@/lib/db/schema/classes";

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    pinHash: text("pin_hash").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => ({
    classIdIdx: index("student_profiles_class_id_idx").on(table.classId),
    classIdIsActiveIdx: index("student_profiles_class_id_is_active_idx").on(table.classId, table.isActive),
  }),
);
