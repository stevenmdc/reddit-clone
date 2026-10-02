import { Menu, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { FaRegUserCircle } from 'react-icons/fa'
import { BiLogOut } from 'react-icons/bi'
import { BsSun, BsMoon, BsCheck2 } from 'react-icons/bs'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useTheme } from '@/hooks/useTheme'
import Image from 'next/image'
import { UserRoundPen } from 'lucide-react'
import { avatarSource } from '@/constants/avatars'
import { useAvatar } from './AvatarProvider'
import AvatarPicker from './AvatarPicker'

export default function Dropdown() {
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const session = useSession()
  const { theme, setTheme } = useTheme()
  const { avatar } = useAvatar()
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const handleSignOut = async () => {
    let { error } = await supabaseClient.auth.signOut()
    if (error) throw new Error('Unable to sign out.')
    router.push(ROUTES.HOME)
  }

  return (
    <div className='shrink-0 text-right'>
      <Menu as='div' className='relative inline-block text-left'>
        <div>
          <Menu.Button aria-label='Profile menu' className='inline-flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-white transition duration-200 hover:ring-orange-500 active:scale-90 dark:ring-offset-[#181C1F] focus:outline-none focus-visible:ring-orange-500 motion-reduce:transform-none motion-reduce:transition-none'>
            <span className='relative block h-9 w-9 overflow-hidden rounded-full bg-[#F8F5F0]'>
              <Image src={avatarSource(avatar)} alt='' width={128} height={128} unoptimized className='absolute left-1/2 top-0 h-[150%] w-[150%] max-w-none -translate-x-1/2 scale-x-[-1] object-cover' />
            </span>
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <Menu.Items className='absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-[#343A3E] rounded-md bg-white dark:bg-[#181C1F] border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
            <div className='p-1'>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type='button'
                    onClick={() => setAvatarPickerOpen(true)}
                    className={`${active ? 'bg-neutral-100 dark:bg-[#2A3236]' : ''} flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm`}
                  >
                    <UserRoundPen className='h-5 w-5' aria-hidden='true' />
                    Choisir un avatar
                  </button>
                )}
              </Menu.Item>
            </div>
            <div className='p-1'>
              <p className='px-2 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-[#9BAEB9]'>Display mode</p>
              {(['light', 'dark'] as const).map((mode) => (
                <Menu.Item key={mode}>
                  {({ active }) => (
                    <button
                      type='button'
                      onClick={() => setTheme(mode)}
                      className={`${active ? 'bg-neutral-100 dark:bg-[#2A3236]' : ''} flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm`}
                    >
                      {mode === 'light' ? (
                        <BsSun aria-hidden='true' className='h-5 w-5' />
                      ) : (
                        <BsMoon aria-hidden='true' className='h-5 w-5' />
                      )}
                      {mode === 'light' ? 'Light' : 'Dark'}
                      {theme === mode && (
                        <>
                          <span className='sr-only'> (selected)</span>
                          <BsCheck2 aria-hidden='true' className='ml-auto h-5 w-5 text-orange-600' />
                        </>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
            {session && <div className='px-1 py-1'>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    className={`${
                      active ? 'bg-orange-500 text-white' : 'text-gray-900 dark:text-[#DBE4E9]'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer`}
                    href={ROUTES.ACCOUNT}
                  >
                    {active ? (
                      <FaRegUserCircle
                        className='mr-2 h-5 w-5 text-white'
                        aria-hidden='true'
                      />
                    ) : (
                      <FaRegUserCircle
                        className='mr-2 h-5 w-5'
                        aria-hidden='true'
                      />
                    )}
                    Account
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-orange-500 text-white' : 'text-gray-900 dark:text-[#DBE4E9]'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer`}
                    onClick={handleSignOut}
                  >
                    {active ? (
                      <BiLogOut
                        className='mr-2 h-5 w-5 text-white'
                        aria-hidden='true'
                      />
                    ) : (
                      <BiLogOut className='mr-2 h-5 w-5' aria-hidden='true' />
                    )}
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </div>}
          </Menu.Items>
        </Transition>
      </Menu>
      {avatarPickerOpen && <AvatarPicker key={session?.user.id ?? 'guest'} onClose={() => setAvatarPickerOpen(false)} />}
    </div>
  )
}
