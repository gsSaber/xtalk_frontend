// eslint.config.mjs
import eslint from '@eslint/js'
import globals from 'globals'
import eslintPluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
// import customGlobals from './.eslintrc-auto-import.json' assert { type: 'json' }
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const customGlobals = require('./.eslintrc-auto-import.json')

export default [
  {
    ignores: [
      'node_modules/*',
      'src/uni_modules/*',
      'dist/*',
      'public/*',
      '*.css',
      '*.jpg',
      '*.jpeg',
      '*.png',
      '*.gif',
      '*.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: false,
    jsx: true,
    braceStyle: '1tbs',
    arrowParens: 'always',
  }),

  /**
   * vue 规则
   */
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        /** 允许在.vue 文件中使用 JSX */
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  {
    rules: {
      // 在这里追加 vue 规则
      'vue/no-mutating-props': [
        'error',
        {
          shallowOnly: true,
        },
      ],
      'vue/multi-word-component-names': 'off', // 关闭规则
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
      'vue/no-template-shadow': 'off',
      'vue/require-explicit-emits': 'off',
      'vue/valid-define-emits': 'off',
      'no-useless-escape': 'off',
      'vue/no-unused-vars': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'off', // 关闭规则
      'vue/require-valid-default-prop': 'off',
      'prettier/ prettier': 'off',
      'no-empty': 'off',
      'no-undef': 'off',
      'no-console': [
        'error',
        {
          allow: ['error', 'warn', 'log'], // 只允许 console.error/warn
        },
      ],
    },
  },

  /**
   * 配置全局变量
   */
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // vue
        ...customGlobals.globals,
        /** 追加一些其他自定义全局规则 */
        wx: true,
      },
    },
  },

  /**
   * prettier 配置
   * 会合并根目录下的prettier.config.js 文件
   * @see https://prettier.io/docs/en/options
   */
  eslintPluginPrettierRecommended,
]
