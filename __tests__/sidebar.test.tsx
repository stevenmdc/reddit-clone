import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import { ReactElement } from 'react'
import { AvatarProvider } from '@/components/AvatarProvider'
import userEvent from '@testing-library/user-event'
import AppLayout from '@/components/AppLayout'
import Sidebar from '@/components/Sidebar'

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: AvatarProvider })

const mockRouter = { pathname: '/', query: {} as { sort?: string; name?: string }, push: jest.fn() }
const mockSubreddits = [{ id: 1, name: 'general', created_at: '2026-10-03T00:00:00Z' }]
jest.mock('next/router', () => ({ useRouter: () => mockRouter }))
jest.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => null,
  useSupabaseClient: () => ({ auth: { signOut: jest.fn() } }),
}))
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useReducedMotion: () => true,
}))
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) },
}))

beforeAll(() => {
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  })
})

function setDesktop(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: query === '(min-width: 768px)' ? desktop : true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  })
}

beforeEach(() => {
  mockRouter.pathname = '/'
  mockRouter.query = {}
  setDesktop(true)
})

it('collapses and reopens the desktop sidebar while keeping the page mounted', async () => {
  const user = userEvent.setup()
  render(<AppLayout><input aria-label='Page content' defaultValue='Keep this' /></AppLayout>)
  await user.click(screen.getByRole('button', { name: 'Fermer la sidebar' }))
  expect(screen.getByRole('button', { name: 'Ouvrir la sidebar' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByText('Accueil').closest('a')).toHaveAttribute('tabindex', '-1')
  expect(screen.getByRole('textbox')).toHaveValue('Keep this')
  await user.click(screen.getByRole('button', { name: 'Ouvrir la sidebar' }))
  expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
})

it('opens a mobile drawer and closes it with Escape', async () => {
  setDesktop(false)
  const user = userEvent.setup()
  render(<AppLayout><p>Page content</p></AppLayout>)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Ouvrir la sidebar' }))
  expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('closes the mobile drawer when navigating', async () => {
  setDesktop(false)
  const user = userEvent.setup()
  render(<AppLayout subreddits={mockSubreddits}><p>Page content</p></AppLayout>)
  await user.click(screen.getByRole('button', { name: 'Ouvrir la sidebar' }))
  const popularLink = screen.getByRole('link', { name: 'r/general' })
  expect(popularLink).toHaveAttribute('href', '/r/general')
  // jsdom cannot navigate; keep the click handler and drawer behavior real.
  popularLink.addEventListener('click', (event) => event.preventDefault(), { once: true })
  await user.click(popularLink)
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('marks the popular feed active and includes official resources and credits', () => {
  mockRouter.query = { sort: 'top' }
  render(<Sidebar open subreddits={mockSubreddits} />)
  expect(screen.getByRole('link', { name: 'Populaire' })).toHaveAttribute('href', '/?sort=top')
  expect(screen.getByRole('link', { name: 'Populaire' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: /Règles de Reddit/ })).toHaveAttribute('href', 'https://redditinc.com/policies/reddit-rules')
  expect(screen.getByRole('link', { name: /Politique de confidentialité/ })).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText('Reddit, Inc. © 2026. All rights reserved.')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Subreddits' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'r/general' })).toHaveAttribute('href', '/r/general')
})
