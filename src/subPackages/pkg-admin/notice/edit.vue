<template>
  <PageLayout title="编辑公告" show-back background-color="#F6F7F2" :footer-height="120">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else class="form">
      <view class="field">
        <text class="label">标题</text>
        <input v-model="form.title" class="input" placeholder="关于 · 今天做什么菜" />
      </view>
      <HtmlBlockEditor v-model="form.contentHtml" title="公告正文" />
    </view>
    <template #footer>
      <view class="footer">
        <button class="btn" :loading="saving" @click="onSave">保存</button>
      </view>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import HtmlBlockEditor from '@/components/HtmlBlockEditor/HtmlBlockEditor.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminNoticeGet, adminNoticeSave } from '@/services/notice'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  title: '关于 · 今天做什么菜',
  contentHtml: ''
})

async function load() {
  loading.value = true
  try {
    const res = await adminNoticeGet()
    if (res.code === 200 && res.data) {
      form.title = res.data.title || '关于 · 今天做什么菜'
      form.contentHtml = res.data.contentHtml || ''
    } else {
      showApiError(res, '加载失败')
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (!String(form.title || '').trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await adminNoticeSave({
      title: form.title.trim(),
      contentHtml: form.contentHtml
    })
    if (res.code === 200) {
      uni.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 500)
    } else {
      showApiError(res, '保存失败')
    }
  } catch (e) {
    showApiError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

onLoad(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.form { padding-bottom: 24rpx; }
.field { margin-bottom: 24rpx; }
.label { display: block; font-size: 24rpx; color: $text-secondary; margin-bottom: 10rpx; }
.input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1F2D2A;
  box-sizing: border-box;
}
.footer {
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
}
.btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  background: #176B4A;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.empty { text-align: center; color: #8A9590; padding: 80rpx; }
</style>
