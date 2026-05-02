'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getPoisInBounds, Poi, createPoi } from '@/app/actions/poi'
import toast from 'react-hot-toast'

// Custom category icons
const getCategoryIcon = (category: string) => {
  let iconHtml = '📍';
  let bgColor = 'bg-blue-500';
  switch(category) {
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
  setBounds: (b: L.LatLngBounds) => void,
  isCreating: boolean,
  setNewPoiLocation: (loc: [number, number] | null) => void 
}) {
  const map = useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => setBounds(map.getBounds()),
    click: (e) => {
      if (isCreating) {
        setNewPoiLocation([e.latlng.lat, e.latlng.lng])
      }
    }
  })
  
  useEffect(() => {
    setBounds(map.getBounds())
  }, [map, setBounds])

  return null
}

function UpdateCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, map.getZoom())
  }, [center, map])
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
  
  const now = new Date()
  const minDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const maxDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().slice(0, 16)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Start Date cannot be after End Date")
      return
    }

    setIsSubmitting(true)
    try {
      formData.append('lat', location[0].toString())
      formData.append('lng', location[1].toString())
      
      // Compress and append photos
      for (const file of photos) {
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
    <div className="absolute bottom-24 right-8 z-[2000] w-[360px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 pointer-events-auto overflow-y-auto max-h-[75vh]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Create New Event</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl font-bold">&times;</button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required name="title" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm" placeholder="Title (e.g., Grand Opening)" />
        <textarea name="description" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm min-h-[60px]" placeholder="Description..." />
        
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Add Photos</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e) => setPhotos(Array.from(e.target.files || []))}
            className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {photos.length > 0 && <span className="text-xs text-emerald-600 mt-1 block">{photos.length} photo(s) selected</span>}
        </div>

        <select required name="category" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm">
          <option value="fair" className="text-black">Fair 🎪</option>
          <option value="sale" className="text-black">Sale 🏷️</option>
          <option value="opening" className="text-black">Grand Opening 🎉</option>
          <option value="event" className="text-black">Temporary Event 📅</option>
          <option value="other" className="text-black">Other 📍</option>
        </select>
        
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase text-gray-500 mb-1">Start Date</label>
            <input type="datetime-local" min={minDate} max={maxDate} name="startDate" className="w-full border rounded-md px-2 py-1.5 bg-transparent dark:border-slate-700 text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase text-gray-500 mb-1">End Date*</label>
            <input type="datetime-local" min={minDate} max={maxDate} name="endDate" required className="w-full border rounded-md px-2 py-1.5 bg-transparent dark:border-slate-700 text-xs" />
          </div>
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

export default function InteractiveMap({ userId }: { userId?: string }) {
  const [pois, setPois] = useState<Poi[]>([])
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09]) // Default London
  const [loadingLoc, setLoadingLoc] = useState(true)
  
  // Create mode state
  const [isCreating, setIsCreating] = useState(false)
  const [newPoiLocation, setNewPoiLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
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
  }, [])

  const fetchPois = useCallback(async () => {
    if (!bounds) return
    try {
      const data = await getPoisInBounds(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast()
      )
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
    <div className={`h-screen w-full relative z-0 ${isCreating && !newPoiLocation ? 'cursor-crosshair' : ''}`}>
      <MapContainer 
        center={userLocation} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <UpdateCenter center={userLocation} />
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
        {pois.map(poi => {
          let coords = [0, 0]
          try {
            const loc = typeof poi.location === 'string' ? JSON.parse(poi.location) : poi.location
            if (loc && loc.coordinates) {
              coords = loc.coordinates
            }
          } catch(e) {}
          
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
                  <a 
                    href={`/poi/${poi.id}`} 
                    className="block text-center bg-blue-600 !text-white text-xs font-bold py-1.5 rounded hover:bg-blue-700 transition-colors no-underline"
                  >
                    View Details & Comments
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating Action Button for Create Mode */}
      {userId && (
        <div className="absolute bottom-8 right-8 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
          {isCreating && !newPoiLocation && (
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-bounce pointer-events-auto border-2 border-emerald-500">
              Click anywhere on the map to drop a pin!
            </div>
          )}
          <button 
            onClick={() => {
              setIsCreating(!isCreating)
              setNewPoiLocation(null)
            }}
            className={`pointer-events-auto flex items-center justify-center w-14 h-14 text-white rounded-full shadow-xl hover:scale-110 transition-all ${isCreating ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isCreating ? (
              <span className="text-2xl font-bold">✕</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Creation Modal Overlay */}
      {newPoiLocation && (
        <PoiCreationModal 
          location={newPoiLocation} 
          onClose={() => setNewPoiLocation(null)} 
          onSuccess={() => {
            fetchPois()
            setNewPoiLocation(null)
            setIsCreating(false)
          }} 
        />
      )}
    </div>
  )
}
