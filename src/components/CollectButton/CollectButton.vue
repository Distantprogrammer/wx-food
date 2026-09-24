<template>
  <view
    class="collect-btn"
    :class="{ active: collected, disabled: isDisabled }"
    @click.stop="handleClick"
  >
    <text class="collect-icon">{{ collected ? '★' : '☆' }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  collected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle'])

const isDisabled = computed(() => props.disabled || props.loading)

function handleClick() {
  if (isDisabled.value) return
  emit('toggle')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.collect-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: #fff;
  color: #53615c;
  transition: transform 0.18s ease, background 0.18s ease, opacity 0.18s ease;

  &.active {
    color: $wechat;
    background: $wechat-soft;
    border-color: $border-green;
  }

  &:active:not(.disabled) {
    transform: scale(0.94);
  }

  &.disabled {
    opacity: 0.45;
  }
}

.collect-icon {
  font-size: 32rpx;
  line-height: 1;
}
</style>
