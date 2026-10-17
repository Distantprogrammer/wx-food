<template>
  <view class="menu-item" hover-class="is-pressed" :hover-stay-time="180" @click="$emit('click')">
    <view class="menu-ico">
      <text class="menu-glyph">{{ icon }}</text>
    </view>
    <text class="menu-label">{{ label }}</text>
    <text v-if="badge" class="menu-badge">{{ badge }}</text>
    <view class="chevron" />
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  badge: { type: String, default: '' }
})

defineEmits(['click'])
</script>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  height: 108rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
  transition: transform 180ms ease;
}

.menu-item.is-pressed {
  transform: scale(0.98);
}

.menu-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  margin-right: 24rpx;
  background: #F2F3F5;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.menu-glyph {
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1;
}

.menu-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.menu-badge {
  flex-shrink: 0;
  min-width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #F5222D;
  color: #FFFFFF;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 32rpx;
  text-align: center;
  box-sizing: border-box;
}
</style>
