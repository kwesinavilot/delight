import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/pages/popup/index.html'),
                sidepanel: resolve(__dirname, 'src/pages/sidepanel/index.html'),
                welcome: resolve(__dirname, 'src/pages/welcome/index.html'),
                userguide: resolve(__dirname, 'src/pages/userguide/index.html'),
                background: resolve(__dirname, 'src/background/index.ts'),
                content: resolve(__dirname, 'src/content/index.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo?.name?.split('.') ?? [];
                    const extType = info[info.length - 1];

                    // Handle HTML files
                    if (extType === 'html') {
                        const pageName = assetInfo?.name?.split('/')?.pop()?.replace('index.', '') ?? '';
                        return `${pageName}`;
                    }

                    // Handle other assets
                    return `[name][extname]`;
                }
            }
        },
        outDir: 'dist',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
});