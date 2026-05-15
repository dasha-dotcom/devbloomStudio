CREATE TABLE "project_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"class_id" uuid NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"project_slug" text NOT NULL,
	"content_version" text NOT NULL,
	"status" text NOT NULL,
	"progress_percent" integer,
	"current_step_id" text NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"latest_reflection_excerpt" text,
	"state_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_attempts" ADD CONSTRAINT "project_attempts_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_attempts" ADD CONSTRAINT "project_attempts_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_attempts_student_project_version_unique_idx" ON "project_attempts" USING btree ("student_profile_id","project_slug","content_version");--> statement-breakpoint
CREATE INDEX "project_attempts_class_id_idx" ON "project_attempts" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "project_attempts_student_profile_id_idx" ON "project_attempts" USING btree ("student_profile_id");--> statement-breakpoint
CREATE INDEX "project_attempts_class_project_idx" ON "project_attempts" USING btree ("class_id","project_slug");--> statement-breakpoint
CREATE INDEX "project_attempts_status_idx" ON "project_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_attempts_last_active_at_idx" ON "project_attempts" USING btree ("last_active_at");--> statement-breakpoint
CREATE INDEX "project_attempts_finished_at_idx" ON "project_attempts" USING btree ("finished_at");