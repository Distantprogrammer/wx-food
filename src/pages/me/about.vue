<template>
  <PageLayout :title="notice.title || '公告'" show-back background-color="#FFF8F0">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else class="card">
      <text class="title">{{ notice.title || '关于 · 今天做什么菜' }}</text>
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
  margin-bottom: 24rpx;
  color: $text-primary;
}

.body {
  font-size: 28rpx;
  color: #444;
  line-height: 1.8;
}

.empty,
.empty-inner {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>
