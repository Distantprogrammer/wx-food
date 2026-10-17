<template>
  <PageLayout
    show-tab-bar
    active-tab="tips"
    :show-header="false"
    background-color="#F7F8FA"
    :content-padding-x="0"
    :content-padding-top="0"
  >
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-head">
      <text class="page-title">烹饪技巧</text>
      <text class="page-sub">把火候、刀工和调味记下来</text>
    </view>

    <view class="search-row">
      <view class="search-bar">
        <view class="search-ico" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索技巧标题"
          placeholder-class="ph"
          confirm-type="search"
          @confirm="reload"
        />
      </view>
      <view class="add-btn" hover-class="is-pressed" :hover-stay-time="180" @click="goCreate">＋ 新增</view>
    </view>

    <view class="tips-page">
      <empty-state v-if="!loading && !list.length" title="暂无技巧文章" desc="换个关键词，或记下一条新技巧" />

      <view
        v-if="list.length"
        class="hero"
        hover-class="is-pressed"
        :hover-stay-time="180"
        @click="goDetail(list[0])"
      >
        <text class="hero-no">{{ String(1).padStart(2, '0') }}</text>
        <text class="hero-title">{{ list[0].title }}</text>
        <text class="hero-desc">{{ list[0].summary || '点击查看详情' }}</text>
      </view>

      <view
        v-for="(item, index) in restList"
        :key="item.id"
        class="tip-card"
        hover-class="is-pressed"
        :hover-stay-time="180"
        @click="goDetail(item)"
      >
        <view class="tip-no">
          <text>{{ String(index + 2).padStart(2, '0') }}</text>
        </view>
        <view class="tip-main">
          <text class="tip-title">{{ item.title }}</text>
          <text class="tip-sum">{{ item.summary || '点击查看详情' }}</text>
        </view>
        <view class="chevron" />
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import { useTabPage } from '@/composables/useTabPage'
import { useUserStore } from '@/store/user'
import { getTipList } from '@/services/tip'
import { showApiError } from '@/utils/apiError'
import { getStatusBarHeight } from '@/utils/system'

useTabPage('tips')

const userStore = useUserStore()
const list = ref([])
const loading = ref(false)
const keyword = ref('')
const statusBarHeight = getStatusBarHeight()
const restList = computed(() => list.value.slice(1))

async function load() {
  loading.value = true
  try {
    const res = await getTipList({
      keyword: keyword.value.trim() || undefined
    })
    if (res.code === 200) list.value = res.data?.list || []
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function reload() {
  load()
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/tip-detail/index?id=${item.id || item._id}` })
}

function goCreate() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/tips/edit?pending=1' })
}

onShow(load)
</script>

<style scoped>
.status-spacer {
  width: 100%;
}

.page-head {
  padding: 16rpx 190rpx 32rpx 32rpx;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 0 32rpx;
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

.tips-page {
  padding: 40rpx 32rpx 48rpx;
}

.hero,
.tip-card {
  transition: transform 180ms ease;
}

.hero.is-pressed,
.tip-card.is-pressed {
  transform: scale(0.98);
}

.hero {
  position: relative;
  margin-bottom: 40rpx;
  padding: 48rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background-image: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
  box-shadow: 0 8rpx 32rpx rgba(45, 106, 79, 0.16);
}

.hero-no {
  position: absolute;
  top: 16rpx;
  right: 32rpx;
  color: #D7EBE3;
  font-size: 88rpx;
  font-weight: 800;
  line-height: 1;
}

.hero-title {
  display: block;
  padding-right: 136rpx;
  color: #FFFFFF;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.5;
}

.hero-desc {
  display: -webkit-box;
  margin-top: 16rpx;
  overflow: hidden;
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 88rpx;
  margin-bottom: 40rpx;
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.tip-card:last-child {
  margin-bottom: 0;
}

.tip-no {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 56rpx;
  height: 40rpx;
  padding: 0 8rpx;
  border-radius: 10rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 40rpx;
  box-sizing: border-box;
}

.tip-main {
  flex: 1;
  min-width: 0;
}

.tip-title {
  display: block;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tip-sum {
  display: block;
  overflow: hidden;
  color: #737373;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
