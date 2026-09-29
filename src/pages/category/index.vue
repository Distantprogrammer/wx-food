<template>
  <PageLayout
    title="分类"
    show-tab-bar
    active-tab="category"
    :scrollable="false"
    background-color="#F6F7F2"
    :header-style="{ background: '#FFFFFF', color: '#1F2D2A', borderBottom: '1rpx solid #E5E9E3' }"
    :header-content-height="88"
    :content-padding-x="0"
    :extra-bottom-padding="0"
  >
    <template #header-content>
      <view class="search-wrap">
        <view class="search-row">
          <view class="search-bar">
            <image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
            <input
              v-model="keyword"
              class="search-input"
              placeholder="搜索菜谱、食材"
              placeholder-class="search-ph"
              confirm-type="search"
              @confirm="reload"
            />
          </view>
          <view class="add-btn" @click="goAddRecipe">新增</view>
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
            <text class="filter-text">{{ difficultyLabel }}</text>
            <text class="filter-caret">▾</text>
          </view>
          <view class="filter-item" :class="{ active: sort !== 'default' }" @click="openSort">
            <text class="filter-text">{{ sortLabel }}</text>
            <text class="filter-caret">▾</text>
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
                <image :src="coverMap[item.id] || placeholderOf(item)" mode="aspectFill" class="cover-img" />
              </view>
              <view class="info">
                <text class="name">{{ item.title }}</text>
                <view class="meta">
                  <text class="meta-item">{{ item.difficultyText }}</text>
                  <text class="meta-item likes">喜欢 {{ item.likes || 0 }}</text>
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
import { useUserStore } from '@/store/user'
import { getCategories, getRecipeList } from '@/services/recipe'
import { getCoverTempUrlBatch } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { showApiError } from '@/utils/apiError'

useTabPage('category')

const userStore = useUserStore()

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

function placeholderOf(item) {
  return getRecipePlaceholder(item?.categorySlug)
}

async function resolveCovers(rows) {
  const urls = (rows || []).map((r) => r.coverImage).filter(Boolean)
  const byUrl = urls.length ? await getCoverTempUrlBatch(urls) : {}
  const next = { ...coverMap.value }
  ;(rows || []).forEach((item) => {
    const u = item.coverImage ? byUrl[item.coverImage] : ''
    next[item.id] = u || getRecipePlaceholder(item.categorySlug)
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

function goAddRecipe() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/recipes/edit?pending=1' })
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
  background: $bg-card;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: $bg-muted;
  border: 1rpx solid $border-color;
  border-radius: $radius-sm;
  padding: 0 20rpx;
  height: 68rpx;
}

.add-btn {
  flex-shrink: 0;
  height: 68rpx;
  line-height: 68rpx;
  padding: 0 22rpx;
  border-radius: $radius-sm;
  background: $primary-color;
  color: #fff;
  font-size: 26rpx;
  font-weight: 650;
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  opacity: 0.65;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  line-height: 68rpx;
  font-size: 26rpx;
  color: $text-primary;
}

.search-ph {
  color: $text-light;
}

.category-layout {
  display: flex;
  height: 100%;
  min-height: 0;
}

.category-nav {
  width: 168rpx;
  background: $bg-muted;
  height: 100%;
  flex-shrink: 0;
  border-right: 1rpx solid $border-color;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22rpx 12rpx;
  font-size: 22rpx;
  color: $text-secondary;
  position: relative;
  gap: 8rpx;

  &.active {
    background: $bg-card;
    color: $primary-color;
    font-weight: 650;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 36rpx;
      background: $primary-color;
      border-radius: 0 4rpx 4rpx 0;
    }
  }
}

.nav-icon {
  font-size: 30rpx;
  line-height: 1;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-name {
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: $bg-color;
  height: 100%;
}

.filter-bar {
  display: flex;
  flex-shrink: 0;
  padding: 14rpx 16rpx;
  background: $bg-card;
  border-bottom: 1rpx solid $border-color;
  gap: 12rpx;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
  max-width: 48%;
  padding: 10rpx 16rpx;
  background: $bg-muted;
  border: 1rpx solid transparent;
  border-radius: $radius-sm;
  font-size: 22rpx;
  color: $text-secondary;

  &.active {
    background: $primary-soft;
    border-color: rgba(23, 107, 74, 0.18);
    color: $primary-color;
    font-weight: 650;
  }
}

.filter-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140rpx;
}

.filter-caret {
  font-size: 18rpx;
  line-height: 1;
  opacity: 0.7;
  flex-shrink: 0;
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
  gap: 16rpx;
}

.mini-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1rpx solid $border-color;
}

.cover {
  height: 176rpx;
  background: $bg-muted;
}

.cover-img {
  width: 100%;
  height: 100%;
  background: $bg-soft;
}

.info {
  padding: 14rpx 14rpx 16rpx;
}

.name {
  display: block;
  font-size: 26rpx;
  font-weight: 650;
  color: $text-primary;
  margin-bottom: 8rpx;
  line-height: $line-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  gap: 12rpx;
  font-size: 20rpx;
  color: $text-light;
  min-width: 0;
}

.meta-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
}

.empty,
.more {
  padding: 40rpx;
  text-align: center;
  color: $text-light;
  font-size: 24rpx;
}
</style>
