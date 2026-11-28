import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronRightIcon } from "./icons";
import styles from "./PageHeader.module.css";

type Crumb = { label: string; href?: string };

/** The bar above every page: where you are on the left, what you can do on the right. */
export const PageHeader = ({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) => (
  <header className={styles.header}>
    <nav aria-label="Breadcrumb" className={styles.crumbs}>
      {crumbs.map((crumb, i) => (
        <Fragment key={crumb.label}>
          {i > 0 && <ChevronRightIcon className={styles.separator} />}
          {crumb.href ? (
            <Link href={crumb.href} className={styles.link}>{crumb.label}</Link>
          ) : (
            <span aria-current="page" className={styles.current}>{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
    {actions && <div className={styles.actions}>{actions}</div>}
  </header>
);
