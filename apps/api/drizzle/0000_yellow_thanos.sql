CREATE TABLE "municipalities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text,
	"area_label" text,
	"area_osm_ref" text,
	"area_geometry" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registered_people" (
	"id" uuid PRIMARY KEY NOT NULL,
	"municipality_id" uuid NOT NULL,
	"external_ref" text NOT NULL,
	"full_name" text NOT NULL,
	"address" text NOT NULL,
	"lng" real NOT NULL,
	"lat" real NOT NULL,
	"device" text NOT NULL,
	"backup_hours" real NOT NULL,
	"lives_alone" boolean NOT NULL,
	"floor" integer NOT NULL,
	"mobility" text NOT NULL,
	"phone" text NOT NULL,
	"carer_name" text,
	"carer_phone" text,
	"substation_ref" text,
	"imported_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "substations" (
	"municipality_id" uuid NOT NULL,
	"osm_ref" text NOT NULL,
	"name" text,
	"voltages_kv" jsonb NOT NULL,
	"operator" text,
	"lng" real NOT NULL,
	"lat" real NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registered_people" ADD CONSTRAINT "registered_people_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substations" ADD CONSTRAINT "substations_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registered_people_municipality" ON "registered_people" USING btree ("municipality_id");--> statement-breakpoint
CREATE UNIQUE INDEX "substations_municipality_osm_ref" ON "substations" USING btree ("municipality_id","osm_ref");