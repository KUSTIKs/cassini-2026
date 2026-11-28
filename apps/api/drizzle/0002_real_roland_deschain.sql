CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"municipality_id" uuid,
	CONSTRAINT "user_roles_unique" UNIQUE NULLS NOT DISTINCT("user_id","role","municipality_id")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_municipality_id_municipalities_id_fk";
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Keep every existing role: copy users.role / users.municipality_id into user_roles before dropping them.
INSERT INTO "user_roles" ("user_id", "role", "municipality_id")
SELECT "id", "role", CASE WHEN "role" = 'municipality_officer' THEN "municipality_id" END FROM "users";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "municipality_id";