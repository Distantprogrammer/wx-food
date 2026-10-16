<template>
  <PageLayout title="内容管理" show-back background-color="#F6F7F2">
    <view class="menu-card">
      <view
        v-for="item in menus"
        :key="item.url"
        class="menu-item"
        hover-class="menu-item-hover"
        @click="go(item.url)"
      >
        <text class="mi">{{ item.badge }}</text>
        <view class="mid">
          <text class="ml">{{ item.title }}</text>
          <text class="sub">{{ item.sub }}</text>
        </view>
        <text v-if="countOf(item.countKey) > 0" class="count-badge">{{ formatBadge(countOf(item.countKey)) }}</text>
        <text class="ma">›</text>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminPendingSummary } from '@/services/admin'

useAdminGuard()

const pending = reactive({
  recipes: 0,
  tips: 0,
  feedbacks: 0
})

const menus = [
  { badge: '菜品', title: '菜品管理', sub: '增删改查菜谱', url: '/subPackages/pkg-admin/recipes/list' },
  {
    badge: '审核',
    title: '审核菜谱',
    sub: '待审处理、同名对比与预览',
    url: '/subPackages/pkg-admin/recipes/audit',
    countKey: 'recipes'
  },
  { badge: '技巧', title: '技巧管理', sub: '增删改查烹饪技巧', url: '/subPackages/pkg-admin/tips/list' },
  {
    badge: '审核',
    title: '审核技巧',
    sub: '待审处理、同名对比与预览',
    url: '/subPackages/pkg-admin/tips/audit',
    countKey: 'tips'
  },
  { badge: '分类', title: '分类管理', sub: '增删改查菜谱分类', url: '/subPackages/pkg-admin/categories/list' },
  { badge: '公告', title: '公告管理', sub: '编辑「关于」页展示的公告内容', url: '/subPackages/pkg-admin/notice/edit' },
  {
    badge: '反馈',
    title: '用户反馈',
    sub: '查看用户提交的意见与建议',
    url: '/subPackages/pkg-admin/feedback/list',
    countKey: 'feedbacks'
  },
  { badge: '用户', title: '用户管理', sub: '分配管理员、改名、删除用户', url: '/subPackages/pkg-admin/users/list' },
  { badge: '种子', title: '导入/更新种子数据', sub: '从本地种子批量导入菜谱与技巧', url: '/subPackages/pkg-admin/seed/index' }
]

function countOf(key) {
  if (!key) return 0
  return Number(pending[key]) || 0
}

function formatBadge(n) {
  return n > 99 ? '99+' : String(n)
}

async function loadPending() {
  try {
    const res = await adminPendingSummary({ silent: true })
    if (res.code === 200) {
      pending.recipes = Number(res.data?.recipes) || 0
      pending.tips = Number(res.data?.tips) || 0
      pending.feedbacks = Number(res.data?.feedbacks) || 0
    }
  } catch (e) {
    // 角标失败不影响进入各功能
  }
}

function go(url) {
  uni.navigateTo({ url })
}

onShow(loadPending)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.menu-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1rpx solid $border-color;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid $border-color;
  min-height: 112rpx;
  box-sizing: border-box;

  &:last-child {
    border-bottom: none;
  }
}

.menu-item-hover {
  background: $bg-muted;
}

.mi {
  width: 72rpx;
  height: 48rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 650;
  color: $primary-color;
  background: $primary-soft;
  border-radius: $radius-sm;
  letter-spacing: 0;
}

.mid {
  flex: 1;
  min-width: 0;
}

.ml {
  display: block;
  font-size: 28rpx;
  font-weight: 650;
  color: $text-primary;
  @include ellipsis(1);
}

.sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $text-light;
  @include ellipsis(1);
}

.count-badge {
  flex-shrink: 0;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 10rpx;
  border-radius: $radius-round;
  background: $error-color;
  color: $text-white;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 32rpx;
  text-align: center;
  box-sizing: border-box;
}

.ma {
  flex-shrink: 0;
  width: 32rpx;
  text-align: center;
  font-size: 32rpx;
  line-height: 1;
  color: $text-light;
}
</style>
