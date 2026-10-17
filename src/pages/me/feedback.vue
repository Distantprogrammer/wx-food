<template>
  <PageLayout
    title="意见反馈"
    show-back
    background-color="#F7F8FA"
    :header-style="headStyle"
    :content-padding-x="32"
    :content-padding-top="28"
    :refresher-enabled="tab === 'mine'"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="onScrollLower"
  >
    <seg-control v-model="tab" :options="tabs" @change="onTab" />

    <block v-if="tab === 'send'">
      <view class="card">
        <text class="lbl">反馈类型</text>
        <view class="chip-row">
          <view
            v-for="item in types"
            :key="item.id"
            class="tchip"
            :class="{ active: fbType === item.id }"
            @click="fbType = item.id"
          >{{ item.icon }} {{ item.label }}</view>
        </view>
      </view>

      <view class="card">
        <text class="lbl">反馈内容 <text class="req">*</text></text>
        <view class="ta-wrap">
          <textarea
            :value="content"
            class="ta"
            maxlength="1000"
            placeholder="说说你的建议、问题或想要的功能…"
            placeholder-class="ph"
            @input="onInput"
          />
          <text class="ta-foot" :class="{ warn: left < 100 }">剩余 {{ left }} 字</text>
        </view>

        <text class="lbl gap">截图（可选）</text>
        <view class="upl">
          <view v-for="(shot, index) in shots" :key="shot.fileID || index" class="shot">
            <image class="up" :src="shot.preview" mode="aspectFill" />
            <view class="shot-x" @click="removeShot(index)">×</view>
          </view>
          <view v-if="shots.length < 3" class="up-add" @click="chooseShots">
            <text class="plus">＋</text>
            <text class="plus-sub">添加</text>
          </view>
        </view>

        <text class="lbl gap">联系方式（选填）</text>
        <input
          v-model="contact"
          class="input"
          maxlength="40"
          placeholder="📮 便于回访的邮箱或微信号"
          placeholder-class="ph"
        />
      </view>

      <view class="note">🛡️ 内容将在本地做基础过滤后提交，管理员 1-3 个工作日内回复</view>
      <button class="btn" :disabled="!canSubmit" @click="onSubmit">{{ submitting ? '提交中…' : '提交反馈' }}</button>

      <view class="preview-head">
        <text>实时预览</text>
        <text class="live">LIVE</text>
      </view>
      <view class="card preview">
        <view class="ava">{{ avatarChar }}</view>
        <view class="pv-main">
          <text class="pv-name">{{ authorName }} 的反馈</text>
          <text class="pv-text" :class="{ filled: !!content.trim() }">{{ content.trim() || '反馈内容将实时显示在这里' }}</text>
        </view>
      </view>
    </block>

    <block v-else>
      <empty-state v-if="!loading && !list.length" icon="📭" title="暂无反馈记录" />
      <view
        v-for="item in list"
        :key="item.id"
        class="card fb"
        :class="{ open: openId === item.id }"
        @click="toggle(item)"
        @longpress="onDelete(item)"
      >
        <view class="fb-top">
          <text class="fb-type">{{ typeText(item.type) }}</text>
          <status-badge :tone="feedbackTone(item.status)" :text="feedbackLabel(item.status)" />
          <text class="fb-date">{{ formatShortTime(item.createTime) }}</text>
        </view>
        <text class="fb-x">{{ item.content }}</text>
        <view v-if="item.reply" class="fb-r">
          <text class="fb-rb">官方回复</text>
          <text class="fb-rx">{{ item.reply }}</text>
        </view>
      </view>
      <view v-if="hasMore" class="more">上拉加载更多</view>
    </block>
  </PageLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import SegControl from '@/components/seg-control/seg-control.vue'
import StatusBadge from '@/components/status-badge/status-badge.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import { useUserStore } from '@/store/user'
import { submitFeedback, deleteMyFeedback, getMyFeedbackList } from '@/services/feedback'
import { showApiError } from '@/utils/apiError'
import { uploadCloudFile } from '@/utils/cloud'
import { filterContent, formatShortTime } from '@/utils/submissionView'

const headStyle = { background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)' }
const types = [
  { id: 'idea', icon: '💡', label: '功能建议' },
  { id: 'bug', icon: '🐛', label: '问题反馈' },
  { id: 'fix', icon: '📝', label: '内容纠错' },
  { id: 'other', icon: '💬', label: '其他' }
]
const tabs = [
  { value: 'send', label: '✍️ 提交反馈' },
  { value: 'mine', label: '📨 我的反馈' }
]

const userStore = useUserStore()
const authorName = computed(() => userStore.userInfo?.nickname || '美食家')
const avatarChar = computed(() => (authorName.value || '作').slice(0, 1))
const tab = ref('send')
const fbType = ref('idea')
const content = ref('')
const contact = ref('')
const shots = ref([])
const submitting = ref(false)
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const loaded = ref(false)
const openId = ref('')

const left = computed(() => 1000 - content.value.length)
const canSubmit = computed(() => !!content.value.trim() && !submitting.value)

function onInput(event) {
  content.value = String(event.detail?.value || '').slice(0, 1000)
}

function typeText(id) {
  const found = types.find((item) => item.id === id)
  return found ? `${found.icon} ${found.label}` : '💬 其他'
}

function feedbackTone(status) {
  if (status === 'processed') return 'ok'
  if (status === 'rejected') return 'no'
  return 'wait'
}

function feedbackLabel(status) {
  if (status === 'processed') return '已回复'
  if (status === 'rejected') return '已关闭'
  return '处理中'
}

function chooseShots() {
  const room = 3 - shots.value.length
  if (room <= 0) return
  uni.chooseMedia({
    count: room,
    mediaType: ['image'],
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const files = res.tempFiles || []
      for (const file of files) {
        if (!file.tempFilePath || shots.value.length >= 3) break
        try {
          const uploaded = await uploadCloudFile(file.tempFilePath, { dir: 'feedback-images' })
          shots.value = shots.value.concat([{ fileID: uploaded.fileID, preview: file.tempFilePath }])
        } catch (error) {
          showApiError(error, '上传失败')
        }
      }
    }
  })
}

function removeShot(index) {
  shots.value = shots.value.filter((_, itemIndex) => itemIndex !== index)
}

function resetForm() {
  content.value = ''
  contact.value = ''
  shots.value = []
  fbType.value = 'idea'
}

async function load(reset = false, silent) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await getMyFeedbackList(
      { page: page.value, limit: 20 },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      const next = res.data?.list || []
      list.value = reset ? next : list.value.concat(next)
      hasMore.value = !!res.data?.hasMore
      loaded.value = true
    } else {
      showApiError(res, '加载失败')
    }
  } catch (error) {
    if (!reset && page.value > 1) page.value -= 1
    showApiError(error, '加载失败')
  } finally {
    loading.value = false
  }
}

function onTab(value) {
  if (value === 'mine' && !loaded.value) load(true)
}

function onScrollLower() {
  if (tab.value !== 'mine' || !hasMore.value || loading.value) return
  page.value += 1
  load(false, true)
}

async function onRefresh() {
  if (tab.value !== 'mine') return
  refreshing.value = true
  await load(true, true)
  refreshing.value = false
}

function toggle(item) {
  if (!item.reply) return
  openId.value = openId.value === item.id ? '' : item.id
}

async function onSubmit() {
  const text = filterContent(content.value)
  if (!text) {
    uni.showToast({ title: '请填写有效内容', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await submitFeedback({
      content: text,
      contact: contact.value.trim(),
      type: fbType.value,
      images: shots.value.map((item) => item.fileID).filter(Boolean)
    })
    if (res.code === 200) {
      resetForm()
      loaded.value = false
      tab.value = 'mine'
      uni.showToast({ title: '提交成功，可在我的反馈查看', icon: 'none' })
      await load(true, true)
    } else {
      showApiError(res, '提交失败')
    }
  } catch (error) {
    showApiError(error, '提交失败')
  } finally {
    submitting.value = false
  }
}

function onDelete(item) {
  uni.showModal({
    title: '删除反馈',
    content: '确认删除这条反馈？',
    success: async (result) => {
      if (!result.confirm) return
      try {
        const res = await deleteMyFeedback(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success' })
          load(true, true)
        } else {
          showApiError(res, '删除失败')
        }
      } catch (error) {
        showApiError(error, '删除失败')
      }
    }
  })
}

onShow(() => {
  if (tab.value === 'mine') load(true)
})
</script>

<style scoped>
.card {
  margin-bottom: 24rpx;
  padding: 28rpx 30rpx;
  border-radius: 28rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.lbl {
  display: block;
  margin-bottom: 18rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 26rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.lbl.gap {
  margin-top: 26rpx;
}

.req {
  color: #E05C5C;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
}

.tchip {
  height: 60rpx;
  margin: 0 16rpx 16rpx 0;
  padding: 0 24rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 30rpx;
  background: #F7F8FA;
  color: rgba(0, 0, 0, 0.55);
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
}

.tchip.active {
  border-color: rgba(45, 106, 79, 0.3);
  background: #E8F3EE;
  color: #2D6A4F;
  font-weight: 700;
}

.ta-wrap {
  border: 3rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 24rpx;
  background: #F7F8FA;
}

.ta {
  width: 100%;
  height: 240rpx;
  padding: 24rpx;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.9);
  font-size: 28rpx;
  line-height: 1.7;
}

.ta-foot {
  display: block;
  padding: 0 24rpx 18rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 22rpx;
  text-align: right;
}

.ta-foot.warn {
  color: #D97A1F;
  font-weight: 700;
}

.upl {
  display: flex;
  flex-wrap: wrap;
}

.shot {
  position: relative;
  width: 128rpx;
  height: 128rpx;
  margin-right: 18rpx;
}

.up {
  width: 128rpx;
  height: 128rpx;
  border-radius: 24rpx;
}

.shot-x {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #FFFFFF;
  font-size: 24rpx;
  line-height: 36rpx;
  text-align: center;
}

.up-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  border: 3rpx dashed #C9CFD4;
  border-radius: 24rpx;
  background: #F7F8FA;
  color: rgba(0, 0, 0, 0.32);
}

.plus {
  font-size: 36rpx;
  line-height: 40rpx;
}

.plus-sub {
  font-size: 20rpx;
  line-height: 28rpx;
}

.input {
  height: 84rpx;
  padding: 0 24rpx;
  border: 3rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 24rpx;
  background: #F7F8FA;
  color: rgba(0, 0, 0, 0.9);
  font-size: 26rpx;
}

.note {
  margin: 8rpx 4rpx 28rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 23rpx;
  line-height: 1.6;
}

.btn {
  height: 92rpx;
  margin: 0 0 36rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  box-shadow: 0 12rpx 32rpx rgba(45, 106, 79, 0.28);
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 92rpx;
}

.btn[disabled] {
  background: #D6DBD9;
  box-shadow: none;
  color: rgba(0, 0, 0, 0.32);
}

.preview-head {
  display: flex;
  align-items: center;
  margin: 8rpx 4rpx 18rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 26rpx;
  font-weight: 800;
}

.live {
  margin-left: 12rpx;
  padding: 4rpx 16rpx;
  border-radius: 14rpx;
  background: #E9F7EC;
  color: #2D8A4E;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 28rpx;
}

.preview {
  display: flex;
}

.ava {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 76rpx;
  height: 76rpx;
  margin-right: 20rpx;
  border-radius: 22rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 76rpx;
  text-align: center;
}

.pv-main {
  flex: 1;
  min-width: 0;
}

.pv-name {
  display: block;
  color: rgba(0, 0, 0, 0.9);
  font-size: 27rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.pv-text {
  display: block;
  margin-top: 8rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 26rpx;
  line-height: 1.6;
  word-break: break-all;
}

.pv-text.filled {
  color: rgba(0, 0, 0, 0.55);
}

.fb {
  padding-top: 8rpx;
  padding-bottom: 8rpx;
}

.fb-top {
  display: flex;
  align-items: center;
  padding-top: 16rpx;
}

.fb-type {
  margin-right: 16rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 22rpx;
  font-weight: 600;
}

.fb-date {
  margin-left: auto;
  color: rgba(0, 0, 0, 0.32);
  font-size: 21rpx;
}

.fb-x {
  display: block;
  margin-top: 14rpx;
  padding-bottom: 16rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 27rpx;
  line-height: 1.65;
}

.fb-r {
  display: flex;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  border-radius: 20rpx;
  background: #E8F3EE;
  color: #1B4332;
  font-size: 25rpx;
  line-height: 1.6;
  transition: max-height 0.25s ease, opacity 0.25s ease;
}

.fb.open .fb-r {
  max-height: 240rpx;
  margin-bottom: 16rpx;
  padding: 18rpx 22rpx;
  opacity: 1;
}

.fb-rb {
  flex-shrink: 0;
  margin-right: 16rpx;
  font-weight: 700;
}

.fb-rx {
  flex: 1;
  min-width: 0;
}

.more {
  padding: 8rpx 0 24rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 24rpx;
  text-align: center;
}
</style>
