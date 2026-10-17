<template>
  <PageLayout
    title="内容管理"
    show-back
    background-color="#F7F8FA"
    :header-style="headStyle"
    :content-padding-x="32"
    :content-padding-top="28"
  >
    <view class="idc">
      <image v-if="userInfo?.avatar" class="ava-img" :src="userInfo.avatar" mode="aspectFill" />
      <view v-else class="ava">{{ avatarChar }}</view>
      <view class="id-main">
        <text class="id-name">{{ userInfo?.nickname || '管理员' }}</text>
        <view class="id-role">
          <text class="role">管理员</text>
          <text class="id-desc">内容组 · 全部权限</text>
        </view>
      </view>
      <view class="week">
        <text class="week-num">{{ weekNew }}</text>
        <text class="week-lab">本周新增</text>
      </view>
    </view>

    <view v-for="group in groups" :key="group.title">
      <text class="g-title">{{ group.title }}</text>
      <view class="mcard">
        <view
          v-for="item in group.items"
          :key="item.url"
          class="mrow"
          hover-class="is-pressed"
          :hover-stay-time="180"
          @click="go(item.url)"
        >
          <view class="m-ico" :style="{ background: item.tint }">{{ item.icon }}</view>
          <view class="m-mid">
            <text class="m-t">{{ item.title }}</text>
            <text class="m-d">{{ item.desc }}</text>
          </view>
          <text v-if="countOf(item.countKey) > 0" class="nb">{{ formatBadge(countOf(item.countKey)) }}</text>
          <text class="chev">›</text>
        </view>
      </view>
    </view>

    <view class="foot">🛡️ 管理操作将记录在操作日志中</view>
  </PageLayout>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useUserStore } from '@/store/user'
import { adminPendingSummary } from '@/services/admin'

const headStyle = { background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)' }
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const avatarChar = computed(() => (userInfo.value?.nickname || '管').slice(0, 1))
const pending = reactive({ recipes: 0, tips: 0, feedbacks: 0, weekNew: 0 })
const weekNew = computed(() => pending.weekNew)

const groups = [
  {
    title: '📚 内容管理',
    items: [
      { title: '菜品管理', desc: '增删改查菜谱', icon: '🍳', tint: '#FFF3E0', url: '/subPackages/pkg-admin/recipes/list' },
      { title: '技巧管理', desc: '增删改查烹饪技巧', icon: '📖', tint: '#E8F0FF', url: '/subPackages/pkg-admin/tips/list' },
      { title: '分类管理', desc: '增删改查菜谱分类', icon: '🗂️', tint: '#F3E8FF', url: '/subPackages/pkg-admin/categories/list' },
      { title: '公告管理', desc: '编辑「关于」页展示的公告', icon: '📢', tint: '#FFF8DC', url: '/subPackages/pkg-admin/notice/edit' }
    ]
  },
  {
    title: '✅ 审核中心',
    items: [
      { title: '审核菜谱', desc: '待审处理、同名比对与预览', icon: '🧾', tint: '#E9F7EC', url: '/subPackages/pkg-admin/recipes/audit', countKey: 'recipes' },
      { title: '审核技巧', desc: '待审处理、同名比对与预览', icon: '🔍', tint: '#E9F7EC', url: '/subPackages/pkg-admin/tips/audit', countKey: 'tips' }
    ]
  },
  {
    title: '👥 用户与数据',
    items: [
      { title: '用户反馈', desc: '查看用户提交的意见与建议', icon: '💬', tint: '#E8F4FD', url: '/subPackages/pkg-admin/feedback/list', countKey: 'feedbacks' },
      { title: '用户管理', desc: '分配管理员、改名、删除用户', icon: '👥', tint: '#FDECEC', url: '/subPackages/pkg-admin/users/list' },
      { title: '导入 / 更新种子数据', desc: '从本地种子批量导入内容', icon: '🌱', tint: '#E9F7EC', url: '/subPackages/pkg-admin/seed/index' }
    ]
  }
]

function countOf(key) {
  if (!key) return 0
  return Number(pending[key]) || 0
}

function formatBadge(count) {
  return count > 99 ? '99+' : String(count)
}

function go(url) {
  uni.navigateTo({ url })
}

async function loadPending() {
  try {
    const res = await adminPendingSummary({ silent: true })
    if (res.code === 200) {
      pending.recipes = Number(res.data?.recipes) || 0
      pending.tips = Number(res.data?.tips) || 0
      pending.feedbacks = Number(res.data?.feedbacks) || 0
      pending.weekNew = Number(res.data?.weekNew) || 0
    }
  } catch (error) {
    pending.weekNew = 0
  }
}

onLoad(() => {
  const role = userStore.userInfo?.role
  const allowed = Number(role) === 1 || role === 'admin'
  if (!allowed) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})

onShow(loadPending)
</script>

<style scoped>
.idc {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
  padding: 28rpx 30rpx;
  border-radius: 28rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.ava,
.ava-img {
  width: 92rpx;
  height: 92rpx;
  margin-right: 24rpx;
  border-radius: 50%;
}

.ava {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 92rpx;
  text-align: center;
}

.id-main {
  flex: 1;
  min-width: 0;
}

.id-name {
  display: block;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.9);
  font-size: 31rpx;
  font-weight: 800;
  line-height: 44rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.id-role {
  display: flex;
  align-items: center;
  margin-top: 6rpx;
}

.role {
  margin-right: 10rpx;
  padding: 2rpx 14rpx;
  border-radius: 12rpx;
  background: #2D6A4F;
  color: #FFFFFF;
  font-size: 19rpx;
  font-weight: 700;
  line-height: 28rpx;
}

.id-desc {
  color: rgba(0, 0, 0, 0.55);
  font-size: 23rpx;
  line-height: 32rpx;
}

.week {
  flex-shrink: 0;
  margin-left: 16rpx;
  text-align: right;
}

.week-num {
  display: block;
  color: #2D6A4F;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.week-lab {
  display: block;
  color: rgba(0, 0, 0, 0.32);
  font-size: 20rpx;
  line-height: 28rpx;
}

.g-title {
  display: block;
  margin: 32rpx 4rpx 18rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 26rpx;
  font-weight: 800;
  line-height: 40rpx;
}

.mcard {
  padding: 4rpx 30rpx;
  border-radius: 28rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.mrow {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.mrow:last-child {
  border-bottom: none;
}

.mrow.is-pressed {
  opacity: 0.7;
}

.m-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  margin-right: 24rpx;
  border-radius: 24rpx;
  font-size: 38rpx;
  line-height: 80rpx;
  text-align: center;
}

.m-mid {
  flex: 1;
  min-width: 0;
}

.m-t {
  display: block;
  color: rgba(0, 0, 0, 0.9);
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.m-d {
  display: block;
  overflow: hidden;
  margin-top: 4rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 23rpx;
  line-height: 34rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nb {
  flex-shrink: 0;
  min-width: 38rpx;
  height: 38rpx;
  margin-right: 12rpx;
  padding: 0 10rpx;
  border-radius: 19rpx;
  background: linear-gradient(135deg, #FF8A4C 0%, #F26B3A 100%);
  color: #FFFFFF;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 38rpx;
  text-align: center;
  box-sizing: border-box;
}

.chev {
  flex-shrink: 0;
  color: #C4C9CE;
  font-size: 32rpx;
  line-height: 40rpx;
}

.foot {
  margin-top: 36rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 22rpx;
  line-height: 34rpx;
  text-align: center;
}
</style>
