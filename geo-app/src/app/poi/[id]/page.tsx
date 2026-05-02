import { getPoiDetails, getComments, addComment, toggleReaction } from '@/app/actions/interaction'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PoiDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const resolvedParams = await params;
  const poiId = resolvedParams.id;

  const poi = await getPoiDetails(poiId)
  const comments = await getComments(poiId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Link 
          href="/map" 
          className="w-fit bg-white dark:bg-slate-800 px-4 py-2 rounded-md shadow text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          &larr; Back to Map
        </Link>

        {/* POI Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{poi.title}</h1>
              <span className="text-xs font-bold uppercase bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{poi.category}</span>
            </div>
            
            {/* Reaction Buttons */}
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border dark:border-slate-700">
              <form action={async () => {
                'use server';
                await toggleReaction(poi.id, 'upvote');
              }}>
                <button type="submit" disabled={!user} className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-emerald-100 text-emerald-700 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50">
                  👍 <span className="font-bold">{poi.upvotes}</span>
                </button>
              </form>
              <form action={async () => {
                'use server';
                await toggleReaction(poi.id, 'downvote');
              }}>
                <button type="submit" disabled={!user} className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-rose-100 text-rose-700 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50">
                  👎 <span className="font-bold">{poi.downvotes}</span>
                </button>
              </form>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{poi.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div><strong>Created by:</strong> {poi.users?.username || 'Unknown'}</div>
            <div><strong>Created at:</strong> {new Date(poi.created_at).toLocaleString()}</div>
            <div><strong>Start:</strong> {poi.start_date ? new Date(poi.start_date).toLocaleString() : 'N/A'}</div>
            <div><strong>End:</strong> {poi.end_date ? new Date(poi.end_date).toLocaleString() : 'N/A'}</div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-8">
          <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
          
          <div className="flex flex-col gap-6 mb-8">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-800 uppercase shrink-0">
                  {comment.users?.username?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold">{comment.users?.username || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-gray-500">No comments yet. Be the first!</p>}
          </div>

          {/* Add Comment Form */}
          {user ? (
            <form action={async (formData) => {
              'use server';
              await addComment(poi.id, formData);
            }} className="flex flex-col gap-4">
              <textarea 
                name="content" 
                required 
                placeholder="Write a comment..." 
                className="w-full border rounded-lg px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[100px]" 
              />
              <button type="submit" className="self-end bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">
                Post Comment
              </button>
            </form>
          ) : (
            <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-lg text-center text-gray-600">
              Please <Link href="/login" className="text-blue-600 hover:underline font-medium">sign in</Link> to leave a comment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
