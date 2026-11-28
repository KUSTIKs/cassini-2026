import { describe, expect, it } from "vitest";
import { can, officerGrant, type RoleGrant, type User } from "./access.js";

const user = (...grants: RoleGrant[]): User => ({ id: "u", name: "Test", email: null, organisation: "Test", grants });
const ADMIN: RoleGrant = { role: "regional_admin", municipalityId: null };
const GRID: RoleGrant = { role: "grid_operator", municipalityId: null };

describe("access policy", () => {
  it("lets a regional admin do everything", () => {
    const admin = user(ADMIN);
    expect(can(admin, "municipality.create")).toBe(true);
    expect(can(admin, "municipality.setup", "krnov")).toBe(true);
    expect(can(admin, "register.upload", "krnov")).toBe(true);
  });

  it("lets the grid operator view any municipality and upload registers, nothing else", () => {
    const grid = user(GRID);
    expect(can(grid, "municipality.view", "krnov")).toBe(true);
    expect(can(grid, "register.upload", "krnov")).toBe(true);
    expect(can(grid, "municipality.setup", "krnov")).toBe(false);
    expect(can(grid, "municipality.create")).toBe(false);
  });

  it("lets an officer see only the municipalities their grants name", () => {
    const officer = user(officerGrant("krnov"), officerGrant("brantice"));
    expect(can(officer, "municipality.view", "krnov")).toBe(true);
    expect(can(officer, "municipality.view", "brantice")).toBe(true);
    expect(can(officer, "municipality.view", "jesenik")).toBe(false);
    expect(can(officer, "municipality.view")).toBe(false);
    expect(can(officer, "register.upload", "krnov")).toBe(false);
  });

  it("combines different roles: an officer who is also on the grid operator's team", () => {
    const both = user(officerGrant("krnov"), GRID);
    expect(can(both, "register.upload", "jesenik")).toBe(true);
    expect(can(both, "municipality.setup", "krnov")).toBe(false);
  });

  it("allows nothing without grants", () => {
    expect(can(user(), "municipality.view", "krnov")).toBe(false);
  });
});
