export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">OCD Projets</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Le projet est prêt. Commence par modifier{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          src/app/page.tsx
        </code>
        .
      </p>
    </main>
  );
}
