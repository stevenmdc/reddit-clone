import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Head from 'next/head'
import Image from 'next/image'
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import { User } from '@/types/models'
import { useFormSubmit } from '@/hooks/useFormSubmit'
import { avatarSource } from '@/constants/avatars'
import { useAvatar } from '@/components/AvatarProvider'
import AvatarPicker from '@/components/AvatarPicker'

interface AccountProps {
  data: User | null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerSupabaseClient(context)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return {
      props: { data },
    }
  }

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  }
}

export default function Account({ data }: AccountProps) {
  const [success, setSuccess] = useState(false)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const { avatar } = useAvatar()
  const session = useSession()
  const supabase = useSupabaseClient()
  const { loading, error, executeSubmit } = useFormSubmit()

  if (!data) {
    return (
      <main className='max-w-2xl mx-auto mt-10 px-3'>
        <div role='alert' className='rounded border bg-white dark:bg-[#181C1F] p-5 text-red-700 dark:text-red-400'>
          Impossible de charger votre profil. Réessayez ou vérifiez la configuration Supabase.
        </div>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!session) throw new Error('User not signed in.')

    setSuccess(false)
    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value

    await executeSubmit(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
      if (error) throw error
      setSuccess(true)
    })
  }

  return (
    <>
      <Head>
        <title>Account</title>
        <meta
          name='description'
          content='A page to see and update your account details'
        />
      </Head>
      <main className='max-w-2xl mx-auto mt-10 px-3'>
        <h1 className='text-xl mb-3'>Account</h1>
        <div className='bg-white dark:bg-[#181C1F] rounded p-5 border'>
          <div className='mb-5 flex flex-wrap items-center gap-5 border-b pb-5'>
            <Image
              src={avatarSource(avatar)}
              alt='Votre avatar'
              width={128}
              height={128}
              unoptimized
              className='h-32 w-32 rounded-2xl object-contain'
            />
            <div>
              <h2 className='mb-2 font-semibold'>Votre avatar</h2>
              <button
                type='button'
                onClick={() => setAvatarPickerOpen(true)}
                className='rounded-full border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-[#2A3236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
              >
                Choisir un avatar
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='mb-5'>
              <label
                className='uppercase text-sm font-semibold'
                htmlFor='email'
              >
                Email
              </label>
              <input
                id='email'
                className='block border w-full rounded px-2 py-1 cursor-not-allowed'
                type='text'
                disabled
                defaultValue={session?.user.email}
              />
            </div>
            <div className='mb-5'>
              <label
                className='uppercase text-sm font-semibold'
                htmlFor='username'
              >
                Username
              </label>
              <input
                id='username'
                className='block border w-full rounded px-2 py-1'
                type='text'
                defaultValue={data.username ?? ''}
              />
            </div>
            <div className='text-right'>
              <button
                className='rounded-full bg-neutral-600 hover:bg-neutral-500 text-neutral-100 px-4 py-1 disabled:bg-gray-400 disabled:cursor-not-allowed'
                disabled={loading}
              >
                Submit
              </button>
            </div>
          </form>
          {error && <div role='alert' className='mt-3 text-red-700 dark:text-red-400'>{error}</div>}
          <div
            className={`text-right mt-3 text-green-600 dark:text-green-400 font-semibold ${
              success ? 'visible' : 'hidden'
            }`}
          >
            Account updated!
          </div>
        </div>
      </main>
      {avatarPickerOpen && <AvatarPicker onClose={() => setAvatarPickerOpen(false)} />}
    </>
  )
}
