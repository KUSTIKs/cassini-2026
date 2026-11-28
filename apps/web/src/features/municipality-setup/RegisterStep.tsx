"use client";

import type { RegisterSummary as Summary } from "@firstreach/contracts";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { UploadIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { importRegisterAction, type RegisterImportState } from "./actions";
import { FilePicker } from "./FilePicker";
import { RegisterFormat } from "./RegisterFormat";
import { RegisterSources } from "./RegisterSources";
import { RegisterSummary } from "./RegisterSummary";
import { RejectedRows } from "./RejectedRows";
import styles from "./steps.module.css";

type Props = { municipalityId: string; register: Summary };

export const RegisterStep = ({ municipalityId, register }: Props) => {
  const [state, action, pending] = useActionState<RegisterImportState, FormData>(
    importRegisterAction.bind(null, municipalityId), { result: null, error: null, fileName: null },
  );
  const [file, setFile] = useState<File | null>(null);
  const hasRegister = register.total > 0;

  return (
    <div className={styles.content}>
      <p className={styles.lead}>
        Add the grid operator&apos;s register of vulnerable customers: people whose health depends on equipment
        that needs constant power. FirstReach links each person to their substation.
      </p>

      {hasRegister && <RegisterSummary register={register} />}

      <RegisterSources>
        <form action={action} className={styles.content} onSubmit={() => setFile(null)}>
          <FilePicker name="file" accept=".csv,text/csv" file={file} onChange={setFile} />
          <div className={styles.actions}>
            <Button type="submit" variant={hasRegister ? "secondary" : "primary"} pending={pending} disabled={!file} icon={<UploadIcon />}>
              {hasRegister ? "Replace register" : "Upload register"}
            </Button>
          </div>
        </form>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.result && !pending && (
          <>
            {state.result.imported > 0 && (
              <Notice tone="success">
                Imported {state.result.imported} {state.result.imported === 1 ? "person" : "people"} from {state.fileName}.
                {hasRegister && " The previous register was replaced."}
              </Notice>
            )}
            {state.result.rejected.length > 0 && <RejectedRows rows={state.result.rejected} nothingImported={state.result.imported === 0} />}
          </>
        )}
        <RegisterFormat />
      </RegisterSources>
    </div>
  );
};
