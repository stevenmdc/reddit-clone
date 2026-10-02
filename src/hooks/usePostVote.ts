import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { PostVote } from '@/types/models'
import { Database } from '@/types/database'
import { readVoteSummary, summarizeVotes, VoteSummary, VoteValue } from '@/lib/votes'

export function usePostVote(id: number, votes: PostVote[], userId?: string) {
  // Legacy helpers use an older generic signature; type the actual JS client.
  const client = useSupabaseClient() as unknown as SupabaseClient<Database>
  const [confirmed, setConfirmed] = useState<{ source: PostVote[]; summary: VoteSummary } | null>(null)
  const [optimistic, setOptimistic] = useState<VoteSummary | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const inFlight = useRef(false)
  const mounted = useRef(true)
  const latestVotes = useRef(votes)

  useEffect(() => { latestVotes.current = votes }, [votes])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const baseline = confirmed?.source === votes ? confirmed.summary : summarizeVotes(votes, userId)
  const summary = optimistic ?? baseline

  async function refreshScore() {
    if (!userId || inFlight.current) return
    inFlight.current = true
    setPending(true)
    try {
      const saved = await readVoteSummary(client, id, userId)
      if (!mounted.current) return
      setConfirmed({ source: latestVotes.current, summary: saved })
      setError('')
      setNeedsRefresh(false)
    } catch {
      if (mounted.current) setError('Impossible de relire le score. Réessayez.')
    } finally {
      inFlight.current = false
      if (mounted.current) setPending(false)
    }
  }

  async function castVote(direction: Exclude<VoteValue, 0>) {
    if (!userId || inFlight.current) return
    // Lock immediately, before React can render disabled buttons.
    inFlight.current = true
    const value: VoteValue = summary.value === direction ? 0 : direction
    const next = { score: summary.score + value - summary.value, value }
    setOptimistic(next)
    setPending(true)
    setError('')
    setNeedsRefresh(false)

    try {
      const response = value === 0
        ? await client.from('post_votes').delete().eq('post_id', id).eq('user_id', userId)
        : await client.from('post_votes').upsert(
          { post_id: id, user_id: userId, is_upvote: value === 1 },
          { onConflict: 'user_id,post_id' }
        ).select('id').single()
      if (response.error) throw response.error
      if (!mounted.current) return
      setConfirmed({ source: latestVotes.current, summary: next })

      try {
        const saved = await readVoteSummary(client, id, userId)
        if (!mounted.current) return
        setConfirmed({ source: latestVotes.current, summary: saved })
        if (saved.value !== value) setError('Votre vote n’a pas été confirmé. Réessayez.')
      } catch {
        if (!mounted.current) return
        // A successful write must not be undone because a subsequent read failed.
        setError('Vote enregistré, mais le score n’a pas pu être actualisé.')
        setNeedsRefresh(true)
      }
    } catch {
      if (mounted.current) setError('Impossible d’enregistrer votre vote. Réessayez.')
    } finally {
      inFlight.current = false
      if (mounted.current) {
        setOptimistic(null)
        setPending(false)
      }
    }
  }

  return { ...summary, pending, error, needsRefresh, castVote, refreshScore }
}
