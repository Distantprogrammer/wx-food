<template>
  <view class="empty-state">
    <text class="empty-mark">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '🍽️' },
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx 32rpx;
  text-align: center;
}

.empty-mark {
  font-size: 36rpx;
  line-height: 1;
}

.empty-title {
  margin-top: 24rpx;
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.5;
}

.empty-desc {
  margin-top: 8rpx;
  color: #737373;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.5;
}
</style>
