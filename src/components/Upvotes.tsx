import { useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useId } from 'react'
import {
  TbArrowBigUpFilled,
  TbArrowBigUp,
  TbArrowBigDownFilled,
  TbArrowBigDown,
} from 'react-icons/tb'
import { PostVote } from '@/types/models'
import { ROUTES } from '@/constants/routes'
import { usePostVote } from '@/hooks/usePostVote'

interface UpvotesProps {
  id: number
  votes: PostVote[]
}

export default function Upvotes(props: UpvotesProps) {
  const session = useSession()
  const userId = session?.user.id
  // A different account or post gets its own state; late requests cannot leak.
  return <VoteControls key={`${props.id}:${userId ?? 'guest'}`} {...props} userId={userId} />
}

function VoteControls({ id, votes, userId }: UpvotesProps & { userId?: string }) {
  const router = useRouter()
  const errorId = useId()
  const { score, value, pending, error, needsRefresh, castVote, refreshScore } = usePostVote(id, votes, userId)

  function vote(direction: 1 | -1) {
    if (!userId) {
      void router.push(ROUTES.LOGIN)
      return
    }
    void castVote(direction)
  }

  return (
    <div className='flex flex-col items-center font-bold text-sm bg-neutral-50 dark:bg-[#0E1113] p-3' aria-busy={pending}>
      <button
        type='button'
        aria-label='Voter pour'
        aria-pressed={value === 1}
        aria-describedby={error ? errorId : undefined}
        disabled={pending}
        onClick={() => vote(1)}
        className='rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-wait disabled:opacity-50'
      >
        {value === 1 ? <TbArrowBigUpFilled className='text-2xl text-orange-600' /> : <TbArrowBigUp className='text-2xl' />}
      </button>
      <div aria-label='Score' aria-live='polite'>{score}</div>
      <button
        type='button'
        aria-label='Voter contre'
        aria-pressed={value === -1}
        aria-describedby={error ? errorId : undefined}
        disabled={pending}
        onClick={() => vote(-1)}
        className='rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-wait disabled:opacity-50'
      >
        {value === -1 ? <TbArrowBigDownFilled className='text-2xl text-orange-600' /> : <TbArrowBigDown className='text-2xl' />}
      </button>
      {error && (
        <div className='mt-2 max-w-24 text-center text-xs font-normal text-red-700 dark:text-red-400'>
          <p id={errorId} role='alert'>{error}</p>
          {needsRefresh && <button type='button' disabled={pending} onClick={() => void refreshScore()} className='mt-2 underline disabled:opacity-50'>Actualiser le score</button>}
        </div>
      )}
    </div>
  )
}
