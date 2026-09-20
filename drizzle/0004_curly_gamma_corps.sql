ALTER TABLE "replies" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_parent_id_replies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "replies_parent_id_idx" ON "replies" USING btree ("parent_id");