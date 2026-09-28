<template>
  <PageLayout
    title="技巧管理"
    show-back
    background-color="#F6F7F2"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <view class="toolbar">
      <input v-model="keyword" class="search" placeholder="搜索技巧" confirm-type="search" @confirm="reload" />
      <view class="add" @click="goEdit()">＋ 新增</view>
    </view>

    <view v-if="!loading && !list.length" class="empty">暂无技巧</view>
    <view v-for="item in list" :key="item.id" class="row">
      <view class="main" @click="goEdit(item.id)">
        <text class="name">{{ item.title }}</text>
        <text class="meta">{{ item.summary || '无摘要' }}</text>
      </view>
      <view class="ops">
        <text class="op" @click.stop="goEdit(item.id)">编辑</text>
        <text class="op danger" @click.stop="onDelete(item)">删除</text>
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
import { adminTipList, adminTipDelete } from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
  }
  try {
    const res = await adminTipList(
      { page: page.value, limit: 20, keyword: keyword.value.trim() },
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

function reload() { load(true) }
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
function goEdit(id) {
  uni.navigateTo({ url: `/subPackages/pkg-admin/tips/edit${id ? `?id=${id}` : ''}` })
}
function onDelete(item) {
  uni.showModal({
    title: '删除技巧',
    content: `确认删除「${item.title}」？`,
    success: async (r) => {
      if (!r.confirm) return
      const res = await adminTipDelete(item.id)
      if (res.code === 200) {
        uni.showToast({ title: '已删除', icon: 'success' })
        reload()
      } else showApiError(res, '删除失败')
    }
  })
}

onShow(() => load(true))
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.toolbar { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.search { flex: 1; height: 72rpx; background: #FFFFFF; border-radius: 16rpx; padding: 0 24rpx; font-size: 26rpx; }
.add { height: 72rpx; line-height: 72rpx; padding: 0 24rpx; background: $primary-color; color: #fff; border-radius: 16rpx; font-size: 26rpx; font-weight: 600; }
.row { display: flex; align-items: center; background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: $shadow-sm; }
.main { flex: 1; min-width: 0; }
.name { display: block; font-size: 28rpx; font-weight: 600; }
.meta { display: block; font-size: 22rpx; color: $text-light; margin-top: 8rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ops { display: flex; gap: 16rpx; }
.op { font-size: 24rpx; color: $primary-color; }
.op.danger { color: #e74c3c; }
.empty, .more { text-align: center; color: #8A9590; padding: 32rpx; font-size: 24rpx; }
</style>
