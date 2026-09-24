<template>
  <view class="write-form">
    <view class="form-card">
      <view class="sentence-field">
        <text>我想对</text>
        <input
          v-model="targetName"
          class="input-line"
          placeholder="TA"
          :focus="autoFocus"
          maxlength="20"
          @input="emitChange"
        />
        <text>说</text>
      </view>
      <textarea
        v-model="content"
        class="textarea"
        placeholder="把没说出口的话，写得简单一点..."
        maxlength="1000"
        :show-confirm-bar="false"
        @input="emitChange"
      />
      <text class="counter">剩余 {{ remainCount }} 字</text>
    </view>

    <view class="safe-row">
      <view class="safe-chip" :class="securityChipClass">
        <text>{{ securityStatus === 'passed' ? '✓' : '○' }}</text>
        <text>{{ securityChipText }}</text>
      </view>
      <view class="safe-chip" :class="{ warning: sensitiveStatus === 'pending' }">
        <text>{{ sensitiveStatus === 'passed' ? '✓' : '○' }}</text>
        <text>本地敏感词过滤</text>
      </view>
      <view class="safe-chip">
        <text>✓</text>
        <text>仅文字无图片</text>
      </view>
      <view class="safe-chip">
        <text>✓</text>
        <text>提交后等待人工审核</text>
      </view>
    </view>

    <button
      class="primary-button"
      :class="{ disabled: isBusy }"
      :loading="isBusy"
      :disabled="isBusy"
      @click="handleSubmit"
    >
      提交审核
    </button>

    <view class="preview-section">
      <view class="section-title">
        <text class="section-title-text">发布预览</text>
        <text class="tag">未提交</text>
      </view>
      <view class="preview-card">
        <view class="letter-head">
          <view class="avatar">{{ previewAvatar }}</view>
          <view class="head-main">
            <text class="letter-title">{{ previewTitle }}</text>
            <text class="letter-time">提交后进入审核队列</text>
          </view>
        </view>
        <text class="letter-body">{{ previewContent }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { validateMessageContent, validateTargetName } from '@/utils/security'
import { checkTextSecurity, checkLocalSensitive } from '@/services/security'

const props = defineProps({
  authorName: { type: String, default: '匿名' },
  initialTarget: { type: String, default: '' },
  initialContent: { type: String, default: '' },
  autoFocus: { type: Boolean, default: true },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'change'])

const targetName = ref(props.initialTarget)
const content = ref(props.initialContent)
const securityStatus = ref('pending')
const sensitiveStatus = ref('pending')
const securityHint = ref('')

const securityChipClass = computed(() => ({
  warning: securityStatus.value === 'pending',
  failed: securityStatus.value === 'failed'
}))

const securityChipText = computed(() => {
  if (securityStatus.value === 'passed') return '微信内容安全文本审核'
  if (securityHint.value) return securityHint.value
  if (securityStatus.value === 'pending') return '微信内容安全文本审核'
  return '微信内容安全文本审核未通过'
})

function mapSecurityReason(reason) {
  const map = {
    empty: '请先输入正文',
    sensitive: '包含本地敏感词',
    risky_content: '内容含有违规信息',
    openapi_permission: '云函数未配置安全接口，请重新部署 publish',
    no_openid: '登录状态异常，请重新进入页面',
    openid_expired: '请关闭小程序后重新打开再试'
  }
  return map[reason] || '微信内容安全审核未通过'
}

const remainCount = computed(() => 1000 - (content.value?.length || 0))

const previewAvatar = computed(() => (props.authorName || '匿').slice(0, 1))
const previewTitle = computed(() => {
  const target = targetName.value.trim() || 'TA'
  return `${props.authorName || '匿名'}想对${target}说：`
})
const previewContent = computed(() => content.value.trim() || '正文预览将显示在这里')

const localSubmitting = ref(false)
const isBusy = computed(() => props.submitting || localSubmitting.value)

watch(() => props.initialTarget, (val) => { targetName.value = val || '' })
watch(() => props.initialContent, (val) => { content.value = val || '' })

let checkTimer = null

async function runSecurityCheck() {
  const text = content.value?.trim()
  const target = targetName.value?.trim()
  if (!text) {
    securityStatus.value = 'pending'
    sensitiveStatus.value = 'pending'
    securityHint.value = ''
    return
  }
  const local = validateMessageContent(text)
  sensitiveStatus.value = local.valid ? 'passed' : 'failed'
  if (local.valid) {
    const res = await checkLocalSensitive(text, target)
    sensitiveStatus.value = res.code === 200 && res.data?.passed ? 'passed' : 'failed'
  }
  const sec = await checkTextSecurity(text, target)
  if (sec.code !== 200) {
    securityStatus.value = 'failed'
    securityHint.value = sec.message || '安全检测请求失败'
    return
  }
  if (sec.data?.passed) {
    securityStatus.value = 'passed'
    securityHint.value = ''
  } else {
    securityStatus.value = 'failed'
    securityHint.value = mapSecurityReason(sec.data?.reason)
  }
}

watch([content, targetName], () => {
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(runSecurityCheck, 500)
})

function emitChange() {
  emit('change', {
    targetName: targetName.value,
    content: content.value
  })
}

async function handleSubmit() {
  if (isBusy.value) return

  const targetCheck = validateTargetName(targetName.value)
  if (!targetCheck.valid) {
    uni.showToast({ title: targetCheck.message, icon: 'none' })
    return
  }
  const contentCheck = validateMessageContent(content.value)
  if (!contentCheck.valid) {
    uni.showToast({ title: contentCheck.message, icon: 'none' })
    return
  }

  localSubmitting.value = true
  try {
    if (securityStatus.value === 'pending' || sensitiveStatus.value === 'pending') {
      await runSecurityCheck()
    }
    if (sensitiveStatus.value !== 'passed') {
      uni.showToast({ title: '本地敏感词检测未通过', icon: 'none' })
      return
    }
    if (securityStatus.value !== 'passed') {
      uni.showToast({ title: '内容安全审核未通过', icon: 'none' })
      return
    }
    emit('submit', {
      targetName: targetName.value.trim(),
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
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: $card;
  box-shadow: $shadow-panel;
}

.sentence-field {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border: 1px solid rgba(7, 193, 96, 0.24);
  border-radius: $radius-md;
  background: #f3fcf7;
  font-size: 32rpx;
  font-weight: 850;
  color: $ink;
}

.input-line {
  flex: 1;
  min-width: 120rpx;
  height: 60rpx;
  padding: 8rpx 16rpx;
  border-bottom: 4rpx solid $wechat;
  color: $wechat-dark;
  font-size: 32rpx;
  font-weight: 850;
}

.textarea {
  height: 436rpx;
  padding: 28rpx;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: #fffaf1;
  color: #3d4b46;
  font-size: 28rpx;
  line-height: 46rpx;
  font-weight: 600;
  width: 100%;
  box-sizing: border-box;
}

.counter {
  text-align: right;
  color: $muted;
  font-size: 22rpx;
  font-weight: 650;
}

.safe-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.safe-chip {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 84rpx;
  padding: 16rpx 20rpx;
  border: 1px solid rgba(7, 193, 96, 0.16);
  border-radius: $radius-md;
  background: #f4fcf7;
  color: #315e4d;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 800;

  &.warning {
    border-color: rgba(215, 155, 0, 0.2);
    background: $warning-soft;
    color: #7a5a06;
  }

  &.failed {
    border-color: rgba(228, 91, 79, 0.2);
    background: #fff0ee;
    color: #c94f44;
  }
}

.primary-button {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: $radius-md;
  background: $wechat;
  color: #fff;
  font-size: 30rpx;
  font-weight: 850;
  box-shadow: 0 24rpx 44rpx rgba(7, 193, 96, 0.22);

  &:active:not(.disabled) {
    background: $wechat-dark;
  }

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
  line-height: 44rpx;
  font-weight: 900;
  color: $ink;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  background: #edf3f0;
  color: #54625e;
  font-size: 20rpx;
  font-weight: 850;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: $card;
  box-shadow: $shadow-card;
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
  border-radius: $radius-md;
  background: linear-gradient(135deg, #dff5e8, #fff7db);
  color: $wechat-dark;
  font-size: 26rpx;
  font-weight: 900;
}

.head-main {
  flex: 1;
  min-width: 0;
}

.letter-title {
  display: block;
  font-size: 28rpx;
  font-weight: 850;
  color: $ink;
}

.letter-time {
  display: block;
  margin-top: 2rpx;
  color: $muted;
  font-size: 22rpx;
  font-weight: 650;
}

.letter-body {
  color: $ink-soft;
  font-size: 26rpx;
  line-height: 42rpx;
  font-weight: 600;
}
</style>
