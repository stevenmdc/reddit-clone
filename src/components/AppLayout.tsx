import { Dialog } from '@headlessui/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PanelLeft, PanelRight } from 'lucide-react'
import { ReactNode, useState, useSyncExternalStore } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Subreddit } from '@/types/models'
import { useSidebarSubreddits } from '@/hooks/useSidebarSubreddits'

const DESKTOP_QUERY = '(min-width: 768px)'
const SIDEBAR_WIDTH = 260
const COLLAPSED_WIDTH = 48

const toggleClass = 'flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-300 transition-colors hover:bg-neutral-100 dark:bg-black dark:text-[#B8C5CD] dark:ring-[#52616B] dark:hover:bg-[#181C1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'

function PanelIcon({ open }: { open: boolean }) {
  const Icon = open ? PanelLeft : PanelRight
  return (
    <Icon size={19} aria-hidden='true'>
      <rect
        x={open ? 3 : 15}
        y={3}
        width={6}
        height={18}
        rx={1}
        fill='currentColor'
        stroke='none'
      />
    </Icon>
  )
}

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export default function AppLayout({ children, subreddits }: { children: ReactNode; subreddits?: Subreddit[] | null }) {
  const communities = useSidebarSubreddits(subreddits)
  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  )
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const open = isDesktop ? desktopOpen : mobileOpen
  const sidebarWidth = isDesktop && open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH
  const transition = {
    duration: reducedMotion ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  }

  function toggleSidebar() {
    if (isDesktop) setDesktopOpen((value) => !value)
    else setMobileOpen((value) => !value)
  }

  return (
    <>
      <Navbar />
      <motion.div
        initial={false}
        animate={{ left: sidebarWidth }}
        transition={transition}
        className='fixed top-20 z-40 -translate-x-1/2'
      >
        <button
          type='button'
          aria-label={open ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
          aria-expanded={open}
          aria-controls='left-sidebar'
          onClick={toggleSidebar}
          className={toggleClass}
        >
          <PanelIcon open={open} />
        </button>
      </motion.div>
        <motion.aside
          id={!isDesktop && mobileOpen ? undefined : 'left-sidebar'}
          aria-label='Navigation principale'
          aria-hidden={!isDesktop || !open}
          initial={false}
          animate={{ width: sidebarWidth }}
          transition={transition}
          className='fixed bottom-0 left-0 top-14 z-30 overflow-hidden border-r bg-white dark:bg-black'
        >
          {isDesktop && (
            <motion.div
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={transition}
              className={`h-full w-[260px] ${open ? '' : 'pointer-events-none'}`}
            >
              <Sidebar open={open} {...communities} />
            </motion.div>
          )}
        </motion.aside>
      <AnimatePresence>
        {!isDesktop && mobileOpen && (
          <Dialog
            static
            open
            onClose={() => setMobileOpen(false)}
            className='fixed inset-0 z-50'
          >
            <motion.div
              aria-hidden='true'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className='absolute inset-0 bg-black/50'
            />
            <Dialog.Panel
              as={motion.div}
              id='left-sidebar'
              initial={{ x: reducedMotion ? 0 : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reducedMotion ? 0 : '-100%', opacity: 0 }}
              transition={transition}
              className='absolute bottom-0 left-0 top-14 flex w-[260px] max-w-[85vw] flex-col border-r bg-white dark:bg-black'
            >
              <Dialog.Title className='sr-only'>Menu</Dialog.Title>
              <div className='absolute right-0 top-6 z-10 translate-x-1/2'>
                <button
                  type='button'
                  aria-label='Fermer la sidebar'
                  aria-expanded='true'
                  aria-controls='left-sidebar'
                  onClick={() => setMobileOpen(false)}
                  className={toggleClass}
                >
                  <PanelIcon open />
                </button>
              </div>
              <Sidebar open {...communities} onNavigate={() => setMobileOpen(false)} />
            </Dialog.Panel>
          </Dialog>
        )}
      </AnimatePresence>
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={transition}
        className='min-w-0 pb-8'
      >
        {children}
      </motion.div>
    </>
  )
}
