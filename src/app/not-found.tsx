import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Page introuvable</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Cette page n&apos;existe pas.</p>
      <Link href="/" className="underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
