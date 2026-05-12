CREATE TABLE "student_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "student_sessions_session_token_hash_unique_idx" ON "student_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "student_sessions_student_profile_id_idx" ON "student_sessions" USING btree ("student_profile_id");--> statement-breakpoint
CREATE INDEX "student_sessions_class_id_idx" ON "student_sessions" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "student_sessions_expires_at_idx" ON "student_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "student_sessions_last_active_at_idx" ON "student_sessions" USING btree ("last_active_at");