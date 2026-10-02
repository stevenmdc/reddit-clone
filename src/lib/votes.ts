import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { PostVote } from '@/types/models'

export type VoteValue = -1 | 0 | 1
export interface VoteSummary {
  score: number
  value: VoteValue
}

export function summarizeVotes(votes: readonly PostVote[], userId?: string): VoteSummary {
  const ownVote = userId ? votes.find((vote) => vote.user_id === userId) : undefined
  return {
    score: votes.reduce((score, vote) => score + (vote.is_upvote ? 1 : -1), 0),
    value: ownVote ? (ownVote.is_upvote ? 1 : -1) : 0,
  }
}

export async function readVoteSummary(client: SupabaseClient<Database>, postId: number, userId: string): Promise<VoteSummary> {
  // Exact counts avoid the API row limit and downloading other users' votes.
  const [upvotes, downvotes, ownVote] = await Promise.all([
    client.from('post_votes').select('id', { count: 'exact', head: true })
      .eq('post_id', postId).eq('is_upvote', true),
    client.from('post_votes').select('id', { count: 'exact', head: true })
      .eq('post_id', postId).eq('is_upvote', false),
    client.from('post_votes').select('is_upvote')
      .eq('post_id', postId).eq('user_id', userId).maybeSingle(),
  ])
  if (upvotes.error || downvotes.error || ownVote.error || upvotes.count === null || downvotes.count === null) {
    throw new Error('Impossible de relire le score.')
  }
  return {
    score: upvotes.count - downvotes.count,
    value: ownVote.data ? (ownVote.data.is_upvote ? 1 : -1) : 0,
  }
}
