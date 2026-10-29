-- Additive fork compatibility check. 0280_quick_phalanx remains byte-identical;
-- the hash-based migrator skips it on installed databases and applies it on new
-- databases independently of upstream 0280_unique_genesis. Never repair drift
-- silently or rewrite applied migration records.
DO $migration$
DECLARE
  actual oid := to_regclass('public.issue_reviewed_html_reviews');
  expected oid;
  actual_shape jsonb;
  expected_shape jsonb;
BEGIN
  IF actual IS NULL THEN
    RAISE EXCEPTION 'Reviewed HTML registry is absent; restore original 0280_quick_phalanx migration history';
  END IF;
CREATE TEMP TABLE "_reviewed_html_expected" (
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
	CONSTRAINT "issue_reviewed_html_reviews_status_check" CHECK ("_reviewed_html_expected"."status" in ('active', 'revoked', 'superseded')),
	CONSTRAINT "issue_reviewed_html_reviews_trust_state_check" CHECK ("_reviewed_html_expected"."trust_state" in ('board_reviewed_bytes')),
	CONSTRAINT "issue_reviewed_html_reviews_version_check" CHECK ("_reviewed_html_expected"."review_version" >= 1),
	CONSTRAINT "issue_reviewed_html_reviews_total_bytes_check" CHECK ("_reviewed_html_expected"."total_bytes" > 0 and "_reviewed_html_expected"."total_bytes" <= 4194304)
);

CREATE INDEX "_reviewed_html_expected_company_issue_idx" ON "_reviewed_html_expected" USING btree ("company_id","issue_id");
CREATE UNIQUE INDEX "_reviewed_html_expected_version_uq" ON "_reviewed_html_expected" USING btree ("company_id","issue_id","review_version");
CREATE UNIQUE INDEX "_reviewed_html_expected_active_uq" ON "_reviewed_html_expected" USING btree ("company_id","issue_id") WHERE "_reviewed_html_expected"."status" = 'active';
  expected := to_regclass('pg_temp._reviewed_html_expected');
  SELECT jsonb_agg(jsonb_build_array(a.attname, format_type(a.atttypid,a.atttypmod), a.attnotnull,
    pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) INTO actual_shape
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE a.attrelid=actual AND a.attnum>0 AND NOT a.attisdropped;
  SELECT jsonb_agg(jsonb_build_array(a.attname, format_type(a.atttypid,a.atttypmod), a.attnotnull,
    pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) INTO expected_shape
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE a.attrelid=expected AND a.attnum>0 AND NOT a.attisdropped;
  IF actual_shape IS DISTINCT FROM expected_shape THEN
    RAISE EXCEPTION 'Reviewed HTML registry columns differ from the retained schema';
  END IF;
  SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY pg_get_constraintdef(oid)) INTO actual_shape
  FROM pg_constraint WHERE conrelid=actual AND contype <> 'f';
  SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY pg_get_constraintdef(oid)) INTO expected_shape
  FROM pg_constraint WHERE conrelid=expected AND contype <> 'f';
  IF actual_shape IS DISTINCT FROM expected_shape THEN
    RAISE EXCEPTION 'Reviewed HTML registry constraints differ from the retained schema';
  END IF;
  SELECT jsonb_agg(jsonb_build_array(indisunique,indisprimary,indisvalid,indisready,indkey::text,
    pg_get_expr(indpred,indrelid),pg_get_expr(indexprs,indrelid)) ORDER BY indkey::text,indisunique,indisprimary)
    INTO actual_shape FROM pg_index WHERE indrelid=actual;
  SELECT jsonb_agg(jsonb_build_array(indisunique,indisprimary,indisvalid,indisready,indkey::text,
    pg_get_expr(indpred,indrelid),pg_get_expr(indexprs,indrelid)) ORDER BY indkey::text,indisunique,indisprimary)
    INTO expected_shape FROM pg_index WHERE indrelid=expected;
  IF actual_shape IS DISTINCT FROM expected_shape THEN
    RAISE EXCEPTION 'Reviewed HTML registry indexes differ from the retained schema';
  END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE conrelid=actual AND contype='f') <> 2
    OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=actual AND contype='f'
      AND conkey=ARRAY[2]::smallint[] AND confrelid='public.companies'::regclass
      AND confkey=ARRAY[1]::smallint[] AND confdeltype='a' AND confupdtype='a' AND convalidated)
    OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=actual AND contype='f'
      AND conkey=ARRAY[3]::smallint[] AND confrelid='public.issues'::regclass
      AND confkey=ARRAY[1]::smallint[] AND confdeltype='c' AND confupdtype='a' AND convalidated) THEN
    RAISE EXCEPTION 'Reviewed HTML registry foreign keys differ from the retained schema';
  END IF;
  DROP TABLE pg_temp._reviewed_html_expected;
END
$migration$;
