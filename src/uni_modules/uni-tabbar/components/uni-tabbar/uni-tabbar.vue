<template>
  <div class="tabbar">
    <div
      class="tabbar-item"
      :class="{ 'tabbar-item-bulge': item.bulge }"
      v-for="(item, index) in props.items"
      :key="item.id"
      @click="onTabClick(item, index)"
      :style="item.bulge ? { '--bulge-height': (item.bulgeHeight || 40) + 'rpx' } : {}"
    >
      <!-- 主菜单内容 -->
      <div class="tabbar-item-content">
        <div class="tabbar-item-icon">
          <img :src="item.icon" alt="" class="tabbar-item-icon-image" />
        </div>
        <div class="tabbar-item-text">
          {{ item.text }}
        </div>
      </div>

      <!-- 子菜单扇形展开区域 -->
      <div
        v-if="item.bulge && item.children && item.children.length > 0"
        class="submenu-container"
        :class="{ 'submenu-container-visible': expandedId === item.id }"
      >
        <!-- 子菜单项 -->
        <div
          v-for="(child, childIndex) in item.children"
          :key="child.id"
          class="submenu-item"
          :style="getSubmenuItemStyle(item.children.length, childIndex)"
          @click.stop="onSubmenuClick(item, child)"
        >
          <div class="submenu-item-icon">
            <img :src="child.icon" alt="" class="submenu-item-icon-image" />
          </div>
          <div class="submenu-item-text">{{ child.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      { id: 'home', text: '首页', icon: '' },
      {
        id: 'center',
        text: '中心',
        icon: '',
        bulge: true,
        bulgeHeight: 10,
        children: [
          { id: 'a', text: '功能A', icon: '' },
          { id: 'b', text: '功能B', icon: '' }
        ]
      },
      {
        id: 'more',
        text: '更多',
        icon: ''
      }
    ]
  }
})

const emit = defineEmits(['click', 'submenu-click'])

const expandedId = ref('')

function getSubmenuItemStyle(childCount, childIndex) {
  const centerX = 80
  const centerY = 80
  const radius = 50
  const startAngle = 45
  const endAngle = 135

  let angle
  if (childCount === 1) {
    angle = 90
  } else {
    const angleStep = (endAngle - startAngle) / (childCount - 1)
    angle = startAngle + angleStep * childIndex
  }

  const radian = (angle * Math.PI) / 180
  const x = centerX + Math.cos(radian) * radius - 24
  const y = centerY - Math.sin(radian) * radius - 24
  const delay = childIndex * 0.08

  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--delay': `${delay}s`
  }
}

function onTabClick(item, index) {
  if (item.bulge && item.children && Array.isArray(item.children) && item.children.length > 0) {
    if (expandedId.value === item.id) {
      expandedId.value = ''
    } else {
      expandedId.value = item.id
    }
  } else {
    expandedId.value = ''
  }
  emit('click', { item, index })
}

function onSubmenuClick(parent, child) {
  expandedId.value = ''
  emit('submenu-click', { parent, child })
}
</script>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  bottom: 0px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background-color: #fff;
  border-top: 1px solid #eee;
  height: 100rpx;
  z-index: 100;
}

.tabbar-item {
  position: relative;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  padding-bottom: 10rpx;

  &.tabbar-item-bulge {
    z-index: 3;
    flex-shrink: 0;
    width: 160rpx;
    padding-bottom: var(--bulge-height, 40rpx);
  }
}

.tabbar-item-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;

  .tabbar-item-bulge & {
    .tabbar-item-icon {
      width: 36px;
      height: 36px;
    }
    .tabbar-item-text {
      font-size: 24rpx;
      font-weight: 500;
    }
  }
}

.tabbar-item-icon {
  width: 24px;
  height: 24px;

  .tabbar-item-icon-image {
    width: 100%;
    height: 100%;
  }
}

.tabbar-item-text {
  color: #333;
  font-size: 22rpx;
  margin-top: 4rpx;
}

.submenu-container {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 80px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.submenu-container-visible {
    pointer-events: auto;
    opacity: 1;

    .submenu-item {
      opacity: 1;
      transform: translate(var(--x), var(--y)) scale(1);
    }
  }
}

.submenu-item {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translate(var(--x), var(--y)) scale(0.3);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  z-index: 10;

  &:active {
    transform: translate(var(--x), var(--y)) scale(0.9);
  }
}

.submenu-item-icon {
  width: 18px;
  height: 18px;

  .submenu-item-icon-image {
    width: 100%;
    height: 100%;
    filter: brightness(0) invert(1);
  }
}

.submenu-item-text {
  color: #fff;
  font-size: 9px;
  margin-top: 2px;
  text-align: center;
  max-width: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>