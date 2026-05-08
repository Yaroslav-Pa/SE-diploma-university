'use client';

import { useState, useRef } from 'react';
import { addComment } from '@/app/actions/interaction';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

export default function CommentForm({ poiId }: { poiId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      for (const file of photos) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        formData.append('images', compressed);
      }

      await addComment(poiId, formData);
      formRef.current?.reset();
      setPhotos([]);
      toast.success('Comment posted!');
    } catch (err) {
      console.error('Comment error:', err);
      // The comment still posted so maybe this is an internal NextJS navigation error
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        // ignore
      } else {
        toast.error('Failed to post comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <textarea
        name='content'
        required
        placeholder='Write a comment...'
        className='w-full border rounded-lg px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-25'
      />

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <label className='text-xs text-gray-500 uppercase font-bold tracking-wide'>
              Attach Photos (optional)
            </label>
            {photos.length > 0 && (
              <button
                type='button'
                onClick={() => setPhotos([])}
                className='text-[10px] text-red-500 font-bold hover:underline'
              >
                Clear All
              </button>
            )}
          </div>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || []);
              setPhotos((prev) => [...prev, ...newFiles]);
              e.target.value = '';
            }}
            className='text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400'
          />
          {photos.length > 0 && (
            <div className='flex gap-2 mt-2 overflow-x-auto pb-2'>
              {photos.map((file, idx) => (
                <div key={idx} className='relative shrink-0 w-12 h-12 group'>
                  <img
                    src={URL.createObjectURL(file)}
                    alt='preview'
                    className='w-full h-full object-cover rounded border border-gray-200 dark:border-slate-700'
                  />
                  <button
                    type='button'
                    onClick={() => removePhoto(idx)}
                    className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity z-10'
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}
