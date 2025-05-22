<script setup>
const { safeAreaInsets } = uni.getSystemInfoSync()
</script>

<template>
  <view :style="{ paddingTop: `${safeAreaInsets?.top}px` }">
    <slot />
  </view>
</template>

<style scoped lang="scss">

</style>
