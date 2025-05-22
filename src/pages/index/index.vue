<script setup>
import TnButton from '@tuniao/tnui-vue3-uniapp/components/button/src/button.vue'
import TnSignBoard from 'tnuiv3p-tn-sign-board/index.vue'
import { ref } from 'vue'
import SaveArea from '@/components/SaveArea.vue'
import Tabbar from '@/components/Tabbar.vue'

const signBoardRef = ref()

// 图片地址
const imagePath = ref('')

// 保存签名
function saveSign() {
  signBoardRef.value?.save().then((res) => {
    imagePath.value = res
  })
}
function roateSaveSign() {
  signBoardRef.value
    ?.save(true)
    .then((res) => {
      imagePath.value = res
    })
    .catch((err) => {
      console.error(err)
      uni.showToast({
        title: '保存失败',
        icon: 'none',
      })
    })
}
// 清空签名，重新签名
function clearSign() {
  signBoardRef.value?.clear()
}
</script>

<template>
  <SaveArea>
    <view class="content">
      <view class="demo">
        <view class="absolute top-0 size-full bg-[yellow]" />
        <TnSignBoard ref="signBoardRef" />
      </view>
      <view class="tn-mt tn-flex-center">
        <TnButton @click="saveSign">
          保存
        </TnButton>
        <TnButton @click="roateSaveSign">
          旋转保存
        </TnButton>
        <TnButton type="danger" @click="clearSign">
          重新签名
        </TnButton>
      </view>
      <view class="tn-mt save-wrapper tn-w-full">
        <image class="sign-image" :src="imagePath" mode="heightFix" />
      </view>
    </view>
    <Tabbar />
  </SaveArea>
</template>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx;

  .demo {
    position: relative;
    width: 100%;
    height: 460rpx;
    border: 1rpx solid var(--tn-color-gray-disabled);
  }

  .save-wrapper {
    position: relative;
    border: 1rpx solid var(--tn-color-gray-disabled);
    height: 360rpx;
  }
}
</style>
