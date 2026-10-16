<template>
  <PageLayout
    title="我的"
    show-tab-bar
    active-tab="me"
    :header-style="{ background: '#F6F7F2', color: '#1F2D2A' }"
    background-color="#F6F7F2"
    :content-padding-x="0"
  >
    <view class="user-section">
      <view class="user-card">
        <view class="user-row">
          <view class="avatar">
            <image v-if="userInfo?.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-img" />
            <text v-else class="avatar-fallback">我</text>
          </view>
          <view class="info">
            <text class="name">{{ userInfo?.nickname || '美食家' }}</text>
            <text class="desc">{{ roleLabel }}</text>
          </view>
          <button class="edit-btn" @click="openEditName">修改名称</button>
        </view>
      </view>

      <view class="stats-card">
        <view class="stat" @click="goList('history')">
          <text class="val">{{ stats.history }}</text>
          <text class="lab">历史查看</text>
        </view>
        <view class="divider" />
        <view class="stat" @click="goList('likes')">
          <text class="val">{{ stats.liked }}</text>
          <text class="lab">我喜欢的</text>
        </view>
        <view class="divider" />
        <view class="stat" @click="goList('favorites')">
          <text class="val">{{ stats.favorite }}</text>
          <text class="lab">我的收藏</text>
        </view>
        <view class="divider" />
        <view class="stat" @click="goList('cooked')">
          <text class="val">{{ stats.cooked }}</text>
          <text class="lab">做过的菜</text>
        </view>
      </view>
    </view>

    <view class="content">
      <view class="section-card">
        <view class="head">
          <text class="head-title">我的收藏</text>
          <view class="more" @click="goList('favorites')">
            <text>查看全部</text>
            <image class="more-arrow" src="/static/icons/chevron.png" mode="aspectFit" />
          </view>
        </view>
        <view v-if="!favorites.length" class="empty">暂无收藏</view>
        <scroll-view v-else scroll-x class="mini-scroll" :show-scrollbar="false">
          <view class="mini-list">
            <view v-for="item in favorites" :key="item.id" class="mini" @click="goDetail(item)">
              <view class="mini-cover">
                <image :src="coverMap[item.id] || placeholderOf(item)" mode="aspectFill" class="mini-img" />
              </view>
              <text class="mini-name">{{ item.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="section-card">
        <view class="head">
          <text class="head-title">最近浏览</text>
          <view class="more" @click="goList('history')">
            <text>查看全部</text>
            <image class="more-arrow" src="/static/icons/chevron.png" mode="aspectFit" />
          </view>
        </view>
        <view v-if="!history.length" class="empty">暂无浏览</view>
        <scroll-view v-else scroll-x class="mini-scroll" :show-scrollbar="false">
          <view class="mini-list">
            <view v-for="item in history" :key="item.id" class="mini" @click="goDetail(item)">
              <view class="mini-cover">
                <image :src="coverMap[item.id] || placeholderOf(item)" mode="aspectFill" class="mini-img" />
              </view>
              <text class="mini-name">{{ item.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="menu-card">
        <view class="menu-item" @click="goFeedback">
          <text class="mi">反馈</text>
          <text class="ml">意见反馈</text>
          <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
        <view class="menu-item" @click="goRecipeHistory">
          <text class="mi">菜谱</text>
          <text class="ml">新增菜谱</text>
          <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
        <view class="menu-item" @click="goTipHistory">
          <text class="mi">技巧</text>
          <text class="ml">新增技巧</text>
          <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
        <view v-if="isAdmin" class="menu-item" @click="goAdmin">
          <text class="mi">管理</text>
          <text class="ml">内容管理</text>
          <text v-if="pendingCount > 0" class="badge">{{ pendingBadge }}</text>
          <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
        <view class="menu-item" @click="goAbout">
          <text class="mi">关于</text>
          <text class="ml">关于 · 今天做什么菜</text>
          <image class="ma" src="/static/icons/chevron.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <template #overlay>
      <view v-if="editVisible" class="edit-mask" @click="editVisible = false">
        <view class="edit-sheet" @click.stop>
          <view class="sheet-handle" />
          <text class="sheet-title">修改名称</text>
          <input
            v-model="editNickname"
            class="edit-input"
            placeholder="请输入昵称"
            maxlength="20"
          />
          <view class="sheet-actions">
            <button class="ghost-button" @click="editVisible = false">取消</button>
            <button class="save-button" @click="handleUpdateName">保存</button>
          </view>
        </view>
      </view>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getUserStats, getUserPreview } from '@/services/userRecipe'
import { adminPendingSummary } from '@/services/admin'
import { getCoverTempUrlBatch } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'

useTabPage('me')

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)
const roleLabel = computed(() => (userStore.isAdmin ? '管理员' : '用户'))
const stats = ref({ history: 0, liked: 0, favorite: 0, cooked: 0 })
const favorites = ref([])
const history = ref([])
const coverMap = ref({})
const editVisible = ref(false)
const editNickname = ref('')
const pendingCount = ref(0)
const pendingBadge = computed(() => (pendingCount.value > 99 ? '99+' : String(pendingCount.value)))

function placeholderOf(item) {
  return getRecipePlaceholder(item?.categorySlug)
}

async function resolveCovers(rows) {
  const urls = (rows || []).map(r => r.coverImage).filter(Boolean)
  const byUrl = urls.length ? await getCoverTempUrlBatch(urls) : {}
  const next = { ...coverMap.value }
  ;(rows || []).forEach(item => {
    const u = item.coverImage ? byUrl[item.coverImage] : ''
    next[item.id] = u || getRecipePlaceholder(item.categorySlug)
  })
  coverMap.value = next
}

async function loadPendingSummary() {
  if (!userStore.isAdmin) {
    pendingCount.value = 0
    return
  }
  try {
    const res = await adminPendingSummary({ silent: true })
    if (res.code === 200) {
      pendingCount.value = Number(res.data?.total) || 0
    }
  } catch (e) {
    // 角标失败不影响主流程
  }
}

async function load() {
  try {
    const tasks = [getUserStats(), getUserPreview()]
    if (userStore.isAdmin) tasks.push(loadPendingSummary())
    else pendingCount.value = 0
    const [s, p] = await Promise.all(tasks)
    if (s.code === 200) stats.value = s.data
    if (p.code === 200) {
      favorites.value = p.data?.favorites || []
      history.value = p.data?.history || []
      coverMap.value = {}
      resolveCovers([...(favorites.value || []), ...(history.value || [])])
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

function goRecipeHistory() {
  uni.navigateTo({ url: '/pages/me/recipe-history' })
}

function goTipHistory() {
  uni.navigateTo({ url: '/pages/me/tip-history' })
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

function openEditName() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  editVisible.value = true
}

async function handleUpdateName() {
  const nickname = editNickname.value.trim()
  if (!nickname) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }
  try {
    await userStore.updateProfile({ nickname })
    uni.showToast({ title: '更新成功', icon: 'success' })
    editVisible.value = false
  } catch (e) {
    uni.showToast({ title: e.message || '更新失败', icon: 'none' })
  }
}

watch(editVisible, val => {
  if (val) {
    editNickname.value = userStore.userInfo?.nickname || ''
  }
})

onShow(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.user-section {
  padding: 10rpx $page-padding-x 8rpx;
}

.user-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  border: 1rpx solid $border-color;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.edit-btn {
  flex-shrink: 0;
  height: 56rpx;
  padding: 0 24rpx;
  margin: 0;
  border: 1rpx solid $border-color;
  border-radius: $radius-sm;
  background: $bg-muted;
  color: $text-primary;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 56rpx;

  &::after {
    border: none;
  }
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-muted;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-fallback {
  font-size: 32rpx;
  font-weight: 700;
  color: $primary-color;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: $line-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $text-light;
}

.stats-card {
  display: flex;
  margin-top: 16rpx;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx 8rpx;
  border: 1rpx solid $border-color;
}

.stat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 0 4rpx;
}

.val {
  font-size: 34rpx;
  font-weight: 750;
  color: $text-primary;
  line-height: 1.2;
}

.lab {
  font-size: 20rpx;
  color: $text-light;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.divider {
  width: 1rpx;
  background: $border-color;
  align-self: stretch;
  margin: 8rpx 0;
}

.content {
  padding: 16rpx $page-padding-x 40rpx;
}

.section-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 22rpx 20rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid $border-color;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  gap: 12rpx;
}

.head-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
}

.more {
  display: flex;
  align-items: center;
  gap: 2rpx;
  font-size: 24rpx;
  color: $text-secondary;
  flex-shrink: 0;
}

.more-arrow {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  opacity: 0.55;
}

.empty {
  text-align: center;
  color: $text-light;
  font-size: 24rpx;
  padding: 24rpx;
}

.mini-scroll {
  white-space: nowrap;
}

.mini-list {
  display: inline-flex;
  gap: 16rpx;
}

.mini {
  width: 140rpx;
}

.mini-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-sm;
  background: $bg-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
  overflow: hidden;
  border: 1rpx solid $border-color;
}

.mini-img {
  width: 100%;
  height: 100%;
}

.mini-name {
  display: block;
  font-size: 22rpx;
  color: $text-primary;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1rpx solid $border-color;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 22rpx;
  border-bottom: 1rpx solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.mi {
  width: 64rpx;
  height: 40rpx;
  margin-right: 12rpx;
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

.ml {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  flex-shrink: 0;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 10rpx;
  margin-right: 12rpx;
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
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  opacity: 0.55;
}

.edit-mask {
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(31, 45, 42, 0.28);
  pointer-events: auto;
}

.edit-sheet {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 176rpx;
  padding: 28rpx;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  background: $bg-card;
  box-shadow: $shadow-lg;
}

.sheet-handle {
  width: 88rpx;
  height: 8rpx;
  margin: 0 auto 24rpx;
  border-radius: 8rpx;
  background: $bg-muted;
}

.sheet-title {
  display: block;
  font-size: 30rpx;
  font-weight: 750;
  color: $text-primary;
  margin-bottom: 20rpx;
}

.edit-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  background: $bg-color;
  box-sizing: border-box;
  font-size: 28rpx;
  color: $text-primary;
}

.sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 16rpx;
}

.save-button,
.ghost-button {
  min-width: 152rpx;
  height: 68rpx;
  padding: 0 24rpx;
  margin: 0;
  border-radius: $radius-md;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 68rpx;

  &::after {
    border: none;
  }
}

.save-button {
  border: 1rpx solid $primary-soft;
  background: $primary-soft;
  color: $primary-color;
}

.ghost-button {
  border: 1rpx solid $border-color;
  background: #fff;
  color: $text-secondary;
}
</style>
