<template>
  <PageLayout title="烹饪技巧" show-tab-bar active-tab="tips" background-color="#FFF8F0">
    <view class="tips-page">
      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="!list.length" class="empty">暂无技巧文章</view>
      <view
        v-for="item in list"
        :key="item.id"
        class="article-card"
        @click="goDetail(item)"
      >
        <text class="icon">📖</text>
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="summary">{{ item.summary || '点击查看详情' }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useTabPage } from '@/composables/useTabPage'
import { getTipList } from '@/services/tip'
import { showApiError } from '@/utils/apiError'

useTabPage('tips')

const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getTipList()
    if (res.code === 200) list.value = res.data?.list || []
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function goDetail(item) {
  uni.navigateTo({ url: `/subPackages/pkg-tips/detail/index?id=${item.id}` })
}

onShow(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.tips-page {
  padding-top: 8rpx;
}

.article-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: $shadow-md;
}

.icon {
  font-size: 44rpx;
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.summary {
  display: block;
  font-size: 24rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: $text-light;
}
</style>
