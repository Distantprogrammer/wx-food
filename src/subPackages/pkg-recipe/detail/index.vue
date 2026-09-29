<template>
  <PageLayout
    title=""
    show-back
    transparent-header
    background-color="#F6F7F2"
    :footer-height="140"
    :content-padding-x="0"
  >
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!recipe" class="empty">菜谱不存在或尚未通过审核</view>
    <template v-else-if="recipe">
      <view class="cover">
        <image :src="cover" mode="aspectFill" class="cover-img" />
      </view>

      <view class="hero">
        <text class="title">{{ recipe.title }}</text>
        <view class="meta">
          <text class="chip">{{ recipe.difficultyText }}</text>
          <text v-if="recipe.calories" class="chip muted">{{ recipe.calories }}kcal</text>
          <text class="chip muted">喜欢 {{ recipe.likes || 0 }}</text>
          <text class="chip muted">收藏 {{ recipe.favorites || 0 }}</text>
        </view>
      </view>

      <view class="action-bar">
        <view class="action" :class="{ on: status.liked }" @click="onLike">
          <image
            class="action-icon"
            :src="status.liked ? '/static/icons/heart-active.png' : '/static/icons/heart.png'"
            mode="aspectFit"
          />
          <text>{{ status.liked ? '已喜欢' : '喜欢' }}</text>
        </view>
        <view class="action" :class="{ on: status.favorited }" @click="onFavorite">
          <image
            class="action-icon"
            :src="status.favorited ? '/static/icons/star-active.png' : '/static/icons/star.png'"
            mode="aspectFit"
          />
          <text>{{ status.favorited ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="action" :class="{ on: status.cooked }" @click="onCooked">
          <image class="action-icon" src="/static/icons/check.png" mode="aspectFit" />
          <text>{{ status.cooked ? '已做过' : '做过' }}</text>
        </view>
      </view>

      <view class="blocks">
        <view class="card">
          <view class="card-title">菜品介绍</view>
          <text class="desc">{{ recipe.summary || '暂无描述' }}</text>
        </view>

        <view v-if="recipe.ingredientsHtml" class="card">
          <view class="card-title">原料和工具</view>
          <rich-text class="section-html" :nodes="recipe.ingredientsHtml" />
        </view>

        <view v-if="recipe.calculationHtml" class="card">
          <view class="card-title">计算</view>
          <rich-text class="section-html" :nodes="recipe.calculationHtml" />
        </view>

        <view v-if="recipe.stepsHtml" class="card">
          <view class="card-title">步骤</view>
          <rich-text class="section-html" :nodes="recipe.stepsHtml" />
        </view>

        <view v-if="recipe.notesHtml" class="card">
          <view class="card-title">补充说明</view>
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
import { onLoad, onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { getRecipeDetail } from '@/services/recipe'
import { addHistory, getRecipeStatus, toggleLike, toggleFavorite, toggleCooked } from '@/services/userRecipe'
import { getCoverTempUrl } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { prepareRecipeShare } from '@/utils/recipeShare'
import { showApiError } from '@/utils/apiError'

const recipe = ref(null)
const loading = ref(true)
const status = ref({ liked: false, favorited: false, cooked: false })
const recipeId = ref(0)
const cover = ref(getRecipePlaceholder())

function syncShare() {
  if (recipe.value) prepareRecipeShare(recipe.value)
}

async function load(id) {
  loading.value = true
  cover.value = getRecipePlaceholder()
  try {
    const [detail, st] = await Promise.all([
      getRecipeDetail(id),
      getRecipeStatus(id)
    ])
    if (detail.code === 200) {
      recipe.value = detail.data
      const temp = await getCoverTempUrl(detail.data?.coverImage)
      cover.value = temp || getRecipePlaceholder(detail.data?.categorySlug)
      syncShare()
      addHistory(id).catch(() => {})
    } else {
      recipe.value = null
      showApiError(detail, '菜谱不存在或尚未通过审核')
    }
    if (st.code === 200) status.value = st.data
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

// mixin 的 onShow 会先 reset；此处再写回菜品分享配置
onShow(() => {
  syncShare()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.cover {
  position: relative;
  height: 460rpx;
  background: $bg-muted;
}

.cover-img {
  width: 100%;
  height: 100%;
  background: $bg-soft;
}

.hero {
  padding: 28rpx $page-padding-x 8rpx;
  background: $bg-color;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 16rpx;
  word-break: break-word;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.chip {
  padding: 6rpx 14rpx;
  border-radius: $radius-sm;
  font-size: 22rpx;
  font-weight: 600;
  color: $primary-color;
  background: $primary-soft;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.muted {
    color: $text-secondary;
    background: $bg-muted;
    font-weight: 500;
  }
}

.action-bar {
  display: flex;
  margin: 20rpx $page-padding-x;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 8rpx;
  border: 1rpx solid $border-color;
}

.action {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 16rpx 8rpx;
  border-radius: $radius-sm;
  font-size: 22rpx;
  color: $text-secondary;
  transition: background $duration-fast $ease-out, color $duration-fast $ease-out;

  &.on {
    color: $primary-color;
    background: $primary-soft;
    font-weight: 650;
  }
}

.action-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.blocks {
  padding: 0 $page-padding-x 40rpx;
}

.card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $card-padding;
  margin-bottom: 16rpx;
  border: 1rpx solid $border-color;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 14rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid $border-color;
}

.desc {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  word-break: break-word;
}

.section-html {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  word-break: break-word;
}

.bottom-bar {
  padding: 16rpx $page-padding-x calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid $border-color;
  box-shadow: $shadow-md;
}

.cook-btn {
  width: 100%;
  height: $btn-height;
  line-height: $btn-height;
  text-align: center;
  background: $primary-color;
  color: $text-white;
  border-radius: $btn-radius;
  font-size: 30rpx;
  font-weight: 700;

  &:active {
    background: $primary-hover;
  }
}

.empty {
  padding: 120rpx;
  text-align: center;
  color: $text-light;
  font-size: 26rpx;
}
</style>
