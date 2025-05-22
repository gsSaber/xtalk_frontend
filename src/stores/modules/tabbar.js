export const useTabbarStore = defineStore('tabbar', () => {
  const currentActiveTabbarIndex = ref(0)

  function activeTabbar(val) {
    currentActiveTabbarIndex.value = val
  }

  return {
    currentActiveTabbarIndex,
    activeTabbar,
  }
})
