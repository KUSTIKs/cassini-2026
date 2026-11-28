import { SetupStepId, type MunicipalitySetup } from "@firstreach/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui/Notice";
import { AlertCallout } from "@/features/alert/AlertCallout";
import { PageHeader } from "@/components/ui/PageHeader";
import { MapPreviewProvider } from "@/features/municipality-setup/MapPreviewContext";
import { SetupMap } from "@/features/municipality-setup/SetupMap";
import { openableSteps, SetupSteps } from "@/features/municipality-setup/SetupSteps";
import { api } from "@/lib/api-client";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const result = await api.getMunicipalitySetup((await params).id);
  return { title: result.ok ? result.data.name : "Municipality" };
};

/** ?step=<id> opens that step; ?step=none closes all; no param opens the next step this role can do. */
const openStepFor = (setup: MunicipalitySetup, requested: string | undefined) => {
  if (requested === "none") return null;
  const openable = openableSteps(setup);
  const parsed = SetupStepId.safeParse(requested);
  if (parsed.success && openable.includes(parsed.data)) return parsed.data;
  return setup.steps.find((s) => s.status === "ready" && openable.includes(s.id))?.id ?? null;
};

const statusLine = (setup: MunicipalitySetup, done: number) => {
  if (done === setup.steps.length) return "Setup is complete. FirstReach is ready for flood warnings here.";
  const progress = `Setup ${done} of ${setup.steps.length} done.`;
  return setup.permissions.setup || setup.permissions.uploadRegister ? progress : `${progress} The regional admin and the grid operator complete it.`;
};

const MunicipalitySetupPage = async ({ params, searchParams }: Props) => {
  const [{ id }, { step }] = await Promise.all([params, searchParams]);
  const [result, alerts] = await Promise.all([api.getMunicipalitySetup(id), api.listAlerts(id)]);
  const activeAlert = alerts.ok ? alerts.data.items.find((a) => a.status === "active") : undefined;
  if (!result.ok && result.error.code === "not_found") notFound();

  const crumbs = [{ label: "Municipalities", href: "/municipalities" }, { label: result.ok ? result.data.name : "Municipality" }];
  if (!result.ok) {
    return (
      <>
        <PageHeader crumbs={crumbs} />
        <div className={styles.pad}><Notice tone="error">{result.error.message}</Notice></div>
      </>
    );
  }

  const setup = result.data;
  const done = setup.steps.filter((s) => s.status === "done").length;

  return (
    <>
      <PageHeader crumbs={crumbs} />
      <MapPreviewProvider>
        <div className={styles.layout}>
          <section className={styles.steps} aria-labelledby="setup-title">
            {activeAlert && <div className={styles.alert}><AlertCallout alert={activeAlert} /></div>}
            <header className={styles.intro}>
              <h1 id="setup-title" className={styles.title}>{setup.name}</h1>
              <p className={styles.subtitle}>
                {setup.region}. {statusLine(setup, done)}
              </p>
            </header>
            <SetupSteps setup={setup} openStep={openStepFor(setup, step)} />
          </section>
          <aside className={styles.map}>
            <SetupMap area={setup.area?.geometry ?? null} substations={setup.substations} />
          </aside>
        </div>
      </MapPreviewProvider>
    </>
  );
};

export default MunicipalitySetupPage;
