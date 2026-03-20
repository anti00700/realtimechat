

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Always there.",
    description:
      "Whether it's a quick check-in or a long overdue conversation — the people you care about are one tap away.",
  },
  {
    title: "Just talk.",
    description:
      "No clutter. No noise. Open a chat and say what you mean. It feels like the other person is right there.",
  },
  {
    title: "Share the moment.",
    description:
      "Send a photo, a thought, a reaction. The things that make conversations real — all in one place.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-sm">
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-black tracking-tighter text-black"
          >
            batchit
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-black hover:bg-black/5 px-6 py-5 text-base"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-black text-white hover:bg-black/80 px-6 py-5 text-base rounded-full"
            >
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-6 pt-28 pb-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-widest uppercase text-black/40 mb-6">
              For the people who matter
            </p>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-8 text-black">
              Talk to
              <br />
              someone.
            </h1>

            <p className="text-xl text-black/50 max-w-lg leading-relaxed mb-10">
              Batchit is where real conversations happen. No algorithms. No feeds. 
              Just you and the people you actually want to talk to.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                asChild
                className="bg-black text-white hover:bg-black/80 rounded-full px-10 py-6 text-base"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-black/20 text-black hover:bg-black/5 hover:text-black rounded-full px-10 py-6 text-base"
              >
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── SEPARATOR ── */}
        <div className="max-w-5xl mx-auto px-6">
          <Separator className="bg-black/8" />
        </div>

        {/* ── FEATURE ROWS ── */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, i) => (
              <div key={feature.title} className="flex flex-col gap-3">
                <span className="text-xs font-medium text-black/30 tabular-nums">
                  0{i + 1}
                  {/* Decorative number — 01, 02, 03.
                      tabular-nums: monospaced number rendering, stays aligned. */}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-black">
                  {feature.title}
                </h3>
                <p className="text-sm text-black/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEPARATOR ── */}
        <div className="max-w-5xl mx-auto px-6">
          <Separator className="bg-black/8" />
        </div>

        {/* ── BOTTOM CTA ── */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-black">
            Someone is waiting
            <br />
            to hear from you.
          </h2>
          <p className="text-black/40 mb-10 text-base">
            Takes 30 seconds to join.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-black text-white hover:bg-black/80 rounded-full px-12 py-6 text-base"
          >
            <Link href="/register" className="flex items-center gap-2">
              Create your account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-black/8 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-black tracking-tighter text-black">
            batchit
          </span>
          <span className="text-xs text-black/30">
            © 2026 Batchit. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  );
}