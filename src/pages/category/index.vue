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
          <text class="search-icon">🔍</text>
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索菜谱、食材"
            confirm-type="search"
            @confirm="reload"
          />
        </view>
      </view>
    </template>

    <view class="category-layout">
      <scroll-view scroll-y class="category-nav">
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

      <view class="category-right">
        <view class="filter-bar">
          <view class="filter-item" :class="{ active: !!difficulty }" @click="openDifficulty">
            {{ difficultyLabel }} ▼
          </view>
          <view class="filter-item" :class="{ active: sort !== 'default' }" @click="openSort">
            {{ sortLabel }} ▼
          </view>
        </view>

        <scroll-view
          scroll-y
          class="recipe-scroll"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
        >
          <view v-if="!loading && !list.length" class="empty">暂无菜谱</view>
          <view class="recipe-grid">
            <view v-for="item in list" :key="item.id" class="mini-card" @click="goDetail(item)">
              <view class="cover">
                <image v-if="coverMap[item.id]" :src="coverMap[item.id]" mode="aspectFill" class="cover-img" />
                <view v-else class="cover-ph">🍽️</view>
              </view>
              <view class="info">
                <text class="name">{{ item.title }}</text>
                <view class="meta">
                  <text>{{ item.difficultyText }}</text>
                  <text>❤️ {{ item.likes || 0 }}</text>
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
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useTabPage } from '@/composables/useTabPage'
import { getCategories, getRecipeList } from '@/services/recipe'
import { getCoverTempUrlBatch } from '@/utils/index'
import { showApiError } from '@/utils/apiError'

useTabPage('category')

/** 与云函数 difficulty 映射一致：1=易(≤2) 2=中(3) 3=难(≥4) */
const difficultyOptions = [
  { label: '全部难度', value: 0 },
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '困难', value: 3 }
]

const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: '最热', value: 'likes' },
  { label: '收藏', value: 'favorites' },
  { label: '低卡', value: 'calories' }
]

const categories = ref([{ slug: '', name: '全部', icon: '🔥' }])
const activeSlug = ref('')
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const coverMap = ref({})
const difficulty = ref(0)
const sort = ref('default')

const difficultyLabel = computed(() => {
  const hit = difficultyOptions.find((o) => o.value === difficulty.value)
  return hit?.value ? hit.label : '难度'
})

const sortLabel = computed(() => {
  const hit = sortOptions.find((o) => o.value === sort.value)
  return hit && hit.value !== 'default' ? hit.label : '排序'
})

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
    const res = await getCategories({ silent: true })
    if (res.code === 200 && res.data?.length) {
      categories.value = [{ slug: '', name: '全部', icon: '🔥' }, ...res.data]
    }
  } catch (e) {
    console.error(e)
  }
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
    coverMap.value = {}
  }
  try {
    const res = await getRecipeList(
      {
        page: page.value,
        limit: 20,
        categorySlug: activeSlug.value || undefined,
        keyword: keyword.value.trim() || undefined,
        difficulty: difficulty.value || undefined,
        sort: sort.value === 'default' ? undefined : sort.value
      },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
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

function openDifficulty() {
  uni.showActionSheet({
    itemList: difficultyOptions.map((o) => o.label),
    success: (res) => {
      const opt = difficultyOptions[res.tapIndex]
      if (!opt || difficulty.value === opt.value) return
      difficulty.value = opt.value
      load(true)
    }
  })
}

function openSort() {
  uni.showActionSheet({
    itemList: sortOptions.map((o) => o.label),
    success: (res) => {
      const opt = sortOptions[res.tapIndex]
      if (!opt || sort.value === opt.value) return
      sort.value = opt.value
      load(true)
    }
  })
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
  padding: 0 24rpx 16rpx;
  background: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $bg-muted;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: $text-primary;
}

.category-layout {
  display: flex;
  height: 100%;
  min-height: 0;
}

.category-nav {
  width: 180rpx;
  background: $bg-muted;
  height: 100%;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  font-size: 24rpx;
  color: $text-secondary;
  position: relative;

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
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.nav-name {
  text-align: center;
}

.category-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 100%;
}

.filter-bar {
  display: flex;
  flex-shrink: 0;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid $border-color;
  gap: 16rpx;
  overflow-x: auto;
}

.filter-item {
  flex-shrink: 0;
  padding: 12rpx 20rpx;
  background: $bg-muted;
  border-radius: 24rpx;
  font-size: 22rpx;
  color: $text-secondary;

  &.active {
    background: rgba(255, 107, 53, 0.12);
    color: $primary-color;
    font-weight: 600;
  }
}

.recipe-scroll {
  flex: 1;
  height: 0;
  padding: 16rpx;
  box-sizing: border-box;
}

.recipe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.mini-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.cover {
  height: 200rpx;
  background: $bg-muted;
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
  padding: 16rpx;
}

.name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  gap: 16rpx;
  font-size: 22rpx;
  color: $text-light;
}

.empty,
.more {
  padding: 40rpx;
  text-align: center;
  color: $text-light;
  font-size: 24rpx;
}
</style>
