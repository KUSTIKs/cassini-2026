import { REGISTER_FORMAT } from "@firstreach/contracts";
import tableStyles from "@/components/ui/DataTable.module.css";
import { ChevronRightIcon } from "@/components/ui/icons";
import styles from "./RegisterFormat.module.css";

/** What the upload expects, generated from the same contract the API's parser is tested against. */
export const RegisterFormat = () => (
  <details className={styles.format}>
    <summary className={styles.summary}>
      <ChevronRightIcon className={styles.chevron} />
      File format
      <span className={styles.hint}>CSV, UTF-8, a header row, then one person per row</span>
    </summary>
    <div className={styles.body}>
      <p className={styles.links}>
        <a href="/templates/register.csv" download>Download an empty template</a>
        <span aria-hidden>·</span>
        <a href="/demo/krnov-register.csv" download>Download the demo register (fictional people)</a>
      </p>
      <table className={tableStyles.table}>
        <thead>
          <tr><th scope="col">Column</th><th scope="col">What to put in it</th></tr>
        </thead>
        <tbody>
          {REGISTER_FORMAT.map((column) => (
            <tr key={column.name}>
              <td>
                <code>{column.name}</code>
                {!column.required && <span className={styles.optional}>optional</span>}
              </td>
              <td>
                {column.rule}
                <span className={styles.example}>e.g. {column.example}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);
