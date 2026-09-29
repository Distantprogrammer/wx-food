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
          <view v-if="!tip" class="empty-tip">暂无预览内容</view>
          <template v-else>
            <view class="hero">
              <text class="name">{{ tip.title || '未命名技巧' }}</text>
              <AuditStatusTag
                v-if="tip.auditStatus === 'pending' || tip.auditStatus === 'rejected' || tip.auditStatus === 'approved'"
                :status="tip.auditStatus"
              />
            </view>

            <view class="blocks">
              <view class="section">
                <view class="section-title">摘要</view>
                <text class="desc">{{ tip.summary || '暂无摘要' }}</text>
              </view>

              <view class="section">
                <view class="section-title">正文</view>
                <view v-if="!bodyBlocks.length" class="desc">暂无正文</view>
                <view v-for="block in bodyBlocks" :key="block.id" class="html-block">
                  <text v-if="block.type === 'h3'" class="html-h3">{{ block.text }}</text>
                  <text v-else-if="block.type === 'p'" class="html-p">{{ block.text }}</text>
                  <view v-else class="html-list">
                    <view
                      v-for="(li, ii) in (block.items || [])"
                      :key="`${block.id}_${ii}`"
                      class="html-li"
                    >
                      <text class="html-bullet">{{ block.type === 'ol' ? `${ii + 1}.` : '•' }}</text>
                      <text class="html-li-text">{{ li }}</text>
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
import { computed } from 'vue'
import { parseHtmlToBlocks, isEmptyBlock } from '@/utils/htmlBlocks'
import AuditStatusTag from '@/components/AuditStatusTag/AuditStatusTag.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  tip: { type: Object, default: null },
  title: { type: String, default: '预览技巧' }
})

const emit = defineEmits(['close'])

const bodyBlocks = computed(() => {
  const html = props.tip?.markdownHtml || ''
  return parseHtmlToBlocks(html).filter((b) => !isEmptyBlock(b))
})

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

.hero {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 24rpx $page-padding-x 8rpx;
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 36rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: $line-tight;
  word-break: break-word;
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
  white-space: pre-wrap;
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
  margin-bottom: 8rpx;
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
