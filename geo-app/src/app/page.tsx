import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <main className="flex flex-col items-center gap-8 max-w-3xl text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Discover Local Events
        </h1>
        <p className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl">
          Find exclusive discounts, grand openings, and temporary events near you in real-time.
        </p>

        <div className="flex gap-4 mt-8 flex-col sm:flex-row">
          {user ? (
            <Link
              href="/map"
              className="rounded-full bg-blue-600 text-white px-8 py-3 font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
            >
              Open Map
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-white/10 border border-white/20 text-white px-8 py-3 font-semibold hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 text-white px-8 py-3 font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </main>

      <footer className="absolute bottom-8 text-slate-500 text-sm">
        Geo-Social MVP &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
