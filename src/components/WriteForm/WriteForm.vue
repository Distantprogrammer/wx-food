<template>
  <view class="write-form">
    <view class="form-card">
      <view class="field">
        <text class="label">联系方式（选填）</text>
        <input
          v-model="contact"
          class="input"
          placeholder="微信 / 手机号，方便我们联系你"
          :focus="autoFocus"
          maxlength="40"
          @input="emitChange"
        />
      </view>
      <view class="field">
        <text class="label">反馈内容 *</text>
        <textarea
          v-model="content"
          class="textarea"
          placeholder="说说你的建议、问题或想要的功能..."
          maxlength="1000"
          :show-confirm-bar="false"
          @input="emitChange"
        />
        <text class="counter">剩余 {{ remainCount }} 字</text>
      </view>
    </view>

    <view class="safe-meta" :class="{ warning: sensitiveStatus === 'pending', failed: sensitiveStatus === 'failed', ok: sensitiveStatus === 'passed' }">
      <text class="safe-dot">{{ sensitiveStatus === 'passed' ? '✓' : (sensitiveStatus === 'failed' ? '!' : '·') }}</text>
      <text class="safe-text">内容将在本地做基础过滤后提交</text>
    </view>

    <button
      class="primary-button"
      :class="{ disabled: isBusy }"
      :loading="isBusy"
      :disabled="isBusy"
      @click="handleSubmit"
    >
      {{ submitText }}
    </button>

    <view class="preview-section">
      <text class="section-title-text">提交预览</text>
      <view class="preview-card">
        <view class="letter-head">
          <view class="avatar">{{ previewAvatar }}</view>
          <view class="head-main">
            <text class="letter-title">{{ previewTitle }}</text>
            <text class="letter-time">{{ contact.trim() ? `联系：${contact.trim()}` : '未填写联系方式' }}</text>
          </view>
        </view>
        <text class="letter-body">{{ previewContent }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { validateMessageContent, filterSensitiveWords } from '@/utils/security'

const props = defineProps({
  authorName: { type: String, default: '美食家' },
  initialContact: { type: String, default: '' },
  initialContent: { type: String, default: '' },
  autoFocus: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  submitText: { type: String, default: '提交反馈' }
})

const emit = defineEmits(['submit', 'change'])

const contact = ref(props.initialContact)
const content = ref(props.initialContent)
const sensitiveStatus = ref('pending')
const localSubmitting = ref(false)

const isBusy = computed(() => props.submitting || localSubmitting.value)
const remainCount = computed(() => 1000 - (content.value?.length || 0))
const previewAvatar = computed(() => (props.authorName || '美').slice(0, 1))
const previewTitle = computed(() => `${props.authorName || '美食家'} 的反馈`)
const previewContent = computed(() => content.value.trim() || '反馈内容将显示在这里')

watch(() => props.initialContact, (val) => { contact.value = val || '' })
watch(() => props.initialContent, (val) => { content.value = val || '' })

let checkTimer = null

function runSensitiveCheck() {
  const text = content.value?.trim()
  const c = contact.value?.trim()
  if (!text && !c) {
    sensitiveStatus.value = 'pending'
    return
  }
  const contentOk = !text || filterSensitiveWords(text).passed
  const contactOk = !c || filterSensitiveWords(c).passed
  sensitiveStatus.value = contentOk && contactOk ? 'passed' : 'failed'
}

watch([content, contact], () => {
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(runSensitiveCheck, 300)
})

function emitChange() {
  emit('change', {
    contact: contact.value,
    content: content.value
  })
}

function validateContact(value = '') {
  const v = String(value || '').trim()
  if (!v) return { valid: true, message: 'ok' }
  if (v.length > 40) return { valid: false, message: '联系方式不能超过40字' }
  const sensitive = filterSensitiveWords(v)
  if (!sensitive.passed) {
    return { valid: false, message: `联系方式包含敏感词：${sensitive.hits.join('、')}` }
  }
  return { valid: true, message: 'ok' }
}

async function handleSubmit() {
  if (isBusy.value) return

  const contactCheck = validateContact(contact.value)
  if (!contactCheck.valid) {
    uni.showToast({ title: contactCheck.message, icon: 'none' })
    return
  }
  const contentCheck = validateMessageContent(content.value)
  if (!contentCheck.valid) {
    uni.showToast({ title: contentCheck.message, icon: 'none' })
    return
  }

  localSubmitting.value = true
  try {
    runSensitiveCheck()
    if (sensitiveStatus.value === 'failed') {
      uni.showToast({ title: '本地敏感词检测未通过', icon: 'none' })
      return
    }
    emit('submit', {
      contact: contact.value.trim(),
      content: content.value.trim()
    })
  } finally {
    localSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.write-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: $card-padding;
  border-radius: $radius-md;
  background: $bg-card;
  border: 1rpx solid $border-color;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 650;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border-radius: $radius-sm;
  background: $bg-muted;
  border: 1rpx solid $border-color;
  font-size: 28rpx;
  color: $text-primary;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  height: 360rpx;
  padding: 20rpx;
  border-radius: $radius-sm;
  background: $bg-muted;
  border: 1rpx solid $border-color;
  color: $text-primary;
  font-size: 28rpx;
  line-height: 44rpx;
  box-sizing: border-box;
}

.counter {
  text-align: right;
  color: $text-light;
  font-size: 22rpx;
}

.safe-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 4rpx;
  color: $text-light;
  font-size: 22rpx;

  &.ok {
    color: $success-color;
  }

  &.warning {
    color: $warning-color;
  }

  &.failed {
    color: $error-color;
  }
}

.safe-dot {
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.safe-text {
  line-height: 1.4;
}

.primary-button {
  height: $btn-height;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: $btn-radius;
  background: $primary-color;
  color: $text-white;
  font-size: 30rpx;
  font-weight: 700;

  &:active {
    background: $primary-hover;
  }

  &.disabled {
    opacity: 0.72;
  }
}

.preview-section {
  margin-top: 8rpx;
}

.section-title-text {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 16rpx;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 22rpx;
  border-radius: $radius-md;
  background: $bg-card;
  border: 1rpx solid $border-color;
}

.letter-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $primary-soft;
  color: $primary-color;
  font-size: 26rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.head-main {
  flex: 1;
  min-width: 0;
}

.letter-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.letter-time {
  display: block;
  margin-top: 4rpx;
  color: $text-light;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.letter-body {
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 42rpx;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
