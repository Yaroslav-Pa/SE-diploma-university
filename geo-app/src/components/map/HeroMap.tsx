'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const DEMO_POIS = [
  { lat: 48.8566, lng: 2.3522, cat: 'fair', emoji: '🎪' },
  { lat: 48.8606, lng: 2.3376, cat: 'opening', emoji: '🎉' },
  { lat: 48.8530, lng: 2.3499, cat: 'sale', emoji: '🏷️' },
  { lat: 48.8650, lng: 2.3210, cat: 'event', emoji: '📅' },
  { lat: 48.8490, lng: 2.3600, cat: 'other', emoji: '📍' },
  { lat: 48.8700, lng: 2.3450, cat: 'sale', emoji: '🏷️' },
  { lat: 48.8440, lng: 2.3300, cat: 'fair', emoji: '🎪' },
  { lat: 48.8580, lng: 2.3700, cat: 'event', emoji: '📅' },
  { lat: 48.8720, lng: 2.3100, cat: 'opening', emoji: '🎉' },
  { lat: 48.8400, lng: 2.3550, cat: 'other', emoji: '📍' },
  { lat: 48.8550, lng: 2.2950, cat: 'sale', emoji: '🏷️' },
  { lat: 48.8680, lng: 2.3650, cat: 'fair', emoji: '🎪' },
  { lat: 48.8460, lng: 2.3150, cat: 'event', emoji: '📅' },
  { lat: 48.8610, lng: 2.3800, cat: 'opening', emoji: '🎉' },
  { lat: 48.8750, lng: 2.3350, cat: 'sale', emoji: '🏷️' },
]

const catColors: Record<string, string> = {
  fair: '#a855f7',
  sale: '#ef4444',
  opening: '#eab308',
  event: '#10b981',
  other: '#6b7280',
}

function getDemoIcon(cat: string, emoji: string) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background:${catColors[cat] || '#3b82f6'};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);opacity:0.9;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })
}

function SlowPan() {
  const map = useMap()
  const dirRef = useRef({ lat: 0.0001, lng: 0.00025 })
  
  useEffect(() => {
    const interval = setInterval(() => {
      const center = map.getCenter()
      map.panTo(
        [center.lat + dirRef.current.lat, center.lng + dirRef.current.lng],
        { animate: true, duration: 2, easeLinearity: 1 }
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [map])

  return null
}

export default function HeroMap() {
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={[48.8566, 2.3400]}
        zoom={13}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
        style={{ cursor: 'default' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <SlowPan />
        {DEMO_POIS.map((poi, i) => (
          <Marker
            key={i}
            position={[poi.lat, poi.lng]}
            icon={getDemoIcon(poi.cat, poi.emoji)}
            interactive={false}
          />
        ))}
      </MapContainer>
    </div>
  )
}
