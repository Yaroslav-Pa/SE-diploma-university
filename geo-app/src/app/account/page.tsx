import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { updateUsername, updatePassword } from './actions'
import ToastNotification from '@/components/ToastNotification'

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('username').eq('id', user!.id).single()

  const resolvedParams = searchParams ? await searchParams : {};
  const message = resolvedParams?.message;

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      <ToastNotification
        message={message}
        type={message?.toLowerCase().includes('success') ? 'success' : 'error'}
      />
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Logged in as <span className="font-medium text-gray-700 dark:text-gray-300">@{profile?.username ?? user?.email}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold mb-4">Change Username</h2>
        <form action={updateUsername} className="flex flex-col gap-3 max-w-sm">
          <input type="text" name="username" defaultValue={profile?.username ?? ''} required className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm" placeholder="your_username" />
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-colors">
            Update Username
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>
        <form action={updatePassword} className="flex flex-col gap-3 max-w-sm">
          <input type="password" name="password" placeholder="New Password" required className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm" />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" required className="w-full border rounded-md px-3 py-2 bg-transparent dark:border-slate-700 text-sm" />
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-colors">
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/30 p-6">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your account on this device.</p>
        <form action={logout}>
          <button type="submit" className="bg-rose-100 text-rose-600 font-bold py-2 px-6 rounded-md hover:bg-rose-200 transition-colors">
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
