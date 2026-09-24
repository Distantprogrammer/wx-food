<template>
  <view class="page-layout" :style="layoutStyle">
    <PageHeader
      v-if="showHeader"
      :title="title"
      :subtitle="subtitle"
      :theme="headerTheme"
      :show-back="showBack"
      :show-home="showHome"
      :header-style="headerStyle"
    >
      <template v-if="hasHeaderLeft" #header-left>
        <slot name="header-left" />
      </template>
      <template v-if="hasHeaderRight" #header-right>
        <slot name="header-right" />
      </template>
      <template v-if="hasHeaderContent" #header-content>
        <slot name="header-content" />
      </template>
    </PageHeader>

    <scroll-view
      v-if="scrollable"
      class="page-layout__scroll"
      scroll-y
      :style="scrollViewStyle"
      :enable-back-to-top="enableBackToTop"
      :show-scrollbar="showScrollbar"
      :refresher-enabled="refresherEnabled"
      :refresher-triggered="refresherTriggered"
      @scrolltolower="onScrollToLower"
      @refresherrefresh="onRefresherRefresh"
    >
      <view class="page-layout__content" :style="mergedContentStyle">
        <slot />
      </view>
    </scroll-view>

    <view
      v-else
      class="page-layout__static"
      :style="staticContentStyle"
    >
      <view class="page-layout__content" :style="mergedContentStyle">
        <slot />
      </view>
    </view>

    <view v-if="hasFooter" class="page-layout__footer">
      <slot name="footer" />
    </view>

    <CustomTabBar v-if="showTabBar" :active-key="activeTab" />

    <view v-if="hasOverlay" class="page-layout__overlay">
      <slot name="overlay" />
    </view>
  </view>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import PageHeader from './PageHeader.vue'
import CustomTabBar from '@/components/custom-tab-bar/CustomTabBar.vue'
import { getScrollViewStyle, rpx2px } from '@/utils/system'

const slots = useSlots()
const hasHeaderLeft = computed(() => !!slots['header-left'])
const hasHeaderRight = computed(() => !!slots['header-right'])
const hasHeaderContent = computed(() => !!slots['header-content'])
const hasFooter = computed(() => !!slots.footer)
const hasOverlay = computed(() => !!slots.overlay)

const emit = defineEmits(['scrolltolower', 'refresherrefresh'])

function onScrollToLower() {
  emit('scrolltolower')
}

function onRefresherRefresh() {
  emit('refresherrefresh')
}

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  headerTheme: { type: String, default: 'food' },
  showHeader: { type: Boolean, default: true },
  showBack: { type: Boolean, default: false },
  showHome: { type: Boolean, default: false },
  showTabBar: { type: Boolean, default: false },
  activeTab: { type: String, default: 'home' },
  headerStyle: { type: Object, default: () => ({}) },
  backgroundColor: { type: String, default: '#FFF8F0' },
  contentPaddingX: { type: Number, default: 32 },
  extraBottomPadding: { type: Number, default: 40 },
  contentStyle: { type: Object, default: () => ({}) },
  headerContentHeight: { type: Number, default: 0 },
  footerHeight: { type: Number, default: 120 },
  enableBackToTop: { type: Boolean, default: true },
  showScrollbar: { type: Boolean, default: false },
  scrollable: { type: Boolean, default: true },
  refresherEnabled: { type: Boolean, default: false },
  refresherTriggered: { type: Boolean, default: false }
})

const letterHeaderExtra = computed(() => {
  if (!props.showHeader || props.headerTheme !== 'letter') return 0
  return props.subtitle ? 56 : 32
})

const layoutStyle = computed(() => ({
  background: props.backgroundColor,
  height: '100vh',
  overflow: 'hidden'
}))

const scrollViewStyle = computed(() =>
  getScrollViewStyle({
    showHeader: props.showHeader,
    showTabBar: props.showTabBar,
    extraBottomPadding: props.extraBottomPadding,
    headerContentHeight: letterHeaderExtra.value || props.headerContentHeight,
    footerHeight: hasFooter.value ? props.footerHeight : 0
  })
)

const staticContentStyle = computed(() => ({
  ...scrollViewStyle.value,
  overflow: 'hidden'
}))

const mergedContentStyle = computed(() => {
  const base = {
    paddingLeft: `${rpx2px(props.contentPaddingX)}px`,
    paddingRight: `${rpx2px(props.contentPaddingX)}px`,
    ...props.contentStyle
  }
  if (props.extraBottomPadding) {
    base.paddingBottom = `${rpx2px(props.extraBottomPadding)}px`
  }
  return base
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page-layout {
  width: 100%;
  box-sizing: border-box;
  color: $ink;
}

.page-layout__static {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-layout__static > .page-layout__content {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.page-layout__scroll,
.page-layout__static,
.page-layout__content {
  width: 100%;
  box-sizing: border-box;
}

.page-layout__content {
  position: relative;
  z-index: 1;
}

.page-layout__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: $z-index-header;
  box-sizing: border-box;
}

.page-layout__overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1100;
  pointer-events: none;
}
</style>
