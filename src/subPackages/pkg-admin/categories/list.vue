<template>
  <PageLayout title="分类管理" show-back background-color="#F6F7F2">
    <view class="toolbar">
      <view class="add" @click="openEdit()">＋ 新增分类</view>
    </view>

    <view v-if="loading && !list.length" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无分类</view>
    <view v-for="item in list" :key="item.slug" class="row">
      <view class="main" @click="openEdit(item)">
        <text class="icon">{{ item.icon || '🍽️' }}</text>
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="meta">{{ item.slug }} · sort {{ item.sort }}</text>
        </view>
      </view>
      <view class="ops">
        <text class="op" @click.stop="openEdit(item)">编辑</text>
        <text class="op danger" @click.stop="onDelete(item)">删除</text>
      </view>
    </view>

    <view v-if="showForm" class="mask" @click="showForm = false">
      <view class="dialog" @click.stop>
        <text class="d-title">{{ form._isNew ? '新增分类' : '编辑分类' }}</text>
        <input v-model="form.slug" class="input" :disabled="!form._isNew" placeholder="slug，如 soup" />
        <input v-model="form.name" class="input" placeholder="名称，如 汤类" />
        <input v-model="form.icon" class="input" placeholder="图标 emoji" />
        <input v-model="form.sort" class="input" type="number" placeholder="排序" />
        <view class="d-actions">
          <button class="d-btn ghost" @click="showForm = false">取消</button>
          <button class="d-btn" :loading="saving" @click="onSave">保存</button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminCategoryList, adminCategorySave, adminCategoryDelete } from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const list = ref([])
const loading = ref(false)
const showForm = ref(false)
const saving = ref(false)
const form = reactive({
  _isNew: true,
  slug: '',
  name: '',
  icon: '🍽️',
  sort: 0
})

async function load() {
  loading.value = true
  try {
    const res = await adminCategoryList()
    if (res.code === 200) list.value = res.data || []
    else showApiError(res, '加载失败')
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function openEdit(item) {
  if (item) {
    form._isNew = false
    form.slug = item.slug
    form.name = item.name
    form.icon = item.icon || '🍽️'
    form.sort = item.sort || 0
  } else {
    form._isNew = true
    form.slug = ''
    form.name = ''
    form.icon = '🍽️'
    form.sort = (list.value[list.value.length - 1]?.sort || 0) + 1
  }
  showForm.value = true
}

async function onSave() {
  if (!form.slug.trim() || !form.name.trim()) {
    uni.showToast({ title: '请填写 slug 和名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await adminCategorySave({
      slug: form.slug.trim(),
      name: form.name.trim(),
      icon: form.icon,
      sort: Number(form.sort) || 0
    })
    if (res.code === 200) {
      uni.showToast({ title: '已保存', icon: 'success' })
      showForm.value = false
      load()
    } else showApiError(res, '保存失败')
  } catch (e) {
    showApiError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

function onDelete(item) {
  uni.showModal({
    title: '删除分类',
    content: `确认删除「${item.name}」？分类下有菜谱时不可删。`,
    success: async (r) => {
      if (!r.confirm) return
      const res = await adminCategoryDelete(item.slug)
      if (res.code === 200) {
        uni.showToast({ title: '已删除', icon: 'success' })
        load()
      } else showApiError(res, '删除失败')
    }
  })
}

onShow(load)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
.toolbar { margin-bottom: 20rpx; }
.add {
  display: inline-block;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 28rpx;
  background: $primary-color;
  color: #fff;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
}
.main { flex: 1; display: flex; align-items: center; gap: 16rpx; min-width: 0; }
.icon { font-size: 40rpx; }
.name { display: block; font-size: 28rpx; font-weight: 600; }
.meta { display: block; font-size: 22rpx; color: $text-light; margin-top: 6rpx; }
.ops { display: flex; gap: 16rpx; }
.op { font-size: 24rpx; color: $primary-color; }
.op.danger { color: #e74c3c; }
.empty { text-align: center; color: #8A9590; padding: 48rpx; }

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}
.dialog {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}
.d-title { display: block; font-size: 32rpx; font-weight: 700; margin-bottom: 24rpx; }
.input {
  width: 100%;
  height: 80rpx;
  background: $bg-color;
  border-radius: 16rpx;
  padding: 0 24rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.d-actions { display: flex; gap: 16rpx; margin-top: 12rpx; }
.d-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background: $primary-color;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.d-btn.ghost { background: #EEF1EB; color: #66736E; }
</style>
