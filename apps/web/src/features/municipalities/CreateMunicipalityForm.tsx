"use client";

import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { createMunicipalityAction, type CreateMunicipalityState } from "./actions";
import styles from "./CreateMunicipalityForm.module.css";

const initial: CreateMunicipalityState = { message: null, fields: {}, values: {} };

export const CreateMunicipalityForm = () => {
  const [state, action, pending] = useActionState(createMunicipalityAction, initial);
  const field = (name: string) => ({ name, defaultValue: state.values[name], error: state.fields[name] });

  return (
    <form action={action} className={styles.form} noValidate>
      {state.message && <Notice tone="error">{state.message}</Notice>}

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Municipality</legend>
        <div className={styles.row}>
          <TextField label="Name" placeholder="Krnov" autoComplete="off" required autoFocus {...field("name")} />
          <TextField label="Region" placeholder="Moravian-Silesian Region" autoComplete="off" required {...field("region")} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Who receives flood alerts</legend>
        <p className={styles.help}>
          Usually the flood commission&apos;s duty officer. FirstReach contacts them the moment a flood warning reaches the town.
        </p>
        <TextField label="Name or role" placeholder="Flood commission duty officer" required {...field("contact.name")} />
        <div className={styles.row}>
          <TextField label="Phone" type="tel" placeholder="+420 777 123 456" required {...field("contact.phone")} />
          <TextField label="Email" type="email" hint="Optional" {...field("contact.email")} />
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" pending={pending}>Create municipality</Button>
        <ButtonLink href="/municipalities" variant="ghost">Cancel</ButtonLink>
      </div>
    </form>
  );
};
