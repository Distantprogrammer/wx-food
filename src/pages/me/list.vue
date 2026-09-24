<template>
  <PageLayout :title="title" show-back background-color="#FFF8F0">
    <view v-if="loading && !list.length" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无数据</view>
    <view v-for="item in list" :key="item.id" class="item">
      <RecipeCard :recipe="item" @click="goDetail" />
    </view>
    <view v-if="hasMore" class="more" @click="loadMore">加载更多</view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import { getUserRecipeList } from '@/services/userRecipe'
import { showApiError } from '@/utils/apiError'

const type = ref('favorites')
const title = ref('我的菜谱')
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)

async function load(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
    list.value = []
  }
  try {
    const res = await getUserRecipeList(type.value, page.value, 20)
    if (res.code === 200) {
      const rows = res.data?.list || []
      list.value = reset ? rows : list.value.concat(rows)
      hasMore.value = !!res.data?.hasMore
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value) return
  page.value += 1
  load()
}

function goDetail(recipe) {
  uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${recipe.id}` })
}

onLoad((query) => {
  type.value = query.type || 'favorites'
  title.value = decodeURIComponent(query.title || '我的菜谱')
  load(true)
})
</script>

<style lang="scss" scoped>
.item { margin-bottom: 24rpx; }
.empty, .more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
