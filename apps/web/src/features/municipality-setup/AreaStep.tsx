"use client";

import type { AreaCandidate } from "@firstreach/contracts";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { searchAreasAction, setAreaAction, type AreaSearchState, type SetAreaState } from "./actions";
import { AreaCandidateList } from "./AreaCandidateList";
import { useMapPreview } from "./MapPreviewContext";
import styles from "./steps.module.css";

type AreaStepProps = { municipalityId: string; municipalityName: string; currentLabel: string | null };

export const AreaStep = ({ municipalityId, municipalityName, currentLabel }: AreaStepProps) => {
  const [search, searchAction, searching] = useActionState<AreaSearchState, FormData>(searchAreasAction, {
    query: municipalityName, items: null, error: null,
  });
  const [saved, saveAction, saving] = useActionState<SetAreaState, FormData>(
    setAreaAction.bind(null, municipalityId), { error: null },
  );
  const [selected, setSelected] = useState<AreaCandidate | null>(null);
  const { setPreview } = useMapPreview();

  // A new search invalidates the previous selection.
  useEffect(() => setSelected(null), [search.items]);
  // The map shows whatever is selected; nothing once this step closes.
  useEffect(() => setPreview(selected?.geometry ?? null), [selected, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  return (
    <div className={styles.content}>
      <p className={styles.lead}>
        {currentLabel
          ? <>Current area: <strong>{currentLabel}</strong>. Search again to change it; substations will need to be found again.</>
          : "Find the municipality's official boundary. FirstReach uses it to decide which substations and people belong to this town."}
      </p>

      <form action={searchAction} className={styles.searchRow} role="search">
        <TextField label="Town or municipality" name="query" defaultValue={search.query} autoComplete="off" error={search.error ?? undefined} />
        <Button type="submit" pending={searching} icon={<SearchIcon />}>Search</Button>
      </form>

      {search.items && (
        search.items.length === 0
          ? <Notice tone="info">No boundary found for “{search.query}”. Try the official name, for example “Krnov”.</Notice>
          : <AreaCandidateList items={search.items} selectedRef={selected?.ref ?? null} onSelect={setSelected} />
      )}

      {saved.error && <Notice tone="error">{saved.error}</Notice>}

      {selected && (
        <form action={saveAction} className={styles.actions}>
          <input type="hidden" name="ref" value={selected.ref} />
          <Button type="submit" variant="primary" pending={saving}>Use this area</Button>
          <span className={`${styles.muted} ${styles.small}`}>Shown dashed on the map</span>
        </form>
      )}
    </div>
  );
};
