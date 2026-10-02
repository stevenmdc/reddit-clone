import { act, render as rtlRender, screen } from '@testing-library/react'
import { ReactElement } from 'react'
import { AvatarProvider } from '@/components/AvatarProvider'
import userEvent from '@testing-library/user-event'
import UserDropdown from '@/components/UserDropdown'
import { themeInitScript } from '@/hooks/useTheme'

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: AvatarProvider })

jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => null,
  useSupabaseClient: () => ({ auth: { signOut: jest.fn() } }),
}))

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = 'light'
})

it('lets a guest switch themes from the profile menu and saves the choice', async () => {
  const user = userEvent.setup()
  render(<UserDropdown />)
  await user.click(screen.getByRole('button', { name: 'Profile menu' }))
  await user.click(screen.getByRole('menuitem', { name: 'Dark' }))
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.style.colorScheme).toBe('dark')
  expect(localStorage.getItem('reddit-theme')).toBe('dark')

  await user.click(screen.getByRole('button', { name: 'Profile menu' }))
  await user.click(screen.getByRole('menuitem', { name: 'Light' }))
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('reddit-theme')).toBe('light')
})

it('restores the saved dark theme before rendering', () => {
  localStorage.setItem('reddit-theme', 'dark')
  window.eval(themeInitScript)
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.style.colorScheme).toBe('dark')
})

it('updates the menu when another tab changes the theme', async () => {
  const user = userEvent.setup()
  render(<UserDropdown />)
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'reddit-theme', newValue: 'dark' }))
  })
  await user.click(screen.getByRole('button', { name: 'Profile menu' }))
  expect(screen.getByRole('menuitem', { name: 'Dark (selected)' })).toBeInTheDocument()
  expect(screen.queryByText('Account')).not.toBeInTheDocument()
})

it('still switches themes when storage is unavailable', async () => {
  const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage disabled')
  })
  try {
    const user = userEvent.setup()
    render(<UserDropdown />)
    await user.click(screen.getByRole('button', { name: 'Profile menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }))
    expect(document.documentElement).toHaveClass('dark')
  } finally {
    setItem.mockRestore()
  }
})
