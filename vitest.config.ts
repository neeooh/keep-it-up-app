/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

// Standalone test config — vitest uses its own bundled Vite so we keep
// this separate from vite.config.ts to avoid plugin type mismatches.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
