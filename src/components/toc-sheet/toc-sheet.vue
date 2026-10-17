<template>
  <view v-if="rendered" class="toc-mask" :class="{ on: entered }" @click="close">
    <view class="toc-sheet" :class="{ on: entered }" @click.stop>
      <view class="toc-handle" />
      <view class="toc-head">
        <view class="toc-badge">📑</view>
        <view class="toc-head-text">
          <text class="toc-title">文章目录</text>
          <text class="toc-sub">共 {{ items.length }} 个章节 · 点击跳转</text>
        </view>
      </view>
      <view v-if="!items.length" class="toc-empty">这篇还没有章节</view>
      <view
        v-for="item in items"
        :key="item.id"
        class="toc-row"
        hover-class="pressed"
        :hover-stay-time="180"
        @click="pick(item)"
      >
        <text class="toc-no">{{ item.no }}</text>
        <text class="toc-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'select'])
const rendered = ref(false)
const entered = ref(false)
let timer = 0

watch(
  () => props.visible,
  (value) => {
    clearTimeout(timer)
    if (value) {
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

function close() {
  emit('close')
}

function pick(item) {
  emit('select', item)
  emit('close')
}
</script>

<style scoped>
.toc-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1200;
  background: rgba(17, 24, 39, 0.45);
  opacity: 0;
  pointer-events: auto;
  transition: opacity 340ms cubic-bezier(0.32, 0.72, 0.33, 1);
}

.toc-mask.on {
  opacity: 1;
}

.toc-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 70%;
  padding: 16rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-radius: 48rpx 48rpx 0 0;
  box-sizing: border-box;
  transform: translateY(105%);
  transition: transform 340ms cubic-bezier(0.32, 0.72, 0.33, 1);
}

.toc-sheet.on {
  transform: translateY(0);
}

.toc-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 8rpx auto 24rpx;
  background: #E5E7EB;
  border-radius: 999rpx;
}

.toc-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.toc-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  margin-right: 22rpx;
  border-radius: 26rpx;
  background: #E8F3EE;
  font-size: 38rpx;
  line-height: 80rpx;
  text-align: center;
}

.toc-head-text {
  flex: 1;
  min-width: 0;
}

.toc-title {
  display: block;
  color: #1A1A1A;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 44rpx;
}

.toc-sub {
  display: block;
  margin-top: 4rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 24rpx;
  line-height: 36rpx;
}

.toc-empty {
  padding: 24rpx 0 12rpx;
  color: #737373;
  font-size: 26rpx;
}

.toc-row {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  border-top: 1px solid #F2F3F5;
}

.toc-row.pressed {
  opacity: 0.72;
}

.toc-no {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 60rpx;
  height: 60rpx;
  margin-right: 24rpx;
  border-radius: 18rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 60rpx;
  text-align: center;
}

.toc-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 28rpx;
  line-height: 40rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
