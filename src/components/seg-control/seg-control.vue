<template>
  <view class="seg">
    <view
      v-for="item in options"
      :key="item.value"
      class="seg-i"
      :class="{ active: modelValue === item.value }"
      @click="pick(item.value)"
    >{{ item.label }}</view>
  </view>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'change'])

function pick(value) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.seg {
  display: flex;
  margin-bottom: 28rpx;
  padding: 6rpx;
  border-radius: 24rpx;
  background: #EEF0F2;
}

.seg-i {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 68rpx;
  border-radius: 20rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 27rpx;
  font-weight: 600;
  line-height: 68rpx;
}

.seg-i.active {
  background: #FFFFFF;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  color: #2D6A4F;
  font-weight: 700;
}
</style>
