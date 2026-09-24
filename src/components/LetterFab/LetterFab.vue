<template>
  <view class="letter-fab">
    <view class="fab fab-search" @click.stop="emit('search')">
      <uni-icons type="search" size="24" color="#07c160" />
    </view>
    <view class="fab fab-write primary" @click.stop="emit('write')">
      <uni-icons type="compose" size="24" color="#ffffff" />
    </view>
  </view>
</template>

<script setup>
const emit = defineEmits(['search', 'write'])
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.letter-fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(176rpx + env(safe-area-inset-bottom) + 24rpx);
  z-index: $z-index-fab;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 24rpx;
  pointer-events: auto;
}

.fab {
  width: 108rpx;
  height: 108rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  color: $wechat;
  box-shadow: $shadow-fab;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &.primary {
    background: $wechat;
    color: #fff;
  }

  &:active {
    transform: scale(0.96);
  }
}

</style>
