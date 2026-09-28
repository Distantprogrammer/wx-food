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

    <view class="safe-row">
      <view class="safe-chip" :class="{ warning: sensitiveStatus === 'pending', failed: sensitiveStatus === 'failed' }">
        <text>{{ sensitiveStatus === 'passed' ? '✓' : '○' }}</text>
        <text>本地敏感词过滤</text>
      </view>
      <view class="safe-chip">
        <text>✓</text>
        <text>仅文字无图片</text>
      </view>
      <view class="safe-chip">
        <text>✓</text>
        <text>提交后立即送达</text>
      </view>
      <view class="safe-chip">
        <text>✓</text>
        <text>无需人工审核</text>
      </view>
    </view>

    <button
      class="primary-button"
      :class="{ disabled: isBusy }"
      :loading="isBusy"
      :disabled="isBusy"
      @click="handleSubmit"
    >
      提交反馈
    </button>

    <view class="preview-section">
      <view class="section-title">
        <text class="section-title-text">提交预览</text>
        <text class="tag">即时送达</text>
      </view>
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
  submitting: { type: Boolean, default: false }
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
  gap: 28rpx;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 32rpx;
  border-radius: $radius-lg;
  background: #fff;
  box-shadow: $shadow-md;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: $bg-color;
  font-size: 28rpx;
  color: $text-primary;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  height: 360rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  background: $bg-color;
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

.safe-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.safe-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: 84rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 107, 53, 0.08);
  color: $primary-dark;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 700;

  &.warning {
    background: rgba(230, 162, 60, 0.12);
    color: #7a5a06;
  }

  &.failed {
    background: rgba(245, 108, 108, 0.12);
    color: #c94f44;
  }
}

.primary-button {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;

  &.disabled {
    opacity: 0.72;
  }
}

.preview-section {
  margin-top: 8rpx;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title-text {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  background: rgba(255, 107, 53, 0.12);
  color: $primary-color;
  font-size: 20rpx;
  font-weight: 700;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: $radius-lg;
  background: #fff;
  box-shadow: $shadow-sm;
}

.letter-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffe0d0, #ffc9a8);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
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
}

.letter-time {
  display: block;
  margin-top: 4rpx;
  color: $text-light;
  font-size: 22rpx;
}

.letter-body {
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 42rpx;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
