'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Poi } from '@/app/actions/poi'
import { Search, X, MapPin } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const CATEGORIES = [
  { value: 'fair', label: 'Fair', emoji: '🎪', activeCls: 'bg-purple-500 text-white border-purple-500' },
  { value: 'sale', label: 'Sale', emoji: '🏷️', activeCls: 'bg-red-500 text-white border-red-500' },
  { value: 'opening', label: 'Opening', emoji: '🎉', activeCls: 'bg-yellow-500 text-black border-yellow-500' },
  { value: 'event', label: 'Event', emoji: '📅', activeCls: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'other', label: 'Other', emoji: '📍', activeCls: 'bg-gray-500 text-white border-gray-500' },
]

const INACTIVE_CHIP = 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'

interface MapFilterBarProps {
  pois: Poi[]
  onLocationSelect: (lat: number, lng: number) => void
  filteredCount: number
  totalCount: number
}

export default function MapFilterBar({ pois, onLocationSelect, filteredCount, totalCount }: MapFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '')
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isGeoLoading, setIsGeoLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchParamsRef = useRef(searchParams)
  useEffect(() => { searchParamsRef.current = searchParams }, [searchParams])

  const activeCats = searchParams.get('cat')?.split(',').filter(Boolean) ?? []

  // Close dropdown on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowDropdown(true)

    // Debounce URL q param update (400ms)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (value) params.set('q', value)
      else params.delete('q')
      router.replace(`/map?${params.toString()}`, { scroll: false })
    }, 400)

    // Debounce Nominatim geocoding (400ms, min 3 chars)
    if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current)
    if (value.length >= 3) {
      setIsGeoLoading(true)
      geoDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=0`,
            { headers: { 'User-Agent': 'geo-app/1.0' } }
          )
          const data: NominatimResult[] = await res.json()
          setLocationResults(data)
        } catch {
          setLocationResults([])
        } finally {
          setIsGeoLoading(false)
        }
      }, 400)
    } else {
      setLocationResults([])
      setIsGeoLoading(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    setLocationResults([])
    setShowDropdown(false)
    const params = new URLSearchParams(searchParamsRef.current.toString())
    params.delete('q')
    router.replace(`/map?${params.toString()}`, { scroll: false })
  }

  const toggleCategory = (cat: string) => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    const current = params.get('cat')?.split(',').filter(Boolean) ?? []
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]
    if (next.length > 0) params.set('cat', next.join(','))
    else params.delete('cat')
    router.replace(`/map?${params.toString()}`, { scroll: false })
  }

  const clearAllCats = () => {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    params.delete('cat')
    router.replace(`/map?${params.toString()}`, { scroll: false })
  }

  const handlePoiSelect = (poi: Poi) => {
    try {
      const loc = typeof poi.location === 'string' ? JSON.parse(poi.location) : poi.location
      if (loc?.coordinates) {
        const [lng, lat] = loc.coordinates as [number, number]
        onLocationSelect(lat, lng)
      }
    } catch { /* ignore parse errors */ }
    const params = new URLSearchParams(searchParamsRef.current.toString())
    params.set('poi', poi.id)
    router.push(`/map?${params.toString()}`, { scroll: false })
    setShowDropdown(false)
  }

  const handleLocationSelect = (result: NominatimResult) => {
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon))
    setShowDropdown(false)
  }

  const poiSuggestions = inputValue.length >= 2
    ? pois.filter(p => p.title.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 4)
    : []

  const hasDropdownContent = poiSuggestions.length > 0 || locationResults.length > 0 || isGeoLoading
  const isFiltered = filteredCount !== totalCount

  return (
    <div ref={containerRef} className="flex flex-col">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
        {/* Search input row */}
        <div className="flex items-center px-3 pt-2.5 pb-1.5 gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
            onKeyDown={e => e.key === 'Escape' && setShowDropdown(false)}
            placeholder="Search events, places..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-200 min-w-0"
          />
          {isGeoLoading && (
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {inputValue && (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category chips row */}
        <div className="flex items-center gap-1.5 px-3 pb-2.5 flex-wrap">
          <button
            onClick={clearAllCats}
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
              activeCats.length === 0
                ? 'bg-blue-600 text-white border-blue-600'
                : INACTIVE_CHIP
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                activeCats.includes(cat.value) ? cat.activeCls : INACTIVE_CHIP
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
          {isFiltered && (
            <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap font-medium">
              {filteredCount}/{totalCount} shown
            </span>
          )}
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && hasDropdownContent && (
        <div className="mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 max-h-64 overflow-y-auto">
          {poiSuggestions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-100 dark:border-slate-700">
                POIs
              </div>
              {poiSuggestions.map(poi => (
                <button
                  key={poi.id}
                  onClick={() => handlePoiSelect(poi)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 transition-colors"
                >
                  <span className="shrink-0 text-base">
                    {CATEGORIES.find(c => c.value === poi.category)?.emoji ?? '📍'}
                  </span>
                  <span className="truncate">{poi.title}</span>
                </button>
              ))}
            </div>
          )}

          {(locationResults.length > 0 || isGeoLoading) && (
            <div>
              <div className={`px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-100 dark:border-slate-700 ${poiSuggestions.length > 0 ? 'border-t' : ''}`}>
                Locations
              </div>
              {isGeoLoading && locationResults.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </div>
              ) : (
                locationResults.map(result => (
                  <button
                    key={result.place_id}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{result.display_name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
