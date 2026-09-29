<template>
  <PageLayout
    title="烹饪技巧"
    show-tab-bar
    active-tab="tips"
    background-color="#F6F7F2"
    :header-style="{ background: '#FFFFFF', color: '#1F2D2A', borderBottom: '1rpx solid #E5E9E3' }"
    :header-content-height="88"
  >
    <template #header-content>
      <view class="search-wrap">
        <view class="search-row">
          <view class="search-bar">
            <image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
            <input
              v-model="keyword"
              class="search-input"
              placeholder="搜索技巧标题"
              placeholder-class="search-ph"
              confirm-type="search"
              @confirm="reload"
            />
          </view>
          <view class="add-btn" @click="goCreate">新增</view>
        </view>
      </view>
    </template>

    <view class="tips-page">
      <view v-if="!loading && !list.length" class="empty">暂无技巧文章</view>
      <view
        v-for="(item, index) in list"
        :key="item.id"
        class="article-row"
        hover-class="article-row--pressed"
        :hover-stay-time="120"
        @click="goDetail(item)"
      >
        <view class="index-block">
          <text class="index-num">{{ String(index + 1).padStart(2, '0') }}</text>
        </view>
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="summary">{{ item.summary || '点击查看详情' }}</text>
        </view>
        <image class="arrow" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useTabPage } from '@/composables/useTabPage'
import { useUserStore } from '@/store/user'
import { getTipList } from '@/services/tip'
import { showApiError } from '@/utils/apiError'

useTabPage('tips')

const userStore = useUserStore()
const list = ref([])
const loading = ref(false)
const keyword = ref('')

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
  uni.navigateTo({ url: `/subPackages/pkg-tips/detail/index?id=${item.id}` })
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

.tips-page {
  padding-top: 4rpx;
}

.article-row {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 14rpx;
  background: $bg-card;
  border-radius: $radius-md;
  border: 1rpx solid $border-color;
}

.article-row--pressed {
  opacity: 0.92;
  background: $bg-muted;
}

.index-block {
  width: 56rpx;
  flex-shrink: 0;
  padding-top: 4rpx;
}

.index-num {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: $primary-color;
  letter-spacing: 1rpx;
  line-height: 1.2;
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 30rpx;
  font-weight: 650;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.summary {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: $line-base;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.arrow {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  margin-top: 8rpx;
  opacity: 0.55;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: $text-light;
  font-size: 26rpx;
}
</style>
