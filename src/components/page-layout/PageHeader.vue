<template>
  <view
    class="page-header"
    :class="{
      'page-header--letter': theme === 'letter',
      'page-header--transparent': transparent,
      'page-header--light': isLightSurface
    }"
    :style="headerStyleMerged"
  >
    <view class="page-header__status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view
      class="page-header__content"
      :class="{ 'page-header__content--letter': theme === 'letter' }"
      :style="contentStyle"
    >
      <view class="page-header__side page-header__left">
        <view
          v-if="showBack"
          class="page-header__btn"
          :class="{ 'page-header__btn--frost': transparent || isLightSurface }"
          @click="handleBack"
        >
          <text class="page-header__back-icon" :class="{ dark: useDarkIcons }">‹</text>
        </view>
        <view
          v-if="showHome"
          class="page-header__btn"
          :class="{ 'page-header__btn--frost': transparent || isLightSurface }"
          @click="handleHome"
        >
          <text class="page-header__home-icon" :class="{ dark: useDarkIcons }">⌂</text>
        </view>
        <slot v-if="hasHeaderLeft" name="header-left" />
      </view>

      <view v-if="theme === 'letter'" class="page-header__letter-main" :style="letterMainStyle">
        <text class="page-header__letter-title">{{ title }}</text>
        <text v-if="subtitle" class="page-header__letter-sub">{{ subtitle }}</text>
      </view>

      <view v-else class="page-header__center">
        <slot v-if="hasHeaderCenter" name="header-center" />
        <text v-else-if="title" class="page-header__title">{{ title }}</text>
      </view>

      <view class="page-header__side page-header__right" :style="rightStyle">
        <slot v-if="hasHeaderRight" name="header-right" />
      </view>
    </view>
    <slot v-if="hasHeaderContent" name="header-content" />
  </view>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import {
  getStatusBarHeight,
  getNavContentHeight,
  getNavBarVerticalPadding,
  getCapsuleReservedWidth,
  getMenuButtonRect
} from '@/utils/system'
import { useTabPermission } from '@/composables/useTabPermission'

const slots = useSlots()
const hasHeaderLeft = computed(() => !!slots['header-left'])
const hasHeaderCenter = computed(() => !!slots['header-center'])
const hasHeaderRight = computed(() => !!slots['header-right'])
const hasHeaderContent = computed(() => !!slots['header-content'])

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  theme: { type: String, default: 'food' },
  /** 透明顶栏（详情封面上） */
  transparent: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
  showHome: { type: Boolean, default: false },
  headerStyle: { type: Object, default: () => ({}) }
})

const statusBarHeight = getStatusBarHeight()
const navContentHeight = getNavContentHeight()
const navVerticalPadding = getNavBarVerticalPadding()
const menuButtonHeight = getMenuButtonRect().height
const { switchToDefaultTab } = useTabPermission()

const capsulePad = computed(() => getCapsuleReservedWidth(10))

/** 白底 / letter 标题栏：深色文字与浅色按钮 */
const isLightSurface = computed(() => {
  if (props.theme === 'letter') return true
  if (props.transparent) return false
  const bg = String(props.headerStyle?.background || props.headerStyle?.backgroundColor || '')
  return /#fff|#ffffff|#f6f7f2|#fafafa|white/i.test(bg)
})

const useDarkIcons = computed(() => props.theme === 'letter' || props.transparent || isLightSurface.value)

const headerStyleMerged = computed(() => {
  if (props.transparent) {
    return { background: 'transparent', ...props.headerStyle }
  }
  if (isLightSurface.value) {
    return {
      background: '#FFFFFF',
      color: '#1F2D2A',
      ...props.headerStyle
    }
  }
  return {
    background: '#176B4A',
    color: '#FFFFFF',
    ...props.headerStyle
  }
})

const contentStyle = computed(() => {
  if (props.theme === 'letter') {
    return {
      minHeight: `${navContentHeight}px`,
      height: 'auto',
      paddingTop: `${navVerticalPadding}px`,
      paddingBottom: '18rpx',
      paddingLeft: '24rpx',
      // letter 标题左对齐，右侧仍需避开胶囊
      paddingRight: `${capsulePad.value}px`,
      boxSizing: 'border-box'
    }
  }
  return {
    height: `${navContentHeight}px`,
    paddingLeft: '24rpx',
    boxSizing: 'border-box'
  }
})

const letterMainStyle = computed(() => ({
  paddingRight: hasHeaderRight.value ? '8rpx' : '0'
}))

const rightStyle = computed(() => {
  if (props.theme === 'letter') {
    return {
      minHeight: `${menuButtonHeight}px`,
      alignSelf: 'start'
    }
  }
  // 仅右侧重避胶囊，避免整栏 paddingRight 把绝对居中的 title 挤偏
  return {
    height: `${navContentHeight}px`,
    right: `${capsulePad.value}px`
  }
})

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    switchToDefaultTab()
  }
}

function handleHome() {
  switchToDefaultTab()
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-index-header;
  color: $text-white;
}

.page-header--light,
.page-header--letter {
  color: $text-primary;
}

.page-header--transparent {
  color: $text-primary;
  pointer-events: none;
}

.page-header--transparent .page-header__side,
.page-header--transparent .page-header__btn {
  pointer-events: auto;
}

.page-header__content {
  display: flex;
  align-items: center;
  position: relative;
}

.page-header__side {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 2;
  min-width: 64rpx;
  min-height: 64rpx;
}

.page-header__content--letter {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 16rpx;
}

.page-header__left {
  position: absolute;
  left: 16rpx;
  top: 50%;
  transform: translateY(-50%);
}

.page-header__right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  justify-content: flex-end;
  max-width: 240rpx;
}

.page-header--letter .page-header__left,
.page-header--letter .page-header__right {
  position: static;
  transform: none;
  top: auto;
}

.page-header--letter .page-header__left {
  margin-right: 0;
}

.page-header--letter .page-header__right {
  max-width: 200rpx;
  justify-self: end;
}

.page-header__center {
  position: absolute;
  left: 120rpx;
  right: 120rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  pointer-events: none;
}

.page-header__title {
  font-size: 32rpx;
  font-weight: 650;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  max-width: 100%;
}

.page-header__letter-main {
  flex: 1;
  min-width: 0;
}

.page-header__letter-title {
  display: block;
  font-size: 38rpx;
  line-height: 50rpx;
  font-weight: 750;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header__letter-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 600;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $icon-touch;
  height: $icon-touch;
  flex-shrink: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.12);
}

.page-header__btn--frost {
  border-color: rgba(31, 45, 42, 0.1);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: $shadow-sm;
}

.page-header--letter .page-header__btn {
  border-color: rgba(31, 45, 42, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.page-header__back-icon {
  font-size: 44rpx;
  line-height: 1;
  color: $text-white;
  margin-top: -4rpx;
  flex-shrink: 0;

  &.dark {
    color: $text-primary;
  }
}

.page-header__home-icon {
  font-size: 32rpx;
  line-height: 1;
  color: $text-white;
  flex-shrink: 0;

  &.dark {
    color: $text-primary;
  }
}
</style>
