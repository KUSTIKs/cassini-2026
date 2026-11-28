import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";
import { Spinner } from "./Spinner";

type Look = { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" };

const buttonClass = ({ variant = "secondary", size = "md" }: Look, extra?: string) =>
  cx(styles.button, styles[variant], styles[size], extra);

type ButtonProps = ComponentProps<"button"> & Look & { pending?: boolean; icon?: ReactNode };

/** `pending` disables the button and swaps the icon for a spinner; the label stays, so width doesn't jump. */
export const Button = ({ variant, size, pending = false, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) => (
  <button
    type={type}
    className={buttonClass({ variant, size }, className)}
    disabled={disabled || pending}
    aria-busy={pending || undefined}
    {...rest}
  >
    {pending ? <Spinner /> : icon}
    {children}
  </button>
);

type ButtonLinkProps = ComponentProps<typeof Link> & Look & { icon?: ReactNode };

export const ButtonLink = ({ variant, size, icon, className, children, ...rest }: ButtonLinkProps) => (
  <Link className={buttonClass({ variant, size }, className)} {...rest}>
    {icon}
    {children}
  </Link>
);
