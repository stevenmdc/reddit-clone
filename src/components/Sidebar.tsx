import Link from 'next/link'
import { useRouter } from 'next/router'
import { Flame, House, ScrollText, ShieldCheck } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Subreddit } from '@/types/models'
import SubredditsSidebar from './SubredditsSidebar'

interface SidebarProps {
  open: boolean
  onNavigate?: () => void
  subreddits?: Subreddit[]
  loading?: boolean
  error?: boolean
}

const resources = [
  { label: 'Règles de Reddit', href: 'https://redditinc.com/policies/reddit-rules', icon: ScrollText },
  { label: 'Politique de confidentialité', href: 'https://www.reddit.com/policies/privacy-policy', icon: ShieldCheck },
]

export default function Sidebar({ open, onNavigate, subreddits = [], loading = false, error = false }: SidebarProps) {
  const router = useRouter()
  const popular = router.pathname === ROUTES.HOME && router.query.sort === 'top'
  const navigation = [
    { label: 'Accueil', href: ROUTES.HOME, icon: House, active: router.pathname === ROUTES.HOME && !popular },
    { label: 'Populaire', href: ROUTES.POPULAR, icon: Flame, active: popular },
  ]
  const linkClass = 'flex items-center gap-3 rounded-lg px-3 py-3 text-sm leading-5 transition-colors hover:bg-neutral-100 dark:hover:bg-[#181C1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'

  return (
    <div className='flex h-full min-h-0 w-[260px] max-w-full flex-col overflow-y-auto px-3 py-5'>
      <nav aria-label='Menu principal' className='space-y-1'>
        {navigation.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            tabIndex={open ? undefined : -1}
            onClick={onNavigate}
            className={`${linkClass} ${active ? 'bg-neutral-100 font-semibold dark:bg-[#181C1F]' : ''}`}
          >
            <Icon size={21} strokeWidth={1.7} aria-hidden='true' className='shrink-0' />
            {label}
          </Link>
        ))}
      </nav>
      <hr className='my-5' />
      <SubredditsSidebar subreddits={subreddits} open={open} onNavigate={onNavigate} loading={loading} error={error} />
      <hr className='my-5' />
      <nav aria-label='Informations Reddit' className='space-y-1'>
        {resources.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            tabIndex={open ? undefined : -1}
            onClick={onNavigate}
            className={linkClass}
          >
            <Icon size={21} strokeWidth={1.7} aria-hidden='true' className='shrink-0' />
            {label}
            <span className='sr-only'> (nouvel onglet)</span>
          </a>
        ))}
      </nav>
      <footer className='mt-auto px-3 pt-10 text-[11px] leading-5 text-neutral-500 dark:text-[#9BAEB9]'>
        Reddit, Inc. © 2026. All rights reserved.
      </footer>
    </div>
  )
}
