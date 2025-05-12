export const useTabbarStore = defineStore('tabbar', () => {
  const tabbarIndex = ref(0)
  const tabbarItem = ref({})

  function activeTabbar(index) {
    if (tabbarIndex.value !== index) {
      tabbarIndex.value = index
    }
  }

  function activeTabbarItem(item) {
    tabbarItem.value = item
  }

  return {
    tabbarIndex,
    tabbarItem,
    activeTabbar,
    activeTabbarItem,
  }
})
