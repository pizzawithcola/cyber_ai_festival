import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The TV kiosk page (public/tv.html) is a static file that differs from the SPA
 * in two ways:
 *   - its API key placeholder is only filled in by the deploy workflow;
 *   - it calls the API through relative URLs, because CloudFront serves both the
 *     app and the API from a single origin.
 *
 * Neither holds on a dev server, so previewing /tv.html locally used to fail
 * with "Reconnecting…" no matter what. This plugin closes that gap in dev only
 * (the proxy for /rankings is added below); a production build is untouched.
 */
function tvHtmlDevPreview(mode: string): Plugin {
  return {
    name: 'tv-html-dev-preview',
    // serve = dev server only, so builds and deploys are never affected
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '')
      const file = path.resolve(process.cwd(), 'public/tv.html')

      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url !== '/tv.html' && !url.startsWith('/tv.html?')) return next()

        const key = env.VITE_API_KEY || ''
        if (!key) {
          server.config.logger.warn(
            'tv.html: VITE_API_KEY is empty, so the page will report a missing API key'
          )
        }

        const html = fs.readFileSync(file, 'utf-8').replace('__API_KEY__', key)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(html)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), tvHtmlDevPreview(mode)],
    server: {
      port: 1688,
      // tv.html ranks players through a relative URL, which is same-origin in
      // production. Mirror that path onto the API host so the kiosk page can be
      // previewed locally too.
      proxy: env.VITE_API_URL
        ? {
            '/rankings': {
              target: env.VITE_API_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
