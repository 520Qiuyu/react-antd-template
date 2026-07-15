import react from '@vitejs/plugin-react';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig, type UserConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(({ mode }): UserConfig => {
  console.log('mode', mode);
  return {
    base: './',
    assetsInclude: ['**/*.wasm'],
    plugins: [
      react(),
      // 自动导入 https://github.com/unplugin/unplugin-auto-import
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        ],
        imports: ['react', 'react-router', 'ahooks'],
        // Generate corresponding .eslintrc-auto-import.json file.
        // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
        eslintrc: {
          enabled: false, // Default `false`
          // provide path ending with `.mjs` or `.cjs` to generate the file with the respective format
          filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
          globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
        },
        dts: './src/auto-imports.d.ts',
      }),
      // 图片压缩 https://github.com/FatehAK/vite-plugin-image-optimizer
      ViteImageOptimizer(),
      // 打包分析 https://github.com/nonzzz/vite-bundle-analyzer
      // mode === 'production' && analyzer(),
    ],
    css: {
      preprocessorOptions: {
        less: {
          // 如果你想要开启全局变量注入
          additionalData: `@import "@/assets/styles/entry.less";`,
          javascriptEnabled: true, // 如果需要支持 Less 中的 JavaScript 语法,
          module: true,
        },
      },
      modules: {
        scopeBehaviour: 'local', // 或 'global'
        generateScopedName: '[name]__[local]___[hash:base64:5]',
        globalModulePaths: [], // 如果有需要排除模块化的路径可以在这里配置
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        assets: path.resolve(__dirname, './src/assets'),
        components: path.resolve(__dirname, './src/components'),
        utils: path.resolve(__dirname, './src/utils'),
        apis: path.resolve(__dirname, './src/apis'),
        views: path.resolve(__dirname, './src/views'),
        src: path.resolve(__dirname, './src'),
        images: path.resolve(__dirname, './src/assets/images'),
      },
    },
    // 依赖预构建
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'ahooks', 'antd', 'axios'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    server: {
      port: 2558,
      host: '0.0.0.0',
      /* headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      }, */
      proxy: {
        '/api': {
          target: 'http://localhost:3000', //
          secure: false,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000', //
          secure: false,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              { name: 'antd ', test: /node_modules\/antd/ },
              { name: 'react', test: /node_modules\/react/ },
              { name: 'reactRouter', test: /node_modules\/react-router/ },
              { name: 'ahooks', test: /node_modules\/ahooks/ },
              { name: 'zustand', test: /node_modules\/zustand/ },
            ],
          },
        },
      },
    },
  };
});
