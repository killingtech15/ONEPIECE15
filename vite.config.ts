import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Blender and screenshot output are not app source. On Windows, opening
      // a watcher while these large/generated files are written can raise EBUSY.
      ignored: ['**/.tools/**', '**/artifacts/**', '**/scripts/**', '**/tests/**', '**/docs/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three'
          if (id.includes('/node_modules/postprocessing/')) return 'effects'
        },
      },
    },
  },
})
