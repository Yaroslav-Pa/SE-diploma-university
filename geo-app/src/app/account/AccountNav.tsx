'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AccountNav() {
  const pathname = usePathname()
  
  const links = [
    { name: 'Settings', href: '/account' },
    { name: 'My POIs', href: '/account/my-pois' }
  ]

  return (
    <nav className="flex md:flex-col gap-2 overflow-x-auto">
      {links.map(link => {
        const isActive = pathname === link.href
        return (
          <Link 
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            {link.name}
          </Link>
        )
      })}
    </nav>
  )
}
