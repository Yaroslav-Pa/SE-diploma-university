'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEmail(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })
  
  if (error) {
    throw new Error('Failed to update email: ' + error.message)
  }
  
  revalidatePath('/account')
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  
  if (error) {
    throw new Error('Failed to update password: ' + error.message)
  }
  
  revalidatePath('/account')
}
