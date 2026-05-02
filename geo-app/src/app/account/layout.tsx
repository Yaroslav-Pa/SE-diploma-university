import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountNav from './AccountNav'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-6 flex flex-col">
        <Link href="/map" className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-8 inline-block">
          &larr; Back to Map
        </Link>
        <h2 className="text-2xl font-bold mb-6">Account</h2>
        <AccountNav />
      </aside>
      <main className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
