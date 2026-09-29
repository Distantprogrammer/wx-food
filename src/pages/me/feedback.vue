<template>
  <PageLayout
    title="意见反馈"
    show-back
    background-color="#F6F7F2"
    :header-content-height="88"
    :refresher-enabled="activeTab === 'history'"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="onScrollLower"
  >
    <template #header-content>
      <view class="head-panel">
        <view class="tabs">
          <view
            v-for="tab in tabs"
            :key="tab.value"
            class="tab"
            :class="{ active: activeTab === tab.value }"
            @click="switchTab(tab.value)"
          >{{ tab.label }}</view>
        </view>
      </view>
    </template>

    <view v-if="activeTab === 'write'">
      <view v-if="editingId" class="edit-banner">
        <text class="edit-banner-text">正在编辑反馈</text>
        <text class="edit-banner-cancel" @click="cancelEdit">取消</text>
      </view>

      <WriteForm
        :key="formKey"
        :author-name="authorName"
        :initial-contact="formContact"
        :initial-content="formContent"
        :submitting="submitting"
        :submit-text="editingId ? '保存修改' : '提交反馈'"
        @submit="onSubmit"
      />
    </view>

    <view v-else>
      <EmptyView v-if="!loading && !list.length" title="暂无反馈记录" />
      <view v-for="item in list" :key="item.id" class="card">
        <view class="head">
          <AuditStatusTag
            variant="feedback"
            :status="item.status || 'pending'"
            :text="statusLabel(item.status)"
          />
          <text class="time">{{ formatTime(item.createTime) }}</text>
        </view>
        <text v-if="item.contact" class="contact">联系：{{ item.contact }}</text>
        <text class="content">{{ item.content }}</text>
        <text v-if="statusTip(item)" class="read-tip">{{ statusTip(item) }}</text>
        <view class="ops">
          <view class="ops-row">
            <text
              v-if="canEdit(item)"
              class="op"
              @click="startEdit(item)"
            >编辑</text>
            <text class="op danger" @click="onDelete(item)">删除</text>
          </view>
        </view>
      </view>
      <view v-if="hasMore" class="more">上拉加载更多</view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import AuditStatusTag from '@/components/AuditStatusTag/AuditStatusTag.vue'
import WriteForm from '@/components/WriteForm/WriteForm.vue'
import { useUserStore } from '@/store/user'
import {
  submitFeedback,
  updateMyFeedback,
  deleteMyFeedback,
  getMyFeedbackList
} from '@/services/feedback'
import { showApiError } from '@/utils/apiError'

const STATUS_LABEL = {
  pending: '未读',
  read: '已读',
  processed: '已处理',
  rejected: '不予处理'
}

const tabs = [
  { label: '提交反馈', value: 'write' },
  { label: '我的反馈', value: 'history' }
]

const userStore = useUserStore()
const authorName = computed(() => userStore.userInfo?.nickname || '美食家')
const activeTab = ref('write')
const submitting = ref(false)
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const editingId = ref('')
const formContact = ref('')
const formContent = ref('')
const formKey = ref(0)
const historyLoaded = ref(false)

function statusLabel(status) {
  return STATUS_LABEL[status] || STATUS_LABEL.pending
}

function canEdit(item) {
  const status = item.status || 'pending'
  return status === 'pending' || status === 'rejected'
}

function formatTime(t) {
  if (!t) return ''
  try {
    const d = typeof t === 'object' && t.$date ? new Date(t.$date) : new Date(t)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch (e) {
    return ''
  }
}

function statusTip(item) {
  const status = item.status || (item.isRead ? 'read' : 'pending')
  if (status === 'processed' && item.handleTime) {
    return `管理员已于 ${formatTime(item.handleTime)} 处理`
  }
  if (status === 'rejected' && item.handleTime) {
    return `管理员已于 ${formatTime(item.handleTime)} 标记不予处理`
  }
  if (status === 'read' && item.readTime) {
    return `管理员已于 ${formatTime(item.readTime)} 查看`
  }
  return ''
}

function switchTab(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'history' && !historyLoaded.value) {
    load(true)
  }
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await getMyFeedbackList(
      { page: page.value, limit: 20 },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      const rows = (res.data?.list || []).map((row) => ({
        ...row,
        status: row.status || (row.isRead ? 'read' : 'pending')
      }))
      list.value = reset ? rows : list.value.concat(rows)
      hasMore.value = !!res.data?.hasMore
      historyLoaded.value = true
    } else {
      showApiError(res, '加载失败')
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function onScrollLower() {
  if (activeTab.value !== 'history') return
  if (!hasMore.value || loading.value) return
  page.value += 1
  load(false, { silent: true })
}

async function onRefresh() {
  if (activeTab.value !== 'history') return
  refreshing.value = true
  await load(true, { silent: true })
  refreshing.value = false
}

function startEdit(item) {
  editingId.value = item.id
  formContact.value = item.contact || ''
  formContent.value = item.content || ''
  formKey.value += 1
  activeTab.value = 'write'
}

function cancelEdit() {
  editingId.value = ''
  formContact.value = ''
  formContent.value = ''
  formKey.value += 1
}

async function onSubmit({ contact, content }) {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = editingId.value
      ? await updateMyFeedback({ id: editingId.value, contact, content })
      : await submitFeedback({ contact, content })
    if (res.code === 200) {
      uni.showToast({ title: editingId.value ? '已保存' : '已提交', icon: 'success' })
      cancelEdit()
      historyLoaded.value = false
      activeTab.value = 'history'
      await load(true, { silent: true })
    } else {
      showApiError(res, editingId.value ? '保存失败' : '提交失败')
    }
  } catch (e) {
    showApiError(e, editingId.value ? '保存失败' : '提交失败')
  } finally {
    submitting.value = false
  }
}

function onDelete(item) {
  uni.showModal({
    title: '删除反馈',
    content: '确认删除这条反馈？',
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await deleteMyFeedback(item.id)
        if (res.code === 200) {
          if (editingId.value === item.id) cancelEdit()
          uni.showToast({ title: '已删除', icon: 'success' })
          await load(true, { silent: true })
        } else {
          showApiError(res, '删除失败')
        }
      } catch (e) {
        showApiError(e, '删除失败')
      }
    }
  })
}

onShow(() => {
  if (activeTab.value === 'history') load(true)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.head-panel {
  padding: 0 24rpx 16rpx;
  background: $bg-card;
}

.tabs {
  display: flex;
  gap: 12rpx;
}

.tab {
  flex: 1;
  text-align: center;
  min-height: $touch-min;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 20rpx;
  border-radius: $radius-sm;
  font-size: 26rpx;
  color: $text-secondary;
  background: $bg-muted;
  box-sizing: border-box;
  @include pressed;

  &.active {
    color: $primary-color;
    background: $primary-soft;
    font-weight: 650;
  }
}

.edit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
  background: $primary-soft;
  border-radius: $radius-sm;
  border: 1rpx solid rgba(23, 107, 74, 0.12);
}

.edit-banner-text {
  font-size: 24rpx;
  color: $primary-color;
  font-weight: 650;
}

.edit-banner-cancel {
  font-size: 24rpx;
  color: $text-secondary;
  min-height: $touch-min;
  display: flex;
  align-items: center;
  padding: 0 8rpx;
  @include pressed;
}

.card {
  @include workbench-card;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
  gap: 16rpx;
}

.time {
  font-size: 22rpx;
  color: $text-light;
  max-width: 260rpx;
  @include ellipsis(1);
}

.contact {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
  @include ellipsis(1);
}

.content {
  display: block;
  font-size: 28rpx;
  line-height: $line-loose;
  color: $text-primary;
  white-space: pre-wrap;
  word-break: break-word;
}

.read-tip {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: $text-light;
  @include ellipsis(2);
}

.ops {
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid $border-color;
}

.ops-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12rpx;
}

.op {
  @include op-chip;

  &:not(.danger) {
    color: $primary-color;
    background: $primary-soft;
  }
}

.more {
  text-align: center;
  color: $text-light;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
