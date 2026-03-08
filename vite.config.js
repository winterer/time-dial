import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/time-dial.js'),
            formats: ['es'],
            fileName: () => 'time-dial.js'
        },
        outDir: 'dist',
        emptyOutDir: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                module: true,
                passes: 3
            },
            mangle: true,
            format: {
                comments: false
            }
        },
        target: 'es2019'
    },
    plugins: [
        {
            name: 'copy-themes-css',
            generateBundle() {
                this.emitFile({
                    type: 'asset',
                    fileName: 'time-dial-themes.css',
                    source: readFileSync(resolve(__dirname, 'src/time-dial-themes.css'), 'utf-8')
                });
            }
        }
    ]
});
