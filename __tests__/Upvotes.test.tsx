import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Upvotes from '@/components/Upvotes'
import { PostVote } from '@/types/models'
import { VoteSummary } from '@/lib/votes'

let mockSession: { user: { id: string } } | null = { user: { id: 'me' } }
const mockPush = jest.fn()
const mockWrite = jest.fn()
const mockReadSummary = jest.fn()
const mockDeleteUser = jest.fn(() => mockWrite())
const mockDeletePost = jest.fn(() => ({ eq: mockDeleteUser }))
const mockDelete = jest.fn(() => ({ eq: mockDeletePost }))
const mockUpsertSelect = jest.fn(() => ({ single: mockWrite }))
const mockUpsert = jest.fn(() => ({ select: mockUpsertSelect }))
const mockFrom = jest.fn(() => ({ upsert: mockUpsert, delete: mockDelete }))

jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => mockSession,
  useSupabaseClient: () => ({ from: mockFrom }),
}))
jest.mock('@/lib/votes', () => ({
  ...jest.requireActual('@/lib/votes'),
  readVoteSummary: (...args: unknown[]) => mockReadSummary(...args),
}))

const vote = (is_upvote: boolean, user_id = 'me', id = 1): PostVote => ({
  id, is_upvote, user_id, post_id: 42, created_at: '2026-10-03T00:00:00Z',
})
const up = () => screen.getByRole('button', { name: 'Voter pour' })
const down = () => screen.getByRole('button', { name: 'Voter contre' })
const score = () => screen.getByLabelText('Score')

beforeEach(() => {
  jest.clearAllMocks()
  mockWrite.mockReset().mockResolvedValue({ data: { id: 1 }, error: null })
  mockReadSummary.mockReset().mockResolvedValue({ score: 1, value: 1 })
  mockSession = { user: { id: 'me' } }
})

it('renders the initial score and current vote immediately', () => {
  render(<Upvotes id={42} votes={[vote(false), vote(true, 'other', 2)]} />)
  expect(score()).toHaveTextContent('0')
  expect(down()).toHaveAttribute('aria-pressed', 'true')
  expect(up()).toHaveAttribute('aria-pressed', 'false')
})

it.each(['Voter pour', 'Voter contre'])('redirects guests for %s without writing', async (name) => {
  mockSession = null
  render(<Upvotes id={42} votes={[]} />)
  await userEvent.click(screen.getByRole('button', { name }))
  expect(mockPush).toHaveBeenCalledWith('/login')
  expect(mockFrom).not.toHaveBeenCalled()
})

it.each([
  [0, 1, 1], [0, -1, -1], [1, 1, 0], [-1, -1, 0], [1, -1, -1], [-1, 1, 1],
] as const)('persists transition %s with direction %s to %s', async (initial, direction, next) => {
  const votes = initial === 0 ? [] : [vote(initial === 1)]
  mockReadSummary.mockResolvedValue({ score: next, value: next })
  render(<Upvotes id={42} votes={votes} />)
  await userEvent.click(direction === 1 ? up() : down())
  await waitFor(() => expect(up()).toBeEnabled())
  expect(score().textContent).toBe(String(next))
  expect(up()).toHaveAttribute('aria-pressed', String(next === 1))
  expect(down()).toHaveAttribute('aria-pressed', String(next === -1))
  if (next === 0) {
    expect(mockDeletePost).toHaveBeenCalledWith('post_id', 42)
    expect(mockDeleteUser).toHaveBeenCalledWith('user_id', 'me')
  } else {
    expect(mockUpsert).toHaveBeenCalledWith(
      { post_id: 42, user_id: 'me', is_upvote: next === 1 },
      { onConflict: 'user_id,post_id' }
    )
  }
})

it('supports add, remove and add again without mutating input votes', async () => {
  const user = userEvent.setup()
  const votes = Object.freeze([]) as unknown as PostVote[]
  mockReadSummary.mockResolvedValueOnce({ score: 1, value: 1 })
    .mockResolvedValueOnce({ score: 0, value: 0 })
    .mockResolvedValueOnce({ score: 1, value: 1 })
  render(<Upvotes id={42} votes={votes} />)
  for (let i = 0; i < 3; i++) {
    await user.click(up())
    await waitFor(() => expect(up()).toBeEnabled())
  }
  expect(score()).toHaveTextContent('1')
  expect(mockUpsert).toHaveBeenCalledTimes(2)
  expect(mockDelete).toHaveBeenCalledTimes(1)
  expect(votes).toEqual([])
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it.each([true, false])('restores the score and reports errors for failed %s deletion/upsert', async (deletion) => {
  mockWrite.mockResolvedValue({ error: { message: 'Denied' } })
  render(<Upvotes id={42} votes={deletion ? [vote(true)] : []} />)
  await userEvent.click(up())
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible d’enregistrer')
  expect(score().textContent).toBe(deletion ? '1' : '0')
  expect(up()).toHaveAttribute('aria-pressed', String(deletion))
  expect(mockReadSummary).not.toHaveBeenCalled()
  expect(up()).toBeEnabled()
})

it('blocks rapid clicks on both buttons until the request completes', async () => {
  let finish!: (result: { error: null; data: { id: number } }) => void
  mockWrite.mockReturnValue(new Promise((resolve) => { finish = resolve }))
  render(<Upvotes id={42} votes={[]} />)
  act(() => {
    fireEvent.click(up())
    fireEvent.click(up())
    fireEvent.click(down())
  })
  expect(mockWrite).toHaveBeenCalledTimes(1)
  expect(up()).toBeDisabled()
  expect(down()).toBeDisabled()
  expect(score()).toHaveTextContent('1')
  await act(async () => { finish({ error: null, data: { id: 1 } }) })
  expect(up()).toBeEnabled()
})

it('uses the server score, including votes by other users', async () => {
  mockReadSummary.mockResolvedValue({ score: 3500, value: 1 })
  render(<Upvotes id={42} votes={[]} />)
  await userEvent.click(up())
  await waitFor(() => expect(score()).toHaveTextContent('3500'))
})

it('retains successful writes after a read failure and retries only the read', async () => {
  mockReadSummary.mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ score: 5, value: 1 } satisfies VoteSummary)
  render(<Upvotes id={42} votes={[]} />)
  await userEvent.click(up())
  expect(await screen.findByRole('alert')).toHaveTextContent('Vote enregistré')
  expect(score()).toHaveTextContent('1')
  await userEvent.click(screen.getByRole('button', { name: 'Actualiser le score' }))
  await waitFor(() => expect(score()).toHaveTextContent('5'))
  expect(mockWrite).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('reads refreshed props and resets the active vote on account changes', () => {
  const view = render(<Upvotes id={42} votes={[vote(true)]} />)
  view.rerender(<Upvotes id={42} votes={[vote(true), vote(true, 'other', 2)]} />)
  expect(score()).toHaveTextContent('2')
  mockSession = { user: { id: 'other' } }
  view.rerender(<Upvotes id={42} votes={[vote(true)]} />)
  expect(up()).toHaveAttribute('aria-pressed', 'false')
})

it('ignores late responses after the active account changes', async () => {
  let finish!: (result: { error: null }) => void
  mockWrite.mockReturnValue(new Promise((resolve) => { finish = resolve }))
  const votes: PostVote[] = []
  const view = render(<Upvotes id={42} votes={votes} />)
  await userEvent.click(up())
  mockSession = { user: { id: 'other' } }
  view.rerender(<Upvotes id={42} votes={votes} />)
  await act(async () => { finish({ error: null }) })
  expect(score()).toHaveTextContent('0')
  expect(up()).toHaveAttribute('aria-pressed', 'false')
  expect(mockReadSummary).not.toHaveBeenCalled()
})
