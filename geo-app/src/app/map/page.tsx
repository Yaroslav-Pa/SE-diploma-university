import MapWrapper from '@/components/map/MapWrapper'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
            <form action="/auth/logout" method="post">
              {/* Note: I'll use a direct action or an actual link since a form action would require setup. Let's just link to /my-pois */}
              <Link 
                href="/my-pois"
                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm hover:-translate-y-0.5 transition-transform"
              >
                My POIs
              </Link>
            </form>
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

      {/* Floating Action Button for creating new POI */}
      {user && (
        <div className="absolute bottom-8 right-8 z-[1000]">
          <Link 
            href="/poi/create"
            className="flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-full shadow-xl hover:bg-emerald-600 hover:scale-110 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      )}

      {/* Map */}
      <MapWrapper />
    </div>
  )
}
