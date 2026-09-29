<template>
  <PageLayout
    show-tab-bar
    active-tab="home"
    :header-style="{ background: '#F6F7F2', color: '#1F2D2A', borderBottom: '1rpx solid #E5E9E3' }"
    background-color="#F6F7F2"
    :content-padding-x="0"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <template #header-left>
      <view class="greeting">
        <text class="text">{{ greeting.text }}</text>
        <text class="icon">{{ greeting.icon }}</text>
      </view>
    </template>
    <view class="home-header">
      <view class="meal-line">
        <!-- <text class="meal-label">本餐推荐</text> -->
        <!-- <text class="meal-title">{{ greeting.meal }}</text> -->
        <text class="meal-sub">为您精选 {{ greeting.meal }} 菜谱</text>
      </view>
    </view>

    <view class="section section--rail">
      <scroll-view scroll-x class="h-scroll" :show-scrollbar="false">
        <view class="h-list">
          <view v-for="item in recommend" :key="item.id" class="h-item">
            <RecipeCard :recipe="item" variant="rail" @click="goDetail" />
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">随机选菜</text>
      </view>
      <view class="random-card">
        <view class="random-result" :class="{ loading: spinning, ready: !!randomRecipe && !spinning }">
          <text class="random-label">{{ spinning ? '正在挑选…' : randomRecipe ? '今日建议' : '尚未选择' }}</text>
          <text class="random-name">{{ randomRecipe?.title || '点击下方开始随机' }}</text>
          <text v-if="randomRecipe && !spinning" class="random-meta">
            {{ randomRecipe.difficultyText || '' }}
            <text v-if="randomRecipe.calories">· {{ randomRecipe.calories }}kcal</text>
          </text>
        </view>
        <view class="random-actions">
          <button v-if="randomRecipe && !spinning" class="btn-ghost" @click="goDetail(randomRecipe)">查看菜谱</button>
          <button class="btn-primary" :class="{ busy: spinning }" :disabled="spinning" @click="spin">
            {{ spinning ? '挑选中…' : randomRecipe ? '再随机一次' : '帮我随机' }}
          </button>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">热门菜谱</text>
        <view class="section-more" @click="goCategory">
          <text>查看更多</text>
          <image class="more-arrow" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
      </view>
      <view class="grid">
        <view v-for="item in hot" :key="item.id" class="grid-item">
          <RecipeCard :recipe="item" variant="compact" @click="goDetail" />
        </view>
      </view>
    </view>

    <view v-if="needSeed && isAdmin" class="seed-tip" @click="goSeed">
      <text>云库暂无菜谱数据，点此导入种子（自动审核通过）</text>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getHome, getRandomRecipe } from '@/services/recipe'
import { getGreeting } from '@/utils/index'
import { showApiError } from '@/utils/apiError'

useTabPage('home')

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)
const greeting = getGreeting()

const recommend = ref([])
const hot = ref([])
const randomRecipe = ref(null)
const spinning = ref(false)
const refreshing = ref(false)
const needSeed = ref(false)

async function load() {
  try {
    const res = await getHome(6)
    if (res.code === 200) {
      recommend.value = res.data?.recommend || []
      hot.value = res.data?.hot || []
      needSeed.value = !!res.data?.needSeed
    }
  } catch (e) {
    needSeed.value = false
    showApiError(e, '加载失败')
  }
}

async function spin() {
  if (spinning.value) return
  spinning.value = true
  try {
    const res = await getRandomRecipe()
    if (res.code === 200) randomRecipe.value = res.data
  } catch (e) {
    showApiError(e, '随机失败')
  } finally {
    spinning.value = false
  }
}

function goSeed() {
  if (!userStore.isAdmin) {
    uni.showToast({ title: '仅管理员可操作', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/seed/index' })
}

async function onRefresh() {
  refreshing.value = true
  await load()
  refreshing.value = false
}

function goDetail(recipe) {
  uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${recipe.id}` })
}

function goCategory() {
  uni.switchTab({ url: '/pages/category/index' })
}

onMounted(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.home-header {
  padding: 8rpx $page-padding-x 8rpx;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
  margin-bottom: 20rpx;
}

.greeting .text {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.greeting .icon {
  font-size: 32rpx;
  line-height: 1;
  flex-shrink: 0;
}

.meal-line {
  padding: 8rpx 0 12rpx;
}

.meal-label {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  color: $primary-color;
  letter-spacing: 1rpx;
  margin-bottom: 6rpx;
}

.meal-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meal-sub {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: $line-base;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section {
  padding: 0 $page-padding-x;
  margin-bottom: 36rpx;
}

.section--rail {
  padding-right: 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
  gap: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 2rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: $text-secondary;
}

.more-arrow {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  margin-left: 2rpx;
  opacity: 0.7;
}

.btn-ghost,
.btn-primary {
  flex: 1;
  min-width: 0;
  height: $btn-height;
  line-height: $btn-height;
  text-align: center;
  font-size: $btn-font;
  font-weight: 650;
  border-radius: $btn-radius;
}

.btn-ghost {
  background: $bg-muted;
  color: $text-primary;
  border: 1rpx solid $border-color;

  &:active {
    opacity: 0.86;
  }
}

.btn-primary {
  background: $primary-color;
  color: $text-white;

  &:active {
    background: $primary-hover;
  }

  &.busy,
  &[disabled] {
    opacity: 0.72;
  }
}

.h-scroll {
  white-space: nowrap;
}

.h-list {
  display: inline-flex;
  gap: 16rpx;
  padding-right: $page-padding-x;
}

.h-item {
  width: 300rpx;
  flex-shrink: 0;
}

.random-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $card-padding;
}

.random-result {
  min-height: 160rpx;
  padding: 28rpx 24rpx;
  border-radius: $radius-sm;
  background: $bg-muted;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
  transition: background $duration-base $ease-out;

  &.ready {
    background: $primary-soft;
  }

  &.loading {
    opacity: 0.85;
  }
}

.random-label {
  font-size: 22rpx;
  font-weight: 600;
  color: $text-light;
}

.random-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.random-meta {
  font-size: 22rpx;
  color: $text-secondary;
}

.random-actions {
  display: flex;
  gap: 16rpx;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $list-gap;
}

.seed-tip {
  margin: 0 $page-padding-x 40rpx;
  padding: 22rpx 24rpx;
  background: $primary-soft;
  color: $primary-color;
  border-radius: $radius-sm;
  border: 1rpx solid rgba(23, 107, 74, 0.16);
  text-align: center;
  font-size: 26rpx;
  line-height: $line-base;
}
</style>
