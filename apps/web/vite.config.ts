import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

function sharedAssetsPlugin() {
  return {
    name: 'shared-assets',
    closeBundle() {
      const srcDir = resolve(__dirname, '../../packages/assets/public')
      const destDir = resolve(__dirname, 'public')
      const dirs = ['ship-logos', 'provider-logos', 'ide-logos']
      
      dirs.forEach(dir => {
        const src = resolve(srcDir, dir)
        const dest = resolve(destDir, dir)
        if (existsSync(src)) {
          mkdirSync(dest, { recursive: true })
          readdirSync(src).forEach(file => {
            copyFileSync(resolve(src, file), resolve(dest, file))
          })
        }
      })
    },
  }
}

const config = defineConfig({
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    sharedAssetsPlugin(),
  ],
  resolve: {
    alias: {
      '@ship/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
      '@ship/primitives': fileURLToPath(new URL('../../packages/primitives/src/index.tsx', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['@ship/compiler'],
  },
})

export default config
