<template>
  <view />
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  uni.redirectTo({ url: '/pages/me/feedback' })
})
</script>
