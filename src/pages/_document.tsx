import { Html, Head, Main, NextScript } from 'next/document'
import { themeInitScript } from '@/hooks/useTheme'

export default function Document() {
  return (
    <Html lang='en' suppressHydrationWarning>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body className='bg-neutral-50 text-neutral-900 dark:bg-[#0E1113] dark:text-[#DBE4E9]'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
