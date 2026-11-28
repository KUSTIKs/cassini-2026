CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"alert_id" uuid NOT NULL,
	"person_id" uuid
);
--> statement-breakpoint
CREATE TABLE "contact_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"state" text NOT NULL,
	"bring" jsonb NOT NULL,
	"note" text,
	"by" uuid NOT NULL,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"alert_id" uuid NOT NULL,
	"municipality_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"bring" jsonb NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_records" ADD CONSTRAINT "contact_records_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_alert" ON "audit_log" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "contact_records_alert" ON "contact_records" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "tasks_alert" ON "tasks" USING btree ("alert_id");