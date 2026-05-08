'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPoiDetails, getComments, toggleReaction, addComment, deleteComment } from '@/app/actions/interaction'
import { deletePoi } from '@/app/actions/poi'
import ImageCarousel from '@/components/ui/ImageCarousel'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { X, MessageSquare, ThumbsUp, ThumbsDown, User, Clock, MapPin, Plus, Trash2 } from 'lucide-react'

interface PoiDetailPanelProps {
  poiId: string
  userId?: string
  isAdmin?: boolean
  onClose: () => void
  onPoiLoaded?: (lat: number, lng: number) => void
  onPoiDeleted?: () => void
}

export default function PoiDetailPanel({ poiId, userId, isAdmin, onClose, onPoiLoaded, onPoiDeleted }: PoiDetailPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [poi, setPoi] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [poiData, commentsData] = await Promise.all([
        getPoiDetails(poiId),
        getComments(poiId)
      ])
      setPoi(poiData)
      setComments(commentsData)

      if (onPoiLoaded && poiData.location) {
        try {
          const loc = typeof poiData.location === 'string' ? JSON.parse(poiData.location) : poiData.location
          if (loc && loc.coordinates) {
            onPoiLoaded(loc.coordinates[1], loc.coordinates[0])
          }
        } catch (e) { }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load details')
    } finally {
      setLoading(false)
    }
  },[onPoiLoaded, poiId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData, poiId])

  const handleReaction = async (type: 'upvote' | 'downvote') => {
    if (!userId) return toast.error('Sign in to vote')
    try {
      await toggleReaction(poiId, type)
      loadData()
    } catch { toast.error('Failed to vote') }
  }

  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    try {
      await deleteComment(commentId)
    } catch {
      toast.error('Failed to delete comment')
      const refreshed = await getComments(poiId)
      setComments(refreshed || [])
    }
  }

  const handleDeletePoi = async () => {
    if (!window.confirm('Delete this POI? This cannot be undone.')) return
    try {
      await deletePoi(poiId)
      toast.success('POI deleted')
      onPoiDeleted?.()
    } catch {
      toast.error('Failed to delete POI')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('content', commentText)

      // Compress and add all photos
      for (const file of photos) {
        try {
          const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1024, useWebWorker: true }
          const compressed = await imageCompression(file, options)
          // Create a new File from the blob to ensure filename preservation
          const newFile = new File([compressed], file.name, { type: file.type })
          formData.append('images', newFile)
        } catch (err) {
          console.error('Compression failed, using original', err)
          formData.append('images', file)
        }
      }

      await addComment(poiId, formData)
      setCommentText('')
      setPhotos([])
      toast.success('Comment posted!')
      loadData()
    } catch (err) {
      console.error('Comment error:', err)
      toast.error('Failed to post comment')
    } finally { setSubmitting(false) }
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newFiles])
    }
    e.target.value = '' // Reset input
  }

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-auto p-4 sm:p-6 lg:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" />

      <div
        className="relative z-10 w-full max-w-5xl h-[90vh] overflow-hidden bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight leading-none">{poi?.title || 'Loading...'}</h2>
              {poi && <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{poi.category}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {poi && (isAdmin || userId === poi.creator_id) && (
              <button
                onClick={handleDeletePoi}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all text-gray-400 hover:text-red-500"
                title="Delete POI"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-gray-500 animate-pulse text-xs font-medium">Fetching details...</p>
          </div>
        ) : poi ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

            {/* Left Column: Media & Core Info */}
            <div className="lg:w-[60%] border-r border-gray-100 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="p-6 sm:p-8">
                <ImageCarousel images={poi.image_urls} />

                <div className="mt-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-lg shadow-blue-500/10">
                      {poi.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <User size={12} />
                      {poi.users?.username || 'GeoExplorer'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <Clock size={12} />
                      {new Date(poi.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <h1 className="text-3xl font-extrabold mb-4 tracking-tight leading-tight">{poi.title}</h1>
                  <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap font-light">
                    {poi.description}
                  </p>

                  {/* Timeline Date Section */}
                  <div className="mt-2">
                    {(() => {
                      const now = new Date()
                      const start = poi.start_date ? new Date(poi.start_date) : null
                      const end = poi.end_date ? new Date(poi.end_date) : null
                      const hasStarted = !start || start <= now
                      const msLeft = end ? end.getTime() - now.getTime() : null
                      const isOver = msLeft !== null && msLeft <= 0

                      // Status badge
                      let statusColor = 'bg-emerald-500'
                      let statusLabel = 'Live'
                      let statusPulse = true
                      if (!hasStarted) { statusColor = 'bg-blue-500'; statusLabel = 'Upcoming'; statusPulse = false }
                      if (isOver) { statusColor = 'bg-gray-400'; statusLabel = 'Ended'; statusPulse = false }

                      return (
                        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-linear-to-br from-gray-50 to-white dark:from-slate-900/60 dark:to-slate-950/40">
                          {/* Status bar */}
                          <div className={`flex items-center gap-2 px-4 py-2 ${isOver ? 'bg-gray-100 dark:bg-slate-800/60' : hasStarted ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
                            <span className="flex items-center gap-1.5">
                              {statusPulse && <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />}
                              {!statusPulse && <span className={`w-2 h-2 rounded-full ${statusColor}`} />}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isOver ? 'text-gray-500' : hasStarted ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                {statusLabel}
                              </span>
                            </span>
                            {!isOver && end && msLeft !== null && msLeft > 0 && hasStarted && (
                              <span className="ml-auto flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                {(() => {
                                  const totalMins = Math.floor(msLeft / 60000)
                                  const d = Math.floor(totalMins / 1440)
                                  const h = Math.floor((totalMins % 1440) / 60)
                                  const m = totalMins % 60
                                  return [d > 0 && `${d}d`, (d > 0 || h > 0) && `${h}h`, `${m}m`].filter(Boolean).join(' ')
                                })()}
                              </span>
                            )}
                          </div>

                          {/* Date rows */}
                          <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-800">
                            {/* Start (Only if start_date exists) */}
                            {start && (
                              <div className="flex items-center gap-3 px-4 py-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${hasStarted ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${hasStarted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Start</p>
                                  <p className="text-sm font-bold leading-tight">
                                    {start.toLocaleString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* End */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isOver ? 'bg-gray-100 dark:bg-slate-800' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${isOver ? 'text-gray-400' : 'text-rose-500 dark:text-rose-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">End</p>
                                {end ? (
                                  isOver ? (
                                    <p className="text-sm font-bold text-gray-400 leading-tight">
                                      {end.toLocaleString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  ) : (
                                    <p className="text-sm font-bold leading-tight">
                                      {end.toLocaleString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )
                                ) : (
                                  <p className="text-xs font-semibold text-gray-500 italic">No end date · Permanent</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Reactions & Comments */}
            <div className="lg:w-[40%] flex flex-col bg-gray-50/30 dark:bg-slate-900/10">

              {/* Feedback Area */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  Feedback
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => handleReaction('upvote')} disabled={!userId} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm disabled:opacity-50">
                    <ThumbsUp size={16} />
                    <span className="text-sm font-bold">{poi.upvotes}</span>
                  </button>
                  <button onClick={() => handleReaction('downvote')} disabled={!userId} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm disabled:opacity-50">
                    <ThumbsDown size={16} />
                    <span className="text-sm font-bold">{poi.downvotes}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2 shrink-0">
                  <MessageSquare size={14} />
                  Comments ({comments.length})
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase shrink-0 text-xs shadow-md">
                        {comment.users?.username?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-bold text-xs text-gray-900 dark:text-white truncate">{comment.users?.username || 'Unknown'}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-gray-400 whitespace-nowrap">{new Date(comment.created_at).toLocaleDateString()}</span>
                            {(isAdmin || userId === comment.user_id) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-0.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-tight mb-2">{comment.content}</p>
                        {comment.image_urls && comment.image_urls.length > 0 && (
                          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                            {comment.image_urls.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800">
                                <img src={url} alt="Attached" className="h-14 w-14 object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 opacity-20 text-center">
                      <MessageSquare size={32} className="mb-2" />
                      <p className="text-xs italic">No comments yet.</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Area */}
                {userId ? (
                  <form onSubmit={handleComment} className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 shrink-0 overflow-visible">
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        required
                        placeholder="Join the conversation..."
                        className="w-full border rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-[13px]"
                        rows={2}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 rounded-lg transition-all" title="Attach photos">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoAdd}
                              className="hidden"
                            />
                            <Plus size={18} />
                          </label>
                          {photos.length > 0 && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md">+{photos.length}</span>}
                        </div>
                        <button type="submit" disabled={submitting || !commentText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 disabled:opacity-50">
                          {submitting ? 'Post...' : 'Post'}
                        </button>
                      </div>

                      {/* Photo Previews */}
                      {photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 custom-scrollbar overflow-visible">
                          {photos.map((file, idx) => (
                            <div key={idx} className="relative shrink-0 w-14 h-14">
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-slate-800"
                              />
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removePhoto(idx); }}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg border border-white dark:border-slate-800 z-10 transition-colors pointer-events-auto"
                              >
                                <X size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-800 rounded-xl text-center shrink-0">
                    <Link href="/login" className="text-[11px] text-blue-600 hover:underline font-bold">Sign in to Comment</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
            <MapPin size={40} className="text-gray-300" />
            <p className="text-sm text-gray-500">POI not found.</p>
            <button onClick={onClose} className="text-xs text-blue-500 font-bold hover:underline">Back to map</button>
          </div>
        )}
      </div>
    </div>
  )
}
