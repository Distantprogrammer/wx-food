<template>
  <view
    class="recipe-card"
    :class="[`is-${variant}`]"
    hover-class="is-pressed"
    :hover-stay-time="180"
    @click="$emit('click', recipe)"
  >
    <view class="cover">
      <image :src="coverSrc" mode="aspectFill" class="cover-img" />
      <view v-if="showBadge" class="badge" :class="diff.key">{{ diff.text }}</view>
    </view>
    <view class="body">
      <text class="name">{{ recipe.title }}</text>
      <view v-if="showMeta && metaMode === 'favorites'" class="meta">
        <view class="diff">
          <view class="dot" :class="diff.key" />
          <text class="diff-text" :class="diff.key">{{ diff.text }}</text>
        </view>
        <text class="fav">♡ {{ recipe.favorites || 0 }}</text>
      </view>
      <view v-else-if="showMeta && metaMode === 'calories'" class="meta">
        <view class="diff">
          <view class="dot" :class="diff.key" />
          <text class="diff-text" :class="diff.key">{{ diff.text }}</text>
        </view>
        <text v-if="recipe.calories" class="kcal">{{ recipe.calories }} kcal</text>
      </view>
      <view v-else-if="showMeta" class="meta meta-legacy">
        <text v-if="recipe.difficultyText || recipe.difficulty">{{ diff.text }}</text>
        <text v-if="recipe.calories">{{ recipe.calories }}kcal</text>
        <text v-if="recipe.likes">喜欢 {{ recipe.likes }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getDifficulty, getCoverTempUrl } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'

const props = defineProps({
  recipe: { type: Object, required: true },
  /** default | compact | rail | tile | spotlight */
  variant: { type: String, default: 'default' },
  showBadge: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true },
  /** legacy | calories | favorites */
  metaMode: { type: String, default: 'legacy' },
  cover: { type: String, default: '' }
})

defineEmits(['click'])

const coverSrc = ref(getRecipePlaceholder())
const diff = computed(() => ({
  key: props.recipe.difficultyKey || getDifficulty(props.recipe.difficulty).key,
  text: props.recipe.difficultyText || getDifficulty(props.recipe.difficulty).text
}))
watch(
  () => [props.cover, props.recipe?.coverImage, props.recipe?.categorySlug],
  async ([cover, coverImage, categorySlug]) => {
    if (cover) {
      coverSrc.value = cover
      return
    }
    const temp = await getCoverTempUrl(coverImage)
    coverSrc.value = temp || getRecipePlaceholder(categorySlug)
  },
  { immediate: true }
)
</script>

<style scoped>
.recipe-card {
  width: 100%;
  min-width: 0;
  background: #FFFFFF;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: transform 180ms ease;
}

.recipe-card.is-pressed {
  transform: scale(0.98);
}

.cover {
  position: relative;
  width: 100%;
  height: 320rpx;
  overflow: hidden;
  background: #f7f8fa;
}

.is-compact .cover {
  height: 180rpx;
}

.is-rail .cover,
.is-tile .cover {
  height: 200rpx;
}

.is-spotlight .cover {
  height: 280rpx;
}

.cover-img {
  width: 100%;
  height: 320rpx;
  display: block;
}

.is-compact .cover-img {
  height: 180rpx;
}

.is-rail .cover-img,
.is-tile .cover-img {
  height: 200rpx;
}

.is-spotlight .cover-img {
  height: 280rpx;
}

.is-tile {
  border-radius: 24rpx;
}

.badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: #FFFFFF;
  color: #1A1A1A;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.5;
}

.badge.easy {
  color: #52C41A;
}

.badge.medium {
  color: #FAAD14;
}

.badge.hard {
  color: #F5222D;
}

.body {
  padding: 12rpx 20rpx 16rpx;
  box-sizing: border-box;
}

.name {
  display: -webkit-box;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.is-compact .name,
.is-rail .name,
.is-tile .name,
.is-spotlight .name {
  display: block;
  min-height: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.is-tile .body {
  padding: 12rpx 16rpx 16rpx;
}

.meta-legacy {
  flex-wrap: wrap;
  justify-content: flex-start;
  color: #737373;
  font-size: 22rpx;
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  min-width: 0;
  margin-top: 8rpx;
}

.diff {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
  flex: 1;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  flex-shrink: 0;
  border-radius: 999rpx;
  background: #B3B3B3;
}

.dot.easy {
  background: #2E9E4F;
}

.dot.medium {
  background: #E6A23C;
}

.dot.hard {
  background: #E24B4B;
}

.diff-text,
.fav,
.kcal {
  color: #737373;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 1.5;
}

.diff-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.diff-text.easy {
  color: #2E9E4F;
}

.diff-text.medium {
  color: #C47E10;
}

.diff-text.hard {
  color: #E24B4B;
}

.fav,
.kcal {
  flex-shrink: 0;
}

.kcal {
  padding: 4rpx 12rpx;
  background: #F7F8FA;
  border-radius: 8rpx;
}
</style>
