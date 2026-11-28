import { REGISTER_DEVICES, REGISTER_FORMAT, REGISTER_MOBILITY } from "@firstreach/contracts";
import { describe, expect, it } from "vitest";
import { parseRegisterRow, REGISTER_COLUMNS } from "../../../domain/register-row.js";
import { DEVICES, MOBILITY } from "../../../domain/registered-person.js";

/** The format shown to admins (contracts) must be the one the parser accepts (domain). */
describe("published register format", () => {
  it("lists exactly the columns the parser reads, in the same order", () => {
    expect(REGISTER_FORMAT.map((c) => c.name)).toEqual([...REGISTER_COLUMNS]);
  });

  it("allows the same device and mobility values", () => {
    expect([...REGISTER_DEVICES]).toEqual([...DEVICES]);
    expect([...REGISTER_MOBILITY]).toEqual([...MOBILITY]);
  });

  it("has examples that parse as a valid row", () => {
    const row = Object.fromEntries(REGISTER_FORMAT.map((c) => [c.name, c.example]));
    expect(parseRegisterRow(row, 1)).toMatchObject({ ok: true });
  });

  it("marks as optional only the columns the parser lets be empty", () => {
    const full = Object.fromEntries(REGISTER_FORMAT.map((c) => [c.name, c.example]));
    for (const column of REGISTER_FORMAT) {
      const result = parseRegisterRow({ ...full, [column.name]: "" }, 1);
      expect({ column: column.name, ok: result.ok }).toEqual({ column: column.name, ok: !column.required });
    }
  });
});
