<template>
  <view
    class="collect-btn"
    :class="{ active: collected, disabled: isDisabled }"
    @click.stop="handleClick"
  >
    <image
      class="collect-icon"
      :src="collected ? '/static/icons/star-active.png' : '/static/icons/star.png'"
      mode="aspectFit"
    />
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
  width: $icon-touch;
  height: $icon-touch;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid $border-color;
  border-radius: $radius-sm;
  background: $bg-card;
  transition: opacity $duration-fast $ease-out, background $duration-fast $ease-out;

  &.active {
    background: $warning-soft;
    border-color: rgba(201, 138, 18, 0.22);
  }

  &:active:not(.disabled) {
    opacity: 0.82;
  }

  &.disabled {
    opacity: 0.45;
  }
}

.collect-icon {
  width: $icon-visual;
  height: $icon-visual;
  flex-shrink: 0;
}
</style>
