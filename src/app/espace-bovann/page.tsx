import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { adminAccess } from "@/server/auth";
import { audienceMap } from "@/server/audience-map";
import { db } from "@/server/db";
import { emailsEnabled, isDemo, usingDefaultPassword } from "@/server/env";
import { getNotificationEmails } from "@/server/settings";
import { Dashboard } from "./dashboard";
import { kpis, toAdmin } from "./data";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Espace Bovann", robots: { index: false } };

async function loadDashboard() {
  const now = Date.now();
  const all = await db.list();
  const rows = all.map((b) => toAdmin(b, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return {
    now,
    rows,
    notificationEmails: await getNotificationEmails(),
    map: audienceMap(all),
  };
}

async function Gate() {
  await connection();
  const { account, signedIn } = await adminAccess();
  if (!signedIn)
    return <LoginForm demo={isDemo && usingDefaultPassword} setup={account === null} />;
  const { now, rows, notificationEmails, map } = await loadDashboard();
  return (
    <Dashboard
      bookings={rows}
      kpis={kpis(rows, now)}
      now={now}
      demo={isDemo}
      emailsEnabled={emailsEnabled}
      notificationEmails={notificationEmails}
      adminEmail={account?.email ?? ""}
      map={map}
    />
  );
}

export default function EspaceBovannPage() {
  return (
    <Suspense fallback={<main className="flex-1 bg-paper" />}>
      <Gate />
    </Suspense>
  );
}
