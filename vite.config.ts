import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { fileURLToPath, URL } from 'node:url'

const entrypoints = {
    index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    actions: fileURLToPath(new URL('./src/actions.ts', import.meta.url)),
    layout: fileURLToPath(new URL('./src/layout.ts', import.meta.url)),
    navigation: fileURLToPath(new URL('./src/navigation.ts', import.meta.url)),
    inputs: fileURLToPath(new URL('./src/inputs.ts', import.meta.url)),
    feedback: fileURLToPath(new URL('./src/feedback.ts', import.meta.url)),
    'data-display': fileURLToPath(new URL('./src/data-display.ts', import.meta.url)),
} as const

export default defineConfig({
    plugins: [
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        libInjectCss(),
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false,
        }),
    ],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    build: {
        lib: {
            entry: entrypoints,
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => {
                const extension = format === 'es' ? 'js' : 'cjs'
                return entryName === 'index' ? `index.${extension}` : `${entryName}.${extension}`
            },
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'react/compiler-runtime', 'framer-motion', 'recharts', '@xyflow/react', '@xyflow/system'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                    'react/compiler-runtime': 'ReactCompilerRuntime',
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
