<template>
  <view class="page-header" :class="{ 'page-header--letter': theme === 'letter' }" :style="headerStyleMerged">
    <view class="page-header__status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view
      class="page-header__content"
      :class="{ 'page-header__content--letter': theme === 'letter' }"
      :style="contentStyle"
    >
      <view class="page-header__left">
        <view v-if="showBack" class="page-header__btn" @click="handleBack">
          <text class="page-header__back-icon" :class="{ dark: theme === 'letter' }">‹</text>
        </view>
        <view v-if="showHome" class="page-header__btn" @click="handleHome">
          <text class="page-header__home-icon" :class="{ dark: theme === 'letter' }">⌂</text>
        </view>
        <slot v-if="hasHeaderLeft" name="header-left" />
      </view>

      <view v-if="theme === 'letter'" class="page-header__letter-main" :style="letterMainStyle">
        <text class="page-header__letter-title">{{ title }}</text>
        <text v-if="subtitle" class="page-header__letter-sub">{{ subtitle }}</text>
      </view>

      <view v-else class="page-header__center" :style="centerStyle">
        <slot v-if="hasHeaderCenter" name="header-center" />
        <text v-else class="page-header__title">{{ title }}</text>
      </view>

      <view class="page-header__right" :style="rightStyle">
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

const headerStyleMerged = computed(() => ({
  background: props.theme === 'letter' ? 'transparent' : '#FF6B35',
  paddingRight: `${capsulePad.value}px`,
  boxSizing: 'border-box',
  color: props.theme === 'letter' ? undefined : '#fff',
  ...props.headerStyle
}))

const contentStyle = computed(() => {
  if (props.theme === 'letter') {
    return {
      minHeight: `${navContentHeight}px`,
      height: 'auto',
      paddingTop: `${navVerticalPadding}px`,
      paddingBottom: '18rpx',
      paddingLeft: '32rpx',
      boxSizing: 'border-box'
    }
  }
  return {
    height: `${navContentHeight}px`,
    paddingLeft: '24rpx',
    boxSizing: 'border-box'
  }
})

const centerStyle = computed(() => ({
  paddingLeft: props.showBack || props.showHome ? '88rpx' : '0',
  paddingRight: hasHeaderRight.value ? '120rpx' : '0'
}))

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
  return {
    height: `${navContentHeight}px`
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
  color: $ink;
}

.page-header__content {
  display: flex;
  align-items: center;
  position: relative;
}

.page-header__left,
.page-header__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.page-header__content--letter {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 16rpx;
}

.page-header__left {
  position: absolute;
  left: 24rpx;
  z-index: 2;
}

.page-header__right {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  max-width: 240rpx;
}

.page-header--letter .page-header__left {
  position: static;
  margin-right: 0;
}

.page-header--letter .page-header__right {
  position: static;
  max-width: 200rpx;
  justify-self: end;
}

.page-header__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.page-header__title {
  font-size: 32rpx;
  font-weight: 600;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header__letter-main {
  flex: 1;
  min-width: 0;
}

.page-header__letter-title {
  display: block;
  font-size: 38rpx;
  line-height: 50rpx;
  font-weight: 850;
  color: $ink;
}

.page-header__letter-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 650;
  color: $muted;
}

.page-header__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: rgba(255, 253, 248, 0.72);
}

.page-header__back-icon {
  font-size: 56rpx;
  line-height: 1;
  color: #fff;
  margin-top: -6rpx;

  &.dark {
    color: $ink;
  }
}

.page-header__home-icon {
  font-size: 40rpx;
  color: #fff;

  &.dark {
    color: $ink;
  }
}
</style>
