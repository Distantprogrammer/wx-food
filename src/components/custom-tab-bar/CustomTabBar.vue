<template>
  <view class="custom-tabbar tab-tokens" :class="'is-' + tabStyle">
    <view class="tabbar-content">
      <block v-for="item in slots" :key="item.key">
        <view
          v-if="item.dice"
          class="dice-wrap"
          aria-role="button"
          aria-label="随机一菜"
          @click="onDice"
        >
          <view class="dice-btn" :class="{ spin: diceSpin }">
            <tab-icon name="dice" active />
          </view>
          <text class="dice-label">随机一菜</text>
        </view>
        <view
          v-else
          class="tab-item"
          :class="{ active: activeKey === item.key }"
          hover-class="tab-item--pressed"
          :hover-stay-time="180"
          aria-role="button"
          :aria-label="item.text"
          @click="handleTabClick(item)"
        >
          <view v-if="tabStyle !== 'C'" class="pill" />
          <view class="ic">
            <tab-icon :name="iconName(item.key)" :active="activeKey === item.key" />
          </view>
          <text class="tab-text">{{ item.text }}</text>
          <view v-if="tabStyle === 'C'" class="ibar" />
        </view>
      </block>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import TabIcon from '@/components/tab-icon/tab-icon.vue'
import { useTabPermission } from '@/composables/useTabPermission'
import { setCurrentTab } from '@/utils/index.js'
import { getRandomRecipe } from '@/services/recipe'

const ICON_NAME = {
  home: 'home',
  tips: 'tips',
  category: 'cat',
  me: 'mine'
}

/** 换肤：A 胶囊，B 中央骰子，C 指示条 */
const tabStyle = 'A'

const props = defineProps({
  activeKey: { type: String, default: 'home' }
})

const { visibleTabBarList } = useTabPermission()
const diceSpin = ref(false)

const slots = computed(() => {
  const list = visibleTabBarList.value || []
  if (tabStyle !== 'B') return list
  const next = []
  list.forEach((item, index) => {
    if (index === 2) next.push({ key: 'dice', dice: true })
    next.push(item)
  })
  return next
})

watch(
  () => props.activeKey,
  (key) => {
    const tab = visibleTabBarList.value.find(item => item.key === key)
    if (tab) setCurrentTab(tab.pagePath)
  },
  { immediate: true }
)

function iconName(key) {
  return ICON_NAME[key] || 'home'
}

function vibrate() {
  try {
    uni.vibrateShort({ type: 'light' })
  } catch (error) {
    // 开发者工具可能没有振动
  }
}

function handleTabClick(item) {
  if (props.activeKey === item.key) return
  vibrate()
  setCurrentTab(item.pagePath)
  uni.switchTab({ url: item.pagePath })
}

async function onDice() {
  diceSpin.value = false
  setTimeout(() => {
    diceSpin.value = true
  }, 16)
  try {
    const res = await getRandomRecipe({ silent: true })
    const title = res.data?.title
    if (res.code === 200 && title) {
      uni.showToast({ title: `今天就吃：${title}`, icon: 'none' })
      return
    }
  } catch (error) {
    // 下面统一提示
  }
  uni.showToast({ title: '暂时没有菜谱', icon: 'none' })
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  overflow: visible;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-content {
  display: flex;
  align-items: stretch;
  height: 152rpx;
  overflow: visible;
}

.tab-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 152rpx;
  color: var(--tab-inactive);
}

.tab-item.active {
  color: var(--brand);
}

.tab-item--pressed {
  opacity: 0.72;
}

.pill {
  position: absolute;
  top: 28rpx;
  left: 50%;
  z-index: 1;
  width: 92rpx;
  height: 58rpx;
  border-radius: 29rpx;
  background: var(--brand-light);
  opacity: 0;
  transform: translateX(-50%) scale(0.5);
  transition: opacity 280ms cubic-bezier(.34, 1.56, .64, 1), transform 280ms cubic-bezier(.34, 1.56, .64, 1);
}

.tab-item.active .pill {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.ic {
  position: relative;
  z-index: 2;
  width: 48rpx;
  height: 48rpx;
}

.tab-item.active .ic {
  animation: tab-pop 380ms cubic-bezier(.34, 1.56, .64, 1);
}

.tab-text {
  position: relative;
  z-index: 2;
  max-width: 100%;
  margin-top: 6rpx;
  overflow: hidden;
  color: inherit;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 28rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tab-item.active .tab-text {
  font-weight: 700;
}

.ibar {
  width: 32rpx;
  height: 6rpx;
  margin-top: 4rpx;
  border-radius: 4rpx;
  background: var(--brand);
  transform: scaleX(0);
  transition: transform 250ms ease;
}

.tab-item.active .ibar {
  transform: scaleX(1);
}

.dice-wrap {
  display: flex;
  flex: 1.15;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.dice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  margin-top: -52rpx;
  box-sizing: border-box;
  border: 10rpx solid #ffffff;
  border-radius: 50%;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  box-shadow: 0 16rpx 40rpx rgba(45, 106, 79, 0.35);
}

.dice-btn.spin :deep(.tab-icon) {
  animation: dice-spin 600ms ease;
}

.dice-label {
  margin-top: 6rpx;
  color: var(--brand);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 28rpx;
}

@keyframes tab-pop {
  0% { transform: scale(0.5); }
  60% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

@keyframes dice-spin {
  0% { transform: rotate(0deg) scale(1); }
  60% { transform: rotate(300deg) scale(1.15); }
  100% { transform: rotate(360deg) scale(1); }
}
</style>
