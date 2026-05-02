'use client'

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export default function ToastNotification({ message, type = 'error' }: { message?: string, type?: 'error' | 'success' }) {
  const shown = useRef(false)
  
  useEffect(() => {
    if (message && !shown.current) {
      if (type === 'error') {
        toast.error(message, { duration: 5000 })
      } else {
        toast.success(message, { duration: 5000 })
      }
      shown.current = true
    }
  }, [message, type])
  
  return null
}
