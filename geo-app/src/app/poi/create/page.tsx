import PoiFormWrapper from '@/components/poi/PoiFormWrapper'
import Link from 'next/link'

export default function CreatePoiPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-4">
        <Link 
          href="/map" 
          className="bg-white dark:bg-slate-800 px-4 py-2 rounded-md shadow text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          &larr; Back to Map
        </Link>
      </div>
      <PoiFormWrapper />
    </div>
  )
}
