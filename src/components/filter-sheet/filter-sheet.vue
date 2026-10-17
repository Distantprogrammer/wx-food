<template>
  <view v-if="rendered" class="mask" :class="{ on: entered }" @click="close">
    <view class="sheet" :class="{ on: entered }" @click.stop>
      <view class="handle" />
      <view class="head">
        <view class="badge">{{ icon }}</view>
        <view class="head-text">
          <text class="title">{{ title }}</text>
          <text class="sub">{{ subtitle }}</text>
        </view>
      </view>

      <view class="options">
        <view
          v-for="item in options"
          :key="item.value"
          class="row"
          hover-class="pressed"
          :hover-stay-time="180"
          @click="pick(item)"
        >
          <view class="emoji" :style="{ background: item.badgeBg || '#F7F8FA' }">{{ item.emoji }}</view>
          <view class="row-main">
            <view class="row-title">
              <text class="name">{{ item.title }}</text>
              <view v-if="item.dot" class="dot" :class="item.dot" />
              <text v-if="item.tag" class="tag" :class="item.tagType || 'hot'">{{ item.tag }}</text>
            </view>
            <text class="desc">{{ item.desc }}</text>
          </view>
          <view class="radio" :class="{ on: isOn(item) }">
            <view v-if="isOn(item)" class="tick" />
          </view>
        </view>
      </view>

      <view class="footer">
        <view class="btn ghost" hover-class="pressed" :hover-stay-time="180" @click="reset">重置</view>
        <view class="btn ok" hover-class="pressed" :hover-stay-time="180" @click="close">确定</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  icon: { type: String, default: '🍽️' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  value: { type: [String, Number], default: '' }
})

const emit = defineEmits(['close', 'select', 'reset'])

const rendered = ref(false)
const entered = ref(false)
let timer = 0

watch(
  () => props.visible,
  (val) => {
    clearTimeout(timer)
    if (val) {
      rendered.value = true
      timer = setTimeout(() => {
        entered.value = true
      }, 30)
      return
    }
    entered.value = false
    timer = setTimeout(() => {
      if (!props.visible) rendered.value = false
    }, 340)
  },
  { immediate: true }
)

function isOn(item) {
  return item.value === props.value
}

function pick(item) {
  if (item.value === props.value) return
  emit('select', item.value)
}

function reset() {
  emit('reset')
}

function close() {
  emit('close')
}
</script>

<style scoped>
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1200;
  background: rgba(17, 24, 39, 0.45);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: auto;
  transition: opacity 340ms cubic-bezier(0.32, 0.72, 0.33, 1);
}

.mask.on {
  opacity: 1;
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 32rpx 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background: #FFFFFF;
  border-radius: 48rpx 48rpx 0 0;
  box-sizing: border-box;
  transform: translateY(105%);
  transition: transform 340ms cubic-bezier(0.32, 0.72, 0.33, 1);
}

.sheet.on {
  transform: translateY(0);
}

.handle {
  width: 72rpx;
  height: 8rpx;
  margin: 8rpx auto 24rpx;
  background: #E5E7EB;
  border-radius: 999rpx;
}

.head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-right: 20rpx;
  background: #E8F3EE;
  border-radius: 20rpx;
  font-size: 36rpx;
  line-height: 72rpx;
  text-align: center;
  flex-shrink: 0;
}

.head-text {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  color: #1A1A1A;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 48rpx;
}

.sub {
  display: block;
  margin-top: 4rpx;
  color: #737373;
  font-size: 24rpx;
  line-height: 36rpx;
}

.row {
  display: flex;
  align-items: center;
  min-height: 108rpx;
  padding: 16rpx 0;
  border-top: 1px solid #F2F3F5;
  box-sizing: border-box;
}

.row.pressed {
  opacity: 0.72;
}

.emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  margin-right: 20rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  line-height: 42rpx;
  text-align: center;
  flex-shrink: 0;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
}

.name {
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  margin-left: 10rpx;
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

.tag {
  margin-left: 10rpx;
  padding: 0 10rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 32rpx;
}

.tag.hot {
  background: #FDECEC;
  color: #E24B4B;
}

.tag.light {
  background: #E8F3EE;
  color: #2D6A4F;
}

.desc {
  display: block;
  margin-top: 4rpx;
  color: #737373;
  font-size: 22rpx;
  line-height: 32rpx;
}

.radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-left: 16rpx;
  border: 2rpx solid #D9D9D9;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.radio.on {
  background: #2D6A4F;
  border-color: #2D6A4F;
}

.tick {
  width: 10rpx;
  height: 16rpx;
  margin-top: -4rpx;
  border-right: 3rpx solid #FFFFFF;
  border-bottom: 3rpx solid #FFFFFF;
  box-sizing: border-box;
  transform: rotate(45deg);
}

.footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0 32rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 88rpx;
}

.btn.pressed {
  transform: scale(0.98);
}

.ghost {
  flex: 1;
  background: #F3F4F6;
  color: #737373;
}

.ok {
  flex: 1.4;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  color: #FFFFFF;
}
</style>
