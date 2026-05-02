import MapWrapper from '@/components/map/MapWrapper'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col">
      {/* Top Navigation Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-[1000] pointer-events-none flex justify-between items-start">
        <Link
          href="/"
          className="pointer-events-auto bg-white/90 dark:bg-black/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-800 font-semibold text-sm hover:-translate-y-0.5 transition-transform"
        >
          Geo-Social
        </Link>

        <div className="pointer-events-auto flex gap-2">
          {user ? (
            <div className="flex gap-2">
              <Link
                href="/my-pois"
                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm hover:-translate-y-0.5 transition-transform"
              >
                My POIs
              </Link>
              <form action={logout}>
                <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm hover:-translate-y-0.5 transition-transform">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm hover:-translate-y-0.5 transition-transform"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Map */}
      <MapWrapper userId={user?.id} />
    </div>
  )
}
