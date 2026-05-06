'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getPoisInBounds, Poi, createPoi } from '@/app/actions/poi'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import PoiDetailPanel from '@/components/map/PoiDetailPanel'
import MapFilterBar from '@/components/map/MapFilterBar'

const getCategoryIcon = (category: string) => {
  let iconHtml = '📍';
  let bgColor = 'bg-blue-500';
  switch (category) {
    case 'fair': iconHtml = '🎪'; bgColor = 'bg-purple-500'; break;
    case 'sale': iconHtml = '🏷️'; bgColor = 'bg-red-500'; break;
    case 'opening': iconHtml = '🎉'; bgColor = 'bg-yellow-500'; break;
    case 'event': iconHtml = '📅'; bgColor = 'bg-emerald-500'; break;
    case 'other': iconHtml = '📍'; bgColor = 'bg-gray-500'; break;
  }
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="${bgColor} text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg text-xl border-2 border-white">${iconHtml}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })
}

const NewPoiIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg text-xl border-2 border-white animate-bounce">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

function MapEvents({
  setBounds,
  isCreating,
  setNewPoiLocation
}: {
  setBounds: React.Dispatch<React.SetStateAction<L.LatLngBounds | null>>,
  isCreating: boolean,
  setNewPoiLocation: (loc: [number, number] | null) => void
}) {
  const map = useMap()
  const mapRef = useRef(map)
  const setBoundsRef = useRef(setBounds)
  const isCreatingRef = useRef(isCreating)
  const setNewPoiLocationRef = useRef(setNewPoiLocation)

  useEffect(() => { mapRef.current = map }, [map])
  useEffect(() => { setBoundsRef.current = setBounds }, [setBounds])
  useEffect(() => { isCreatingRef.current = isCreating }, [isCreating])
  useEffect(() => { setNewPoiLocationRef.current = setNewPoiLocation }, [setNewPoiLocation])

  useEffect(() => {
    const onMoveEnd = () => {
      const newBounds = mapRef.current.getBounds()
      setBoundsRef.current(prev => (prev?.equals(newBounds) ? prev : newBounds))
      localStorage.setItem('mapPos', JSON.stringify({
        lat: mapRef.current.getCenter().lat,
        lng: mapRef.current.getCenter().lng,
        zoom: mapRef.current.getZoom()
      }))
    }
    const onClick = (e: L.LeafletMouseEvent) => {
      if (isCreatingRef.current) {
        setNewPoiLocationRef.current([e.latlng.lat, e.latlng.lng])
      }
    }

    setBoundsRef.current(prev => {
      const b = mapRef.current.getBounds()
      return prev?.equals(b) ? prev : b
    })
    mapRef.current.on('moveend', onMoveEnd)
    mapRef.current.on('click', onClick)
    return () => {
      mapRef.current.off('moveend', onMoveEnd)
      mapRef.current.off('click', onClick)
    }
  }, [])

  return null
}

function UpdateCenter({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()

  useEffect(() => {
    const stopFly = () => { map.stop() }
    map.on('dragstart', stopFly)
    return () => { map.off('dragstart', stopFly) }
  }, [map])

  useEffect(() => {
    const currentCenter = map.getCenter()
    if (Math.abs(currentCenter.lat - center[0]) > 0.001 || Math.abs(currentCenter.lng - center[1]) > 0.001 || map.getZoom() !== zoom) {
      map.flyTo(center, zoom, { duration: 1.5 })
    }
  }, [center, map, zoom])
  return null
}

import imageCompression from 'browser-image-compression'

// ... existing code down to PoiCreationModal

function PoiCreationModal({
  location,
  onClose,
  onSuccess
}: {
  location: [number, number],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [coverIndex, setCoverIndex] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)

    // Combine split date + time fields into datetime strings
    const startDateVal = formData.get('startDate_date') as string
    const startTimeVal = (formData.get('startDate_time') as string)
    const endDateVal = formData.get('endDate_date') as string
    const endTimeVal = (formData.get('endDate_time') as string)

    if (!endDateVal) {
      toast.error("End Date is required")
      return
    }

    if (!endTimeVal) {
      toast.error("End Time is required")
      return
    }

    const startDate = startDateVal ? `${startDateVal}T${startTimeVal}` : ''
    const endDate = endDateVal ? `${endDateVal}T${endTimeVal}` : ''

    // Overwrite hidden fields
    formData.set('startDate', startDate)
    formData.set('endDate', endDate)

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Start Date cannot be after End Date")
      return
    }

    setIsSubmitting(true)
    try {
      formData.append('lat', location[0].toString())
      formData.append('lng', location[1].toString())

      // Reorder photos so cover is first
      const orderedPhotos = [...photos]
      if (orderedPhotos.length > 0 && coverIndex !== 0) {
        const cover = orderedPhotos.splice(coverIndex, 1)[0]
        orderedPhotos.unshift(cover)
      }

      // Compress and append photos
      for (const file of orderedPhotos) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        })
        formData.append('images', compressedFile)
      }

      await createPoi(formData)
      toast.success("Event created successfully!")
      onSuccess()
    } catch (err) {
      console.error(err)
      toast.error("Failed to create event")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="absolute bottom-24 right-8 z-[2000] w-[420px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 pointer-events-auto overflow-y-auto max-h-[75vh]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Create New Event</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl font-bold">&times;</button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required name="title" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm" placeholder="Title (e.g., Grand Opening)" />
        <textarea name="description" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm min-h-[60px]" placeholder="Description..." />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-[10px] uppercase text-gray-500">Add Photos</label>
            {photos.length > 0 && (
              <button type="button" onClick={() => { setPhotos([]); setCoverIndex(0); }} className="text-[10px] text-red-500 font-bold hover:underline">
                Clear All
              </button>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || [])
              setPhotos(prev => [...prev, ...newFiles])
              e.target.value = ''
            }}
            className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {photos.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {photos.map((file, idx) => (
                <div key={idx} className="relative shrink-0 w-16 h-16 cursor-pointer group">
                  <img onClick={() => setCoverIndex(idx)} src={URL.createObjectURL(file)} alt="preview" className={`w-full h-full object-cover rounded-md border-2 transition-colors ${coverIndex === idx ? 'border-emerald-500' : 'border-transparent'}`} />
                  {coverIndex === idx && (
                    <div className="absolute top-1 left-1 bg-emerald-500 text-white rounded-full p-0.5 shadow pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                  {coverIndex !== idx && (
                    <div onClick={() => setCoverIndex(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold text-center p-1 rounded-md transition-opacity leading-none">Set Cover</div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotos(prev => prev.filter((_, i) => i !== idx))
                      if (coverIndex === idx) setCoverIndex(0)
                      else if (coverIndex > idx) setCoverIndex(coverIndex - 1)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <select required name="category" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm">
          <option value="fair" className="text-black">Fair 🎪</option>
          <option value="sale" className="text-black">Sale 🏷️</option>
          <option value="opening" className="text-black">Grand Opening 🎉</option>
          <option value="event" className="text-black">Temporary Event 📅</option>
          <option value="other" className="text-black">Other 📍</option>
        </select>

        {/* Start Date */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Start Date</span>
            <span className="ml-auto text-[9px] text-gray-400 italic">optional</span>
          </div>
          <div className="flex gap-2 px-3 pb-2.5">
            <input
              type="date"
              max="9999-12-31"
              name="startDate_date"
              className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all cursor-pointer"
            />
            <input
              type="time"
              name="startDate_time"
              className="w-[120px] shrink-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all cursor-pointer"
            />
          </div>
          <input type="hidden" name="startDate" id="startDateHidden" />
        </div>

        {/* End Date */}
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">End Date</span>
            <span className="ml-auto text-[9px] font-bold text-rose-400">required</span>
          </div>
          <div className="flex gap-2 px-3 pb-2.5">
            <input
              type="date"
              max="9999-12-31"
              name="endDate_date"
              required
              className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all cursor-pointer"
            />
            <input
              type="time"
              name="endDate_time"
              required
              className="w-[120px] shrink-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all cursor-pointer"
            />
          </div>
          <input type="hidden" name="endDate" id="endDateHidden" />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-emerald-500 text-white font-bold py-2 rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}

export default function InteractiveMap({ userId, isAdmin }: { userId?: string; isAdmin?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pois, setPois] = useState<Poi[]>([])
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)

  const [userLocation, setUserLocation] = useState<[number, number]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mapPos')
      if (saved) {
        try {
          const { lat, lng } = JSON.parse(saved)
          return [lat, lng]
        } catch (e) { }
      }
    }
    return [51.505, -0.09] // Default London
  })

  const [mapZoom, setMapZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mapPos')
      if (saved) {
        try {
          const { zoom } = JSON.parse(saved)
          return zoom
        } catch (e) { }
      }
    }
    return 13
  })

  const [loadingLoc, setLoadingLoc] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mapPos')) return false
    return true
  })

  // Create mode state
  const [isCreating, setIsCreating] = useState(false)
  const [newPoiLocation, setNewPoiLocation] = useState<[number, number] | null>(null)
  const [centeredPoiId, setCenteredPoiId] = useState<string | null>(null)

  const selectedPoiId = searchParams.get('poi')
  const searchQuery = searchParams.get('q') ?? ''
  const activeCats = searchParams.get('cat')?.split(',').filter(Boolean) ?? []

  const filteredPois = pois.filter(poi => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!poi.title.toLowerCase().includes(q) && !poi.description?.toLowerCase().includes(q)) return false
    }
    if (activeCats.length > 0 && !activeCats.includes(poi.category)) return false
    return true
  })

  useEffect(() => {
    if (selectedPoiId) {
      if (selectedPoiId !== centeredPoiId) {
        const poi = pois.find(p => p.id === selectedPoiId)
        if (poi) {
          let coords = [0, 0]
          try {
            const loc = typeof poi.location === 'string' ? JSON.parse(poi.location) : poi.location
            if (loc && loc.coordinates) {
              coords = loc.coordinates
              setUserLocation([coords[1], coords[0]])
              setMapZoom(15)
              setCenteredPoiId(selectedPoiId) // Mark as centered
            }
          } catch (e) { }
        }
      }
    } else {
      setCenteredPoiId(null)
    }
  }, [selectedPoiId, pois, centeredPoiId])

  const handleCloseDetail = () => {
    setCenteredPoiId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('poi')
    router.replace(`/map?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (!loadingLoc) return // already loaded from localstorage

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          setLoadingLoc(false)
        },
        (error) => {
          console.warn("Unable to get location or permission denied:", error.message)
          setLoadingLoc(false)
        }
      )
    } else {
      setLoadingLoc(false)
    }
  }, [loadingLoc])

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          setMapZoom(15)
        },
        () => {
          // Silently fail — location may not be available
          console.warn('Geolocation not available')
        }
      )
    }
  }

  const fetchPois = useCallback(async () => {
    if (!bounds) return
    try {
      // Calculate bounds properly handling antimeridian and zooming out
      let minLng = bounds.getWest()
      let maxLng = bounds.getEast()
      const minLat = Math.max(-90, bounds.getSouth())
      const maxLat = Math.min(90, bounds.getNorth())

      if (maxLng - minLng >= 360) {
        // If zoomed out to see the whole world, query the whole world
        minLng = -180
        maxLng = 180
      } else {
        // Normalize longitudes to -180..180
        minLng = ((minLng + 180) % 360 + 360) % 360 - 180
        maxLng = ((maxLng + 180) % 360 + 360) % 360 - 180

        // If normalization causes min > max (crossing antimeridian),
        // fallback to querying the whole world for this MVP
        if (minLng > maxLng) {
          minLng = -180
          maxLng = 180
        }
      }

      const data = await getPoisInBounds(minLat, minLng, maxLat, maxLng)
      setPois(data || [])
    } catch (e) {
      console.error(e)
    }
  }, [bounds])

  useEffect(() => {
    fetchPois()
  }, [fetchPois])

  if (loadingLoc) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`h-screen w-full relative ${isCreating && !newPoiLocation ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={userLocation}
        zoom={mapZoom}
        minZoom={6}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <UpdateCenter center={userLocation} zoom={mapZoom} />
        <MapEvents
          setBounds={setBounds}
          isCreating={isCreating}
          setNewPoiLocation={setNewPoiLocation}
        />

        {/* Render New POI Pin if in create mode and location selected */}
        {newPoiLocation && (
          <Marker position={newPoiLocation} icon={NewPoiIcon} />
        )}

        {/* Render existing POIs */}
        {filteredPois.map(poi => {
          let coords = [0, 0]
          try {
            const loc = typeof poi.location === 'string' ? JSON.parse(poi.location) : poi.location
            if (loc && loc.coordinates) {
              coords = loc.coordinates
            }
          } catch (e) { }

          const lat = coords[1]
          const lng = coords[0]
          if (!lat || !lng) return null

          return (
            <Marker key={poi.id} position={[lat, lng]} icon={getCategoryIcon(poi.category)}>
              <Popup>
                <div className="flex flex-col gap-1 min-w-[200px]">
                  {poi.image_urls && poi.image_urls.length > 0 && (
                    <img src={poi.image_urls[0]} alt={poi.title} className="w-full h-24 object-cover rounded mb-1" />
                  )}
                  <h3 className="font-bold text-lg m-0 p-0 leading-tight">{poi.title}</h3>
                  <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded w-fit my-1">
                    {poi.category}
                  </span>
                  <p className="text-sm m-0 p-0 line-clamp-3">{poi.description}</p>
                  <div className="flex justify-between items-center mt-2 border-t pt-2 text-xs text-gray-500 mb-2">
                    <span className="text-emerald-600 font-semibold">👍 {poi.upvotes}</span>
                    <span className="text-rose-600 font-semibold">👎 {poi.downvotes}</span>
                  </div>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('poi', poi.id)
                      router.push(`/map?${params.toString()}`, { scroll: false })
                      setUserLocation([lat, lng])
                      setMapZoom(15)
                      setCenteredPoiId(poi.id)
                    }}
                    className="block w-full text-center bg-blue-600 text-white text-xs font-bold py-1.5 rounded hover:bg-blue-700 transition-colors cursor-pointer border-0"
                  >
                    View Details & Comments
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Filter Bar */}
      <div className="absolute top-2 left-0 right-0 flex justify-center z-[1000] px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl">
          <MapFilterBar
            pois={pois}
            onLocationSelect={(lat, lng) => {
              setUserLocation([lat, lng])
              setMapZoom(14)
            }}
            filteredCount={filteredPois.length}
            totalCount={pois.length}
          />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-8 right-4 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
        {userId && isCreating && !newPoiLocation && (
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-bounce pointer-events-auto border-2 border-emerald-500">
            Click anywhere on the map to drop a pin!
          </div>
        )}
        <div className="flex gap-3 items-center">
          <button
            onClick={handleLocateMe}
            title="Go to my location"
            className="pointer-events-auto group flex items-center gap-2 h-12 px-4 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full shadow-xl hover:scale-105 transition-all border border-gray-200 dark:border-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
              <path fillRule="evenodd" d="M11.99 2a1 1 0 00-1 1v1.07A8.003 8.003 0 004.07 11H3a1 1 0 100 2h1.07a8.003 8.003 0 006.92 6.93V21a1 1 0 102 0v-1.07a8.003 8.003 0 006.93-6.93H21a1 1 0 100-2h-1.07A8.003 8.003 0 0013 4.07V3a1 1 0 00-1.01-1zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold whitespace-nowrap">My Location</span>
          </button>

          {userId && (
            <button
              onClick={() => {
                setIsCreating(!isCreating)
                setNewPoiLocation(null)
              }}
              title={isCreating ? 'Cancel' : 'Create POI'}
              className={`pointer-events-auto group flex items-center gap-2 h-12 px-4 text-white rounded-full shadow-xl hover:scale-105 transition-all ${isCreating ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isCreating ? (
                <>
                  <span className="text-lg font-bold">✕</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Cancel</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-semibold whitespace-nowrap">Create POI</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Creation Modal Overlay */}
      {newPoiLocation && (
        <PoiCreationModal
          location={newPoiLocation}
          onClose={() => setNewPoiLocation(null)}
          onSuccess={() => {
            router.refresh()
            setTimeout(() => {
              fetchPois()
              setNewPoiLocation(null)
              setIsCreating(false)
            }, 500)
          }}
        />
      )}

      {/* POI Detail Panel */}
      {selectedPoiId && (
        <PoiDetailPanel
          poiId={selectedPoiId}
          userId={userId}
          isAdmin={isAdmin}
          onClose={handleCloseDetail}
          onPoiLoaded={(lat, lng) => {
            setUserLocation([lat, lng])
            setMapZoom(15)
          }}
          onPoiDeleted={() => {
            handleCloseDetail()
            setTimeout(() => fetchPois(), 300)
          }}
        />
      )}
    </div>
  )
}
