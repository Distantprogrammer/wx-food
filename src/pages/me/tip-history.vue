<template>
  <PageLayout
    title="新增技巧"
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
      hero-icon="📖"
      hero-title="提交新技巧"
      hero-desc="分享厨房经验，审核通过后全员可见"
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
import { getMyCreatedTips, deleteMyTip } from '@/services/tip'
import { useUserStore } from '@/store/user'
import { showApiError } from '@/utils/apiError'
import { auditLabel, auditTone, formatShortTime } from '@/utils/submissionView'

const headStyle = { background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)' }
const userStore = useUserStore()
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)

const TIP_TONES = [
  { test: /洗|碗/, icon: '🧽', tint: '#E8F0FF' },
  { test: /安全|毒/, icon: '⚠️', tint: '#FFF8DC' },
  { test: /蒸/, icon: '♨️', tint: '#FDECEC' },
  { test: /炸|空气/, icon: '🌀', tint: '#F3E8FF' },
  { test: /腌/, icon: '🥩', tint: '#FDECEC' },
  { test: /米|炖|煮/, icon: '🍚', tint: '#FFF3E0' }
]

function tipMark(title) {
  const found = TIP_TONES.find((item) => item.test.test(title || ''))
  return found || { icon: '📖', tint: '#E8F0FF' }
}

const rows = computed(() => list.value.map((item) => {
  const mark = tipMark(item.title)
  const tone = auditTone(item.auditStatus)
  return {
    id: item.id,
    title: item.title || '未命名技巧',
    meta: item.summary || '暂无摘要',
    tone,
    statusText: auditLabel(item.auditStatus),
    date: formatShortTime(item.createTime),
    icon: mark.icon,
    tint: mark.tint,
    reason: tone === 'no' ? (item.rejectReason || '与已有技巧内容重复，建议合并补充后再提交') : '',
    raw: item
  }
}))

async function load(reset = false, silent) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await getMyCreatedTips(
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
  uni.navigateTo({ url: '/subPackages/pkg-admin/tips/edit?pending=1' })
}

function onOpen(row) {
  const item = row.raw
  if (!item?.id) return
  if (item.auditStatus === 'approved') {
    uni.navigateTo({ url: `/pages/tip-detail/index?id=${item.id}` })
    return
  }
  uni.navigateTo({ url: `/subPackages/pkg-admin/tips/edit?id=${item.id}&owner=1` })
}

function onDelete(row) {
  const item = row.raw
  if (!item?.id || item.auditStatus === 'approved') return
  uni.showModal({
    title: '删除技巧',
    content: `确认删除「${item.title || '未命名技巧'}」？`,
    success: async (result) => {
      if (!result.confirm) return
      try {
        const res = await deleteMyTip(item.id)
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
