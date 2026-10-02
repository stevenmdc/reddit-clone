const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { loadEnvConfig } = require('@next/env')

const root = path.resolve(__dirname, '..')
loadEnvConfig(root, true, { info() {}, error() {} })

try {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
  if (!/^[a-z]{20}$/.test(projectRef)) throw new Error('Invalid project reference')

  const result = spawnSync(process.platform === 'win32' ? 'supabase.exe' : 'supabase', [
    'gen', 'types', 'typescript', '--project-id', projectRef, '--schema', 'public',
  ], { cwd: root, encoding: 'utf8' })

  if (result.error || result.status !== 0 || !result.stdout.includes('export type Database')) {
    throw new Error('Generation failed')
  }
  fs.writeFileSync(path.join(root, 'src/types/database.ts'), result.stdout)
  console.log('Updated src/types/database.ts')
} catch {
  console.error('Unable to generate database types. Check the Supabase URL, CLI installation and login. The existing file was preserved.')
  process.exitCode = 1
}
