import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import createAutoImport from './plugins/auto-import'
import tailwindcss from 'tailwindcss'
import uniTailwind from '@uni-helper/vite-plugin-uni-tailwind'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni(), createAutoImport(), uniTailwind()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        require('postcss-pxtorpx-pro')({
          unitPrecision: 3,
          propList: ['*'],
          selectorBlackList: [],
          replace: true,
          mediaQuery: false,
          minPixelValue: 1,
          exclude: /node_modules|uview-ui/i,
          transform: (x) => x,
        }),
      ],
    },
  },
})
