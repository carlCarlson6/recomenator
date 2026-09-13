import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

const loadedEnv = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
Object.assign(process.env, loadedEnv)

// Validate environment variables at startup.
await import('#/env/server.js')

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [nitro({ preset: 'vercel' }), tanstackStart(), tailwindcss(), viteReact()],
})

export default config
