<template>
  <PageLayout
    title="用户反馈"
    show-back
    background-color="#FFF8F0"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <view v-if="!loading && !list.length" class="empty">暂无反馈</view>
    <view v-for="item in list" :key="item.id" class="card">
      <view class="head">
        <text class="name">{{ item.nickname || '匿名用户' }}</text>
        <text class="time">{{ formatTime(item.createTime) }}</text>
      </view>
      <text v-if="item.contact" class="contact">联系：{{ item.contact }}</text>
      <text class="content">{{ item.content }}</text>
      <view class="ops">
        <text class="op danger" @click="onDelete(item)">删除</text>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminFeedbackList, adminFeedbackDelete } from '@/services/feedback'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)

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

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await adminFeedbackList(
      { page: page.value, limit: 20 },
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

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
}

.time {
  font-size: 22rpx;
  color: $text-light;
}

.contact {
  display: block;
  font-size: 24rpx;
  color: $primary-color;
  margin-bottom: 10rpx;
}

.content {
  display: block;
  font-size: 26rpx;
  line-height: 40rpx;
  color: $text-secondary;
  white-space: pre-wrap;
  word-break: break-word;
}

.ops {
  display: flex;
  justify-content: flex-end;
  margin-top: 16rpx;
}

.op.danger {
  font-size: 24rpx;
  color: #e74c3c;
}

.empty,
.more {
  text-align: center;
  color: #999;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
