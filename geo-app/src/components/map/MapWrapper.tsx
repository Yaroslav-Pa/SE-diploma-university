'use client'

import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(
  () => import('@/components/map/InteractiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
)

export default function MapWrapper({ userId }: { userId?: string }) {
  return <InteractiveMap userId={userId} />
}
