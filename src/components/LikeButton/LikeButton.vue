<template>
  <view
    class="like-btn"
    :class="{ active: liked, disabled: isDisabled }"
    @click.stop="handleClick"
  >
    <image
      class="like-icon"
      :src="liked ? '/static/icons/heart-active.png' : '/static/icons/heart.png'"
      mode="aspectFit"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  liked: { type: Boolean, default: false },
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

.like-btn {
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
    background: $primary-soft;
    border-color: rgba(23, 107, 74, 0.18);
  }

  &:active:not(.disabled) {
    opacity: 0.82;
  }

  &.disabled {
    opacity: 0.45;
  }
}

.like-icon {
  width: $icon-visual;
  height: $icon-visual;
  flex-shrink: 0;
}
</style>
