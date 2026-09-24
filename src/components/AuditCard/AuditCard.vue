<template>
  <view class="audit-card" :class="{ 'batch-mode': batchMode }">
    <view v-if="batchMode" class="checkbox-wrap" @click="emit('toggle-select', message._id)">
      <view class="checkbox" :class="{ checked: selected }">
        <text v-if="selected">✓</text>
      </view>
    </view>
    <view class="audit-main">
      <view class="audit-head">
        <text class="audit-title">{{ titleText }}</text>
        <text class="tag green">{{ securityLabel }}</text>
      </view>
      <text class="audit-body">{{ message.content }}</text>
      <text class="audit-meta">{{ wordCount }} 字</text>
      <view v-if="!batchMode" class="audit-actions">
        <button class="approve-button" @click="emit('approve', message)">审核通过</button>
        <button class="danger-button" @click="emit('reject', message)">审核拒绝</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  batchMode: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-select', 'approve', 'reject'])

const titleText = computed(() => {
  const author = props.message.authorName || '匿名'
  const target = props.message.targetName || 'TA'
  return `${author}想对${target}说`
})

const wordCount = computed(() => (props.message.content || '').length)

const securityLabel = computed(() => {
  if (props.message.securityPassed) return '安全通过'
  return '微信安全审核确认'
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.audit-card {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: $card;
  box-shadow: $shadow-card;

  &.batch-mode {
    display: grid;
    grid-template-columns: 44rpx 1fr;
  }
}

.audit-main {
  flex: 1;
  min-width: 0;
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

.audit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.audit-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 850;
  color: $ink;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 850;

  &.green {
    background: #e9fbf1;
    color: $wechat-dark;
  }
}

.audit-body {
  display: block;
  color: $ink-soft;
  font-size: 26rpx;
  line-height: 42rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.audit-meta {
  display: block;
  color: $muted;
  font-size: 22rpx;
  font-weight: 650;
  margin-bottom: 16rpx;
}

.audit-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.approve-button,
.danger-button {
  min-width: 152rpx;
  height: 68rpx;
  padding: 0 24rpx;
  border-radius: $radius-md;
  font-size: 24rpx;
  font-weight: 850;
  line-height: 68rpx;
}

.approve-button {
  border: 1px solid rgba(7, 193, 96, 0.2);
  background: #ecfbf2;
  color: $wechat-dark;
}

.danger-button {
  border: 1px solid rgba(228, 91, 79, 0.18);
  background: $danger-soft;
  color: $danger;
}
</style>
