<template>
  <PageLayout :title="notice.title || '公告'" show-back background-color="#F6F7F2">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else class="article">
      <text class="title">{{ notice.title || '关于 · 今天做什么菜' }}</text>
      <view class="divider" />
      <rich-text v-if="notice.contentHtml" class="body" :nodes="notice.contentHtml" />
      <view v-else class="empty-inner">暂无公告内容</view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { getNotice } from '@/services/notice'
import { showApiError } from '@/utils/apiError'

const loading = ref(true)
const notice = ref({ title: '', contentHtml: '' })

async function load() {
  loading.value = true
  try {
    const res = await getNotice()
    if (res.code === 200 && res.data) {
      notice.value = {
        title: res.data.title || '关于 · 今天做什么菜',
        contentHtml: res.data.contentHtml || ''
      }
    } else {
      showApiError(res, '加载失败')
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

onShow(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.article {
  padding: 8rpx 0 48rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: $line-tight;
  word-break: break-word;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 28rpx 0;
}

.body {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  line-height: 1.85;
  word-break: break-word;
}

.empty,
.empty-inner {
  padding: 80rpx 32rpx;
  text-align: center;
  color: $text-light;
  font-size: 26rpx;
}
</style>
