import Link from 'next/link'
import { BsReddit } from 'react-icons/bs'
import { useSession } from '@supabase/auth-helpers-react'
import UserDropdown from './UserDropdown'
import { ROUTES } from '@/constants/routes'
export default function Navbar() {
  const session = useSession()

  return (
    <nav className='sticky top-0 z-40 h-14 border-b bg-white dark:bg-[#181C1F] shadow-sm px-3 sm:px-5 py-2 flex justify-between items-center'>
      <div className='flex items-center gap-1 sm:gap-3'>
        <Link href={ROUTES.HOME} className='flex gap-2 items-center'>
          <BsReddit className='text-orange-700' size={33} />
          <div className='font-semibold text-xl hidden sm:inline-block'>
            reddit
          </div>
        </Link>
      </div>
      {session ? (
        <UserDropdown />
      ) : (
        <div className='flex items-center gap-2'>
          <Link
            className='inline-flex place-self-center whitespace-nowrap rounded-full border border-neutral-400 dark:border-[#52616B] hover:border-neutral-500 text-neutral-900 dark:text-[#DBE4E9] text-sm sm:text-base font-semibold px-3 sm:px-10 py-1 cursor-pointer'
            href={ROUTES.LOGIN}
          >
            Log In
          </Link>
          <Link
            className='inline-flex place-self-center whitespace-nowrap rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-semibold px-3 sm:px-10 py-1 cursor-pointer'
            href={ROUTES.SIGNUP}
          >
            Sign Up
          </Link>
          <UserDropdown />
        </div>
      )}
    </nav>
  )
}
