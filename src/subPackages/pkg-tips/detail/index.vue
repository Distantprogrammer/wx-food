<template>
  <PageLayout title="技巧详情" show-back background-color="#F6F7F2" :content-padding-x="32">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="tip" class="article">
      <text class="title">{{ tip.title }}</text>
      <text v-if="tip.summary" class="summary">{{ tip.summary }}</text>
      <view class="divider" />
      <rich-text class="body" :nodes="tip.markdownHtml" />
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { getTipDetail } from '@/services/tip'
import { showApiError } from '@/utils/apiError'

const tip = ref(null)
const loading = ref(true)

onLoad(async (q) => {
  loading.value = true
  try {
    const res = await getTipDetail(Number(q.id))
    if (res.code === 200) tip.value = res.data
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.article {
  padding: 8rpx 0 48rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 16rpx;
  word-break: break-word;
}

.summary {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  margin-bottom: 8rpx;
  word-break: break-word;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 28rpx 0;
}

.body {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  line-height: 1.85;
  word-break: break-word;
}

.empty {
  padding: 80rpx;
  text-align: center;
  color: $text-light;
  font-size: 26rpx;
}
</style>
