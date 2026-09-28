<template>
  <PageLayout title="内容管理" show-back background-color="#F6F7F2">
    <view class="menu-card">
      <view class="menu-item" @click="go('/subPackages/pkg-admin/recipes/list')">
        <text class="mi">菜品</text>
        <view class="mid">
          <text class="ml">菜品管理</text>
          <text class="sub">增删改查菜谱</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/tips/list')">
        <text class="mi">技巧</text>
        <view class="mid">
          <text class="ml">技巧管理</text>
          <text class="sub">增删改查烹饪技巧</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/categories/list')">
        <text class="mi">分类</text>
        <view class="mid">
          <text class="ml">分类管理</text>
          <text class="sub">增删改查菜谱分类</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/notice/edit')">
        <text class="mi">公告</text>
        <view class="mid">
          <text class="ml">公告管理</text>
          <text class="sub">编辑「关于」页展示的公告内容</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/feedback/list')">
        <text class="mi">反馈</text>
        <view class="mid">
          <text class="ml">用户反馈</text>
          <text class="sub">查看用户提交的意见与建议</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-item" @click="go('/subPackages/pkg-admin/seed/index')">
        <text class="mi">种子</text>
        <view class="mid">
          <text class="ml">导入/更新种子数据</text>
          <text class="sub">从本地种子批量导入菜谱与技巧</text>
        </view>
        <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
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
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1rpx solid $border-color;
  box-shadow: $shadow-sm;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.mi {
  width: 64rpx;
  height: 40rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 650;
  color: $primary-color;
  background: $primary-soft;
  border-radius: $radius-sm;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ma {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  opacity: 0.55;
}
</style>
