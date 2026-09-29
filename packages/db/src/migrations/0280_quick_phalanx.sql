CREATE TABLE "issue_reviewed_html_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"issue_id" uuid NOT NULL,
	"review_version" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"trust_state" text DEFAULT 'board_reviewed_bytes' NOT NULL,
	"html_attachment_id" uuid NOT NULL,
	"files" jsonb NOT NULL,
	"total_bytes" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_user_id" text NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_reviewed_html_reviews_status_check" CHECK ("issue_reviewed_html_reviews"."status" in ('active', 'revoked', 'superseded')),
	CONSTRAINT "issue_reviewed_html_reviews_trust_state_check" CHECK ("issue_reviewed_html_reviews"."trust_state" in ('board_reviewed_bytes')),
	CONSTRAINT "issue_reviewed_html_reviews_version_check" CHECK ("issue_reviewed_html_reviews"."review_version" >= 1),
	CONSTRAINT "issue_reviewed_html_reviews_total_bytes_check" CHECK ("issue_reviewed_html_reviews"."total_bytes" > 0 and "issue_reviewed_html_reviews"."total_bytes" <= 4194304)
);
--> statement-breakpoint
ALTER TABLE "issue_reviewed_html_reviews" ADD CONSTRAINT "issue_reviewed_html_reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_reviewed_html_reviews" ADD CONSTRAINT "issue_reviewed_html_reviews_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_reviewed_html_reviews_company_issue_idx" ON "issue_reviewed_html_reviews" USING btree ("company_id","issue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_reviewed_html_reviews_version_uq" ON "issue_reviewed_html_reviews" USING btree ("company_id","issue_id","review_version");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_reviewed_html_reviews_active_uq" ON "issue_reviewed_html_reviews" USING btree ("company_id","issue_id") WHERE "issue_reviewed_html_reviews"."status" = 'active';