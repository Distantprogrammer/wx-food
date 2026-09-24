## uni-tabbar 半圆弧底部导航栏
> **组件名：uni-tabbar**

半圆弧形 tabbar 组件，用于替代微信小程序原生 tabbar，优先适配微信小程序。导航项沿底部半圆弧形排列。

### 功能特性
- 半圆弧形背景，圆角顶部
- 导航项沿圆弧分布，中心项略低、两侧略高
- 自定义图标、文字
- 支持 `v-model:activeIndex` 控制选中态

### 基本用法

```vue
<template>
  <uni-tabbar
    v-model:active-index="activeIndex"
    :items="tabItems"
    @click="onTabClick"
  />
</template>

<script setup>
import { ref } from 'vue'

const activeIndex = ref(0)
const tabItems = [
  { id: 'home', text: '首页', icon: '/static/home.png' },
  { id: 'order', text: '订单', icon: '/static/order.png' },
  { id: 'center', text: '我的', icon: '/static/center.png' }
]

function onTabClick({ item, index }) {
  uni.switchTab({ url: item.pagePath })
}
</script>
```

### Props
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| items | Array | [] | 菜单项配置 |
| activeIndex | Number | 0 | 当前选中索引 |
| arcRadius | Number | 120 | 圆弧半径，影响项分布弧度 |

### items 项配置
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 唯一标识 |
| text | String | 是 | 显示文字 |
| icon | String | 否 | 图标路径 |

### Events
| 事件 | 参数 | 说明 |
|------|------|------|
| click | { item, index } | 点击菜单项 |
| update:activeIndex | index | 选中索引变化（v-model） |

