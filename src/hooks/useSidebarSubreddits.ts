import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Subreddit } from '@/types/models'

export function useSidebarSubreddits(initial?: Subreddit[] | null) {
  const [fallback, setFallback] = useState<Subreddit[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (initial != null || fallback !== null) return
    let active = true
    async function load() {
      try {
        const { data, error } = await supabase.from('subreddits')
          .select('id,name,created_at').order('name')
        if (!active) return
        setError(Boolean(error))
        setFallback(data ?? [])
      } catch {
        if (active) {
          setError(true)
          setFallback([])
        }
      }
    }
    void load()
    return () => { active = false }
  }, [initial, fallback])

  return {
    subreddits: initial ?? fallback ?? [],
    loading: initial == null && fallback === null,
    error: initial == null && error,
  }
}
