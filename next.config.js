const imageBucketUrl = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET_URL
const imageBucket = imageBucketUrl ? new URL(imageBucketUrl) : null

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageBucket ? [{
      protocol: imageBucket.protocol.replace(':', ''),
      hostname: imageBucket.hostname,
      port: imageBucket.port,
      pathname: `${imageBucket.pathname.replace(/\/$/, '')}/**`,
    }] : [],
  },
  output: 'standalone',
}

module.exports = nextConfig
