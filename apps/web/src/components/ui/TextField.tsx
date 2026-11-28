import { useId, type ComponentProps } from "react";
import { cx } from "@/lib/cx";
import styles from "./TextField.module.css";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string | undefined;
};

/** Label, input, then either the error or the hint, wired up for screen readers. */
export const TextField = ({ label, hint, error, className, ...input }: TextFieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...input}
      />
      {message && (
        <p id={messageId} className={cx(styles.message, error && styles.error)}>{message}</p>
      )}
    </div>
  );
};
