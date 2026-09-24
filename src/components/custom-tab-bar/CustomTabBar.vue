<template>
  <view class="custom-tabbar">
    <view class="tabbar-content">
      <view
        v-for="item in visibleTabBarList"
        :key="item.key"
        class="tab-item"
        :class="{ active: activeKey === item.key }"
        @click="handleTabClick(item)"
      >
        <text class="tab-icon">{{ activeKey === item.key ? item.activeIcon : item.icon }}</text>
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
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 120rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: $text-light;
  font-size: 20rpx;

  &.active {
    color: $primary-color;
    font-weight: 600;
  }
}

.tab-icon {
  font-size: 40rpx;
  line-height: 1;
}

.tab-text {
  font-size: 20rpx;
}
</style>
