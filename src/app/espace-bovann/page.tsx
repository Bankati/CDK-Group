import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { isAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { emailsEnabled, isDemo, usingDefaultPassword } from "@/server/env";
import { recentEmails } from "@/server/notifications";
import { Dashboard } from "./dashboard";
import { kpis, toAdmin } from "./data";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Espace Bovann", robots: { index: false } };

async function loadDashboard() {
  const now = Date.now();
  const rows = (await db.list())
    .map((b) => toAdmin(b, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const emails = emailsEnabled
    ? []
    : recentEmails().map((e) => ({
        to: e.to,
        subject: e.subject,
        text: e.text,
        at: e.at,
        delivered: e.delivered,
        error: e.error,
      }));
  return { now, rows, emails };
}

async function Gate() {
  await connection();
  if (!(await isAdmin())) return <LoginForm demo={usingDefaultPassword} />;
  const { now, rows, emails } = await loadDashboard();
  return (
    <Dashboard
      bookings={rows}
      kpis={kpis(rows, now)}
      now={now}
      demo={isDemo}
      emails={emails}
      emailsEnabled={emailsEnabled}
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
