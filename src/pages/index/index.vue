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
      <view class="random-panel">
        <view class="random-stage">
          <!-- 翻牌过程只用轻量卡片，避免频繁重建 RecipeCard / 拉封面 -->
          <view v-if="spinning" class="spin-card flipping">
            <view class="spin-cover" />
            <view class="spin-body">
              <text class="spin-name">{{ flashTitle || '挑选中…' }}</text>
              <text class="spin-meta">正在翻牌</text>
            </view>
          </view>
          <view v-else-if="randomRecipe" class="random-card-wrap">
            <RecipeCard :recipe="randomRecipe" variant="rail" @click="goDetail" />
          </view>
          <view v-else class="random-placeholder">
            <view class="ph-cover" />
            <view class="ph-body">
              <text class="ph-title">点击下方开始随机</text>
              <text class="ph-sub">从今日精选中抽出一道菜</text>
            </view>
          </view>
        </view>
        <view class="random-actions">
          <button
            v-if="randomRecipe && !spinning"
            class="btn-ghost"
            @click="goDetail(randomRecipe)"
          >查看菜谱</button>
          <button class="btn-primary" :class="{ busy: spinning }" :disabled="spinning" @click="onSpin">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getHome, getRandomRecipe } from '@/services/recipe'
import { getGreeting } from '@/utils/index'
import { showApiError } from '@/utils/apiError'

useTabPage('home')

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
const greeting = getGreeting()

const recommend = ref([])
const hot = ref([])
const spinPool = ref([])
const randomRecipe = ref(null)
const flashTitle = ref('')
const spinning = ref(false)
const refreshing = ref(false)
const needSeed = ref(false)
let spinTimer = null

function shuffle(list) {
  const arr = [...(list || [])].filter((r) => r && r.id)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

async function load() {
  try {
    const res = await getHome(8)
    if (res.code === 200) {
      const slot = shuffle(res.data?.slot || [])
      const rec = shuffle(res.data?.recommend || [])
      const pool = slot.length ? slot : rec
      recommend.value = pool.slice(0, 8)
      spinPool.value = pool
      hot.value = (res.data?.hot || []).filter((r) => r && r.id)
      needSeed.value = !!res.data?.needSeed
    }
  } catch (e) {
    needSeed.value = false
    showApiError(e, '加载失败')
  }
}

function clearSpinTimer() {
  if (spinTimer) {
    clearInterval(spinTimer)
    spinTimer = null
  }
}

async function onSpin() {
  if (spinning.value) return
  // 先卸掉 RecipeCard，避免翻牌过程加载封面图
  randomRecipe.value = null
  spinning.value = true
  clearSpinTimer()

  const pool = spinPool.value.length ? spinPool.value : recommend.value
  let tick = 0
  if (pool.length) {
    flashTitle.value = pool[0].title || '挑选中…'
    spinTimer = setInterval(() => {
      const item = pool[tick % pool.length]
      flashTitle.value = item?.title || '挑选中…'
      tick += 1
    }, 80)
  } else {
    flashTitle.value = '挑选中…'
  }

  try {
    const [res] = await Promise.all([
      getRandomRecipe(),
      new Promise((r) => setTimeout(r, 800))
    ])
    clearSpinTimer()
    flashTitle.value = ''
    spinning.value = false
    if (res.code === 200 && res.data && res.data.id) {
      randomRecipe.value = res.data
    } else if (pool.length) {
      randomRecipe.value = pool[Math.floor(Math.random() * pool.length)]
    } else {
      uni.showToast({ title: '暂无可随机菜谱', icon: 'none' })
    }
  } catch (e) {
    clearSpinTimer()
    flashTitle.value = ''
    spinning.value = false
    showApiError(e, '随机失败')
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
  if (!recipe?.id) return
  uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${recipe.id}` })
}

function goCategory() {
  uni.switchTab({ url: '/pages/category/index' })
}

onMounted(load)
onBeforeUnmount(clearSpinTimer)
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

.random-panel {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $card-padding;
}

.random-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 12rpx 0 4rpx;
}

.random-card-wrap,
.spin-card,
.random-placeholder {
  width: 300rpx;
}

.spin-card,
.random-placeholder {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
}

.spin-card.flipping {
  animation: cardFlip 0.16s ease-in-out infinite alternate;
}

.spin-cover,
.ph-cover {
  height: 200rpx;
  background: linear-gradient(135deg, $bg-soft 0%, $bg-muted 100%);
}

.spin-body,
.ph-body {
  padding: 16rpx 18rpx 20rpx;
  min-height: 100rpx;
  box-sizing: border-box;
}

.spin-name,
.ph-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spin-meta,
.ph-sub {
  display: block;
  font-size: 22rpx;
  color: $text-light;
}

.random-placeholder {
  border-style: dashed;
  background: $bg-muted;
}

.random-actions {
  display: flex;
  gap: 16rpx;
}

@keyframes cardFlip {
  from {
    transform: translateY(4rpx) scale(0.98);
    opacity: 0.82;
  }
  to {
    transform: translateY(-4rpx) scale(1);
    opacity: 1;
  }
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
