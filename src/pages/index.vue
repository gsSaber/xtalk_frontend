<script setup lang="ts">
import { Base64 } from 'js-base64'
import { useRouter } from 'uni-use-router'

definePage({
  layout: false,
  style: { navigationStyle: 'custom' },
})

// 仿vue-router
const router = useRouter()

function jump() {
  const url = 'https://uni-helper.js.org/vitesse-uni-app/getting-started/introduction'
  const encodedUrl = Base64.encode(url)
  router.push({
    url: '/pages/WebView',
    query: {
      url: encodedUrl,
    },
  })
}
</script>

<template>
  <view
    h-screen
    w-screen
    flex
    items-center
    justify-center
    pt="[env(safe-area-inset-top)]"
    class="[background:linear-gradient(135deg,#f5f7fa_0%,#c3cfe2_100%)]"
  >
    <view
      text="[4rem] #2c3e50"
      cursor-pointer
      select-none
      font-bold
      transition-all
      duration-300
      ease-in-out
      hover="scale-110"
      class="[text-shadow:2px_2px_4px_rgba(0,0,0,0.1)] rotate-[-15deg] hover:rotate-[-12deg] hover:text-[#1a73e8]"
      @click="jump"
    >
      Welcome
    </view>
  </view>
</template>
