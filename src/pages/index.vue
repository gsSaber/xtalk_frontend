<script setup lang="ts">
definePage({
  layout: false,
  style: { navigationStyle: 'custom' },
})
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
      hover="scale-110 text-#1a73e8"
      class="[text-shadow:2px_2px_4px_rgba(0,0,0,0.1)] rotate-[-15deg] hover:rotate-[-12deg]"
    >
      Welcome
    </view>
  </view>
</template>
