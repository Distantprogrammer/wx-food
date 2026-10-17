<template>
  <PageLayout
    title="新增菜谱"
    show-back
    background-color="#F7F8FA"
    :header-style="headStyle"
    :content-padding-x="32"
    :content-padding-top="28"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <submission-board
      hero-icon="🍣"
      hero-title="提交新菜谱"
      hero-desc="填写后进入审核，通过后展示给大家"
      :items="rows"
      @create="goCreate"
      @open="onOpen"
      @remove="onDelete"
    />
    <view v-if="hasMore" class="more">上拉加载更多</view>
  </PageLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import SubmissionBoard from '@/components/submission-board/submission-board.vue'
import { getMyCreatedRecipes, deleteMyRecipe } from '@/services/recipe'
import { useUserStore } from '@/store/user'
import { showApiError } from '@/utils/apiError'
import { auditLabel, auditTone, foodMark, formatShortTime } from '@/utils/submissionView'

const headStyle = { background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)' }
const userStore = useUserStore()
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)

const rows = computed(() => list.value.map((item) => {
  const mark = foodMark(item.categoryName)
  const tone = auditTone(item.auditStatus)
  return {
    id: item.id,
    title: item.title || '未命名菜谱',
    meta: `${item.categoryName || '未分类'} · ${item.difficultyText || '家常'}`,
    tone,
    statusText: auditLabel(item.auditStatus),
    date: formatShortTime(item.createTime),
    icon: mark.icon,
    tint: mark.tint,
    reason: tone === 'no' ? (item.rejectReason || '请根据审核意见修改后重新提交') : '',
    raw: item
  }
}))

async function load(reset = false, silent) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await getMyCreatedRecipes(
      { page: page.value, limit: 20 },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      const next = res.data?.list || []
      list.value = reset ? next : list.value.concat(next)
      hasMore.value = !!res.data?.hasMore
    } else {
      showApiError(res, '加载失败')
    }
  } catch (error) {
    if (!reset && page.value > 1) page.value -= 1
    showApiError(error, '加载失败')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  load(false, true)
}

async function onRefresh() {
  refreshing.value = true
  await load(true, true)
  refreshing.value = false
}

function goCreate() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/recipes/edit?pending=1' })
}

function onOpen(row) {
  const item = row.raw
  if (!item?.id) return
  if (item.auditStatus === 'approved') {
    uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${item.id}` })
    return
  }
  uni.navigateTo({ url: `/subPackages/pkg-admin/recipes/edit?id=${item.id}&owner=1` })
}

function onDelete(row) {
  const item = row.raw
  if (!item?.id || item.auditStatus === 'approved') return
  uni.showModal({
    title: '删除菜谱',
    content: `确认删除「${item.title || '未命名菜谱'}」？`,
    success: async (result) => {
      if (!result.confirm) return
      try {
        const res = await deleteMyRecipe(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success' })
          load(true, true)
        } else {
          showApiError(res, '删除失败')
        }
      } catch (error) {
        showApiError(error, '删除失败')
      }
    }
  })
}

onShow(() => load(true))
</script>

<style scoped>
.more {
  padding: 24rpx 0 8rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 24rpx;
  text-align: center;
}
</style>
