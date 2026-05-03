'use client'

import dynamic from 'next/dynamic'

const HeroMap = dynamic(() => import('@/components/map/HeroMap'), { ssr: false })

export default function HeroMapWrapper() {
  return <HeroMap />
}
