<template>
  <view class="custom-tabbar">
    <view class="tabbar-content">
      <view
        v-for="item in visibleTabBarList"
        :key="item.key"
        class="tab-item"
        :class="{ active: activeKey === item.key }"
        hover-class="tab-item--pressed"
        :hover-stay-time="100"
        @click="handleTabClick(item)"
      >
        <image
          class="tab-icon"
          :src="activeKey === item.key ? item.activeIcon : item.icon"
          mode="aspectFit"
        />
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { watch } from 'vue'
import { useTabPermission } from '@/composables/useTabPermission'
import { setCurrentTab } from '@/utils/index.js'

const props = defineProps({
  activeKey: { type: String, default: 'home' }
})

const { visibleTabBarList } = useTabPermission()

watch(
  () => props.activeKey,
  (key) => {
    const tab = visibleTabBarList.value.find(item => item.key === key)
    if (tab) setCurrentTab(tab.pagePath)
  },
  { immediate: true }
)

function handleTabClick(item) {
  if (props.activeKey === item.key) return
  setCurrentTab(item.pagePath)
  uni.switchTab({ url: item.pagePath })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.custom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: $z-index-tabbar;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid $border-color;
  box-shadow: 0 -2rpx 12rpx rgba(31, 45, 42, 0.04);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-width: 0;
  color: $text-light;
  transition: color $duration-fast $ease-out;

  &.active {
    color: $primary-color;
  }
}

.tab-item--pressed {
  opacity: 0.72;
}

.tab-icon {
  width: $tab-icon-size;
  height: $tab-icon-size;
  flex-shrink: 0;
}

.tab-text {
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item.active .tab-text {
  font-weight: 650;
}
</style>
