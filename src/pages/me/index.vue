<template>
  <PageLayout
    show-tab-bar
    active-tab="me"
    :show-header="false"
    background-color="#F7F8FA"
    :content-padding-x="0"
    :content-padding-top="0"
  >
    <view class="status-spacer" :style="{ height: statusBarHeight + 'px' }" />

    <view class="mine-page">
      <text class="page-title">我的</text>

      <view class="profile">
        <view class="user-row">
          <view class="avatar">
            <image v-if="userInfo?.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-img" />
            <text v-else class="avatar-fallback">我</text>
          </view>
          <view class="info">
            <text class="name title-fade">{{ userInfo?.nickname || '美食家' }}</text>
            <text class="desc">{{ profileDesc }}</text>
          </view>
          <button class="edit-btn" @click="openEditName">修改名称</button>
        </view>
        <view class="stats">
          <view class="stat" @click="goList('history')">
            <text class="val">{{ stats.history }}</text>
            <text class="lab">历史查看</text>
          </view>
          <view class="stat" @click="goList('likes')">
            <text class="val">{{ stats.liked }}</text>
            <text class="lab">我喜欢的</text>
          </view>
          <view class="stat" @click="goList('favorites')">
            <text class="val">{{ stats.favorite }}</text>
            <text class="lab">我的收藏</text>
          </view>
          <view class="stat" @click="goList('cooked')">
            <text class="val">{{ stats.cooked }}</text>
            <text class="lab">做过的菜</text>
          </view>
        </view>
      </view>

      <view class="block">
        <section-head title="我的收藏" more="查看全部" @more="goList('favorites')" />
        <empty-state v-if="!favorites.length" title="暂无收藏" desc="看到喜欢的菜，点一下收藏" />
        <scroll-view v-else scroll-x class="fav-scroll" :show-scrollbar="false">
          <view class="fav-list">
            <view
              v-for="item in favorites"
              :key="item.id"
              class="fav"
              hover-class="is-pressed"
              :hover-stay-time="180"
              @click="goDetail(item)"
            >
              <image :src="coverMap[item.id] || placeholderOf(item)" mode="aspectFill" class="fav-img" />
              <text class="fav-name">{{ item.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="block hist-block">
        <section-head title="最近浏览" more="查看全部" @more="goList('history')" />
        <empty-state v-if="!history.length" title="暂无浏览" desc="看过的菜谱会出现在这里" />
        <scroll-view v-else scroll-x class="hist-scroll" :show-scrollbar="false">
          <view class="hist-list">
            <view v-for="item in history" :key="item.id" class="hist-item">
              <RecipeCard
                :recipe="item"
                :cover="coverMap[item.id]"
                variant="rail"
                meta-mode="calories"
                :show-badge="false"
                @click="goDetail"
              />
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="menu-card">
        <menu-item icon="✉️" label="意见反馈" @click="goFeedback" />
        <menu-item icon="🍜" label="新增菜谱" @click="goRecipeHistory" />
        <menu-item icon="🔪" label="新增技巧" @click="goTipHistory" />
        <menu-item v-if="isAdmin" icon="⚙️" label="内容管理" :badge="pendingCount > 0 ? pendingBadge : ''" @click="goAdmin" />
        <menu-item icon="ℹ️" label="关于我们" @click="goAbout" />
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
            placeholder-class="ph"
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
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHead from '@/components/section-head/section-head.vue'
import MenuItem from '@/components/menu-item/menu-item.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import { useUserStore } from '@/store/user'
import { useTabPage } from '@/composables/useTabPage'
import { getUserStats, getUserPreview } from '@/services/userRecipe'
import { adminPendingSummary } from '@/services/admin'
import { getCoverTempUrlBatch } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { getStatusBarHeight } from '@/utils/system'

useTabPage('me')

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)
const roleLabel = computed(() => (userStore.isAdmin ? '管理员' : '用户'))

function joinedDays(createTime) {
  if (createTime == null || createTime === '') return 0
  let ts = 0
  if (typeof createTime === 'number') ts = createTime
  else if (typeof createTime === 'string') ts = Date.parse(createTime)
  else if (typeof createTime === 'object') {
    if (createTime.$date != null) ts = Number(createTime.$date)
    else if (createTime.seconds != null) ts = Number(createTime.seconds) * 1000
  }
  if (!ts || Number.isNaN(ts)) return 0
  if (ts < 1e12) ts *= 1000
  return Math.max(1, Math.ceil((Date.now() - ts) / 86400000))
}

const profileDesc = computed(() => {
  const days = joinedDays(userInfo.value?.createTime)
  return days ? `${roleLabel.value} · 已加入 ${days} 天` : roleLabel.value
})
const statusBarHeight = getStatusBarHeight()
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

<style scoped>
.status-spacer {
  width: 100%;
}

.mine-page {
  padding: 16rpx 32rpx 64rpx;
}

.page-title {
  display: block;
  margin-bottom: 32rpx;
  padding-right: 190rpx;
}

.profile {
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.user-row {
  display: flex;
  align-items: center;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 48rpx;
  background: #e8f3ee;
}

.avatar-img {
  width: 96rpx;
  height: 96rpx;
}

.avatar-fallback {
  color: #2D6A4F;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  margin-right: 24rpx;
}

.name {
  display: block;
  color: #1A1A1A;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 48rpx;
  white-space: normal;
  word-break: break-all;
}

.title-fade {
  animation: title-fade-in 360ms ease both;
}

.desc {
  display: block;
  margin-top: 8rpx;
  color: #737373;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 36rpx;
  white-space: normal;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: auto;
  height: 64rpx;
  margin: 0 0 0 auto;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 64rpx;
  white-space: nowrap;
}

.stats {
  display: flex;
  margin-top: 32rpx;
  border-top: 1px solid #EBEBEB;
}

.stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 0;
  min-height: 88rpx;
  padding-top: 24rpx;
}

.val {
  color: #1A1A1A;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.5;
}

.lab {
  max-width: 100%;
  overflow: hidden;
  color: #737373;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.block {
  margin-top: 48rpx;
}

.fav-scroll {
  width: 100%;
  white-space: nowrap;
}

.fav-list {
  display: inline-flex;
  gap: 24rpx;
}

.fav {
  width: 192rpx;
  flex-shrink: 0;
  transition: transform 180ms ease;
}

.fav.is-pressed {
  transform: scale(0.98);
}

.fav-img {
  width: 192rpx;
  height: 192rpx;
  display: block;
  border-radius: 20rpx;
  background: #f7f8fa;
}

.fav-name {
  display: block;
  width: 192rpx;
  margin-top: 12rpx;
  overflow: hidden;
  color: #1A1A1A;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 36rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.hist-block {
  width: 100%;
  overflow: hidden;
}

.hist-scroll {
  width: 100%;
  white-space: nowrap;
}

.hist-list {
  display: inline-flex;
}

.hist-item {
  width: 300rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.hist-item:last-child {
  margin-right: 0;
}

.menu-card {
  margin-top: 48rpx;
  overflow: hidden;
  background: #FFFFFF;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.menu-card :deep(.menu-item) {
  border-bottom: 1px solid #EBEBEB;
}

.menu-card :deep(.menu-item:last-child) {
  border-bottom: none;
}

.edit-mask {
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}

.edit-sheet {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  bottom: calc(152rpx + env(safe-area-inset-bottom) + 24rpx);
  padding: 40rpx;
  border-radius: 36rpx;
  background: #FFFFFF;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.sheet-handle {
  width: 64rpx;
  height: 8rpx;
  margin: 0 auto 32rpx;
  border-radius: 999rpx;
  background: #EBEBEB;
}

.sheet-title {
  display: block;
  margin-bottom: 32rpx;
  color: #1A1A1A;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.5;
}

.edit-input {
  width: 100%;
  height: 88rpx;
  margin-bottom: 32rpx;
  padding: 0 32rpx;
  border-radius: 20rpx;
  background: #F7F8FA;
  box-sizing: border-box;
  color: #1A1A1A;
  font-size: 28rpx;
}

.sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
}

.save-button,
.ghost-button {
  min-width: 128rpx;
  height: 88rpx;
  margin: 0;
  padding: 0 32rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 88rpx;
}

.save-button {
  background: #2D6A4F;
  color: #FFFFFF;
}

.ghost-button {
  background: #F7F8FA;
  color: #737373;
}
</style>
