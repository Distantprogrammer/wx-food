<template>
  <PageLayout title="菜谱详情" show-back background-color="#FFF8F0" :footer-height="140" :content-padding-x="0">
    <view v-if="loading" class="empty">加载中...</view>
    <template v-else-if="recipe">
      <view class="cover">
        <image v-if="cover" :src="cover" mode="aspectFill" class="cover-img" />
        <view v-else class="cover-ph">🍽️</view>
        <view class="cover-mask" />
        <view class="cover-info">
          <text class="title">{{ recipe.title }}</text>
          <view class="meta">
            <text>⭐ {{ recipe.difficultyText }}</text>
            <text v-if="recipe.calories">🔥 {{ recipe.calories }}kcal</text>
            <text>❤️ {{ recipe.likes || 0 }}</text>
            <text>⭐ {{ recipe.favorites || 0 }}</text>
          </view>
        </view>
      </view>

      <view class="action-bar">
        <view class="action" :class="{ on: status.liked }" @click="onLike">
          <text>{{ status.liked ? '❤️' : '🤍' }}</text>
          <text>{{ status.liked ? '已喜欢' : '喜欢' }}</text>
        </view>
        <view class="action" :class="{ on: status.favorited }" @click="onFavorite">
          <text>{{ status.favorited ? '⭐' : '☆' }}</text>
          <text>{{ status.favorited ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="action" :class="{ on: status.cooked }" @click="onCooked">
          <text>👨‍🍳</text>
          <text>{{ status.cooked ? '已做过' : '做过' }}</text>
        </view>
      </view>

      <view class="blocks">
        <view class="card">
          <view class="card-title">📝 菜品介绍</view>
          <text class="desc">{{ recipe.summary || '暂无描述' }}</text>
        </view>

        <view v-if="recipe.ingredientsHtml" class="card">
          <view class="card-title">🥬 原料和工具</view>
          <rich-text class="section-html" :nodes="recipe.ingredientsHtml" />
        </view>

        <view v-if="recipe.calculationHtml" class="card">
          <view class="card-title">🧮 计算</view>
          <rich-text class="section-html" :nodes="recipe.calculationHtml" />
        </view>

        <view v-if="recipe.stepsHtml" class="card">
          <view class="card-title">👩‍🍳 步骤</view>
          <rich-text class="section-html" :nodes="recipe.stepsHtml" />
        </view>

        <view v-if="recipe.notesHtml" class="card">
          <view class="card-title">📌 补充说明</view>
          <rich-text class="section-html" :nodes="recipe.notesHtml" />
        </view>
      </view>
    </template>

    <template #footer>
      <view class="bottom-bar">
        <button class="cook-btn" @click="onCooked">
          {{ status.cooked ? '已标记做过' : '开始做菜 / 标记做过' }}
        </button>
      </view>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { getRecipeDetail } from '@/services/recipe'
import { addHistory, getRecipeStatus, toggleLike, toggleFavorite, toggleCooked } from '@/services/userRecipe'
import { getCoverTempUrl } from '@/utils/index'
import { showApiError } from '@/utils/apiError'

const recipe = ref(null)
const loading = ref(true)
const status = ref({ liked: false, favorited: false, cooked: false })
const recipeId = ref(0)
const cover = ref('')

async function load(id) {
  loading.value = true
  cover.value = ''
  try {
    const [detail, st] = await Promise.all([
      getRecipeDetail(id),
      getRecipeStatus(id)
    ])
    if (detail.code === 200) {
      recipe.value = detail.data
      cover.value = await getCoverTempUrl(detail.data?.coverImage)
    }
    if (st.code === 200) status.value = st.data
    addHistory(id).catch(() => {})
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

async function onLike() {
  try {
    const res = await toggleLike(recipeId.value)
    if (res.code === 200) {
      status.value.liked = res.data.active
      if (recipe.value) {
        recipe.value.likes = Math.max((recipe.value.likes || 0) + (res.data.active ? 1 : -1), 0)
      }
    }
  } catch (e) {
    showApiError(e)
  }
}

async function onFavorite() {
  try {
    const res = await toggleFavorite(recipeId.value)
    if (res.code === 200) {
      status.value.favorited = res.data.active
      if (recipe.value) {
        recipe.value.favorites = Math.max((recipe.value.favorites || 0) + (res.data.active ? 1 : -1), 0)
      }
    }
  } catch (e) {
    showApiError(e)
  }
}

async function onCooked() {
  try {
    const res = await toggleCooked(recipeId.value)
    if (res.code === 200) {
      status.value.cooked = res.data.active
      uni.showToast({ title: res.data.active ? '已标记' : '已取消', icon: 'none' })
    }
  } catch (e) {
    showApiError(e)
  }
}

onLoad((q) => {
  recipeId.value = Number(q.id)
  if (recipeId.value) load(recipeId.value)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.cover {
  position: relative;
  height: 420rpx;
}

.cover-img, .cover-ph {
  width: 100%;
  height: 100%;
}

.cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  background: linear-gradient(135deg, #ffe0d0, #ff8c5a);
}

.cover-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65));
}

.cover-info {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  bottom: 32rpx;
  color: #fff;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.meta {
  display: flex;
  gap: 24rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.action-bar {
  display: flex;
  margin: -20rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: $shadow-lg;
  position: relative;
  z-index: 2;
}

.action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: $text-secondary;

  &.on { color: $primary-color; }
}

.blocks { padding: 0 24rpx 40rpx; }

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.desc {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
}

.section-html {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.7;
}

.bottom-bar {
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
}

.cook-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.empty {
  padding: 120rpx;
  text-align: center;
  color: #999;
}
</style>
