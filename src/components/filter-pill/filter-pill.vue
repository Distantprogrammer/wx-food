<template>
  <view class="pill" :class="{ on: active }" hover-class="pressed" :hover-stay-time="180" @click="$emit('click')">
    <view class="funnel" :class="{ on: active }">
      <view class="funnel-a" />
      <view class="funnel-b" />
      <view class="funnel-c" />
    </view>
    <text class="label">{{ label }}</text>
    <template v-if="active && valueText">
      <text class="sep">·</text>
      <view v-if="dot" class="dot" :class="dot" />
      <text class="value">{{ valueText }}</text>
    </template>
    <view class="caret" />
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  active: { type: Boolean, default: false },
  valueText: { type: String, default: '' },
  /** easy | medium | hard */
  dot: { type: String, default: '' }
})

defineEmits(['click'])
</script>

<style scoped>
.pill {
  display: flex;
  align-items: center;
  flex-shrink: 1;
  min-width: 0;
  max-width: 100%;
  height: 56rpx;
  padding: 0 20rpx;
  background: linear-gradient(180deg, #FDF7EF 0%, #FAEEDF 100%);
  border: 2rpx solid #F1E2CF;
  border-radius: 999rpx;
  box-sizing: border-box;
  transition: transform 180ms ease;
}

.pill.on {
  background: #E8F3EE;
  border-color: #D7EBE3;
}

.pill.pressed {
  transform: scale(0.98);
}

.funnel {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 18rpx;
  margin-right: 8rpx;
}

.funnel-a,
.funnel-b,
.funnel-c {
  background: #E8975C;
  border-radius: 2rpx;
}

.funnel.on .funnel-a,
.funnel.on .funnel-b,
.funnel.on .funnel-c {
  background: #2D6A4F;
}

.funnel-a {
  width: 18rpx;
  height: 4rpx;
}

.funnel-b {
  width: 10rpx;
  height: 4rpx;
  margin-top: 2rpx;
}

.funnel-c {
  width: 4rpx;
  height: 6rpx;
  margin-top: 2rpx;
}

.label,
.sep,
.value {
  color: #8A8175;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 56rpx;
  white-space: nowrap;
}

.pill.on .label,
.pill.on .sep,
.pill.on .value {
  color: #2D6A4F;
  font-weight: 600;
}

.sep {
  margin: 0 6rpx;
}

.value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 6rpx;
  border-radius: 999rpx;
  background: #B3B3B3;
  flex-shrink: 0;
}

.dot.easy {
  background: #2E9E4F;
}

.dot.medium {
  background: #E6A23C;
}

.dot.hard {
  background: #E24B4B;
}

.caret {
  flex-shrink: 0;
  width: 12rpx;
  height: 12rpx;
  margin-top: -6rpx;
  margin-left: 8rpx;
  border-right: 3rpx solid #C9A36A;
  border-bottom: 3rpx solid #C9A36A;
  box-sizing: border-box;
  transform: rotate(45deg);
}

.pill.on .caret {
  border-right-color: #2D6A4F;
  border-bottom-color: #2D6A4F;
}
</style>
