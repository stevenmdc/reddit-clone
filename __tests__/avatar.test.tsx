import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarProvider } from '@/components/AvatarProvider'
import UserDropdown from '@/components/UserDropdown'

let mockSession: { user: { id: string; user_metadata: Record<string, unknown> } } | null = null
const mockUpdateUser = jest.fn()
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => mockSession,
  useSupabaseClient: () => ({ auth: { updateUser: mockUpdateUser, signOut: jest.fn() } }),
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

beforeEach(() => {
  mockSession = null
  mockUpdateUser.mockReset().mockResolvedValue({ error: null })
  localStorage.clear()
})

function renderProfile() {
  return render(<AvatarProvider><UserDropdown /></AvatarProvider>)
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Profile menu' }))
  await user.click(screen.getByRole('menuitem', { name: 'Choisir un avatar' }))
  expect(screen.getByRole('dialog', { name: 'Choisir un avatar' })).toBeInTheDocument()
}

it('lets a guest choose an avatar and restores it after remounting', async () => {
  const user = userEvent.setup()
  const profile = renderProfile()
  await openPicker(user)
  expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(7)
  await user.click(screen.getByRole('button', { name: 'Husky' }))
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(localStorage.getItem('reddit-guest-avatar')).toBe('husky')
  expect(mockUpdateUser).not.toHaveBeenCalled()
  profile.unmount()
  renderProfile()
  expect(screen.getByRole('button', { name: 'Profile menu' }).querySelector('img')).toHaveAttribute('src', '/images/avatars/husky.webp')
})

it('cancels without changing the current avatar', async () => {
  const user = userEvent.setup()
  renderProfile()
  await openPicker(user)
  await user.click(screen.getByRole('button', { name: 'Dalmatien' }))
  await user.click(screen.getByRole('button', { name: 'Annuler' }))
  expect(localStorage.getItem('reddit-guest-avatar')).toBeNull()
  expect(screen.getByRole('button', { name: 'Profile menu' }).querySelector('img')).toHaveAttribute('src', '/images/avatars/corgi.webp')
})

it('saves signed-in choices in account metadata and updates the navbar', async () => {
  mockSession = { user: { id: 'user-1', user_metadata: { avatar_id: 'shiba' } } }
  const user = userEvent.setup()
  renderProfile()
  await openPicker(user)
  expect(screen.getByRole('button', { name: 'Shiba' })).toHaveAttribute('aria-pressed', 'true')
  await user.click(screen.getByRole('button', { name: 'Teckel' }))
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(mockUpdateUser).toHaveBeenCalledWith({ data: { avatar_id: 'dachshund' } })
  expect(screen.getByRole('button', { name: 'Profile menu' }).querySelector('img')).toHaveAttribute('src', '/images/avatars/dachshund.webp')
  expect(localStorage.getItem('reddit-guest-avatar')).toBeNull()
})

it('keeps the picker open and preserves the avatar when account saving fails', async () => {
  mockSession = { user: { id: 'user-1', user_metadata: { avatar_id: 'shiba' } } }
  mockUpdateUser.mockResolvedValue({ error: { message: 'Unavailable' } })
  const user = userEvent.setup()
  renderProfile()
  await openPicker(user)
  await user.click(screen.getByRole('button', { name: 'Caniche' }))
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible d’enregistrer votre avatar')
  expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Annuler' }))
  expect(screen.getByRole('button', { name: 'Profile menu' }).querySelector('img')).toHaveAttribute('src', '/images/avatars/shiba.webp')
})
