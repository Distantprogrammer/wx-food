<template>
  <PageLayout
    title="新增技巧"
    show-back
    background-color="#F6F7F2"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <template #header-right>
      <view class="hdr-btn" @click="goCreate">新增</view>
    </template>

    <view class="create-card" hover-class="create-card-hover" @click="goCreate">
      <view class="create-text">
        <text class="create-title">提交新技巧</text>
        <text class="create-desc">填写后将进入审核，通过后展示给大家</text>
      </view>
      <text class="create-arrow">›</text>
    </view>

    <view class="history-head">
      <text class="history-title">我的提交</text>
    </view>

    <EmptyView v-if="!loading && !list.length" title="暂无新增记录" desc="提交后可在此查看审核进度" />
    <view v-for="item in list" :key="item.id" class="card">
      <view class="card-main" @click="onOpen(item)">
        <view class="head">
          <AuditStatusTag :status="item.auditStatus || 'pending'" :text="statusLabel(item.auditStatus)" />
          <text class="time">{{ formatTime(item.createTime) }}</text>
        </view>
        <text class="title">{{ item.title || '未命名技巧' }}</text>
        <text v-if="item.summary" class="meta">{{ item.summary }}</text>
        <text v-if="statusTip(item)" class="tip">{{ statusTip(item) }}</text>
      </view>
      <view v-if="canManage(item)" class="ops">
        <view class="ops-row">
          <text class="op" @click.stop="goEdit(item)">编辑</text>
          <text class="op danger" @click.stop="onDelete(item)">删除</text>
        </view>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import AuditStatusTag from '@/components/AuditStatusTag/AuditStatusTag.vue'
import { getMyCreatedTips, deleteMyTip } from '@/services/tip'
import { useUserStore } from '@/store/user'
import { showApiError } from '@/utils/apiError'

const userStore = useUserStore()

const STATUS_LABEL = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
}

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)

function statusLabel(status) {
  return STATUS_LABEL[status] || STATUS_LABEL.pending
}

function canManage(item) {
  const status = item.auditStatus || 'pending'
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
  const status = item.auditStatus || 'pending'
  if (status === 'approved' && item.auditTime) {
    return `已于 ${formatTime(item.auditTime)} 通过审核`
  }
  if (status === 'rejected' && item.auditTime) {
    return `已于 ${formatTime(item.auditTime)} 驳回`
  }
  if (status === 'pending') {
    return '等待管理员审核'
  }
  return ''
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await getMyCreatedTips(
      { page: page.value, limit: 20 },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      list.value = reset ? (res.data?.list || []) : list.value.concat(res.data?.list || [])
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

function goCreate() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/tips/edit?pending=1' })
}

function goEdit(item) {
  if (!item?.id) return
  uni.navigateTo({ url: `/subPackages/pkg-admin/tips/edit?id=${item.id}&owner=1` })
}

function onOpen(item) {
  if (!item?.id) return
  if (item.auditStatus === 'approved') {
    uni.navigateTo({ url: `/subPackages/pkg-tips/detail/index?id=${item.id}` })
    return
  }
  goEdit(item)
}

function onDelete(item) {
  uni.showModal({
    title: '删除技巧',
    content: `确认删除「${item.title || '未命名技巧'}」？`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await deleteMyTip(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success' })
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

onShow(() => load(true))
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.hdr-btn {
  padding: 8rpx 18rpx;
  min-height: $touch-min;
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 650;
  color: $primary-color;
  @include pressed;
}

.create-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  @include workbench-card;
  margin-bottom: 8rpx;
}

.create-card-hover {
  background: $bg-muted;
}

.create-text {
  flex: 1;
  min-width: 0;
}

.create-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8rpx;
}

.create-desc {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: $line-base;
}

.create-arrow {
  flex-shrink: 0;
  width: 40rpx;
  text-align: center;
  font-size: 36rpx;
  line-height: 1;
  color: $primary-color;
}

.history-head {
  margin: 24rpx 0 16rpx;
}

.history-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
}

.card {
  @include workbench-card;
}

.card-main {
  @include pressed;
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

.title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 8rpx;
  @include ellipsis(1);
}

.meta {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  @include ellipsis(1);
}

.tip {
  display: block;
  margin-top: 12rpx;
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
