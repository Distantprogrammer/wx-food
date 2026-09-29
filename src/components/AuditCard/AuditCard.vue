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
        <text class="tag">{{ securityLabel }}</text>
      </view>
      <text class="audit-body">{{ message.content }}</text>
      <text class="audit-meta">{{ wordCount }} 字</text>
      <view v-if="!batchMode" class="audit-actions">
        <view class="action-btn primary" @click="emit('approve', message)">审核通过</view>
        <view class="action-btn danger" @click="emit('reject', message)">审核拒绝</view>
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
@import '@/styles/mixins.scss';

.audit-card {
  display: flex;
  gap: 20rpx;
  @include workbench-card;
  margin-bottom: 0;

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
  @include pressed;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $primary-color;
  border-radius: $radius-sm;
  color: $primary-color;
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;

  &:not(.checked) {
    border-color: $border-color;
    color: transparent;
  }

  &.checked {
    background: $primary-soft;
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
  min-width: 0;
  font-size: $font-size-base;
  font-weight: 700;
  color: $text-primary;
  @include ellipsis(1);
}

.tag {
  @include status-tag;
  &.tag,
  & {
    color: $primary-color;
    background: $primary-soft;
  }
}

.audit-body {
  display: block;
  color: $text-secondary;
  font-size: 26rpx;
  line-height: $line-loose;
  font-weight: 500;
  margin-bottom: 8rpx;
  word-break: break-word;
}

.audit-meta {
  display: block;
  color: $text-light;
  font-size: $font-size-xs;
  margin-bottom: 16rpx;
}

.audit-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}

.action-btn {
  @include op-chip;

  &.primary {
    color: $primary-color;
    background: $primary-soft;
  }

  &.danger {
    color: $error-color;
    background: $error-soft;
  }
}
</style>
