"use client";

import { useId } from "react";
import { UploadIcon } from "@/components/ui/icons";
import styles from "./FilePicker.module.css";

type Props = { name: string; accept: string; file: File | null; onChange: (file: File | null) => void };

/** A native file input behind a large, keyboard-reachable target. */
export const FilePicker = ({ name, accept, file, onChange }: Props) => {
  const id = useId();
  return (
    <div className={styles.picker}>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        className={styles.input}
        onChange={(e) => onChange(e.currentTarget.files?.[0] ?? null)}
      />
      <label htmlFor={id} className={styles.target}>
        <UploadIcon />
        {file ? (
          <span><strong>{file.name}</strong> <span className={styles.muted}>{(file.size / 1024).toFixed(1)} KB</span></span>
        ) : (
          <span>Choose a CSV file <span className={styles.muted}>or drop it here</span></span>
        )}
      </label>
    </div>
  );
};
