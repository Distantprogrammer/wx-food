<template>
  <PageLayout title="技巧详情" show-back background-color="#FFF8F0">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="tip" class="card">
      <text class="title">{{ tip.title }}</text>
      <text v-if="tip.summary" class="summary">{{ tip.summary }}</text>
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

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: $shadow-md;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.summary {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.body {
  font-size: 28rpx;
  color: #444;
  line-height: 1.8;
}

.empty {
  padding: 80rpx;
  text-align: center;
  color: #999;
}
</style>
