CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"municipality_id" uuid NOT NULL,
	"status" text NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"signal_ids" jsonb NOT NULL,
	"substations" jsonb NOT NULL,
	"people" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hazard_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"kind" text NOT NULL,
	"stage" text NOT NULL,
	"area" jsonb NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expected_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"confidence" text NOT NULL,
	"provenance" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_municipality" ON "alerts" USING btree ("municipality_id");