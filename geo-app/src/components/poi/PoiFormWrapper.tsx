'use client'

import dynamic from 'next/dynamic'

const PoiForm = dynamic(() => import('@/components/poi/PoiForm'), { ssr: false })

export default function PoiFormWrapper() {
  return <PoiForm />
}
