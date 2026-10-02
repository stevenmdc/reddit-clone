import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    files: ['src/components/Upvotes.tsx'],
    // Existing prop/session synchronization will be refactored with the vote layer.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores(['.next/**', '.swc/**', 'node_modules/**', 'coverage/**']),
])
