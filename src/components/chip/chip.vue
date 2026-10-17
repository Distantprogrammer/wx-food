<template>
  <view
    class="chip"
    :class="{ 'is-on': active }"
    hover-class="is-pressed"
    :hover-stay-time="180"
    @click="$emit('click')"
  >
    <text class="chip-text"><slot /></text>
  </view>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 32rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: transform 180ms ease;
}

.chip.is-on {
  background: #E8F3EE;
  box-shadow: none;
}

.chip.is-pressed {
  transform: scale(0.98);
}

.chip-text {
  color: #737373;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

.chip.is-on .chip-text {
  color: #2D6A4F;
  font-weight: 600;
}
</style>
