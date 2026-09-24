<template>
  <view class="recipe-card" @click="$emit('click', recipe)">
    <view class="cover">
      <image v-if="coverSrc" :src="coverSrc" mode="aspectFill" class="cover-img" />
      <view v-else class="cover-placeholder">{{ emoji }}</view>
      <view class="badge" :class="diff.key">{{ diff.text }}</view>
    </view>
    <view class="body">
      <text class="name">{{ recipe.title }}</text>
      <view class="meta">
        <text v-if="recipe.calories">🔥 {{ recipe.calories }}kcal</text>
        <text v-if="recipe.likes">❤️ {{ recipe.likes }}</text>
        <text v-if="recipe.favorites">⭐ {{ recipe.favorites }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getDifficulty, getCoverTempUrl } from '@/utils/index'

const props = defineProps({
  recipe: { type: Object, required: true }
})

defineEmits(['click'])

const coverSrc = ref('')
const diff = computed(() => ({
  key: props.recipe.difficultyKey || getDifficulty(props.recipe.difficulty).key,
  text: props.recipe.difficultyText || getDifficulty(props.recipe.difficulty).text
}))
const emoji = computed(() => {
  const map = { soup: '🍲', meat_dish: '🥩', vegetable_dish: '🥬', staple: '🍚', dessert: '🍰', aquatic: '🐟', breakfast: '🌅', drink: '🥤' }
  return map[props.recipe.categorySlug] || '🍽️'
})

watch(
  () => props.recipe?.coverImage,
  async (val) => {
    coverSrc.value = ''
    coverSrc.value = await getCoverTempUrl(val)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.recipe-card {
  background: #fff;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.cover {
  position: relative;
  height: 220rpx;
}

.cover-img,
.cover-placeholder {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  background: linear-gradient(135deg, #ffe0d0, #ffc9a8);
}

.badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
  color: #fff;
  font-weight: 500;

  &.easy { background: linear-gradient(135deg, #67c23a, #85ce61); }
  &.medium { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
  &.hard { background: linear-gradient(135deg, #f56c6c, #f89898); }
}

.body {
  padding: 20rpx;
}

.name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8rpx;
}

.meta {
  display: flex;
  gap: 20rpx;
  font-size: 22rpx;
  color: $text-light;
}
</style>
