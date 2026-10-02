import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { readVoteSummary } from '@/lib/votes'

function clientWithResults(upCount: number | null, downCount: number, ownVote: { is_upvote: boolean } | null, error: unknown = null) {
  const results = [
    { count: upCount, error },
    { count: downCount, error: null },
    { data: ownVote, error: null },
  ]
  const queries = results.map((result) => {
    const query = {
      select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn(() => Promise.resolve(result)),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    return query
  })
  const from = jest.fn().mockReturnValueOnce(queries[0]).mockReturnValueOnce(queries[1]).mockReturnValueOnce(queries[2])
  return { client: { from } as unknown as SupabaseClient<Database>, queries, from }
}

it('uses exact server counts and fetches only the current user vote', async () => {
  const { client, queries } = clientWithResults(3500, 250, { is_upvote: false })
  expect(await readVoteSummary(client, 42, 'me')).toEqual({ score: 3250, value: -1 })
  expect(queries[0].select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
  expect(queries[0].eq).toHaveBeenCalledWith('is_upvote', true)
  expect(queries[1].eq).toHaveBeenCalledWith('is_upvote', false)
  expect(queries[2].eq).toHaveBeenCalledWith('user_id', 'me')
  for (const query of queries) expect(query.eq).toHaveBeenCalledWith('post_id', 42)
})

it('returns a neutral vote when there is no current user row', async () => {
  const { client } = clientWithResults(0, 2, null)
  expect(await readVoteSummary(client, 42, 'me')).toEqual({ score: -2, value: 0 })
})

it.each([null, { message: 'Denied' }])('rejects missing counts or query errors: %s', async (error) => {
  const { client } = clientWithResults(error === null ? null : 1, 0, null, error)
  await expect(readVoteSummary(client, 42, 'me')).rejects.toThrow('Impossible de relire le score')
})
