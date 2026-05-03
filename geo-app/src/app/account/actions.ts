'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateEmail(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    redirect('/account?message=Email is required')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })

  if (error) {
    redirect('/account?message=' + encodeURIComponent('Failed to update email: ' + error.message))
  }

  redirect('/account?message=Email updated successfully')
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password !== confirmPassword) {
    redirect('/account?message=Passwords do not match')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/account?message=' + encodeURIComponent('Failed to update password: ' + error.message))
  }

  redirect('/account?message=Password updated successfully')
}
