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

  const imageFiles = formData.getAll('images') as File[]
  const imageUrls: string[] = []

  for (const file of imageFiles) {
    if (file.size === 0) continue
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('poi-images')
      .upload(fileName, file)
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
    } else if (uploadData) {
      const { data: publicUrlData } = supabase.storage.from('poi-images').getPublicUrl(fileName)
      imageUrls.push(publicUrlData.publicUrl)
    }
  }

  const { error } = await supabase.from('comments').insert({
    poi_id: poiId,
    user_id: user.id,
    content,
    image_urls: imageUrls
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

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single()
  const isAdmin = userData?.is_admin ?? false

  const query = supabase.from('comments').delete().eq('id', commentId)
  const { error } = isAdmin ? await query : await query.eq('user_id', user.id)
  if (error) throw new Error('Failed to delete comment')

  revalidatePath('/map')
}

export async function getPoiDetails(poiId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pois')
    .select('*, users!pois_creator_id_fkey(username)')
    .eq('id', poiId)
    .single()
  if (error) {
    console.error('getPoiDetails error:', error)
    throw new Error(`Failed to load POI details: ${error.message}`)
  }
  return data
}
