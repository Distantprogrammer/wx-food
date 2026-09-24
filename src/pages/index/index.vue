<template>
  <PageLayout
    :show-header="false"
    show-tab-bar
    active-tab="home"
    background-color="#FFF8F0"
    :content-padding-x="0"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <view class="home-header">
      <view class="top">
        <view class="greeting">
          <text class="text">{{ greeting.text }}</text>
          <text class="icon">{{ greeting.icon }}</text>
        </view>
        <view class="avatar" @click="goMe">
          <image v-if="userInfo?.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-img" />
          <text v-else>😊</text>
        </view>
      </view>
      <view class="meal-banner">
        <text class="title">{{ greeting.meal }}推荐</text>
        <text class="sub">为您精选 {{ greeting.meal }} 菜谱</text>
      </view>
    </view>

    <view class="section">
      <scroll-view scroll-x class="h-scroll" :show-scrollbar="false">
        <view class="h-list">
          <view v-for="item in recommend" :key="item.id" class="h-item">
            <RecipeCard :recipe="item" @click="goDetail" />
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">🎲 随机选菜</text>
      </view>
      <view class="slot-card">
        <view class="slot-window">
          <text class="slot-emoji">{{ spinning ? '⏳' : '🎰' }}</text>
          <text class="slot-name">{{ randomRecipe?.title || '点击下方按钮开始' }}</text>
        </view>
        <button class="spin-btn" :disabled="spinning" @click="spin">
          {{ spinning ? '旋转中...' : '帮我随机' }}
        </button>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">🔥 热门菜谱</text>
        <text class="section-more" @click="goCategory">查看更多 →</text>
      </view>
      <view class="grid">
        <view v-for="item in hot" :key="item.id" class="grid-item">
          <RecipeCard :recipe="item" @click="goDetail" />
        </view>
      </view>
    </view>

    <view v-if="needSeed && isAdmin" class="seed-tip" @click="goSeed">
      <text>云库暂无菜谱数据，点此导入种子（首次）</text>
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
      needSeed.value = !recommend.value.length && !hot.value.length
    }
  } catch (e) {
    needSeed.value = true
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

function goMe() {
  uni.switchTab({ url: '/pages/me/index' })
}

onMounted(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.home-header {
  padding: 60rpx 40rpx 24rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
  background: linear-gradient(180deg, rgba(255, 107, 53, 0.15), transparent);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.greeting .text {
  font-size: 40rpx;
  font-weight: 600;
}

.greeting .icon {
  font-size: 36rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  border: 4rpx solid #fff;
  box-shadow: $shadow-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.meal-banner {
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  border-radius: 24rpx;
  padding: 28rpx;
  color: #fff;
}

.meal-banner .title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.meal-banner .sub {
  font-size: 24rpx;
  opacity: 0.9;
}

.section {
  padding: 0 40rpx;
  margin-bottom: 40rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
}

.section-more {
  font-size: 24rpx;
  color: $primary-color;
}

.h-scroll {
  white-space: nowrap;
}

.h-list {
  display: inline-flex;
  gap: 20rpx;
}

.h-item {
  width: 280rpx;
  flex-shrink: 0;
}

.slot-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: $shadow-md;
}

.slot-window {
  height: 180rpx;
  background: $bg-muted;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.slot-emoji {
  font-size: 48rpx;
}

.slot-name {
  font-size: 28rpx;
  font-weight: 500;
}

.spin-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.seed-tip {
  margin: 0 40rpx 40rpx;
  padding: 24rpx;
  background: rgba(255, 107, 53, 0.1);
  color: $primary-color;
  border-radius: 16rpx;
  text-align: center;
  font-size: 26rpx;
}
</style>
