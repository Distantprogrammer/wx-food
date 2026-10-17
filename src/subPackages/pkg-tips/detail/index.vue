<template>
  <view />
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

onLoad((query) => {
  const id = query?.id || ''
  uni.redirectTo({ url: `/pages/tip-detail/index?id=${id}` })
})
</script>
