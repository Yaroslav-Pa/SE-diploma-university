import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { deletePoi } from '@/app/actions/poi'

export default async function MyPoisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: pois } = await supabase
    .from('pois')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My POIs</h1>
      </div>

      {pois && pois.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pois.map((poi) => (
            <div key={poi.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-100 dark:border-slate-800 p-6 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                {poi.category}
              </div>
              <h3 className="text-xl font-bold mb-2 pr-16 leading-tight">{poi.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{poi.description}</p>

              <div className="text-xs text-gray-500 mb-4 bg-gray-100 dark:bg-slate-800 p-2 rounded">
                <p><strong>Start:</strong> {poi.start_date ? new Date(poi.start_date).toLocaleString() : 'N/A'}</p>
                <p><strong>End:</strong> {poi.end_date ? new Date(poi.end_date).toLocaleString() : 'N/A'}</p>
                <p className="mt-1">👍 {poi.upvotes} | 👎 {poi.downvotes}</p>
              </div>

              <div className="flex gap-2">
                <Link href={`/map?poi=${poi.id}`} className="flex-1 flex items-center justify-center text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-semibold transition-colors">
                  View Details
                </Link>
                <form action={async () => {
                  'use server';
                  await deletePoi(poi.id);
                }} className="flex-1">
                  <button type="submit" className="w-full bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-md text-sm font-semibold transition-colors">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-12 text-center">
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-4">You haven&apos;t created any POIs yet.</h3>
          <Link
            href="/map"
            className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold hover:bg-emerald-600 transition-colors"
          >
            Go to Map to Create a POI
          </Link>
        </div>
      )}
    </div>
  )
}
