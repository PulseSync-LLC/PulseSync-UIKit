import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [
        react(),
        libInjectCss(),
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: true,
        }),
    ],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    build: {
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            name: 'PulseSyncUI',
            formats: ['es', 'cjs'],
            fileName: 'pulsesync-ui',
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion', 'recharts', '@xyflow/react', '@xyflow/system'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                    'framer-motion': 'framerMotion',
                },
            },
        },
        sourcemap: true,
        cssCodeSplit: false,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
