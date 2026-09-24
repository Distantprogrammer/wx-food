<template>
  <view class="simple-card" :class="{ selectable: batchMode }" @click="handleClick">
    <view v-if="batchMode" class="checkbox-wrap" @click.stop="emit('toggle-select', message._id)">
      <view class="checkbox" :class="{ checked: selected }">
        <text v-if="selected">✓</text>
      </view>
    </view>
    <view class="card-main">
      <view class="card-head">
        <text class="card-title">{{ titleText }}</text>
        <text class="tag" :class="statusClass">{{ statusLabel }}</text>
      </view>
      <text class="card-body">{{ message.content }}</text>
      <view v-if="hasActions && !batchMode" class="card-actions" @click.stop>
        <button v-if="showReject" class="mini-button danger" @click="emit('reject', message)">审核拒绝</button>
        <button v-if="showRestore" class="mini-button green" @click="emit('restore', message)">恢复通过</button>
        <button v-if="showDelete" class="mini-button" @click="emit('delete', message)">删除</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  batchMode: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: true },
  showRestore: { type: Boolean, default: false },
  showReject: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-select', 'delete', 'restore', 'reject', 'click'])

const hasActions = computed(() => props.showDelete || props.showRestore || props.showReject)

const titleText = computed(() => {
  const author = props.message.authorName || '匿名'
  const target = props.message.targetName || 'TA'
  return `${author}想对${target}说：`
})

const statusLabel = computed(() => {
  const status = Number(props.message.status)
  if (status === 0) return '待审核'
  if (status === 1) return '通过'
  if (status === 2) return '未通过'
  return '未知'
})

const statusClass = computed(() => {
  const status = Number(props.message.status)
  if (status === 0) return 'gray'
  if (status === 1) return 'green'
  if (status === 2) return 'red'
  return ''
})

function handleClick() {
  if (props.batchMode) {
    emit('toggle-select', props.message._id)
    return
  }
  emit('click', props.message)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.simple-card {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: $card;
  box-shadow: $shadow-card;

  &.selectable:active {
    opacity: 0.92;
  }
}

.checkbox-wrap {
  padding-top: 4rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $wechat;
  border-radius: 10rpx;
  color: $wechat;
  font-size: 22rpx;
  font-weight: 900;

  &:not(.checked) {
    border-color: #b7c0bc;
    color: transparent;
  }
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.card-title {
  flex: 1;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 850;
  color: $ink;
}

.tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 850;

  &.gray { background: #edf3f0; color: #54625e; }
  &.green { background: $wechat-soft; color: $wechat-dark; }
  &.red { background: $danger-soft; color: $danger; }
}

.card-body {
  color: $muted;
  font-size: 26rpx;
  line-height: 42rpx;
  font-weight: 600;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 16rpx;
}

.mini-button {
  height: 56rpx;
  padding: 0 20rpx;
  border: 1px solid $line;
  border-radius: 14rpx;
  background: #fff;
  color: #52615d;
  font-size: 22rpx;
  font-weight: 850;
  line-height: 56rpx;

  &.green {
    border-color: rgba(7, 193, 96, 0.2);
    background: $wechat-soft;
    color: $wechat-dark;
  }

  &.danger {
    border-color: rgba(228, 91, 79, 0.18);
    background: $danger-soft;
    color: $danger;
  }
}
</style>
