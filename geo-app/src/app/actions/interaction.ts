'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(poiId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const content = formData.get('content') as string
  if (!content) throw new Error('Comment content is required')

  const { error } = await supabase.from('comments').insert({
    poi_id: poiId,
    user_id: user.id,
    content
  })

  if (error) {
    console.error('Failed to add comment', error)
    throw new Error('Failed to add comment')
  }

  revalidatePath(`/poi/${poiId}`)
}

export async function getComments(poiId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, users(username, avatar_url)')
    .eq('poi_id', poiId)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Failed to load comments')
  return data
}

export async function toggleReaction(poiId: string, type: 'upvote' | 'downvote') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use the RPC function we defined in schema to atomically update the reaction
  const { error } = await supabase.rpc('toggle_reaction', {
    p_poi_id: poiId,
    p_type: type
  })

  if (error) {
    console.error('Failed to toggle reaction', error)
    // Fallback if RPC doesn't exist? Since we provided the schema, we assume it does.
    throw new Error('Failed to toggle reaction')
  }

  revalidatePath(`/poi/${poiId}`)
  revalidatePath('/map')
}

export async function getPoiDetails(poiId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pois')
    .select('*, users(username)')
    .eq('id', poiId)
    .single()
    
  if (error) throw new Error('Failed to load POI details')
  return data
}
