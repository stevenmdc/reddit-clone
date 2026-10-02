import Link from 'next/link'
import { Subreddit } from '@/types/models'
import { ROUTES } from '@/constants/routes'
import { UsersRound } from 'lucide-react'
import { useRouter } from 'next/router'

interface SubredditsSidebarProps {
  subreddits: Subreddit[]
  open: boolean
  onNavigate?: () => void
  loading?: boolean
  error?: boolean
}

export default function SubredditsSidebar({ subreddits, open, onNavigate, loading, error }: SubredditsSidebarProps) {
  const router = useRouter()
  return (
    <nav aria-label='Subreddits'>
      <h2 className='mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-[#9BAEB9]'>Subreddits</h2>
      {loading ? (
        <p className='px-3 py-2 text-sm text-neutral-500 dark:text-[#9BAEB9]' role='status'>Chargement…</p>
      ) : error ? (
        <p className='px-3 py-2 text-sm text-neutral-500 dark:text-[#9BAEB9]' role='status'>Communautés indisponibles.</p>
      ) : subreddits.length === 0 ? (
        <p className='px-3 py-2 text-sm text-neutral-500 dark:text-[#9BAEB9]'>Aucun subreddit.</p>
      ) : (
        <ul className='space-y-1'>
          {[...subreddits].sort((a, b) => a.name.localeCompare(b.name)).map((subreddit) => {
            const active = router.pathname === '/r/[name]' && router.query.name === subreddit.name
            return (
              <li key={subreddit.id}>
                <Link
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-[#181C1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${active ? 'bg-neutral-100 font-semibold dark:bg-[#181C1F]' : ''}`}
                  href={ROUTES.SUBREDDIT(subreddit.name)}
                  aria-current={active ? 'page' : undefined}
                  tabIndex={open ? undefined : -1}
                  onClick={onNavigate}
                  title={`r/${subreddit.name}`}
                >
                  <UsersRound size={21} strokeWidth={1.7} className='shrink-0' aria-hidden='true' />
                  <span className='truncate'>r/{subreddit.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
