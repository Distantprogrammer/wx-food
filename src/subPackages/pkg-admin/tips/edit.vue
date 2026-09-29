<template>
  <PageLayout
    :title="form.tipId ? '编辑技巧' : (form.auditStatus === 'pending' ? '新增技巧（待审）' : '新增技巧')"
    show-back
    background-color="#F6F7F2"
    :footer-height="120"
  >
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else class="form">
      <view class="field">
        <text class="label">标题 *</text>
        <input v-model="form.title" class="input" placeholder="技巧标题" />
      </view>
      <view class="field">
        <text class="label">摘要</text>
        <textarea v-model="form.summary" class="textarea" auto-height placeholder="简短摘要" />
      </view>
      <HtmlBlockEditor v-model="form.markdownHtml" title="正文" />
    </view>
    <template #footer>
      <view class="footer">
        <button class="btn ghost" @click="openPreview">预览</button>
        <button class="btn" :loading="saving" @click="onSave">保存</button>
      </view>
    </template>

    <TipPreviewDrawer
      :visible="previewVisible"
      :tip="previewTip"
      @close="previewVisible = false"
    />
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import HtmlBlockEditor from '@/components/HtmlBlockEditor/HtmlBlockEditor.vue'
import TipPreviewDrawer from '@/components/TipPreviewDrawer/TipPreviewDrawer.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminTipDetail, adminTipSave } from '@/services/admin'
import { showApiError } from '@/utils/apiError'

const allowUserSubmit = ref(false)
useAdminGuard({ allowUserSubmit: () => allowUserSubmit.value })

const loading = ref(false)
const saving = ref(false)
const previewVisible = ref(false)
const form = reactive({
  tipId: null,
  title: '',
  summary: '',
  markdownHtml: '',
  auditStatus: 'approved'
})

const previewTip = computed(() => ({
  title: form.title,
  summary: form.summary,
  markdownHtml: form.markdownHtml,
  auditStatus: form.auditStatus
}))

function openPreview() {
  previewVisible.value = true
}

async function loadDetail(id) {
  loading.value = true
  try {
    const res = await adminTipDetail(id)
    if (res.code !== 200 || !res.data) {
      showApiError(res, '加载失败')
      return
    }
    form.tipId = res.data.id
    form.title = res.data.title || ''
    form.summary = res.data.summary || ''
    form.markdownHtml = res.data.markdownHtml || ''
    form.auditStatus = res.data.auditStatus || 'approved'
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
    const res = await adminTipSave({ ...form })
    if (res.code === 200) {
      uni.showToast({
        title: form.auditStatus === 'pending' ? '已提交审核' : '已保存',
        icon: 'success'
      })
      setTimeout(() => uni.navigateBack(), 500)
    } else showApiError(res, '保存失败')
  } catch (e) {
    showApiError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

onLoad(async (q) => {
  if ((q.pending === '1' || q.owner === '1') && (!q.id || q.owner === '1')) {
    allowUserSubmit.value = true
  }
  if (q.pending === '1' && !q.id) {
    form.auditStatus = 'pending'
  }
  if (q.id) {
    await loadDetail(Number(q.id))
    if (allowUserSubmit.value) {
      form.auditStatus = 'pending'
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
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
.textarea {
  width: 100%;
  min-height: 140rpx;
  padding: 20rpx 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1F2D2A;
  box-sizing: border-box;
}
.footer {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #E5E9E3;
}
.btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  background: #176B4A;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;

  &.ghost {
    flex: 0 0 200rpx;
    background: #EEF1EB;
    color: #1F2D2A;
    border: 1rpx solid #E5E9E3;
  }
}
.empty { text-align: center; color: #8A9590; padding: 80rpx; }
</style>
