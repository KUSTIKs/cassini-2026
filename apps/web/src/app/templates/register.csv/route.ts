import { REGISTER_FORMAT } from "@firstreach/contracts";

export const dynamic = "force-static";

/** An empty register: just the header row, generated from the contract so it can't drift from the parser. */
export const GET = () =>
  new Response(`${REGISTER_FORMAT.map((c) => c.name).join(",")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="firstreach-register-template.csv"',
    },
  });
