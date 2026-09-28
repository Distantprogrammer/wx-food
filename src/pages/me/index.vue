<template>
  <PageLayout
    :show-header="false"
    show-tab-bar
    active-tab="me"
    background-color="#FFF8F0"
    :content-padding-x="0"
  >
    <view class="header-bg" />
    <view class="user-section">
      <view class="user-card">
        <view class="avatar">
          <image v-if="userInfo?.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-img" />
          <text v-else>😊</text>
        </view>
        <view class="info">
          <text class="name">{{ userInfo?.nickname || '美食家' }}</text>
          <text class="desc">云开发已静默登录</text>
        </view>
      </view>

      <view class="stats-card">
        <view class="stat" @click="goList('history')"><text class="val">{{ stats.history }}</text><text class="lab">历史查看</text></view>
        <view class="divider" />
        <view class="stat" @click="goList('likes')"><text class="val">{{ stats.liked }}</text><text class="lab">我喜欢的</text></view>
        <view class="divider" />
        <view class="stat" @click="goList('favorites')"><text class="val">{{ stats.favorite }}</text><text class="lab">我的收藏</text></view>
        <view class="divider" />
        <view class="stat" @click="goList('cooked')"><text class="val">{{ stats.cooked }}</text><text class="lab">做过的菜</text></view>
      </view>
    </view>

    <view class="content">
      <view class="section-card">
        <view class="head">
          <text>📚 我的收藏</text>
          <text class="more" @click="goList('favorites')">查看全部 →</text>
        </view>
        <view v-if="!favorites.length" class="empty">暂无收藏</view>
        <scroll-view v-else scroll-x class="mini-scroll" :show-scrollbar="false">
          <view class="mini-list">
            <view v-for="item in favorites" :key="item.id" class="mini" @click="goDetail(item)">
              <view class="mini-cover">{{ item.title?.slice(0, 1) }}</view>
              <text class="mini-name">{{ item.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="section-card">
        <view class="head">
          <text>🔄 最近浏览</text>
          <text class="more" @click="goList('history')">查看全部 →</text>
        </view>
        <view v-if="!history.length" class="empty">暂无浏览</view>
        <scroll-view v-else scroll-x class="mini-scroll" :show-scrollbar="false">
          <view class="mini-list">
            <view v-for="item in history" :key="item.id" class="mini" @click="goDetail(item)">
              <view class="mini-cover">{{ item.title?.slice(0, 1) }}</view>
              <text class="mini-name">{{ item.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="menu-card">
        <view class="menu-item" @click="goFeedback">
          <text class="mi">💬</text>
          <text class="ml">意见反馈</text>
          <text class="ma">→</text>
        </view>
        <view v-if="isAdmin" class="menu-item" @click="goAdmin">
          <text class="mi">🛠️</text>
          <text class="ml">内容管理</text>
          <text class="ma">→</text>
        </view>
        <view class="menu-item" @click="goAbout">
          <text class="mi">ℹ️</text>
          <text class="ml">关于 · 今天做什么菜</text>
          <text class="ma">→</text>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getUserStats, getUserPreview } from '@/services/userRecipe'

useTabPage('me')

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)
const stats = ref({ history: 0, liked: 0, favorite: 0, cooked: 0 })
const favorites = ref([])
const history = ref([])

async function load() {
  try {
    const [s, p] = await Promise.all([getUserStats(), getUserPreview()])
    if (s.code === 200) stats.value = s.data
    if (p.code === 200) {
      favorites.value = p.data?.favorites || []
      history.value = p.data?.history || []
    }
  } catch (e) {
    console.error(e)
  }
}

function goList(type) {
  const titles = { history: '历史查看', likes: '我喜欢的', favorites: '我的收藏', cooked: '做过的菜' }
  uni.navigateTo({ url: `/pages/me/list?type=${type}&title=${encodeURIComponent(titles[type] || '')}` })
}

function goDetail(item) {
  uni.navigateTo({ url: `/subPackages/pkg-recipe/detail/index?id=${item.id}` })
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/me/feedback' })
}

function goAbout() {
  uni.navigateTo({ url: '/pages/me/about' })
}

function goAdmin() {
  if (!userStore.isAdmin) {
    uni.showToast({ title: '仅管理员可进入', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/subPackages/pkg-admin/index/index' })
}

onShow(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280rpx;
  background: linear-gradient(180deg, rgba(255, 107, 53, 0.55), rgba(255, 248, 240, 0.2));
  z-index: 0;
}

.user-section {
  position: relative;
  z-index: 1;
  padding: 80rpx 40rpx 16rpx;
  padding-top: calc(80rpx + env(safe-area-inset-top));
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-lg;
}

.avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  border: 4rpx solid $primary-color;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  background: $bg-color;
}

.avatar-img { width: 100%; height: 100%; }

.info { flex: 1; }
.name { display: block; font-size: 34rpx; font-weight: 600; }
.desc { font-size: 24rpx; color: $text-light; }

.stats-card {
  display: flex;
  margin-top: 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 12rpx;
  box-shadow: $shadow-md;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.val { font-size: 36rpx; font-weight: 700; color: $primary-color; }
.lab { font-size: 22rpx; color: $text-light; }
.divider { width: 1rpx; background: $border-color; }

.content { padding: 8rpx 40rpx 40rpx; position: relative; z-index: 1; }

.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
}

.head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.more { font-size: 24rpx; color: $primary-color; font-weight: 400; }

.empty { text-align: center; color: $text-light; font-size: 24rpx; padding: 24rpx; }

.mini-scroll { white-space: nowrap; }
.mini-list { display: inline-flex; gap: 16rpx; }
.mini { width: 140rpx; text-align: center; }
.mini-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffe0d0, #ffc9a8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}
.mini-name {
  display: block;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
.mi { font-size: 32rpx; margin-right: 16rpx; }
.ml { flex: 1; font-size: 28rpx; }
.ma { color: #ccc; }
</style>
