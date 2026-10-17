<template>
  <view class="section-head">
    <text class="section-title">{{ title }}</text>
    <view
      v-if="more"
      class="section-more"
      hover-class="is-pressed"
      :hover-stay-time="180"
      @click="$emit('more')"
    >
      <text class="more-text">{{ more }}</text>
      <text class="more-chev">›</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  more: { type: String, default: '' }
})

defineEmits(['more'])
</script>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 88rpx;
  margin-bottom: 24rpx;
}

.section-title {
  min-width: 0;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.section-more {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8rpx;
  min-height: 88rpx;
  color: #737373;
  transition: transform 180ms ease;
}

.section-more.is-pressed {
  transform: scale(0.98);
}

.more-text,
.more-chev {
  color: #737373;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.5;
}
</style>
