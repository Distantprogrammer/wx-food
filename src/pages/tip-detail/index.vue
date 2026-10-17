<template>
  <view class="page">
    <view class="progress" :style="{ width: progress + '%' }" />

    <view class="head" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav">
        <view class="back" @click="back">‹</view>
        <text class="nav-title">技巧详情</text>
        <view class="nav-gap" />
      </view>
      <scroll-view v-if="tips.length" scroll-x class="switcher" :show-scrollbar="false">
        <view class="switcher-row">
          <view
            v-for="(item, index) in tips"
            :key="item.id || item._id"
            class="sw-chip"
            :class="{ active: isCurrent(item) }"
            @click="switchTip(item)"
          >{{ chipText(item, index) }}</view>
        </view>
      </scroll-view>
    </view>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!tip" class="empty">技巧不存在或尚未通过审核</view>
    <block v-else>
      <view class="hero">
        <view class="hero-top">
          <text class="kicker">📖 烹饪技巧 · VOL.{{ vol }}</text>
          <view class="hero-ico">{{ iconText }}</view>
        </view>
        <text class="hero-title">{{ tip.title }}</text>
        <text v-if="tip.summary" class="hero-desc">{{ tip.summary }}</text>
        <view class="hero-meta">
          <text>⏱ 约 {{ minutes }} 分钟</text>
          <text class="meta-sep">|</text>
          <text>📑 {{ toc.length }} 个章节</text>
          <text v-if="updatedText" class="meta-sep">|</text>
          <text v-if="updatedText">🔁 更新于 {{ updatedText }}</text>
        </view>
      </view>
      <article-renderer ref="renderer" :content="content" @toc="onToc" @meta="onMeta" />
    </block>

    <view v-if="tip" class="toc-fab" @click="tocVisible = true">
      <view class="fab-line" />
      <view class="fab-line short" />
      <view class="fab-line" />
    </view>

    <view v-if="tip" class="actionbar">
      <view class="ab-item" :class="{ liked }" @click="toggleLike">
        <text class="ab-ico">♡</text>
        <text class="ab-num">{{ likeCount }}</text>
      </view>
      <view class="ab-sep" />
      <view class="ab-item" :class="{ faved }" @click="toggleFav">
        <text class="ab-ico">☆</text>
        <text class="ab-num">{{ favCount }}</text>
      </view>
      <view class="ab-sep" />
      <view class="ab-item" @click="shareTip">
        <text class="ab-ico">↑</text>
        <text class="ab-num">{{ shareCount }}</text>
      </view>
      <view class="ab-main" @click="randomDish">🎲 随机一菜</view>
    </view>

    <toc-sheet :visible="tocVisible" :items="toc" @close="tocVisible = false" @select="jump" />
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import ArticleRenderer from '@/components/article-renderer/article-renderer.vue'
import TocSheet from '@/components/toc-sheet/toc-sheet.vue'
import { getTipDetail, getTipList } from '@/services/tip'
import { getRandomRecipe } from '@/services/recipe'
import { showApiError } from '@/utils/apiError'
import { getStatusBarHeight } from '@/utils/system'

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
const statusBarHeight = getStatusBarHeight()
const tip = ref(null)
const tips = ref([])
const loading = ref(true)
const minutes = ref(1)
const toc = ref([])
const tocVisible = ref(false)
const renderer = ref(null)
const currentId = ref('')
const progress = ref(0)
const pageHeight = ref(0)
const liked = ref(false)
const faved = ref(false)
const likeCount = ref(0)
const favCount = ref(0)
const shareCount = ref(0)

const content = computed(() => tip.value?.markdown || tip.value?.markdownHtml || '')

const vol = computed(() => {
  const index = tips.value.findIndex((item) => isCurrent(item))
  return String((index >= 0 ? index : 0) + 1).padStart(2, '0')
})

const iconText = computed(() => {
  if (tip.value?.icon) return tip.value.icon
  const title = tip.value?.title || ''
  if (/油温/.test(title)) return '🌡️'
  if (/决策|吃什么/.test(title)) return '🧮'
  return '📖'
})

const updatedText = computed(() => {
  const value = tip.value?.updatedAt
  if (!value) return ''
  const date = new Date(typeof value === 'object' && value.$date ? Number(value.$date) : value)
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
})

function isCurrent(item) {
  return String(item?.id || item?._id || '') === String(currentId.value || '')
}

function chipText(item, index) {
  const mark = CIRCLED[index] || `${index + 1}`
  const name = String(item?.title || '').replace(/^如何/, '')
  return `${mark} ${name}`
}

function onToc(list) {
  toc.value = list || []
  measurePage()
}

function onMeta(meta) {
  minutes.value = meta?.minutes || 1
}

function jump(item) {
  renderer.value?.scrollTo(item.id)
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/tips/index' })
}

function applyCounts(data) {
  liked.value = false
  faved.value = false
  likeCount.value = Number(data?.likes) || 0
  favCount.value = Number(data?.favorites) || 0
  shareCount.value = Number(data?.shares) || 0
}

function toggleLike() {
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
  uni.showToast({ title: liked.value ? '已点赞' : '已取消点赞', icon: 'none' })
}

function toggleFav() {
  faved.value = !faved.value
  favCount.value += faved.value ? 1 : -1
  uni.showToast({ title: faved.value ? '已收藏' : '已取消收藏', icon: 'none' })
}

function shareTip() {
  shareCount.value += 1
  uni.setClipboardData({
    data: tip.value?.title || '烹饪技巧',
    success() {
      uni.showToast({ title: '已复制标题', icon: 'none' })
    }
  })
}

async function randomDish() {
  try {
    const res = await getRandomRecipe({ silent: true })
    const id = res.data?.id || res.data?.recipeId
    if (res.code === 200 && id) {
      uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${id}` })
      return
    }
  } catch (error) {
    // 没有菜谱时只提示
  }
  uni.showToast({ title: '暂时没有菜谱', icon: 'none' })
}

async function loadDetail(id) {
  loading.value = !tip.value
  try {
    const res = await getTipDetail(id)
    if (res.code === 200) {
      tip.value = res.data
      currentId.value = res.data?.id || res.data?._id || id
      applyCounts(res.data)
    } else {
      tip.value = null
      showApiError(res, '技巧不存在或尚未通过审核')
    }
  } catch (error) {
    tip.value = null
    showApiError(error, '加载失败')
  } finally {
    loading.value = false
    nextTick(measurePage)
  }
}

async function loadTips() {
  try {
    const res = await getTipList({})
    if (res.code === 200) tips.value = res.data?.list || []
  } catch (error) {
    tips.value = []
  }
}

function switchTip(item) {
  const id = item?.id || item?._id
  if (!id || isCurrent(item)) return
  currentId.value = id
  toc.value = []
  uni.pageScrollTo({ scrollTop: 0, duration: 0 })
  loadDetail(id)
}

function measurePage() {
  uni.createSelectorQuery().select('.page').boundingClientRect((rect) => {
    pageHeight.value = rect?.height || 0
  }).exec()
}

onPageScroll((event) => {
  const windowHeight = uni.getSystemInfoSync().windowHeight || 1
  const scrollable = Math.max(pageHeight.value - windowHeight, 1)
  progress.value = Math.max(0, Math.min(100, (event.scrollTop / scrollable) * 100))
})

onLoad(async (query) => {
  currentId.value = query.id || ''
  await loadTips()
  await loadDetail(query.id)
})
</script>

<style scoped>
.page {
  min-height: 100%;
  background: #F7F8FA;
}

.progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 30;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.95);
}

.head {
  padding-bottom: 28rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
}

.nav {
  display: flex;
  align-items: center;
  height: 100rpx;
  padding: 0 28rpx;
}

.back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  font-size: 40rpx;
  line-height: 64rpx;
  text-align: center;
}

.nav-title {
  flex: 1;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  line-height: 100rpx;
  text-align: center;
}

.nav-gap {
  width: 64rpx;
}

.switcher {
  width: 100%;
  white-space: nowrap;
}

.switcher-row {
  display: inline-flex;
  padding: 8rpx 32rpx 20rpx;
}

.sw-chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 60rpx;
  margin-right: 16rpx;
  padding: 0 26rpx;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 30rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  font-weight: 600;
  line-height: 60rpx;
}

.sw-chip.active {
  background: #FFFFFF;
  border-color: #FFFFFF;
  color: #2D6A4F;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.14);
}

.hero {
  position: relative;
  margin: 0 32rpx;
  padding: 28rpx 32rpx 28rpx;
  background: #FFFFFF;
  border-radius: 36rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 88rpx;
  height: 88rpx;
  margin-left: 20rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  box-shadow: 0 12rpx 28rpx rgba(45, 106, 79, 0.32);
  font-size: 42rpx;
  line-height: 88rpx;
  text-align: center;
}

.kicker {
  display: inline-block;
  max-width: 100%;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 32rpx;
}

.hero-title {
  display: block;
  margin-top: 20rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 44rpx;
  font-weight: 800;
  line-height: 60rpx;
}

.hero-desc {
  display: block;
  margin-top: 14rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 26rpx;
  line-height: 1.75;
}

.hero-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.32);
  font-size: 22rpx;
  line-height: 34rpx;
}

.meta-sep {
  margin: 0 12rpx;
  color: #D8DBDF;
}

.article-pad {
  padding: 0 32rpx;
}

.empty {
  padding: 120rpx 32rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 28rpx;
  text-align: center;
}

.toc-fab {
  position: fixed;
  right: 36rpx;
  bottom: 192rpx;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.14);
}

.fab-line {
  width: 28rpx;
  height: 3rpx;
  margin: 4rpx 0;
  background: #2D6A4F;
  border-radius: 2rpx;
}

.fab-line.short {
  width: 18rpx;
  align-self: flex-start;
  margin-left: 26rpx;
}

.actionbar {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: stretch;
  padding: 12rpx;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 52rpx;
  box-shadow: 0 16rpx 56rpx rgba(0, 0, 0, 0.14);
}

.ab-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.55);
}

.ab-item.liked {
  color: #E5484D;
}

.ab-item.faved {
  color: #E8A33D;
}

.ab-ico {
  font-size: 32rpx;
  line-height: 40rpx;
}

.ab-num {
  font-size: 20rpx;
  font-weight: 600;
  line-height: 28rpx;
}

.ab-sep {
  width: 1px;
  margin: 18rpx 0;
  background: rgba(0, 0, 0, 0.08);
}

.ab-main {
  display: flex;
  flex: 1.7;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 28rpx rgba(45, 106, 79, 0.3);
}
</style>
