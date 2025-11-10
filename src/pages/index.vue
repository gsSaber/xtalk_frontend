<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

definePage({
  layout: false,
  style: { navigationStyle: 'custom' },
})

const showToast = ref(false)
let toastTimer: number | null = null

async function handleCopy() {
  try {
    await navigator.clipboard.writeText('Welcome to Basic Uni Template!')
    // Show toast
    showToast.value = true
    // Reset any existing timer
    if (toastTimer)
      window.clearTimeout(toastTimer)
    // Auto hide after 2s
    toastTimer = window.setTimeout(() => {
      showToast.value = false
      toastTimer = null
    }, 2000)
  }
  catch (err) {
    console.error(err)
  }
}

onBeforeUnmount(() => {
  if (toastTimer)
    window.clearTimeout(toastTimer)
})
</script>

<template>
  <div
    h-screen
    w-screen
    flex
    items-center
    justify-center
    pt="[env(safe-area-inset-top)]"
    class="[background:linear-gradient(135deg,#f5f7fa_0%,#c3cfe2_100%)]"
  >
    <div
      text="[4rem] #2c3e50"
      cursor-pointer
      select-none
      font-bold
      transition-all
      duration-300
      ease-in-out
      hover="scale-110 text-#1a73e8"
      class="[text-shadow:2px_2px_4px_rgba(0,0,0,0.1)] rotate-[-15deg] hover:rotate-[-12deg]"
      @click="handleCopy"
    >
      Welcome
    </div>
    <!-- Toast bottom-right -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showToast"
        fixed
        bottom="4"
        right="4"
        select-none
        rounded
        bg="green-600"
        px="4"
        py="2"
        text="white"
        shadow="lg"
        class="shadow-green-400/30"
        role="status"
        aria-live="polite"
      >
        复制成功，已复制到剪贴板
      </div>
    </Transition>
  </div>
</template>
