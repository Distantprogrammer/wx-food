<template>
  <!-- #ifdef MP-WEIXIN -->
  <root-portal v-if="visible">
  <!-- #endif -->
    <view v-if="visible" class="preview-mask" @click="emitClose">
      <view class="preview-drawer" @click.stop>
        <view class="drawer-handle" />
        <view class="drawer-head">
          <text class="drawer-title">{{ title }}</text>
          <view class="drawer-close" @click="emitClose">
            <text class="drawer-close-x">✕</text>
          </view>
        </view>

        <scroll-view scroll-y class="drawer-body" :show-scrollbar="false">
          <view v-if="!recipe" class="empty-tip">暂无预览内容</view>
          <template v-else>
            <view class="cover">
              <image
                :src="coverSrc"
                mode="aspectFill"
                class="cover-img"
                @error="onCoverError"
              />
            </view>

            <view class="hero">
              <text class="name">{{ recipe.title || '未命名菜谱' }}</text>
              <view class="meta">
                <text class="chip">{{ diffText }}</text>
                <text v-if="recipe.calories" class="chip muted">{{ recipe.calories }}kcal</text>
                <text class="chip muted">喜欢 {{ recipe.likes || 0 }}</text>
                <text class="chip muted">收藏 {{ recipe.favorites || 0 }}</text>
              </view>
            </view>

            <view class="blocks">
              <view class="section">
                <view class="section-title">菜品介绍</view>
                <text class="desc">{{ recipe.summary || '暂无描述' }}</text>
              </view>

              <view v-for="section in htmlSections" :key="section.key" class="section">
                <view class="section-title">{{ section.title }}</view>
                <view v-for="block in section.blocks" :key="block.id" class="html-block">
                  <text v-if="block.type === 'h3'" class="html-h3">{{ block.text }}</text>
                  <text v-else-if="block.type === 'p'" class="html-p">{{ block.text }}</text>
                  <view v-else class="html-list">
                    <view
                      v-for="(item, ii) in (block.items || [])"
                      :key="`${block.id}_${ii}`"
                      class="html-li"
                    >
                      <text class="html-bullet">{{ block.type === 'ol' ? `${ii + 1}.` : '•' }}</text>
                      <text class="html-li-text">{{ item }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </scroll-view>
      </view>
    </view>
  <!-- #ifdef MP-WEIXIN -->
  </root-portal>
  <!-- #endif -->
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getDifficulty, getCoverTempUrl } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { parseHtmlToBlocks, isEmptyBlock } from '@/utils/htmlBlocks'

const props = defineProps({
  visible: { type: Boolean, default: false },
  recipe: { type: Object, default: null },
  coverUrl: { type: String, default: '' },
  title: { type: String, default: '预览菜谱' }
})

const emit = defineEmits(['close'])

const coverSrc = ref(getRecipePlaceholder())

const SECTION_DEFS = [
  { key: 'ingredients', title: '原料和工具', field: 'ingredientsHtml' },
  { key: 'calculation', title: '计算', field: 'calculationHtml' },
  { key: 'steps', title: '步骤', field: 'stepsHtml' },
  { key: 'notes', title: '补充说明', field: 'notesHtml' }
]

const diffText = computed(() => {
  const r = props.recipe || {}
  return r.difficultyText || getDifficulty(r.difficulty).text
})

const htmlSections = computed(() => {
  const recipe = props.recipe || {}
  return SECTION_DEFS.map((def) => {
    const html = String(recipe[def.field] || '')
    const blocks = parseHtmlToBlocks(html).filter((b) => !isEmptyBlock(b))
    return {
      key: def.key,
      title: def.title,
      blocks
    }
  }).filter((s) => s.blocks.length)
})

watch(
  () => [props.visible, props.coverUrl, props.recipe?.coverImage, props.recipe?.categorySlug],
  async ([visible, coverUrl, coverImage, categorySlug]) => {
    if (!visible) return
    if (coverUrl) {
      coverSrc.value = coverUrl
      return
    }
    const temp = await getCoverTempUrl(coverImage)
    coverSrc.value = temp || getRecipePlaceholder(categorySlug)
  },
  { immediate: true }
)

function onCoverError() {
  coverSrc.value = getRecipePlaceholder(props.recipe?.categorySlug)
}

function emitClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.preview-mask {
  position: fixed;
  inset: 0;
  z-index: $drawer-z;
  background: $mask-scrim;
  display: flex;
  align-items: flex-end;
  pointer-events: auto;
}

.preview-drawer {
  width: 100%;
  height: 88vh;
  background: $bg-color;
  border-radius: $radius-lg $radius-lg 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: $shadow-lg;
}

.drawer-handle {
  @include sheet-handle;
  flex-shrink: 0;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 88rpx;
  padding: 8rpx 28rpx 16rpx;
  background: $bg-card;
  border-bottom: 1rpx solid $border-color;
  flex-shrink: 0;
  box-sizing: border-box;
}

.drawer-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  @include ellipsis(1);
}

.drawer-close {
  width: $icon-touch;
  height: $icon-touch;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $bg-muted;
  flex-shrink: 0;
  @include pressed;
}

.drawer-close-x {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1;
}

.drawer-body {
  flex: 1;
  height: 0;
}

.cover {
  height: 360rpx;
  background: $bg-muted;
}

.cover-img {
  width: 100%;
  height: 100%;
  background: $bg-soft;
}

.hero {
  padding: 24rpx $page-padding-x 8rpx;
}

.name {
  display: block;
  font-size: 36rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 14rpx;
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

  &.muted {
    color: $text-secondary;
    background: $bg-muted;
    font-weight: 500;
  }
}

.blocks {
  padding: 16rpx $page-padding-x calc(40rpx + env(safe-area-inset-bottom));
}

.section {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 14rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid $border-color;
}

.desc {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  word-break: break-word;
}

.html-block {
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.html-h3 {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  margin-bottom: 8rpx;
}

.html-p {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  white-space: pre-wrap;
  word-break: break-word;
}

.html-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.html-li {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.html-bullet {
  width: 40rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: $text-light;
  line-height: $line-loose;
  text-align: center;
}

.html-li-text {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: $line-loose;
  word-break: break-word;
}

.empty-tip {
  padding: 120rpx 32rpx;
  text-align: center;
  color: $text-light;
  font-size: 26rpx;
}
</style>
