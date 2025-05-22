<script setup>
import TnTabbarItem from '@tuniao/tnui-vue3-uniapp/components/tabbar/src/tabbar-item.vue'
import TnTabbar from '@tuniao/tnui-vue3-uniapp/components/tabbar/src/tabbar.vue'
import { useTabbarStore } from '@/stores/modules/tabbar'
import { jumpSwitchPageTo } from '@/utils/pageTo'

const tabbarStore = useTabbarStore()

// 导航栏数据
const tabbarData = [
  {
    name: '首页',
    icon: 'home',
    activeIcon: 'home-fill',
    path: '/pages/index/index',
  },
  {
    name: '示例',
    icon: 'keyboard-circle',
    activeIcon: 'keyboard-circle-fill',
    path: '/pages/example/index',
  },
  {
    name: '我的',
    icon: 'my-circle',
    activeIcon: 'my-circle-fill',
    path: '/pages/mine/index',
  },
]
</script>

<template>
  <TnTabbar v-model="tabbarStore.currentActiveTabbarIndex" fixed frosted switch-animation>
    <TnTabbarItem
      v-for="(item, index) in tabbarData"
      :key="index"
      :icon="item.icon"
      :active-icon="item.activeIcon"
      :bulge="index === 1"
      :text="item.name"
      @click="jumpSwitchPageTo(item.path)"
    />
  </TnTabbar>
</template>

<style scoped lang="scss">

</style>
