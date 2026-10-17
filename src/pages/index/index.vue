<template>
  <PageLayout
    show-tab-bar
    active-tab="home"
    :show-header="false"
    background-color="#F7F8FA"
    :content-padding-x="0"
    :content-padding-top="0"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }" />

    <view class="home-head">
      <text class="page-title">{{ greeting.text }} {{ greeting.icon }}</text>
      <text class="page-sub">为您精选 {{ greeting.meal }} 菜谱</text>
    </view>

    <view class="rail-block">
      <view class="rail-head">
        <section-head title="推荐精选" />
      </view>
      <scroll-view scroll-x class="h-scroll" :show-scrollbar="false">
        <view class="h-list">
          <view v-for="item in recommend" :key="item.id" class="h-item">
            <RecipeCard
              :recipe="item"
              variant="rail"
              meta-mode="calories"
              :show-badge="false"
              @click="goDetail"
            />
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="block">
      <view class="random-card">
        <view v-if="spinning" class="spin-line">
          <text class="dice busy">🎲</text>
          <text class="random-title">{{ flashTitle || '挑选中…' }}</text>
          <text class="random-sub">正在从推荐精选里翻牌</text>
        </view>
        <view v-else-if="randomRecipe" class="random-result">
          <RecipeCard :recipe="randomRecipe" variant="spotlight" :show-badge="false" meta-mode="calories" @click="goDetail" />
        </view>
        <view v-else class="spin-line">
          <text class="dice">🎲</text>
          <text class="random-title">帮我随机</text>
          <text class="random-sub">不知道吃什么，交给今天的运气</text>
        </view>
        <view class="random-actions" :class="{ split: randomRecipe && !spinning }">
          <button
            v-if="randomRecipe && !spinning"
            class="cta cta-ghost"
            @click="goDetail(randomRecipe)"
          >查看菜谱</button>
          <button class="cta" :class="{ busy: spinning }" :disabled="spinning" @click="onSpin">
            {{ spinning ? '挑选中…' : randomRecipe ? '再随机一次' : '帮我随机' }}
          </button>
        </view>
      </view>
    </view>

    <view class="block">
      <section-head title="热门菜谱" more="查看更多" @more="goCategory" />
      <view class="grid">
        <RecipeCard
          v-for="item in hot"
          :key="item.id"
          :recipe="item"
          meta-mode="calories"
          :show-badge="false"
          @click="goDetail"
        />
      </view>
    </view>

    <view v-if="needSeed && isAdmin" class="seed-tip" hover-class="is-pressed" :hover-stay-time="180" @click="goSeed">
      <text>云库暂无菜谱数据，点此导入种子（自动审核通过）</text>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHead from '@/components/section-head/section-head.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getHome, getRandomRecipe } from '@/services/recipe'
import { getGreeting } from '@/utils/index'
import { showApiError } from '@/utils/apiError'
import { getStatusBarHeight } from '@/utils/system'

useTabPage('home')

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
const greeting = getGreeting()
const statusBarHeight = getStatusBarHeight()

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
  // 先卸掉结果，避免翻牌过程加载封面图
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

<style scoped>
.status-spacer {
  width: 100%;
}

.home-head {
  padding: 16rpx 190rpx 32rpx 32rpx;
}

.rail-block {
  width: 100%;
  padding-top: 8rpx;
  overflow: hidden;
}

.rail-head {
  padding: 0 32rpx;
}

.h-scroll {
  width: 100%;
  white-space: nowrap;
}

.h-list {
  display: inline-flex;
  padding: 0 32rpx 8rpx;
}

.h-item {
  width: 300rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.h-item:last-child {
  margin-right: 0;
}

.block {
  padding: 32rpx 32rpx 0;
}

.block:last-of-type {
  padding-bottom: 32rpx;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.random-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 8rpx 0 0;
  padding: 24rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background-image: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
  box-shadow: 0 8rpx 32rpx rgba(45, 106, 79, 0.16);
  text-align: center;
}

.spin-line,
.random-result {
  width: 100%;
}

.random-result {
  text-align: left;
}

.dice {
  font-size: 48rpx;
  line-height: 1;
}

.dice.busy {
  animation: dice-bob 180ms ease infinite alternate;
}

.random-title {
  display: block;
  max-width: 100%;
  margin-top: 12rpx;
  overflow: hidden;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.random-sub {
  display: block;
  margin-top: 8rpx;
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.5;
}

.random-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  margin-top: 20rpx;
}

.random-actions.split {
  flex-direction: row;
}

.cta {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  max-width: 100%;
  height: 72rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #FFFFFF;
  color: #2D6A4F;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 72rpx;
  text-align: center;
}

.cta.busy,
.cta[disabled] {
  opacity: 0.72;
}

.cta-ghost {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.seed-tip {
  margin: 48rpx 32rpx 32rpx;
  padding: 24rpx 32rpx;
  border-radius: 20rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  transition: transform 180ms ease;
}

.seed-tip.is-pressed {
  transform: scale(0.98);
}

@keyframes dice-bob {
  from {
    transform: translateY(8rpx);
  }
  to {
    transform: translateY(-8rpx);
  }
}
</style>
