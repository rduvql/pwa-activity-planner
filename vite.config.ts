import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        host: "0.0.0.0"
    },
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico'],
            manifest: {
                name: 'Activity Planner',
                short_name: 'Planner',
                description: 'Plan activities with integrated todo lists',
                theme_color: '#6366f1',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
});
