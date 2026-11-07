import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/wizard";
import { getPackage } from "@/lib/packages";

export const metadata: Metadata = { title: "Réserver mon live" };

async function Wizard({ searchParams }: PageProps<"/reserver">) {
  const sp = await searchParams;
  const mode = sp.mode === "presentiel" || sp.mode === "distance" ? sp.mode : undefined;
  const pkg = typeof sp.package === "string" && getPackage(sp.package) ? sp.package : undefined;
  return <BookingWizard key={mode ?? "x"} initialMode={mode} suggestedPackage={pkg} />;
}

export default function ReserverPage(props: PageProps<"/reserver">) {
  return (
    <Suspense fallback={<div className="h-17 bg-coal-900" />}>
      <Wizard {...props} />
    </Suspense>
  );
}
