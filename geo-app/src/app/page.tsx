import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroMapWrapper from "@/components/map/HeroMapWrapper";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Map Background */}
      <HeroMapWrapper />

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-900/90 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center p-6 md:p-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              G
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Geo-Social</span>
          </div>
          {!user && (
            <nav className="flex gap-3">
              <Link
                href="/login"
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-white/20 transition-all"
              >
                Sign Up
              </Link>
            </nav>
          )}
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="flex flex-col items-center gap-6 max-w-3xl">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live local events near you
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05]">
              Discover What&apos;s
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                Happening Nearby
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 font-light max-w-xl leading-relaxed">
              Explore fairs, sales, grand openings, and temporary events
              — all pinned on a live, interactive map.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 mt-4 flex-col sm:flex-row items-center">
              <Link
                href="/map"
                className="group relative rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-10 py-4 font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all"
              >
                Explore Map
                <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl w-full">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 text-left hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">🎪</div>
              <h3 className="text-white font-bold text-sm mb-1">Local Fairs & Markets</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Discover pop-up markets, seasonal fairs, and community gatherings.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 text-left hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">🏷️</div>
              <h3 className="text-white font-bold text-sm mb-1">Sales & Discounts</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Never miss a flash sale or a limited-time discount in your area.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 text-left hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="text-white font-bold text-sm mb-1">Grand Openings</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Be the first to know when new shops, cafes, and venues open nearby.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-slate-500 text-sm">
          Geo-Social MVP &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
