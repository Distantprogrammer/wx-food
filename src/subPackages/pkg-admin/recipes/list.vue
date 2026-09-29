<template>
  <PageLayout
    title="菜品管理"
    show-back
    background-color="#F6F7F2"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <view class="toolbar">
      <view class="search-bar">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索菜名"
          placeholder-class="search-ph"
          confirm-type="search"
          @confirm="reload"
        />
        <text class="search-btn" @click="reload">搜索</text>
      </view>
      <view class="add-btn" @click="goEdit()">新增</view>
    </view>

    <EmptyView v-if="!loading && !list.length" title="暂无菜谱" desc="可点击右上新增或导入种子" />
    <view v-for="item in list" :key="item.id" class="card">
      <view class="card-main" @click="openPreview(item)">
        <text class="name">{{ item.title }}</text>
        <text class="meta">
          {{ item.categoryName || item.categorySlug || '未分类' }} · {{ item.difficultyText }} · 喜欢 {{ item.likes || 0 }}
        </text>
      </view>
      <view class="ops">
        <view class="ops-row">
          <text class="op" @click.stop="openPreview(item)">预览</text>
          <text class="op" @click.stop="goEdit(item.id)">编辑</text>
          <text class="op danger" @click.stop="onDelete(item)">删除</text>
        </view>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>

    <RecipePreviewDrawer
      :visible="previewVisible"
      :recipe="previewRecipe"
      title="预览菜谱"
      @close="previewVisible = false"
    />
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import RecipePreviewDrawer from '@/components/RecipePreviewDrawer/RecipePreviewDrawer.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminRecipeList, adminRecipeDelete, adminRecipeDetail } from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const previewVisible = ref(false)
const previewRecipe = ref(null)

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
  }
  try {
    const res = await adminRecipeList(
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

function reload() {
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

async function openPreview(item) {
  if (!item?.id) return
  try {
    const res = await adminRecipeDetail(item.id)
    if (res.code === 200 && res.data) {
      previewRecipe.value = res.data
      previewVisible.value = true
    } else {
      showApiError(res, '预览失败')
    }
  } catch (e) {
    showApiError(e, '预览失败')
  }
}

function goEdit(id) {
  const q = id ? `?id=${id}` : ''
  uni.navigateTo({ url: `/subPackages/pkg-admin/recipes/edit${q}` })
}

function onDelete(item) {
  uni.showModal({
    title: '删除菜谱',
    content: `确认删除「${item.title}」？`,
    success: async (r) => {
      if (!r.confirm) return
      const res = await adminRecipeDelete(item.id)
      if (res.code === 200) {
        uni.showToast({ title: '已删除', icon: 'success' })
        previewVisible.value = false
        reload()
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
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.search-bar {
  flex: 1;
  min-width: 0;
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

.search-ph {
  color: $text-light;
}

.search-btn {
  flex-shrink: 0;
  padding: 0 16rpx;
  height: 52rpx;
  line-height: 52rpx;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 24rpx;
  font-weight: 650;
  @include pressed;
}

.add-btn {
  flex-shrink: 0;
  height: $search-height;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $primary-color;
  color: $text-white;
  font-size: 26rpx;
  font-weight: 650;
  @include pressed;

  &:active {
    background: $primary-hover;
    opacity: 1;
  }
}

.card {
  @include workbench-card;
}

.card-main {
  min-width: 0;
  @include pressed;
}

.name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  @include ellipsis(1);
}

.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $text-light;
  @include ellipsis(1);
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
}

.more {
  text-align: center;
  color: $text-light;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
