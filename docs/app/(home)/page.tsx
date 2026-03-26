import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16 sm:px-10">
      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.95fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-fd-muted-foreground">
            Drizzle ORM localization
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-6xl">
            Documentation for multilingual Drizzle schemas without giving up type safety.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-fd-muted-foreground">
            drizzle-i18n gives you two practical strategies: normalized translation
            tables or inline JSON locale maps. The docs cover setup, querying,
            locale typing, and mutation helpers for PostgreSQL, MySQL, and SQLite.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs"
              className="rounded-full bg-fd-foreground px-5 py-3 text-sm font-medium text-fd-background transition hover:opacity-90"
            >
              Open docs
            </Link>
            <Link
              href="/docs/getting-started"
              className="rounded-full border border-fd-border px-5 py-3 text-sm font-medium text-fd-foreground transition hover:bg-fd-card"
            >
              Quick start
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-fd-border bg-fd-card/85 p-6 shadow-sm backdrop-blur">
          <div className="rounded-2xl border border-fd-border bg-fd-background p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-fd-muted-foreground">
              Choose a strategy
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-fd-border p-4">
                <h2 className="font-medium text-fd-foreground">Translation table</h2>
                <p className="mt-2 text-sm leading-7 text-fd-muted-foreground">
                  Best for relational queries, normalized schemas, and missing-translation reporting.
                </p>
              </div>
              <div className="rounded-2xl border border-fd-border p-4">
                <h2 className="font-medium text-fd-foreground">JSON column</h2>
                <p className="mt-2 text-sm leading-7 text-fd-muted-foreground">
                  Best for compact schemas and per-locale reads or partial updates on a single row.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            href: '/docs/getting-started',
            title: 'Getting started',
            body: 'Install the package, pick a dialect entry point, and wire your first localized schema.',
          },
          {
            href: '/docs/translation-table',
            title: 'Translation table',
            body: 'Generate companion translation tables and query localized rows without manual join plumbing.',
          },
          {
            href: '/docs/json-columns',
            title: 'JSON columns',
            body: 'Store locale maps on the parent row and extract or update one locale at a time.',
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-[1.5rem] border border-fd-border bg-fd-card/80 p-6 transition hover:-translate-y-0.5 hover:border-fd-foreground/20 hover:bg-fd-card"
          >
            <h2 className="text-lg font-medium text-fd-foreground">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-fd-muted-foreground">{card.body}</p>
            <span className="mt-5 inline-flex text-sm font-medium text-fd-foreground">
              Explore
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
