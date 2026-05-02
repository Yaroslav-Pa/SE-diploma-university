'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useRouter } from 'next/navigation'
import { createPoi } from '@/app/actions/poi'

// Fix for default leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

export default function PoiForm() {
  const router = useRouter()
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!position) {
      alert("Please select a location on the map.")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.append('lat', position.lat.toString())
      formData.append('lng', position.lng.toString())
      
      const res = await createPoi(formData)
      if (res.success) {
        router.push('/map')
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create POI")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto mt-8 bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input required name="title" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Grand Opening" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Details about the event..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select required name="category" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
              <option value="fair" className="text-black">Fair</option>
              <option value="sale" className="text-black">Sale</option>
              <option value="opening" className="text-black">Grand Opening</option>
              <option value="event" className="text-black">Temporary Event</option>
              <option value="other" className="text-black">Other</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="datetime-local" name="startDate" className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="datetime-local" name="endDate" required className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            * Click on the map to set the event location
          </p>
          <button 
            type="submit" 
            disabled={isSubmitting || !position}
            className="mt-4 bg-emerald-500 text-white font-bold py-3 rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
      
      <div className="flex-1 min-h-[400px] bg-slate-100 z-0">
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    </div>
  )
}
