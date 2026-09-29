<template>
  <PageLayout
    title="审核技巧"
    show-back
    background-color="#F6F7F2"
    :header-content-height="160"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
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
        <view class="search-bar">
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索技巧标题"
            confirm-type="search"
            @confirm="reload"
          />
          <text class="search-btn" @click="reload">搜索</text>
        </view>
      </view>
    </template>

    <EmptyView v-if="!loading && !list.length" title="暂无数据" desc="切换 Tab 或调整搜索条件试试" />
    <view v-for="item in list" :key="item.id" class="card">
      <view class="card-main" @click="openPreview(item)">
        <view class="title-row">
          <text class="name">{{ item.title }}</text>
          <AuditStatusTag :status="item.auditStatus" />
        </view>
        <text class="meta">{{ item.summary || '无摘要' }}</text>
        <view class="dup-row">
          <text class="dup">同名 {{ item.sameTitleCount || 1 }} 个</text>
          <text
            v-if="(item.sameTitleCount || 1) > 1"
            class="link"
            @click.stop="openCompare(item)"
          >对比同名 ›</text>
        </view>
        <text v-if="item.createdByNickname" class="creator">提交人：{{ item.createdByNickname }}</text>
      </view>
      <view class="ops">
        <view class="ops-row">
          <text class="op" @click="openPreview(item)">预览</text>
          <text
            v-if="(item.sameTitleCount || 1) > 1"
            class="op"
            @click="openCompare(item)"
          >对比</text>
          <text class="op" @click="goEdit(item.id)">编辑</text>
        </view>
        <view class="ops-row status-ops">
          <text
            v-if="item.auditStatus !== 'approved'"
            class="op primary"
            @click="onAudit(item, 'approved')"
          >通过</text>
          <text
            v-if="item.auditStatus !== 'rejected'"
            class="op warn"
            @click="onAudit(item, 'rejected')"
          >驳回</text>
          <text
            v-if="item.auditStatus !== 'pending'"
            class="op"
            @click="onAudit(item, 'pending')"
          >待审</text>
          <text class="op danger" @click="onDelete(item)">删除</text>
        </view>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>

    <TipPreviewDrawer
      :visible="previewVisible"
      :tip="previewTip"
      :title="previewTitle"
      @close="previewVisible = false"
    />

    <view v-if="compareVisible" class="compare-mask" @click="compareVisible = false">
      <view class="compare-sheet" @click.stop>
        <view class="drawer-handle" />
        <view class="sheet-head">
          <text class="sheet-title">同名对比 · {{ compareTitle }}</text>
          <view class="sheet-close" @click="compareVisible = false">
            <text class="sheet-close-x">✕</text>
          </view>
        </view>
        <scroll-view scroll-y class="sheet-body">
          <view v-if="compareLoading" class="empty-inline">加载中...</view>
          <EmptyView v-else-if="!compareList.length" title="暂无同名技巧" />
          <view
            v-for="item in compareList"
            :key="item.id"
            class="compare-item"
          >
            <view class="compare-main" @click="openPreview(item, true)">
              <view class="compare-title-row">
                <text class="compare-name">{{ item.title }} #{{ item.id }}</text>
                <AuditStatusTag :status="item.auditStatus" />
              </view>
              <text class="compare-meta">{{ item.summary || '无摘要' }}</text>
            </view>
            <view class="ops-row compare-ops">
              <text class="op" @click="openPreview(item, true)">预览</text>
              <text class="op" @click="goEdit(item.id)">编辑</text>
              <text class="op danger" @click="onDelete(item)">删除</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import AuditStatusTag from '@/components/AuditStatusTag/AuditStatusTag.vue'
import TipPreviewDrawer from '@/components/TipPreviewDrawer/TipPreviewDrawer.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import {
  adminTipAuditList,
  adminTipSameTitleList,
  adminTipUpdateAuditStatus,
  adminTipDetail,
  adminTipDelete
} from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const tabs = [
  { label: '待审核', value: 'pending' },
  { label: '同名', value: 'duplicates' },
  { label: '已驳回', value: 'rejected' },
  { label: '全部', value: 'all' }
]

const STATUS_LABEL = {
  pending: '待审',
  approved: '已通过',
  rejected: '已驳回'
}

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const activeTab = ref('pending')

const previewVisible = ref(false)
const previewTip = ref(null)
const previewTitle = ref('预览技巧')

const compareVisible = ref(false)
const compareLoading = ref(false)
const compareTitle = ref('')
const compareList = ref([])

function statusLabel(status) {
  return STATUS_LABEL[status] || STATUS_LABEL.approved
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await adminTipAuditList(
      {
        page: page.value,
        limit: 20,
        tab: activeTab.value,
        keyword: keyword.value.trim() || undefined
      },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      const rows = res.data?.list || []
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

function reload() {
  load(true)
}

function switchTab(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  load(true)
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

async function ensureDetail(item) {
  if (item?.markdownHtml) return item
  const res = await adminTipDetail(item.id)
  if (res.code === 200 && res.data) return res.data
  return item
}

async function openPreview(item, fromCompare = false) {
  try {
    const detail = await ensureDetail(item)
    previewTip.value = detail
    previewTitle.value = fromCompare ? `对比预览 #${detail.id}` : '预览技巧'
    previewVisible.value = true
  } catch (e) {
    showApiError(e, '预览失败')
  }
}

async function openCompare(item) {
  compareTitle.value = item.title || ''
  compareVisible.value = true
  compareLoading.value = true
  compareList.value = []
  try {
    const res = await adminTipSameTitleList(item.title, null)
    if (res.code === 200) {
      compareList.value = res.data?.list || []
    } else {
      showApiError(res, '加载同名失败')
    }
  } catch (e) {
    showApiError(e, '加载同名失败')
  } finally {
    compareLoading.value = false
  }
}

function onAudit(item, auditStatus) {
  const label = statusLabel(auditStatus)
  uni.showModal({
    title: `标记为${label}`,
    content: `确认将「${item.title}」标记为「${label}」？`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await adminTipUpdateAuditStatus(item.id, auditStatus)
        if (res.code === 200) {
          item.auditStatus = auditStatus
          uni.showToast({ title: '已更新', icon: 'success' })
          if (activeTab.value === 'pending' || activeTab.value === 'rejected') {
            load(true, { silent: true })
          }
        } else {
          showApiError(res, '操作失败')
        }
      } catch (e) {
        showApiError(e, '操作失败')
      }
    }
  })
}

function onDelete(item) {
  uni.showModal({
    title: '删除技巧',
    content: `确认删除「${item.title}」？删除后不可恢复。`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await adminTipDelete(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success' })
          previewVisible.value = false
          compareVisible.value = false
          load(true, { silent: true })
        } else {
          showApiError(res, '删除失败')
        }
      } catch (e) {
        showApiError(e, '删除失败')
      }
    }
  })
}

function goEdit(id) {
  uni.navigateTo({ url: `/subPackages/pkg-admin/tips/edit?id=${id}` })
}

onShow(() => load(true))
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
  margin-bottom: 14rpx;
  overflow-x: auto;
}

.tab {
  flex-shrink: 0;
  padding: 10rpx 20rpx;
  min-height: $touch-min;
  display: flex;
  align-items: center;
  border-radius: $radius-sm;
  font-size: 24rpx;
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

.search-bar {
  @include search-field;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: $search-height;
  line-height: $search-height;
  font-size: 26rpx;
  color: $text-primary;
}

.search-btn {
  flex-shrink: 0;
  padding: 0 18rpx;
  height: 52rpx;
  line-height: 52rpx;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 24rpx;
  font-weight: 650;
  @include pressed;
}

.card {
  @include workbench-card;
}

.card-main {
  @include pressed;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  @include ellipsis(1);
}

.meta {
  display: block;
  font-size: 22rpx;
  color: $text-light;
  margin-bottom: 10rpx;
  @include ellipsis(1);
}

.dup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.dup {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 650;
}

.link {
  font-size: 22rpx;
  color: $primary-color;
  font-weight: 650;
  min-height: $touch-min;
  display: flex;
  align-items: center;
  @include pressed;
}


.creator {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
    padding-top: 12rpx;
    border-top: 1rpx dashed $border-color;
  }
}

.op {
  @include op-chip;
}

.compare-mask {
  position: fixed;
  inset: 0;
  z-index: 2800;
  background: $mask-scrim;
  display: flex;
  align-items: flex-end;
  pointer-events: auto;
}

.compare-sheet {
  width: 100%;
  height: 70vh;
  background: $bg-color;
  border-radius: $radius-lg $radius-lg 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-handle {
  @include sheet-handle;
  flex-shrink: 0;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 88rpx;
  padding: 8rpx 28rpx 16rpx;
  background: $bg-card;
  border-bottom: 1rpx solid $border-color;
  flex-shrink: 0;
  box-sizing: border-box;
}

.sheet-title {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  @include ellipsis(1);
}

.sheet-close {
  width: $icon-touch;
  height: $icon-touch;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $bg-muted;
  flex-shrink: 0;
  @include pressed;
}

.sheet-close-x {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1;
}

.sheet-body {
  flex: 1;
  height: 0;
  padding: 8rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.compare-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.compare-main {
  @include pressed;
}

.compare-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.compare-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  @include ellipsis(1);
}

.compare-meta {
  display: block;
  font-size: 22rpx;
  color: $text-light;
  margin-bottom: 8rpx;
  @include ellipsis(1);
}

.compare-summary {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: $line-base;
  @include ellipsis(2);
}

.compare-ops {
  margin-top: 12rpx;
}

.empty-inline,
.more {
  text-align: center;
  color: $text-light;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
