import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";
import { CreateMunicipalityForm } from "@/features/municipalities/CreateMunicipalityForm";
import { getCurrentUser } from "@/lib/current-user";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "New municipality" };

const NewMunicipalityPage = async () => {
  const me = await getCurrentUser();
  const allowed = me.ok && me.data.permissions.createMunicipality;
  return (
    <>
      <PageHeader crumbs={[{ label: "Municipalities", href: "/municipalities" }, { label: "New" }]} />
      <div className={styles.page}>
        <h1 className={styles.title}>New municipality</h1>
        {allowed ? (
          <>
            <p className={styles.lead}>
              Start with the basics. You&apos;ll mark the area and connect the register next. The alert contact is
              invited as the municipality&apos;s officer.
            </p>
            <CreateMunicipalityForm />
          </>
        ) : (
          <div className={styles.lead}><Notice tone="info">Only the regional admin can add municipalities.</Notice></div>
        )}
      </div>
    </>
  );
};

export default NewMunicipalityPage;
