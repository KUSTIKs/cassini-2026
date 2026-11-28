import { ContactState } from "@firstreach/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertCounters } from "@/features/alert/AlertCounters";
import { AlertHeader } from "@/features/alert/AlertHeader";
import { AlertList } from "@/features/alert/AlertList";
import { AlertMap } from "@/features/alert/AlertMap";
import { when } from "@/features/alert/labels";
import { PersonPanel } from "@/features/alert/PersonPanel";
import { PrintButton } from "@/features/alert/PrintButton";
import { api } from "@/lib/api-client";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Flood alert" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ person?: string; filter?: string }> };

/** Flow 3: the mayor works the list. ?person= opens a person (logged by the API); ?filter= narrows the list. */
const AlertPage = async ({ params, searchParams }: Props) => {
  const [{ id }, { person: personId, filter: rawFilter }] = await Promise.all([params, searchParams]);
  const result = await api.getAlert(id);
  if (!result.ok && result.error.code === "not_found") notFound();
  if (!result.ok)
    return (
      <>
        <PageHeader crumbs={[{ label: "Municipalities", href: "/municipalities" }, { label: "Flood alert" }]} />
        <div className={styles.pad}><Notice tone="error">{result.error.message}</Notice></div>
      </>
    );

  const alert = result.data;
  const parsed = ContactState.safeParse(rawFilter);
  const filter = parsed.success ? parsed.data : "all";
  const base = `/alerts/${alert.id}`;
  const query = (q: { person?: string | undefined; filter?: string }) => {
    const p = new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => Boolean(e[1]) && e[1] !== "all"));
    return p.size ? `${base}?${p}` : base;
  };

  const person = personId && !alert.sealed ? await api.getAlertPerson(alert.id, personId) : null;
  const people = filter === "all" ? alert.people : alert.people.filter((p) => p.contact.state === filter);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Municipalities", href: "/municipalities" },
          { label: alert.municipalityName, href: `/municipalities/${alert.municipalityId}` },
          { label: "Flood alert" },
        ]}
        actions={!alert.sealed && <PrintButton />}
      />
      <div className={styles.layout}>
        <section className={styles.main} aria-label="Ranked list">
          <AlertHeader alert={alert} />
          <div data-print="hide">
            <AlertCounters counters={alert.counters} filter={filter} hrefFor={(f) => query({ filter: f })} />
          </div>
          {alert.sealed && (
            <Notice tone="info">Names and phone numbers are visible only to {alert.municipalityName}&apos;s officers while the alert is active.</Notice>
          )}
          <AlertList
            people={people}
            selectedId={person?.ok ? person.data.personId : null}
            hrefFor={alert.sealed ? null : (pid) => query({ person: pid, filter })}
          />
          <p className={styles.printFoot}>Printed {when(new Date().toISOString())}. Confidential: personal data released for this flood alert only.</p>
        </section>
        <aside className={styles.side} data-print="hide">
          {person?.ok ? (
            <PersonPanel alertId={alert.id} person={person.data} municipalityName={alert.municipalityName} closeHref={query({ filter })} />
          ) : (
            <>
              {person && !person.ok && <Notice tone="error">{person.error.message}</Notice>}
              <AlertMap alert={alert} selectedId={null} />
            </>
          )}
        </aside>
      </div>
    </>
  );
};

export default AlertPage;
