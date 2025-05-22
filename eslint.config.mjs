import { icebreaker } from '@icebreakers/eslint-config'

export default icebreaker({
  vue: true,
  tailwindcss: true,
  weapp: true,
  rules: {
    'no-undef': 'off',
  },
})
