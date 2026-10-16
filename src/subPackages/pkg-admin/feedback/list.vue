<template>
  <PageLayout
    title="用户反馈"
    show-back
    background-color="#F6F7F2"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    :footer-height="batchBarHeight"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <view class="toolbar">
      <view class="check-all" @click="toggleSelectAll">
        <view class="box" :class="{ on: isAllSelected }" />
        <text>{{ isAllSelected ? '取消全选' : '全选本页' }}</text>
      </view>
      <text class="selected-tip">已选 {{ selectedIds.length }}</text>
    </view>

    <EmptyView v-if="!loading && !list.length" title="暂无反馈" />
    <view
      v-for="item in list"
      :key="item.id"
      class="card"
      :class="[`is-${item.status || 'pending'}`, { selected: selectedMap[item.id] }]"
    >
      <view class="card-top">
        <view class="check" @click.stop="toggleSelect(item.id)">
          <view class="box" :class="{ on: selectedMap[item.id] }" />
        </view>
        <view class="main">
          <view class="head">
            <view class="head-left">
              <text class="name">{{ item.nickname || '匿名用户' }}</text>
              <AuditStatusTag
                variant="feedback"
                :status="item.status || 'pending'"
                :text="statusLabel(item.status)"
              />
            </view>
            <text class="time">{{ formatTime(item.createTime) }}</text>
          </view>
          <text class="content">{{ item.content }}</text>
          <view class="ops">
            <view class="ops-row">
              <text
                v-if="item.status !== 'read'"
                class="op primary"
                @click="onUpdateStatus([item.id], 'read')"
              >已读</text>
              <text
                v-if="item.status !== 'processed'"
                class="op success"
                @click="onUpdateStatus([item.id], 'processed')"
              >已处理</text>
            </view>
            <view class="ops-row status-ops">
              <text
                v-if="item.status !== 'rejected'"
                class="op warn"
                @click="onUpdateStatus([item.id], 'rejected')"
              >不予处理</text>
              <text class="op danger" @click="onDelete(item)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>

    <template #footer>
      <view class="batch-bar">
        <button class="batch-btn" :disabled="!selectedIds.length || busy" @click="onBatch('read')">
          批量已读
        </button>
        <button class="batch-btn success" :disabled="!selectedIds.length || busy" @click="onBatch('processed')">
          批量已处理
        </button>
        <button class="batch-btn warn" :disabled="!selectedIds.length || busy" @click="onBatch('rejected')">
          批量不予处理
        </button>
      </view>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import AuditStatusTag from '@/components/AuditStatusTag/AuditStatusTag.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminFeedbackList, adminFeedbackDelete, adminFeedbackUpdateStatus } from '@/services/feedback'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const STATUS_LABEL = {
  pending: '未读',
  read: '已读',
  processed: '已处理',
  rejected: '不予处理'
}

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const busy = ref(false)
const selectedMap = reactive({})

const selectedIds = computed(() => Object.keys(selectedMap).filter((id) => selectedMap[id]))
const isAllSelected = computed(
  () => list.value.length > 0 && list.value.every((item) => selectedMap[item.id])
)
const batchBarHeight = computed(() => 128)

function statusLabel(status) {
  return STATUS_LABEL[status] || STATUS_LABEL.pending
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

function clearSelection() {
  Object.keys(selectedMap).forEach((id) => {
    delete selectedMap[id]
  })
}

function toggleSelect(id) {
  selectedMap[id] = !selectedMap[id]
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    list.value.forEach((item) => {
      selectedMap[item.id] = false
    })
    return
  }
  list.value.forEach((item) => {
    selectedMap[item.id] = true
  })
}

function applyLocalStatus(ids, status) {
  const set = new Set(ids)
  const now = new Date().toISOString()
  list.value.forEach((item) => {
    if (!set.has(item.id)) return
    item.status = status
    item.isRead = status !== 'pending'
    if (status === 'read') item.readTime = now
    if (status === 'processed' || status === 'rejected') item.handleTime = now
  })
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
    clearSelection()
  }
  try {
    const res = await adminFeedbackList(
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
    } else {
      showApiError(res, '加载失败')
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  load(false, { silent: true })
}

async function onRefresh() {
  refreshing.value = true
  await load(true, { silent: true })
  refreshing.value = false
}

async function onUpdateStatus(ids, status) {
  const unique = [...new Set((ids || []).filter(Boolean))]
  if (!unique.length || busy.value) return
  busy.value = true
  try {
    const res = await adminFeedbackUpdateStatus({ ids: unique, status })
    if (res.code === 200) {
      applyLocalStatus(unique, status)
      unique.forEach((id) => {
        selectedMap[id] = false
      })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      showApiError(res, '操作失败')
    }
  } catch (e) {
    showApiError(e, '操作失败')
  } finally {
    busy.value = false
  }
}

function onBatch(status) {
  const ids = selectedIds.value
  if (!ids.length) {
    uni.showToast({ title: '请先选择反馈', icon: 'none' })
    return
  }
  const label = statusLabel(status)
  uni.showModal({
    title: `批量${label}`,
    content: `确认将选中的 ${ids.length} 条标记为「${label}」？`,
    success: (r) => {
      if (!r.confirm) return
      onUpdateStatus(ids, status)
    }
  })
}

function onDelete(item) {
  uni.showModal({
    title: '删除反馈',
    content: '确认删除这条反馈？',
    success: async (r) => {
      if (!r.confirm) return
      const res = await adminFeedbackDelete(item.id)
      if (res.code === 200) {
        uni.showToast({ title: '已删除', icon: 'success' })
        load(true, { silent: true })
      } else {
        showApiError(res, '删除失败')
      }
    }
  })
}

onShow(() => load(true))
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}

.check-all {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: $touch-min;
  font-size: 24rpx;
  color: $text-secondary;
  @include pressed;
}

.selected-tip {
  font-size: 22rpx;
  color: $text-light;
}

.box {
  width: 36rpx;
  height: 36rpx;
  border-radius: $radius-sm;
  border: 2rpx solid $border-color;
  background: $bg-card;
  box-sizing: border-box;

  &.on {
    border-color: $primary-color;
    background: $primary-color;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 10rpx;
      top: 4rpx;
      width: 10rpx;
      height: 18rpx;
      border: 3rpx solid $text-white;
      border-top: 0;
      border-left: 0;
      transform: rotate(45deg);
    }
  }
}

.card {
  @include workbench-card;

  &.is-pending {
    border-color: rgba(217, 76, 61, 0.28);
  }

  &.selected {
    background: $primary-soft;
  }
}

.card-top {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.check {
  padding-top: 6rpx;
  flex-shrink: 0;
  @include pressed;
}

.main {
  flex: 1;
  min-width: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
  gap: 16rpx;
}

.head-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  min-width: 0;
  flex: 1;
}

.name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  max-width: 100%;
  @include ellipsis(1);
}

.time {
  font-size: 22rpx;
  color: $text-light;
  flex-shrink: 0;
  max-width: 220rpx;
  @include ellipsis(1);
}

.content {
  display: block;
  font-size: 26rpx;
  line-height: $line-loose;
  color: $text-secondary;
  white-space: pre-wrap;
  word-break: break-word;
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

  &.status-ops {
    margin-top: 12rpx;
  }
}

.op {
  @include op-chip;
}

.batch-bar {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  @include safe-area-bottom;
  background: $bg-card;
  border-top: 1rpx solid $border-color;
}

.batch-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 650;
  border-radius: $radius-sm;
  background: $primary-color;
  color: $text-white;
  padding: 0 8rpx;
  @include pressed;

  &.success {
    background: $success-color;
  }

  &.warn {
    background: $warning-color;
  }

  &[disabled] {
    opacity: 0.45;
  }
}

.more {
  text-align: center;
  color: $text-light;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
