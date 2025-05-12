<script setup>
import { useTabbarStore } from '@/store/modules/tabbar'
import TmTabbar from '@/uni_modules/tm-ui/components/tm-tabbar/tm-tabbar.vue'

const tabbarStore = useTabbarStore()
const list = [
  {
    title: '首页',
    icon: 'home-smile-2-line',
    selectedIcon: 'home-smile-2-fill',
    path: '/pages/index/index',
    dotType: 'dot',
  },
  {
    title: '示例',
    icon: 'tools-line',
    selectedIcon: 'tools-fill',
    path: '/pages/example/index',
  },
]

function changeTabbar(index) {
  console.log('changeTabbar', list[index].path)
  tabbarStore.activeTabbar(index)
  uni.switchTab({
    url: list[index].path,
  })
}
</script>

<template>
  <view class="">
    <!--  :is-canvas-render="false" 必须为false,官方现在已知ios有问题,正在修复  -->
    <tm-tabbar
      :list="list"
      :out-index="tabbarStore.tabbarIndex"
      color="rgba(0,0,0,0.64)"
      out-bg-color="#ffffff"
      out-icon-color="#16ee9c"
      position="relative"
      :is-canvas-render="false"
      selected-color="#000000"
      @change="changeTabbar"
    >
    </tm-tabbar>
  </view>
</template>

<style scoped></style>
