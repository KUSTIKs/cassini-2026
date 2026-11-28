import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { MunicipalityList } from "@/features/municipalities/MunicipalityList";
import { api } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/current-user";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Municipalities" };
export const dynamic = "force-dynamic";

const newButton = (
  <ButtonLink href="/municipalities/new" variant="primary" size="sm" icon={<PlusIcon />}>New municipality</ButtonLink>
);

const MunicipalitiesPage = async () => {
  const [me, result] = await Promise.all([getCurrentUser(), api.listMunicipalities()]);
  const canCreate = me.ok && me.data.permissions.createMunicipality;
  return (
    <>
      <PageHeader crumbs={[{ label: "Municipalities" }]} actions={canCreate && result.ok && result.data.items.length > 0 && newButton} />
      {!result.ok ? (
        <div className={styles.pad}><Notice tone="error">{result.error.message}</Notice></div>
      ) : result.data.items.length === 0 ? (
        <div className={styles.pad}>
          {canCreate ? (
            <EmptyState title="Set up your first municipality" action={newButton}>
              Add a town, mark its area, and connect the grid operator&apos;s register of people who depend on
              electricity at home. FirstReach then knows who to warn when a flood heads their way.
            </EmptyState>
          ) : (
            <EmptyState title="No municipalities yet">
              The regional admin hasn&apos;t set up any municipalities you can see.
            </EmptyState>
          )}
        </div>
      ) : (
        <MunicipalityList items={result.data.items} />
      )}
    </>
  );
};

export default MunicipalitiesPage;
