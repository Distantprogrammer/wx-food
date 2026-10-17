<template>
  <PageLayout
    show-tab-bar
    active-tab="category"
    :show-header="false"
    :scrollable="false"
    background-color="#F7F8FA"
    :content-padding-x="0"
    :content-padding-top="0"
    :extra-bottom-padding="0"
  >
    <view class="cat-page">
      <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }" />

      <view class="page-head">
        <text class="page-title">分类</text>
        <text class="page-sub">按菜系挑一道今天想吃的</text>
      </view>

      <view class="search-row">
        <view class="search-bar">
          <view class="search-ico" />
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索菜谱、食材"
            placeholder-class="ph"
            confirm-type="search"
            @confirm="reload"
          />
        </view>
        <view class="add-btn" hover-class="is-pressed" :hover-stay-time="180" @click="goAddRecipe">＋ 新增</view>
      </view>

      <view class="category-layout" :style="{ height: navHeight + 'px' }">
        <scroll-view scroll-y class="category-nav" :style="{ height: navHeight + 'px' }" :show-scrollbar="false">
          <view
            v-for="cat in categories"
            :key="cat.slug"
            class="nav-item"
            :class="{ active: activeSlug === cat.slug }"
            @click="switchCat(cat.slug)"
          >
            <view class="nav-pill">
              <text class="nav-icon">{{ cat.icon || '🍽️' }}</text>
              <text class="nav-name">{{ cat.name }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="category-right">
          <view class="filter-bar">
            <filter-pill
              label="难度"
              :active="difficulty > 0"
              :value-text="difficultyText"
              :dot="difficultyDot"
              @click="sheet = 'difficulty'"
            />
            <filter-pill
              label="排序"
              :active="sort !== 'default'"
              :value-text="sortText"
              @click="sheet = 'sort'"
            />
            <text class="filter-count">共 {{ total }} 道</text>
          </view>

          <scroll-view
            scroll-y
            class="recipe-scroll"
            :style="{ height: listHeight + 'px' }"
            :show-scrollbar="false"
            @scrolltolower="loadMore"
            :refresher-enabled="true"
            :refresher-triggered="refreshing"
            @refresherrefresh="onRefresh"
          >
            <empty-state v-if="!loading && !list.length" title="暂无菜谱" desc="换个分类或筛选条件" />
            <view class="recipe-grid">
              <RecipeCard
                v-for="item in list"
                :key="item.id"
                :recipe="item"
                :cover="coverMap[item.id]"
                variant="tile"
                meta-mode="favorites"
                :show-badge="false"
                @click="goDetail"
              />
            </view>
            <view v-if="hasMore" class="more">加载更多</view>
          </scroll-view>
        </view>
      </view>
    </view>

    <template #overlay>
      <filter-sheet
        :visible="sheet === 'difficulty'"
        icon="🎯"
        title="选择难度"
        subtitle="按火候挑一道今天做得来的"
        :options="difficultySheetOptions"
        :value="difficulty"
        @select="onPickDifficulty"
        @reset="onResetDifficulty"
        @close="sheet = ''"
      />
      <filter-sheet
        :visible="sheet === 'sort'"
        icon="↕️"
        title="选择排序"
        subtitle="换一种方式翻今天的菜单"
        :options="sortSheetOptions"
        :value="sort"
        @select="onPickSort"
        @reset="onResetSort"
        @close="sheet = ''"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import FilterPill from '@/components/filter-pill/filter-pill.vue'
import FilterSheet from '@/components/filter-sheet/filter-sheet.vue'
import { useTabPage } from '@/composables/useTabPage'
import { useUserStore } from '@/store/user'
import { getCategories, getRecipeList } from '@/services/recipe'
import { getCoverTempUrlBatch } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { showApiError } from '@/utils/apiError'
import { getStatusBarHeight, getTabBarOccupiedHeight, getWindowHeight, rpx2px } from '@/utils/system'

useTabPage('category')

const userStore = useUserStore()
const statusBarHeight = getStatusBarHeight()
const navHeight = ref(420)
const listHeight = ref(320)

function syncPaneHeight() {
  const pane = Math.max(
    getWindowHeight() - getTabBarOccupiedHeight() - statusBarHeight - rpx2px(260),
    240
  )
  navHeight.value = pane
  listHeight.value = Math.max(pane - rpx2px(96), 180)
}

/** 与云函数 difficulty 映射一致：1=易(≤2) 2=中(3) 3=难(≥4) */
const difficultySheetOptions = [
  { value: 1, emoji: '🌱', title: '简单', desc: '步骤少，新手也能一次成功', dot: 'easy', badgeBg: '#E8F6EC' },
  { value: 2, emoji: '🔥', title: '中等', desc: '有一点火候，按步骤来就好', dot: 'medium', badgeBg: '#FFF4E5' },
  { value: 3, emoji: '🌶️', title: '困难', desc: '工序多，适合认真做一桌', dot: 'hard', badgeBg: '#FDECEC' }
]

const sortSheetOptions = [
  { value: 'default', emoji: '✨', title: '默认排序', desc: '按推荐和更新综合排', badgeBg: '#F4F5F7' },
  { value: 'likes', emoji: '❤️', title: '最热', desc: '大家都在看的菜排在前面', tag: 'HOT', tagType: 'hot', badgeBg: '#FDECEC' },
  { value: 'favorites', emoji: '⭐', title: '收藏', desc: '被收藏最多的菜排在前面', badgeBg: '#FFF8E8' },
  { value: 'calories', emoji: '🥗', title: '低卡', desc: '热量从低到高', tag: '轻食', tagType: 'light', badgeBg: '#E8F3EE' }
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
const total = ref(0)
const sheet = ref('')

const difficultyText = computed(() => difficultySheetOptions.find((o) => o.value === difficulty.value)?.title || '')
const difficultyDot = computed(() => difficultySheetOptions.find((o) => o.value === difficulty.value)?.dot || '')
const sortText = computed(() => sortSheetOptions.find((o) => o.value === sort.value && o.value !== 'default')?.title || '')

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
      total.value = Number(res.data?.total) || list.value.length
      resolveCovers(rows)
    }
  } catch (e) {
    if (!reset && page.value > 1) page.value -= 1
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

function onPickDifficulty(value) {
  difficulty.value = value
  load(true, { silent: true })
}

function onResetDifficulty() {
  if (!difficulty.value) return
  difficulty.value = 0
  load(true, { silent: true })
}

function onPickSort(value) {
  sort.value = value
  load(true, { silent: true })
}

function onResetSort() {
  if (sort.value === 'default') return
  sort.value = 'default'
  load(true, { silent: true })
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
  syncPaneHeight()
  await loadCats()
  await load(true)
})

onShow(syncPaneHeight)
</script>

<style scoped>
.cat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.status-spacer {
  flex-shrink: 0;
  width: 100%;
}

.page-head {
  flex-shrink: 0;
  padding: 16rpx 190rpx 24rpx 32rpx;
}

.search-row {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 24rpx;
  padding: 0 32rpx 24rpx;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
  height: 76rpx;
  padding: 0 32rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 48rpx;
  color: #1A1A1A;
  font-size: 28rpx;
  line-height: 1.5;
}

.add-btn {
  flex-shrink: 0;
  height: 76rpx;
  padding: 0 32rpx;
  border-radius: 20rpx;
  background: #2D6A4F;
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 76rpx;
  transition: transform 180ms ease;
}

.add-btn.is-pressed {
  transform: scale(0.98);
}

.category-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.category-nav {
  width: 208rpx;
  height: auto;
  align-self: stretch;
  flex-shrink: 0;
  overflow: hidden;
  background: #F7F8FA;
}

.nav-item {
  position: relative;
  max-width: 100%;
  margin: 4rpx 8rpx 4rpx 18rpx;
  padding: 4rpx 0;
  box-sizing: border-box;
}

.nav-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 96rpx;
  padding: 12rpx 8rpx;
  box-sizing: border-box;
}

.nav-icon {
  flex-shrink: 0;
  margin-bottom: 6rpx;
  font-size: 36rpx;
  line-height: 1;
  text-align: center;
}

.nav-item.active .nav-pill {
  padding: 14rpx 8rpx;
  background: #FFFFFF;
  border: 2rpx solid #E6E6E6;
  border-radius: 16rpx;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -16rpx;
  top: 50%;
  width: 6rpx;
  height: 28rpx;
  margin-top: -14rpx;
  background: #2D6A4F;
  border-radius: 6rpx;
}

.nav-name {
  width: 100%;
  max-height: 64rpx;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
  text-align: center;
  white-space: normal;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.nav-item.active .nav-name {
  color: #2D6A4F;
  font-weight: 700;
}

.category-right {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: auto;
  background: #F7F8FA;
}

.filter-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx 24rpx;
}

.filter-count {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #737373;
  font-size: 24rpx;
  line-height: 1.5;
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recipe-scroll {
  flex: 1;
  height: 1px;
  min-height: 0;
  padding: 0 24rpx 32rpx;
  box-sizing: border-box;
}

.recipe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.more {
  padding: 32rpx;
  color: #737373;
  font-size: 24rpx;
  line-height: 1.5;
  text-align: center;
}
</style>
