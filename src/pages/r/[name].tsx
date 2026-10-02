import Head from 'next/head'
import Link from 'next/link'
import { useSession } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabase/client'
import { NESTED_POSTS_QUERY } from '@/lib/supabase/queries'
import Upvotes from '@/components/Upvotes'
import { formatTimeAgo } from '@/lib/format-time-ago'
import { FaRegComment } from 'react-icons/fa'
import { useRouter } from 'next/router'
import { AiFillPlusCircle } from 'react-icons/ai'
import { BsImage, BsLink } from 'react-icons/bs'
import Post from '@/components/Post'
import { ROUTES } from '@/constants/routes'
import { GetServerSidePropsContext } from 'next'
import { Post as PostType, Subreddit as SubredditType } from '@/types/models'

type SubredditWithPosts = SubredditType & { posts: PostType[] }

interface SubredditPageProps {
  posts: SubredditWithPosts[] | null
  subreddits: SubredditType[] | null
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { name } = context.query
  if (typeof name !== 'string') return { notFound: true }
  const [posts, subreddits] = await Promise.all([
    supabase
      .from('subreddits')
      .select(`*, ${NESTED_POSTS_QUERY}`)
      .eq('name', name),
    supabase.from('subreddits').select('*'),
  ])

  if (posts.error || subreddits.error) throw new Error('Unable to load community')
  if (!posts.data?.length) return { notFound: true }

  return {
    props: { posts: posts.data, subreddits: subreddits.data },
  }
}

export default function Subreddit({ posts }: SubredditPageProps) {
  const session = useSession()
  const router = useRouter()
  const { name } = router.query

  return (
    <>
      <Head>
        <title>{name}</title>
        <meta name='description' content={`The subreddit for ${name}`} />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main className='px-3 mt-5'>
        <div className='max-w-2xl mx-auto'>
          {session && (
            <div className='flex items-center gap-2 mb-3 bg-white dark:bg-[#181C1F] p-2 border rounded'>
              <Link
                className='grow flex items-center gap-2'
                href={ROUTES.CREATE_POST}
              >
                <AiFillPlusCircle className='text-4xl text-neutral-500 dark:text-[#9BAEB9]' />{' '}
                <input
                  className='border w-full rounded px-3 py-2 bg-neutral-50 dark:bg-[#0E1113] hover:bg-white dark:hover:bg-[#22282C]'
                  placeholder='Create Post'
                  type='text'
                />
              </Link>
              <Link href={ROUTES.CREATE_POST_IMAGE}>
                <BsImage className='text-2xl text-neutral-500 dark:text-[#9BAEB9] hover:bg-neutral-100 dark:hover:bg-[#22282C] cursor-pointer h-10 w-10 p-2 rounded' />
              </Link>
              <Link href={ROUTES.CREATE_POST_LINK}>
                <BsLink className='text-2xl text-neutral-500 dark:text-[#9BAEB9] hover:bg-neutral-100 dark:hover:bg-[#22282C] cursor-pointer h-10 w-10 p-2 rounded' />
              </Link>
            </div>
          )}
          <ul>
            {posts?.[0]?.posts?.map((post: PostType) => {
              return <Post key={post.id} {...post} />
            })}
          </ul>
        </div>
      </main>
    </>
  )
}
