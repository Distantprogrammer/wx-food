<template>
  <PageLayout
    title="用户管理"
    show-back
    background-color="#F6F7F2"
    :header-content-height="88"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
    @scrolltolower="loadMore"
  >
    <template #header-content>
      <view class="search-wrap">
        <view class="search-bar">
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索昵称"
            placeholder-class="search-ph"
            confirm-type="search"
            @confirm="reload"
          />
          <text class="search-btn" @click="reload">搜索</text>
        </view>
      </view>
    </template>

    <EmptyView v-if="!loading && !list.length" title="暂无用户" />
    <view v-for="item in list" :key="item.id" class="card">
      <view class="head">
        <view class="avatar">
          <image v-if="item.avatar" :src="item.avatar" mode="aspectFill" class="avatar-img" />
          <text v-else class="avatar-fallback">{{ (item.nickname || '用').slice(0, 1) }}</text>
        </view>
        <view class="info">
          <view class="name-row">
            <text class="name">{{ item.nickname || '未命名' }}</text>
            <text class="role" :class="{ admin: item.role === 1 }">{{ item.role === 1 ? '管理员' : '用户' }}</text>
            <text v-if="item.isSelf" class="self">我</text>
          </view>
          <text class="meta">openid ···{{ maskOpenid(item.openid) }}</text>
          <text class="meta">注册 {{ formatTime(item.createTime) }}</text>
        </view>
      </view>
      <view class="ops">
        <view class="ops-row">
          <text class="op" @click="openRename(item)">改名</text>
          <text
            v-if="!item.isSelf"
            class="op primary"
            @click="onToggleRole(item)"
          >{{ item.role === 1 ? '取消管理员' : '设为管理员' }}</text>
        </view>
        <view v-if="!item.isSelf" class="ops-row status-ops">
          <text class="op danger" @click="onDelete(item)">删除</text>
        </view>
      </view>
    </view>
    <view v-if="hasMore" class="more">上拉加载更多</view>

    <view v-if="renameVisible" class="mask" @click="renameVisible = false">
      <view class="dialog" @click.stop>
        <text class="d-title">修改名称</text>
        <input
          v-model="renameNickname"
          class="input"
          maxlength="20"
          placeholder="请输入昵称"
        />
        <view class="d-actions">
          <view class="d-btn ghost" @click="renameVisible = false">取消</view>
          <view class="d-btn" :class="{ busy: saving }" @click="onSaveRename">保存</view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import {
  adminUserList,
  adminUserUpdateNickname,
  adminUserUpdateRole,
  adminUserDelete
} from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const renameVisible = ref(false)
const renameNickname = ref('')
const renameTarget = ref(null)
const saving = ref(false)

function maskOpenid(openid) {
  const s = String(openid || '')
  if (s.length <= 6) return s || '-'
  return s.slice(-6)
}

function formatTime(t) {
  if (!t) return '-'
  try {
    const d = typeof t === 'object' && t.$date ? new Date(t.$date) : new Date(t)
    if (Number.isNaN(d.getTime())) return '-'
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  } catch (e) {
    return '-'
  }
}

async function load(reset = false, { silent } = {}) {
  if (loading.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const res = await adminUserList(
      {
        page: page.value,
        limit: 20,
        keyword: keyword.value.trim() || undefined
      },
      { silent: silent ?? (!reset && list.value.length > 0) }
    )
    if (res.code === 200) {
      const rows = res.data?.list || []
      list.value = reset ? rows : list.value.concat(rows)
      hasMore.value = !!res.data?.hasMore
    } else {
      showApiError(res, '加载失败')
    }
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function reload() {
  load(true)
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  load(false, { silent: true })
}

async function onRefresh() {
  refreshing.value = true
  await load(true, { silent: true })
  refreshing.value = false
}

function openRename(item) {
  renameTarget.value = item
  renameNickname.value = item.nickname || ''
  renameVisible.value = true
}

async function onSaveRename() {
  const item = renameTarget.value
  const nickname = renameNickname.value.trim()
  if (!item?.id) return
  if (!nickname) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await adminUserUpdateNickname(item.id, nickname)
    if (res.code === 200) {
      item.nickname = nickname
      renameVisible.value = false
      uni.showToast({ title: '已保存', icon: 'success' })
    } else {
      showApiError(res, '保存失败')
    }
  } catch (e) {
    showApiError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

function onToggleRole(item) {
  if (!item || item.isSelf) return
  const nextRole = item.role === 1 ? 2 : 1
  const title = nextRole === 1 ? '设为管理员' : '取消管理员'
  const content = nextRole === 1
    ? `确认将「${item.nickname || '该用户'}」设为管理员？`
    : `确认取消「${item.nickname || '该用户'}」的管理员权限？`
  uni.showModal({
    title,
    content,
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await adminUserUpdateRole(item.id, nextRole)
        if (res.code === 200) {
          item.role = nextRole
          uni.showToast({ title: '已更新', icon: 'success' })
        } else {
          showApiError(res, '操作失败')
        }
      } catch (e) {
        showApiError(e, '操作失败')
      }
    }
  })
}

function onDelete(item) {
  if (!item || item.isSelf) return
  uni.showModal({
    title: '删除用户',
    content: `确认删除「${item.nickname || '该用户'}」？将同时清理其收藏、喜欢、浏览与反馈记录。`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        const res = await adminUserDelete(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success' })
          load(true, { silent: true })
        } else {
          showApiError(res, '删除失败')
        }
      } catch (e) {
        showApiError(e, '删除失败')
      }
    }
  })
}

onShow(() => load(true))
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.search-wrap {
  padding: 0 24rpx 16rpx;
  background: $bg-card;
}

.search-bar {
  @include search-field;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: $search-height;
  line-height: $search-height;
  font-size: 26rpx;
  color: $text-primary;
}

.search-ph {
  color: $text-light;
}

.search-btn {
  flex-shrink: 0;
  padding: 0 18rpx;
  height: 52rpx;
  line-height: 52rpx;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 24rpx;
  font-weight: 650;
  @include pressed;
}

.card {
  @include workbench-card;
}

.head {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  background: $bg-soft;
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-fallback {
  font-size: 28rpx;
  font-weight: 700;
  color: $primary-color;
}

.info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 8rpx;
  min-width: 0;
}

.name {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  max-width: 100%;
  @include ellipsis(1);
}

.role {
  flex-shrink: 0;
  padding: 2rpx 12rpx;
  border-radius: $radius-sm;
  font-size: 20rpx;
  font-weight: 650;
  color: $text-secondary;
  background: $bg-muted;

  &.admin {
    color: $primary-color;
    background: $primary-soft;
  }
}

.self {
  flex-shrink: 0;
  padding: 2rpx 10rpx;
  border-radius: $radius-sm;
  font-size: 20rpx;
  color: $warning-color;
  background: $warning-soft;
  font-weight: 650;
}

.meta {
  display: block;
  font-size: 22rpx;
  color: $text-light;
  line-height: 1.5;
  @include ellipsis(1);
}

.ops {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid $border-color;
}

.ops-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12rpx;

  &.status-ops {
    margin-top: 12rpx;
  }
}

.op {
  @include op-chip;
}

.mask {
  position: fixed;
  inset: 0;
  z-index: $z-index-popup;
  background: $mask-scrim;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
  pointer-events: auto;
}

.dialog {
  width: 100%;
  max-width: 620rpx;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 32rpx 28rpx;
  border: 1rpx solid $border-color;
}

.d-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 24rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border-radius: $radius-sm;
  background: $bg-muted;
  border: 1rpx solid $border-color;
  font-size: 28rpx;
  color: $text-primary;
  box-sizing: border-box;
  margin-bottom: 28rpx;
}

.d-actions {
  display: flex;
  gap: 16rpx;
}

.d-btn {
  flex: 1;
  @include btn-primary;
  height: 80rpx;

  &.ghost {
    @include btn-ghost;
    height: 80rpx;
  }

  &.busy {
    opacity: 0.72;
    pointer-events: none;
  }
}

.more {
  text-align: center;
  color: $text-light;
  padding: 32rpx;
  font-size: 24rpx;
}
</style>
