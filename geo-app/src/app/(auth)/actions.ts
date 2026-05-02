'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/map')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // Note: Assuming email confirmations are disabled for development, or using a trigger.
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/register?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    // Attempt to create public profile. This assumes the user is logged in (email confirm disabled).
    // If it fails due to RLS, it means they are not fully authenticated yet.
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      username: username,
    })
    
    if (profileError) {
      console.error('Profile creation failed:', profileError)
      // We still redirect to let the user know account was created
    }
  }

  if (!data.session) {
    redirect('/login?message=' + encodeURIComponent('Registration successful! Please check your email to confirm your account (or disable email confirmation in Supabase).'))
  }

  revalidatePath('/', 'layout')
  redirect('/map') 
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
