'use client'

import { useState } from 'react'
import { addComment } from '@/app/actions/interaction'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'

export default function CommentForm({ poiId }: { poiId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      for (const file of photos) {
        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
        formData.append('images', compressed)
      }

      await addComment(poiId, formData)
      e.currentTarget.reset()
      setPhotos([])
      toast.success("Comment posted!")
    } catch(err) {
      toast.error("Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea 
        name="content" 
        required 
        placeholder="Write a comment..." 
        className="w-full border rounded-lg px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[100px]" 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-wide">Attach Photos (optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e) => setPhotos(Array.from(e.target.files || []))}
            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
