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

  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('username', username)

  if (count && count > 0) {
    redirect('/register?message=' + encodeURIComponent('Username is already taken'))
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/register?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      username: username,
    })
    
    if (profileError) {
      console.error('Profile creation failed:', profileError)
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
