import { describe, expect, it } from "vitest";
import { parseRegisterRow, type RawRegisterRow } from "./register-row.js";

const valid: RawRegisterRow = {
  external_ref: "R-001", full_name: "Test Person", address: "Main 1, Krnov",
  lat: "50.09", lon: "17.70", device: "ventilator", backup_hours: "3",
  lives_alone: "yes", floor: "0", mobility: "bedridden", phone: "+420 000 000 001",
  carer_name: "", carer_phone: "",
};

describe("parseRegisterRow", () => {
  it("parses a valid row", () => {
    const result = parseRegisterRow(valid, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.person).toMatchObject({ device: "ventilator", livesAlone: true, floor: 0, carerName: null });
      expect(result.person.location).toEqual({ lng: 17.7, lat: 50.09 });
    }
  });

  it("reports every problem in a row, with field names", () => {
    const result = parseRegisterRow({ ...valid, device: "toaster", lat: "", lives_alone: "maybe" }, 7);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.map((p) => p.field).sort()).toEqual(["device", "lat", "lives_alone"]);
    if (!result.ok) expect(result.problems.every((p) => p.row === 7)).toBe(true);
  });
});
