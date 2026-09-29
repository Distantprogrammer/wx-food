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
        <text class="ma">›</text>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'

useAdminGuard()

const menus = [
  { badge: '菜品', title: '菜品管理', sub: '增删改查菜谱', url: '/subPackages/pkg-admin/recipes/list' },
  { badge: '审核', title: '审核菜谱', sub: '待审处理、同名对比与预览', url: '/subPackages/pkg-admin/recipes/audit' },
  { badge: '技巧', title: '技巧管理', sub: '增删改查烹饪技巧', url: '/subPackages/pkg-admin/tips/list' },
  { badge: '审核', title: '审核技巧', sub: '待审处理、同名对比与预览', url: '/subPackages/pkg-admin/tips/audit' },
  { badge: '分类', title: '分类管理', sub: '增删改查菜谱分类', url: '/subPackages/pkg-admin/categories/list' },
  { badge: '公告', title: '公告管理', sub: '编辑「关于」页展示的公告内容', url: '/subPackages/pkg-admin/notice/edit' },
  { badge: '反馈', title: '用户反馈', sub: '查看用户提交的意见与建议', url: '/subPackages/pkg-admin/feedback/list' },
  { badge: '用户', title: '用户管理', sub: '分配管理员、改名、删除用户', url: '/subPackages/pkg-admin/users/list' },
  { badge: '种子', title: '导入/更新种子数据', sub: '从本地种子批量导入菜谱与技巧', url: '/subPackages/pkg-admin/seed/index' }
]

function go(url) {
  uni.navigateTo({ url })
}
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

.ma {
  flex-shrink: 0;
  width: 32rpx;
  text-align: center;
  font-size: 32rpx;
  line-height: 1;
  color: $text-light;
}
</style>
