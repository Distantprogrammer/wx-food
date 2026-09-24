<template>
  <PageLayout
    title="分类"
    show-tab-bar
    active-tab="category"
    :scrollable="false"
    background-color="#ffffff"
    :header-style="{ background: '#ffffff', color: '#2d2d2d', borderBottom: '1rpx solid #f0f0f0' }"
    :header-content-height="88"
    :content-padding-x="0"
    :extra-bottom-padding="0"
  >
    <template #header-content>
      <view class="search-wrap">
        <view class="search-bar">
          <text>🔍</text>
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索菜谱"
            confirm-type="search"
            @confirm="reload"
          />
        </view>
      </view>
    </template>

    <view class="main">
      <scroll-view scroll-y class="nav">
        <view
          v-for="cat in categories"
          :key="cat.slug"
          class="nav-item"
          :class="{ active: activeSlug === cat.slug }"
          @click="switchCat(cat.slug)"
        >
          <text class="nav-icon">{{ cat.icon || '🍽️' }}</text>
          <text class="nav-name">{{ cat.name }}</text>
        </view>
      </scroll-view>

      <view class="right">
        <scroll-view
          scroll-y
          class="list"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
        >
          <view v-if="loading && !list.length" class="empty">加载中...</view>
          <view v-else-if="!list.length" class="empty">暂无菜谱</view>
          <view class="grid">
            <view v-for="item in list" :key="item.id" class="grid-item" @click="goDetail(item)">
              <view class="mini-card">
                <view class="cover">
                  <image v-if="coverMap[item.id]" :src="coverMap[item.id]" mode="aspectFill" class="cover-img" />
                  <view v-else class="cover-ph">🍽️</view>
                </view>
                <view class="info">
                  <text class="name">{{ item.title }}</text>
                  <text class="meta">{{ item.difficultyText }} · {{ item.calories || '--' }}kcal</text>
                </view>
              </view>
            </view>
          </view>
          <view v-if="hasMore" class="more">加载更多</view>
        </scroll-view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useTabPage } from '@/composables/useTabPage'
import { getCategories, getRecipeList } from '@/services/recipe'
import { getCoverTempUrlBatch } from '@/utils/index'
import { showApiError } from '@/utils/apiError'

useTabPage('category')

const categories = ref([{ slug: '', name: '全部', icon: '🔥' }])
const activeSlug = ref('')
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const coverMap = ref({})

async function resolveCovers(rows) {
  const urls = (rows || []).map((r) => r.coverImage).filter(Boolean)
  const byUrl = await getCoverTempUrlBatch(urls)
  const next = { ...coverMap.value }
  ;(rows || []).forEach((item) => {
    const u = byUrl[item.coverImage]
    if (u) next[item.id] = u
  })
  coverMap.value = next
}

async function loadCats() {
  try {
    const res = await getCategories()
    if (res.code === 200 && res.data?.length) {
      categories.value = [{ slug: '', name: '全部', icon: '🔥' }, ...res.data]
    }
  } catch (e) {
    console.error(e)
  }
}

async function load(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
    list.value = []
    coverMap.value = {}
  }
  try {
    const res = await getRecipeList({
      page: page.value,
      limit: 20,
      categorySlug: activeSlug.value || undefined,
      keyword: keyword.value.trim() || undefined
    })
    if (res.code === 200) {
      const rows = res.data?.list || []
      list.value = reset ? rows : list.value.concat(rows)
      hasMore.value = !!res.data?.hasMore
      resolveCovers(rows)
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function switchCat(slug) {
  if (activeSlug.value === slug) return
  activeSlug.value = slug
  load(true)
}

function reload() {
  load(true)
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  load()
}

async function onRefresh() {
  refreshing.value = true
  await load(true)
  refreshing.value = false
}

function goDetail(item) {
  uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${item.id}` })
}

onMounted(async () => {
  await loadCats()
  await load(true)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.search-wrap {
  padding: 12rpx 24rpx 16rpx;
  background: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #f8f8f8;
  border-radius: 32rpx;
  padding: 14rpx 24rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
}

.main {
  display: flex;
  height: 100%;
  min-height: 0;
}

.nav {
  width: 180rpx;
  background: #f8f8f8;
  height: 100%;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 12rpx;
  position: relative;
  font-size: 22rpx;
  color: $text-secondary;

  &.active {
    background: #fff;
    color: $primary-color;
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 40rpx;
      background: linear-gradient(135deg, #ff6b35, #ff8c5a);
      border-radius: 0 4rpx 4rpx 0;
    }
  }
}

.nav-icon {
  font-size: 32rpx;
  margin-bottom: 6rpx;
}

.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.list {
  flex: 1;
  height: 100%;
  padding: 16rpx;
  box-sizing: border-box;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.mini-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.cover {
  height: 180rpx;
}

.cover-img,
.cover-ph {
  width: 100%;
  height: 100%;
}

.cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffe0d0, #ffc9a8);
  font-size: 48rpx;
}

.info {
  padding: 12rpx;
}

.name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 20rpx;
  color: $text-light;
  margin-top: 4rpx;
}

.empty,
.more {
  padding: 40rpx;
  text-align: center;
  color: $text-light;
  font-size: 24rpx;
}
</style>
