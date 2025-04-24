import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'parquet-merge-[hash].js',
      },
    },
  },
  plugins: [
		preact(),
		tailwindcss(),
    cssInjectedByJsPlugin(),
	],
  esbuild: {
    legalComments: 'none',
  },
})
