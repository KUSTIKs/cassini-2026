"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./Sidebar.module.css";

/** Client island: only this needs the current path. */
export const NavLink = ({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={styles.link} aria-current={active ? "page" : undefined}>
      {icon}
      {children}
    </Link>
  );
};
