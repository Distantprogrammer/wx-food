<template>
  <view class="profile-card">
    <view class="profile-row">
      <view class="profile-info">
        <view class="profile-avatar">{{ avatarText }}</view>
        <view>
          <text class="profile-name">{{ displayName }}</text>
          <text class="profile-sub">{{ roleText }}</text>
        </view>
      </view>
      <button v-if="isLogin" class="edit-btn" @click="emit('edit')">修改资料</button>
      <button v-else class="edit-btn" @click="emit('login')">微信登录</button>
    </view>
    <view class="profile-stats">
      <view class="profile-stat" @click="emit('stat-click', 'history')">
        <text class="stat-num">{{ stats.publishCount }}</text>
        <text class="stat-label">历史发布</text>
      </view>
      <view class="profile-stat" @click="emit('stat-click', 'likes')">
        <text class="stat-num">{{ stats.likeCount }}</text>
        <text class="stat-label">点赞</text>
      </view>
      <view class="profile-stat" @click="emit('stat-click', 'collects')">
        <text class="stat-num">{{ stats.collectCount }}</text>
        <text class="stat-label">收藏</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getRoleLabel } from '@/utils/permission'

const props = defineProps({
  user: { type: Object, default: null },
  isLogin: { type: Boolean, default: false },
  stats: {
    type: Object,
    default: () => ({ publishCount: 0, likeCount: 0, collectCount: 0 })
  }
})

const emit = defineEmits(['edit', 'login', 'stat-click'])

const avatarText = computed(() => {
  const name = props.user?.nickname || '访'
  return name.slice(0, 1)
})

const displayName = computed(() => props.user?.nickname || '访客')

const roleText = computed(() => {
  if (!props.isLogin) return '未登录'
  return `用户权限 - ${getRoleLabel(props.user?.role)}`
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 32rpx;
  border-radius: $radius-md;
  background: $primary-color;
  color: #fff;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.profile-card::after {
  content: '';
  position: absolute;
  right: -68rpx;
  bottom: -84rpx;
  width: 300rpx;
  height: 300rpx;
  border: 36rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
}

.profile-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.profile-avatar {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.2);
  font-size: 36rpx;
  font-weight: 900;
}

.profile-name {
  display: block;
  font-size: 44rpx;
  line-height: 56rpx;
  font-weight: 900;
}

.profile-sub {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 24rpx;
  font-weight: 700;
}

.edit-btn {
  height: 56rpx;
  padding: 0 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 56rpx;
}

.profile-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.profile-stat {
  min-height: 112rpx;
  padding: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.12);

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.stat-num {
  display: block;
  font-size: 36rpx;
  line-height: 44rpx;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 4rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 22rpx;
  font-weight: 700;
}
</style>
