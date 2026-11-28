import type { RejectedRow } from "@firstreach/contracts";
import tableStyles from "@/components/ui/DataTable.module.css";
import { Notice } from "@/components/ui/Notice";
import styles from "./RejectedRows.module.css";

const SHOWN = 20;

/** Problems by row and column, so the grid operator can fix the file. Row numbers exclude the header. */
export const RejectedRows = ({ rows, nothingImported }: { rows: RejectedRow[]; nothingImported: boolean }) => (
  <div className={styles.wrap}>
    <Notice tone="error">
      {nothingImported ? "Nothing was imported. " : ""}
      {rows.length} {rows.length === 1 ? "problem" : "problems"} found. Fix them in the file and upload it again.
    </Notice>
    <table className={tableStyles.table}>
      <thead><tr><th scope="col">Row</th><th scope="col">Column</th><th scope="col">Problem</th></tr></thead>
      <tbody>
        {rows.slice(0, SHOWN).map((r) => (
          <tr key={`${r.row}-${r.field}`}><td>{r.row}</td><td><code>{r.field}</code></td><td>{r.message}</td></tr>
        ))}
      </tbody>
    </table>
    {rows.length > SHOWN && <p className={styles.more}>And {rows.length - SHOWN} more.</p>}
  </div>
);
