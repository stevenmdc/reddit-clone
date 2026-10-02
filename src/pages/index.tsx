import Head from 'next/head'
import Link from 'next/link'
import { useSession } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabase/client'
import { POST_SELECT_QUERY } from '@/lib/supabase/queries'
import Post from '@/components/Post'
import { ROUTES } from '@/constants/routes'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { AiFillPlusCircle } from 'react-icons/ai'
import { BiNews } from 'react-icons/bi'
import { BsFire, BsImage, BsLink } from 'react-icons/bs'
import { GetServerSideProps } from 'next'
import { Post as PostType, PostWithUpvotes, Subreddit } from '@/types/models'

export const getServerSideProps: GetServerSideProps = async () => {
  const [posts, subreddits] = await Promise.all([
    supabase
      .from('posts')
      .select(POST_SELECT_QUERY)
      .order('created_at', { ascending: false }),
    supabase.from('subreddits').select('*'),
  ])

  return {
    props: {
      posts: posts.data ?? [],
      subreddits: subreddits.data ?? [],
      loadError: posts.error || subreddits.error
        ? 'Impossible de charger les publications. Vérifiez la configuration du backend Supabase.'
        : null,
    },
  }
}

const sortByDate = (posts: PostWithUpvotes[]): PostWithUpvotes[] => {
  return posts.sort((a, b) => {
    return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  })
}

const sortByUpvotes = (posts: PostWithUpvotes[]): PostWithUpvotes[] => {
  return posts.sort((a, b) => {
    return b.upvotes - a.upvotes
  })
}

interface HomeProps {
  posts: PostType[]
  subreddits: Subreddit[]
  loadError: string | null
}

export default function Home({ posts: initialPosts, loadError }: HomeProps) {
  const session = useSession()
  const router = useRouter()
  const sort = router.query.sort === 'top' ? 'top' : 'new'

  const postsWithUpvotes: PostWithUpvotes[] = useMemo(
    () =>
      initialPosts.map((post) => {
        const upvotes = post.post_votes.reduce((acc, vote) => {
          return acc + (vote.is_upvote ? 1 : -1)
        }, 0)
        return { ...post, upvotes }
      }),
    [initialPosts]
  )

  const sortedPosts = useMemo(() => {
    if (sort === 'new') {
      return sortByDate([...postsWithUpvotes])
    } else {
      return sortByUpvotes([...postsWithUpvotes])
    }
  }, [sort, postsWithUpvotes])

  const handleSort = (sortBy: 'new' | 'top') => {
    void router.push(sortBy === 'top' ? ROUTES.POPULAR : ROUTES.HOME, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>Reddit Clone</title>
        <meta name='description' content='A clone of Reddit' />
      </Head>
      <main className='px-3 mt-5'>
        <div className='max-w-2xl mx-auto'>
          {loadError && (
            <div role='alert' className='mb-3 rounded border border-red-200 bg-white dark:bg-[#181C1F] p-4 text-red-700 dark:text-red-400'>
              {loadError}
            </div>
          )}
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
          <div className='mb-3 bg-white dark:bg-[#181C1F] border rounded p-3'>
            <div className='flex gap-3'>
              <button
                className={`flex items-center gap-2 border hover:bg-neutral-200 dark:hover:bg-[#2A3236] px-2 py-1 text-lg rounded ${
                  sort === 'new' && 'bg-neutral-200 dark:bg-[#2A3236]'
                }`}
                onClick={() => handleSort('new')}
              >
                <BiNews /> New
              </button>
              <button
                className={`flex items-center gap-2 border hover:bg-neutral-200 dark:hover:bg-[#2A3236] px-3 py-1 text-lg rounded ${
                  sort === 'top' && 'bg-neutral-200 dark:bg-[#2A3236]'
                }`}
                onClick={() => handleSort('top')}
              >
                <BsFire /> Top
              </button>
            </div>
          </div>
          <ul>
            {sortedPosts.map((post) => {
              return <Post key={post.id} {...post} />
            })}
          </ul>
        </div>
      </main>
    </>
  )
}
