<template>
  <view class="page-layout" :style="layoutStyle">
    <PageHeader
      v-if="showHeader"
      :title="title"
      :subtitle="subtitle"
      :theme="headerTheme"
      :transparent="transparentHeader"
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

    <!-- 可滚动：外层 scroll-view -->
    <scroll-view
      v-if="enableScroll"
      class="page-layout__scroll"
      scroll-y
      :style="bodyStyle"
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

    <!-- 不可滚动：固定高度容器，供内部自行 scroll-view / flex（避免嵌套滚动与 iOS 百分比高度失效） -->
    <view v-else class="page-layout__body" :style="bodyStyle">
      <view class="page-layout__content page-layout__content--fill" :style="mergedContentStyle">
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
import { computed, onMounted, ref, useSlots } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageHeader from './PageHeader.vue'
import CustomTabBar from '@/components/custom-tab-bar/CustomTabBar.vue'
import { getScrollViewStyle, getWindowHeight, resetSystemInfo, rpx2px } from '@/utils/system'

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
  /** 透明顶栏，用于封面图上的详情页 */
  transparentHeader: { type: Boolean, default: false },
  backgroundColor: { type: String, default: '#F6F7F2' },
  contentPaddingX: { type: Number, default: 32 },
  extraBottomPadding: { type: Number, default: 40 },
  contentStyle: { type: Object, default: () => ({}) },
  headerContentHeight: { type: Number, default: 0 },
  footerHeight: { type: Number, default: 120 },
  enableBackToTop: { type: Boolean, default: true },
  contentPaddingTop: { type: Number, default: 20 },
  showScrollbar: { type: Boolean, default: false },
  /** 为 false 时外层不用 scroll-view，适合内部自管滚动/底部固定布局 */
  enableScroll: { type: Boolean, default: true },
  /** @deprecated 请使用 enableScroll；保留兼容旧写法 */
  scrollable: { type: Boolean, default: undefined },
  refresherEnabled: { type: Boolean, default: false },
  refresherTriggered: { type: Boolean, default: false }
})

const enableScroll = computed(() =>
  props.scrollable === undefined ? props.enableScroll : props.scrollable
)

const letterHeaderExtra = computed(() => {
  if (!props.showHeader || props.headerTheme !== 'letter') return 0
  return props.subtitle ? 56 : 32
})

/** 响应式视口高度：避免启动瞬间错误 windowHeight 被写死 */
const viewportHeight = ref(getWindowHeight())

function refreshViewport() {
  resetSystemInfo()
  viewportHeight.value = getWindowHeight()
}

onMounted(() => {
  refreshViewport()
  setTimeout(refreshViewport, 50)
})

onShow(() => {
  refreshViewport()
})

const layoutStyle = computed(() => ({
  background: props.backgroundColor,
  height: `${viewportHeight.value}px`,
  overflow: 'hidden'
}))

const bodyStyle = computed(() =>
  getScrollViewStyle({
    // 透明顶栏时内容从屏幕顶部开始，封面可铺满并被返回按钮叠在上方
    showHeader: props.showHeader && !props.transparentHeader,
    showTabBar: props.showTabBar,
    // 高度已在容器扣除 footer；内容区再用 padding 留白，避免双倍扣减
    extraBottomPadding: 0,
    headerContentHeight: letterHeaderExtra.value || (hasHeaderContent.value ? props.headerContentHeight : 0),
    footerHeight: hasFooter.value ? props.footerHeight : 0,
    windowHeight: viewportHeight.value
  })
)

const mergedContentStyle = computed(() => {
  const topPad = props.transparentHeader
    ? (props.contentPaddingTop === 20 ? 0 : props.contentPaddingTop)
    : props.contentPaddingTop
  const style = {
    paddingTop: `${rpx2px(topPad)}px`,
    paddingLeft: `${rpx2px(props.contentPaddingX)}px`,
    paddingRight: `${rpx2px(props.contentPaddingX)}px`,
    ...props.contentStyle
  }
  if (props.extraBottomPadding) {
    style.paddingBottom = `${rpx2px(props.extraBottomPadding)}px`
  }
  if (!enableScroll.value) {
    style.height = '100%'
    style.boxSizing = 'border-box'
    style.overflow = 'hidden'
  }
  return style
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page-layout {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  color: $ink;
}

.page-layout__scroll,
.page-layout__body {
  width: 100%;
  box-sizing: border-box;
}

.page-layout__body {
  overflow: hidden;
}

.page-layout__content {
  width: 100%;
  box-sizing: border-box;
}

.page-layout__content--fill {
  height: 100%;
  overflow: hidden;
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
  z-index: $z-index-popup;
  pointer-events: none;
}
</style>
