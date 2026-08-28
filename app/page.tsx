import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Blocks, GitBranch, PieChart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-bold tracking-tight">Formic</span>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up free</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
          Build forms that feel effortless.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A configuration-driven form platform: drag-and-drop builder, branching logic,
          full theming, and response analytics — all in one place.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start building <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>

        <div className="mt-24 grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <Feature icon={<Blocks className="h-5 w-5" />} title="12 question types" desc="Choice, rating, scale, text, date, ranking and more, all pluggable." />
          <Feature icon={<GitBranch className="h-5 w-5" />} title="Branching logic" desc="Show, skip, jump or end the form based on any prior answer." />
          <Feature icon={<PieChart className="h-5 w-5" />} title="Response analytics" desc="Completion rate, drop-off, per-question distributions, CSV/JSON export." />
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        Built with Next.js, Supabase, and shadcn/ui.
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
