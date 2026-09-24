<template>
  <PageLayout title="内容管理" show-back background-color="#FFF8F0">
    <view class="menu-card">
      <view class="menu-item" @click="go('/subPackages/pkg-admin/recipes/list')">
        <text class="mi">🍲</text>
        <view class="mid">
          <text class="ml">菜品管理</text>
          <text class="sub">增删改查菜谱</text>
        </view>
        <text class="ma">→</text>
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/tips/list')">
        <text class="mi">📖</text>
        <view class="mid">
          <text class="ml">技巧管理</text>
          <text class="sub">增删改查烹饪技巧</text>
        </view>
        <text class="ma">→</text>
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/categories/list')">
        <text class="mi">📂</text>
        <view class="mid">
          <text class="ml">分类管理</text>
          <text class="sub">增删改查菜谱分类</text>
        </view>
        <text class="ma">→</text>
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/seed/index')">
        <text class="mi">📦</text>
        <view class="mid">
          <text class="ml">导入/更新种子数据</text>
          <text class="sub">从本地种子批量导入菜谱与技巧</text>
        </view>
        <text class="ma">→</text>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'

useAdminGuard()

function go(url) {
  uni.navigateTo({ url })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.menu-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid $border-color;
  &:last-child { border-bottom: none; }
}

.mi { font-size: 40rpx; margin-right: 20rpx; }
.mid { flex: 1; min-width: 0; }
.ml { display: block; font-size: 30rpx; font-weight: 600; }
.sub { display: block; font-size: 22rpx; color: $text-light; margin-top: 6rpx; }
.ma { color: #ccc; }
</style>
