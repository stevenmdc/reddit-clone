import AppLayout from '@/components/AppLayout'
import { AvatarProvider } from '@/components/AvatarProvider'
import '@/styles/globals.css'
import { useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { Subreddit } from '@/types/models'

function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session
  subreddits?: Subreddit[] | null
}>) {
  const [supabase] = useState(() => createBrowserSupabaseClient())

  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <SessionContextProvider
        supabaseClient={supabase}
        initialSession={pageProps.initialSession}
      >
        <AvatarProvider>
          <AppLayout subreddits={pageProps.subreddits}>
            <Component {...pageProps} />
          </AppLayout>
        </AvatarProvider>
      </SessionContextProvider>
    </>
  )
}
export default MyApp
