<template>
  <PageLayout title="导入种子数据" show-back background-color="#F6F7F2">
    <view class="card">
      <text class="title">批量导入说明</text>
      <text class="desc">将把本地种子（菜谱 / 技巧 / 分类）写入云数据库。导入的菜谱与技巧会自动标记为「已通过」，创建人为当前操作人。空库可首次导入；已有数据时仅管理员可更新覆盖。</text>
      <text class="progress">{{ progress || '等待开始…' }}</text>
      <button class="btn" :disabled="running" @click="onImport">
        {{ running ? '导入中…' : '开始导入/更新' }}
      </button>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { safeRunSeedImport } from '@/utils/seed'

useAdminGuard()

const running = ref(false)
const progress = ref('')

async function onImport() {
  if (running.value) return
  running.value = true
  progress.value = '准备中…'
  try {
    await safeRunSeedImport({
      onProgress: (msg) => {
        progress.value = msg
      }
    })
    progress.value = '导入完成'
  } finally {
    running.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: $shadow-sm;
}

.title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 28rpx;
}

.progress {
  display: block;
  font-size: 24rpx;
  color: $primary-color;
  margin-bottom: 24rpx;
  min-height: 36rpx;
}

.btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  background: #176B4A;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  &[disabled] { opacity: 0.6; }
}
</style>
