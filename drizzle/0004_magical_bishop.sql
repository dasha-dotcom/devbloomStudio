ALTER TABLE "classes" ADD COLUMN "default_variant" text DEFAULT 'control' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_attempts" ADD COLUMN "variant" text DEFAULT 'control' NOT NULL;--> statement-breakpoint
DROP INDEX "project_attempts_student_project_version_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "project_attempts_student_project_version_variant_unique_idx" ON "project_attempts" USING btree ("student_profile_id","project_slug","content_version","variant");
