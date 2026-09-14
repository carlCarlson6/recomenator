CREATE TABLE "drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"author_id" text NOT NULL,
	"category" text NOT NULL,
	"title" text,
	"description" text,
	"external_url" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drafts_rating_check" CHECK ("drafts"."rating" IS NULL OR "drafts"."rating" BETWEEN 1 AND 10)
);
--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drafts_group_id_author_id_updated_at_idx" ON "drafts" USING btree ("group_id","author_id","updated_at");