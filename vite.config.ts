import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        host: "0.0.0.0"
    },
    base: "/planner/",
    publicDir: "public",
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['schedule.ico'],
            manifest: {
                name: 'Activity Planner',
                short_name: 'Planner',
                description: 'Plan activities with integrated todo lists',
                theme_color: '#6366f1',
                start_url: "/planner/",
                scope: '/planner/',
                icons: [
                    {
                        src: '/planner/schedule.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
});
