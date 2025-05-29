import react from '@vitejs/plugin-react';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(({ command, mode }) => {
  console.log('mode', mode);
  return {
    define: {
      global: 'window', // 将 `global` 替换为 `window`
    },
    base: './',
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
      mode === 'production' && analyzer(),
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
    esbuild: {
      // jsxInject: `import React from 'react'`,
    },
    // 依赖预构建
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'ahooks', 'antd'],
    },
    server: {
      port: 2558,
      host: '0.0.0.0',
      proxy: {
        '/api/sm-sso': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/sso/login': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/logout': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/api': {
          target: 'http://172.22.43.162:50309', //
          // target: "http://172.22.132.62:6272", //文
          // target: "http://172.22.132.51:6272", //曾
          // target: "http://172.22.132.66:6272", //唐
          secure: false,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      proxy: {
        '/api/sm-sso': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/sso/login': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/logout': {
          target: 'http://172.22.43.162:50309', //
          secure: false,
          changeOrigin: true,
        },
        '/api': {
          target: 'http://172.22.43.162:50309', //
          // target: "http://172.22.132.62:6272", //文
          // target: "http://172.22.132.51:6272", //曾
          // target: "http://172.22.132.66:6272", //唐
          secure: false,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 分包
          manualChunks: {
            antd: ['antd'],
            react: ['react', 'react-dom'],
            reactRouter: ['react-router-dom'],
            ahooks: ['ahooks'],
            reactRedux: ['react-redux'],
          },
        },
      },
    },
  };
});
