<template>
  <view
    class="recipe-card"
    :class="[`is-${variant}`]"
    hover-class="is-pressed"
    :hover-stay-time="120"
    @click="$emit('click', recipe)"
  >
    <view class="cover">
      <image :src="coverSrc" mode="aspectFill" class="cover-img" />
      <view v-if="showBadge" class="badge" :class="diff.key">{{ diff.text }}</view>
    </view>
    <view class="body">
      <text class="name">{{ recipe.title }}</text>
      <view v-if="showMeta" class="meta">
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
  /** default | compact | rail */
  variant: { type: String, default: 'default' },
  showBadge: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true }
})

defineEmits(['click'])

const coverSrc = ref(getRecipePlaceholder())
const diff = computed(() => ({
  key: props.recipe.difficultyKey || getDifficulty(props.recipe.difficulty).key,
  text: props.recipe.difficultyText || getDifficulty(props.recipe.difficulty).text
}))

watch(
  () => [props.recipe?.coverImage, props.recipe?.categorySlug],
  async ([coverImage, categorySlug]) => {
    const temp = await getCoverTempUrl(coverImage)
    coverSrc.value = temp || getRecipePlaceholder(categorySlug)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.recipe-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1rpx solid $border-color;
  transition: opacity $duration-fast $ease-out;

  &.is-pressed {
    opacity: 0.88;
  }
}

.cover {
  position: relative;
  width: 100%;
  height: 220rpx;
  background: $bg-muted;
}

.is-compact .cover {
  height: 180rpx;
}

.is-rail .cover {
  height: 200rpx;
}

.cover-img {
  width: 100%;
  height: 100%;
  background: $bg-soft;
}

.badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 4rpx 14rpx;
  border-radius: $radius-sm;
  font-size: 20rpx;
  font-weight: 600;
  color: $text-primary;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid $border-color;

  &.easy { color: $success-color; }
  &.medium { color: #B8821A; }
  &.hard { color: $accent-tomato; }
}

.body {
  padding: 16rpx 18rpx 18rpx;
  min-height: 108rpx;
  box-sizing: border-box;
}

.is-compact .body {
  padding: 12rpx 14rpx 14rpx;
  min-height: 96rpx;
}

.is-rail .body {
  min-height: 100rpx;
}

.name {
  display: block;
  font-size: 28rpx;
  font-weight: 650;
  color: $text-primary;
  line-height: $line-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8rpx;
}

.is-compact .name {
  font-size: 26rpx;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 16rpx;
  font-size: 22rpx;
  color: $text-light;
  line-height: 1.3;
}
</style>
