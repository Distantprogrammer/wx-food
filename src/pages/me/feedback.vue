<template>
  <PageLayout title="意见反馈" show-back background-color="#F6F7F2">
    <WriteForm
      :author-name="authorName"
      :submitting="submitting"
      @submit="onSubmit"
    />
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import WriteForm from '@/components/WriteForm/WriteForm.vue'
import { useUserStore } from '@/store/user'
import { submitFeedback } from '@/services/feedback'
import { showApiError } from '@/utils/apiError'

const userStore = useUserStore()
const authorName = computed(() => userStore.userInfo?.nickname || '美食家')
const submitting = ref(false)

async function onSubmit({ contact, content }) {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await submitFeedback({ contact, content })
    if (res.code === 200) {
      uni.showToast({ title: '已提交', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 500)
    } else {
      showApiError(res, '提交失败')
    }
  } catch (e) {
    showApiError(e, '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>
