<template>
  <PageLayout :title="form.recipeId ? '编辑菜品' : '新增菜品'" show-back background-color="#FFF8F0" :footer-height="120">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else class="form">
      <view class="field">
        <text class="label">标题 *</text>
        <input v-model="form.title" class="input" placeholder="菜名" />
      </view>
      <view class="field">
        <text class="label">分类</text>
        <picker :range="categoryLabels" :value="categoryIndex" @change="onCategoryChange">
          <view class="picker">{{ categoryLabels[categoryIndex] || '请选择分类' }}</view>
        </picker>
      </view>
      <view class="field">
        <text class="label">难度 (1-5)</text>
        <input v-model="form.difficulty" class="input" type="number" />
      </view>
      <view class="field">
        <text class="label">卡路里</text>
        <input v-model="form.calories" class="input" type="number" />
      </view>
      <view class="field">
        <text class="label">封面图路径</text>
        <input v-model="form.coverImage" class="input" placeholder="/download/recipe-images/xxx.jpeg" />
      </view>
      <view class="field">
        <text class="label">简介</text>
        <textarea v-model="form.summary" class="textarea" auto-height />
      </view>

      <HtmlBlockEditor v-model="form.ingredientsHtml" title="原料和工具" />
      <HtmlBlockEditor v-model="form.calculationHtml" title="计算" />
      <HtmlBlockEditor v-model="form.stepsHtml" title="步骤" />
      <HtmlBlockEditor v-model="form.notesHtml" title="补充说明" />
    </view>

    <template #footer>
      <view class="footer">
        <button class="btn" :loading="saving" @click="onSave">保存</button>
      </view>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import HtmlBlockEditor from '@/components/HtmlBlockEditor/HtmlBlockEditor.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminRecipeDetail, adminRecipeSave, adminCategoryList } from '@/services/admin'
import { showApiError } from '@/utils/apiError'

useAdminGuard()

const loading = ref(false)
const saving = ref(false)
const categories = ref([])
const form = reactive({
  recipeId: null,
  title: '',
  categorySlug: '',
  categoryName: '',
  difficulty: 3,
  calories: 0,
  coverImage: '',
  summary: '',
  ingredientsHtml: '',
  calculationHtml: '',
  stepsHtml: '',
  notesHtml: ''
})

const categoryLabels = computed(() => categories.value.map((c) => `${c.icon || ''} ${c.name}`.trim()))
const categoryIndex = computed(() => {
  const i = categories.value.findIndex((c) => c.slug === form.categorySlug)
  return i >= 0 ? i : 0
})

function onCategoryChange(e) {
  const idx = Number(e.detail.value) || 0
  const cat = categories.value[idx]
  if (!cat) return
  form.categorySlug = cat.slug
  form.categoryName = cat.name
}

async function loadCategories() {
  const res = await adminCategoryList()
  if (res.code === 200) {
    categories.value = res.data || []
    if (!form.categorySlug && categories.value[0]) {
      form.categorySlug = categories.value[0].slug
      form.categoryName = categories.value[0].name
    }
  }
}

async function loadDetail(id) {
  loading.value = true
  try {
    const res = await adminRecipeDetail(id)
    if (res.code !== 200 || !res.data) {
      showApiError(res, '加载失败')
      return
    }
    const d = res.data
    form.recipeId = d.id
    form.title = d.title || ''
    form.categorySlug = d.categorySlug || ''
    form.categoryName = d.categoryName || ''
    form.difficulty = d.difficulty || 3
    form.calories = d.calories || 0
    form.coverImage = d.coverImage || ''
    form.summary = d.summary || ''
    form.ingredientsHtml = d.ingredientsHtml || ''
    form.calculationHtml = d.calculationHtml || ''
    form.stepsHtml = d.stepsHtml || ''
    form.notesHtml = d.notesHtml || ''
  } catch (e) {
    showApiError(e, '加载失败')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (!String(form.title || '').trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await adminRecipeSave({ ...form })
    if (res.code === 200) {
      uni.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 500)
    } else {
      showApiError(res, '保存失败')
    }
  } catch (e) {
    showApiError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

onLoad(async (q) => {
  await loadCategories()
  if (q.id) await loadDetail(Number(q.id))
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.form { padding-bottom: 24rpx; }
.field { margin-bottom: 24rpx; }
.label { display: block; font-size: 24rpx; color: $text-secondary; margin-bottom: 10rpx; }
.input, .picker, .textarea {
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.textarea { min-height: 140rpx; width: 100%; }
.picker { color: #333; }
.footer {
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.empty { text-align: center; color: #999; padding: 80rpx; }
</style>
