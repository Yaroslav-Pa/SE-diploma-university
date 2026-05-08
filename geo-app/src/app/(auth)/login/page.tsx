import { login } from '../actions'
import Link from 'next/link'
import ToastNotification from '@/components/ToastNotification'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <ToastNotification 
        message={searchParams?.message} 
        type={searchParams?.message?.includes('successful') ? 'success' : 'error'} 
      />
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{' '}
        Back
      </Link>

      <form
        className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={login}
      >
        <div className="flex flex-col mb-4">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground text-gray-500">Sign in to your account to continue</p>
        </div>

        <label className="text-md font-medium" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6 border-gray-300 dark:border-gray-700"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md font-medium" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6 border-gray-300 dark:border-gray-700"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 mb-2">
          Sign In
        </button>
        <div className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </div>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 text-red-600 text-center rounded-md text-sm">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
