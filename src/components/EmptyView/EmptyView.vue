<template>
  <view class="empty-view">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #1f2d2a;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #6f7d78;
  font-weight: 650;
}
</style>
