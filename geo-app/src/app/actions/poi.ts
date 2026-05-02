'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import wkx from 'wkx'

// Helper to parse PostGIS hex WKB to GeoJSON
function parseLocation(loc: any) {
  if (typeof loc === 'string') {
    try {
      const geometry = wkx.Geometry.parse(Buffer.from(loc, 'hex'))
      return geometry.toGeoJSON()
    } catch (e) {
      console.error('Error parsing WKB location:', e)
      return loc
    }
  }
  return loc
}

export interface Poi {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  location: any // In JS, it returns GeoJSON { type: "Point", coordinates: [lng, lat] }
  start_date: string
  end_date: string
  upvotes: number
  downvotes: number
  created_at: string
}

export async function getPoisInBounds(minLat: number, minLng: number, maxLat: number, maxLng: number) {
  const supabase = await createClient()

  // We assume an RPC `get_pois_in_bounds` exists in the database
  // If not, we will fallback to fetching active POIs and filtering on the client for the MVP
  const { data, error } = await supabase.rpc('get_pois_in_bounds', {
    min_lat: minLat,
    min_lng: minLng,
    max_lat: maxLat,
    max_lng: maxLng
  })

  if (error) {
    console.error('Error fetching POIs from RPC, falling back to basic fetch:', error)
    // Fallback if RPC is not installed: Fetch all active and filter in JS (Not optimal, but works for MVP)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('pois')
      .select('*')
      .gt('end_date', new Date().toISOString())
      
    if (fallbackError) {
      throw new Error('Failed to fetch POIs: ' + fallbackError.message)
    }
    
    // Parse locations first
    const processedData = fallbackData.map((poi: Poi) => ({
      ...poi,
      location: parseLocation(poi.location)
    }))

    // Functional filter
    return processedData.filter((poi: Poi) => {
      if (!poi.location || !poi.location.coordinates) return false;
      const [lng, lat] = poi.location.coordinates;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    }) as Poi[];
  }

  // Parse locations for RPC data too
  return data.map((poi: Poi) => ({
    ...poi,
    location: parseLocation(poi.location)
  })) as Poi[]
}

export async function createPoi(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string

  const { error } = await supabase.from('pois').insert({
    creator_id: user.id,
    title,
    description,
    category,
    location: `POINT(${lng} ${lat})`,
    start_date: startDate ? new Date(startDate).toISOString() : null,
    end_date: endDate ? new Date(endDate).toISOString() : null
  })

  if (error) {
    console.error('Failed to create POI:', error)
    throw new Error('Failed to create POI')
  }

  revalidatePath('/map')
  revalidatePath('/my-pois')
  return { success: true }
}

export async function deletePoi(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('pois')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id)

  if (error) throw new Error('Failed to delete POI')
  
  revalidatePath('/map')
  revalidatePath('/my-pois')
}
