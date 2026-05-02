'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getPoisInBounds, Poi } from '@/app/actions/poi'

// Fix for default leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ setBounds }: { setBounds: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
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

export default function InteractiveMap() {
  const [pois, setPois] = useState<Poi[]>([])
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09]) // Default London
  const [loadingLoc, setLoadingLoc] = useState(true)

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
    <div className="h-screen w-full relative z-0">
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
        <MapEvents setBounds={setBounds} />
        
        {pois.map(poi => {
          // Fallback parsing just in case Supabase returns string GeoJSON instead of object
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
            <Marker key={poi.id} position={[lat, lng]}>
              <Popup>
                <div className="flex flex-col gap-1 min-w-[200px]">
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
    </div>
  )
}
