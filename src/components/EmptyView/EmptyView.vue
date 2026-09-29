<template>
  <view class="empty-view">
    <view class="empty-mark" aria-hidden="true">
      <view class="empty-dot" />
      <view class="empty-line" />
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 96rpx 40rpx;
  text-align: center;
}

.empty-mark {
  width: 88rpx;
  height: 88rpx;
  border-radius: $radius-md;
  background: $bg-muted;
  border: 1rpx solid $border-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.empty-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: $radius-round;
  background: $text-light;
  opacity: 0.55;
}

.empty-line {
  width: 40rpx;
  height: 6rpx;
  border-radius: $radius-round;
  background: $border-color;
}

.empty-title {
  font-size: $font-size-base;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
}

.empty-desc {
  margin-top: 10rpx;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-base;
}
</style>
