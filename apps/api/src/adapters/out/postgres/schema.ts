import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { ExposedPerson, ExposedSubstation } from "../../../domain/exposure.js";
import type { Area } from "../../../domain/geo.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";

/** Persistence model. Belongs to the Postgres adapter, NOT the domain. */

export const municipalities = pgTable("municipalities", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  areaLabel: text("area_label"),
  areaOsmRef: text("area_osm_ref"),
  areaGeometry: jsonb("area_geometry").$type<Area>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const substations = pgTable(
  "substations",
  {
    municipalityId: uuid("municipality_id").notNull().references(() => municipalities.id, { onDelete: "cascade" }),
    osmRef: text("osm_ref").notNull(),
    name: text("name"),
    voltagesKv: jsonb("voltages_kv").$type<number[]>().notNull(),
    operator: text("operator"),
    lng: real("lng").notNull(),
    lat: real("lat").notNull(),
  },
  (t) => [uniqueIndex("substations_municipality_osm_ref").on(t.municipalityId, t.osmRef)],
);

export const registeredPeople = pgTable(
  "registered_people",
  {
    id: uuid("id").primaryKey(),
    municipalityId: uuid("municipality_id").notNull().references(() => municipalities.id, { onDelete: "cascade" }),
    externalRef: text("external_ref").notNull(),
    fullName: text("full_name").notNull(),
    address: text("address").notNull(),
    lng: real("lng").notNull(),
    lat: real("lat").notNull(),
    device: text("device", { enum: ["ventilator", "oxygen_concentrator", "other"] }).notNull(),
    backupHours: real("backup_hours").notNull(),
    livesAlone: boolean("lives_alone").notNull(),
    floor: integer("floor").notNull(),
    mobility: text("mobility", { enum: ["independent", "limited", "bedridden"] }).notNull(),
    phone: text("phone").notNull(),
    carerName: text("carer_name"),
    carerPhone: text("carer_phone"),
    substationRef: text("substation_ref"),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("registered_people_municipality").on(t.municipalityId)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    organisation: text("organisation").notNull(),
  },
  (t) => [uniqueIndex("users_email").on(t.email)],
);

/** One row per role a user holds. Officers' rows name the municipality; other roles leave it null. */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["regional_admin", "grid_operator", "municipality_officer"] }).notNull(),
    municipalityId: uuid("municipality_id").references(() => municipalities.id, { onDelete: "cascade" }),
  },
  (t) => [unique("user_roles_unique").on(t.userId, t.role, t.municipalityId).nullsNotDistinct()],
);

/** Signals from every plugin, one shape (ARCHITECTURE.md §6). Upserted by id. */
export const hazardSignals = pgTable("hazard_signals", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  kind: text("kind", { enum: ["flood", "power_outage", "storm", "fire"] }).notNull(),
  stage: text("stage", { enum: ["forecast", "observed"] }).notNull(),
  area: jsonb("area").$type<Area>().notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  expectedAt: timestamp("expected_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  confidence: text("confidence", { enum: ["low", "medium", "high"] }).notNull(),
  provenance: jsonb("provenance").$type<HazardSignal["provenance"]>().notNull(),
});

/**
 * Alerts keep the ranked list as a snapshot (no names: those stay in registered_people and are
 * joined only for unsealed viewers).
 */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey(),
    municipalityId: uuid("municipality_id").notNull().references(() => municipalities.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["active", "closed"] }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    signalIds: jsonb("signal_ids").$type<string[]>().notNull(),
    substations: jsonb("substations").$type<ExposedSubstation[]>().notNull(),
    people: jsonb("people").$type<ExposedPerson[]>().notNull(),
  },
  (t) => [index("alerts_municipality").on(t.municipalityId)],
);
