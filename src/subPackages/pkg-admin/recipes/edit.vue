<template>
  <PageLayout
    :title="form.recipeId ? '编辑菜品' : (form.auditStatus === 'pending' ? '新增菜品（待审）' : '新增菜品')"
    show-back
    background-color="#F6F7F2"
    :footer-height="120"
  >
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
        <text class="label">封面图</text>
        <view class="cover-wrap">
          <view class="cover-box" @click="onChooseCover">
            <image v-if="coverPreview" :src="coverPreview" mode="aspectFill" class="cover-img" />
            <view v-else class="cover-add">
              <text class="cover-plus">{{ uploading ? '…' : '＋' }}</text>
              <text class="cover-tip">{{ uploading ? '上传中' : '上传封面' }}</text>
            </view>
          </view>
          <view v-if="form.coverImage" class="cover-ops">
            <text class="cover-path">{{ form.coverImage }}</text>
            <text class="cover-del" @click="clearCover">删除</text>
          </view>
        </view>
      </view>
      <view class="field">
        <text class="label">简介</text>
        <textarea v-model="form.summary" class="textarea" auto-height placeholder="一句话介绍这道菜" />
      </view>

      <HtmlBlockEditor v-model="form.ingredientsHtml" title="原料和工具" />
      <HtmlBlockEditor v-model="form.calculationHtml" title="计算" />

      <view class="field">
        <text class="label">步骤动作</text>
        <view v-for="(step, index) in form.steps" :key="index" class="step-edit">
          <view class="action-row">
            <view
              v-for="action in stepActions"
              :key="action.key"
              class="action-chip"
              :class="{ on: step.actionKey === action.key }"
              :style="step.actionKey === action.key ? { background: action.color, color: action.colorDeep } : {}"
              @click="pickAction(index, action)"
            >{{ action.icon }} {{ action.actionTitle }}</view>
          </view>
          <view class="emoji-line">
            <input v-model="step.icon" class="emoji-input" maxlength="8" />
            <input v-model="step.actionTitle" class="input grow" placeholder="动作标题" />
          </view>
          <textarea v-model="step.text" class="textarea" auto-height placeholder="这一步怎么做，关键数字会自动高亮" />
          <text class="step-del" @click="removeStep(index)">删除这步</text>
        </view>
        <view class="add-step" @click="addStep">添加步骤</view>
      </view>

      <HtmlBlockEditor v-model="form.stepsHtml" title="步骤原文" />
      <HtmlBlockEditor v-model="form.notesHtml" title="补充说明" />
    </view>

    <template #footer>
      <view class="footer">
        <button class="btn ghost" @click="openPreview">预览</button>
        <button class="btn" :loading="saving" @click="onSave">保存</button>
      </view>
    </template>

    <RecipePreviewDrawer
      :visible="previewVisible"
      :recipe="previewRecipe"
      :cover-url="coverPreview"
      @close="previewVisible = false"
    />
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageLayout from '@/components/page-layout/PageLayout.vue'
import HtmlBlockEditor from '@/components/HtmlBlockEditor/HtmlBlockEditor.vue'
import RecipePreviewDrawer from '@/components/RecipePreviewDrawer/RecipePreviewDrawer.vue'
import { useAdminGuard } from '@/composables/useAdminGuard'
import { adminRecipeDetail, adminRecipeSave, adminCategoryList } from '@/services/admin'
import { uploadCloudFile } from '@/utils/cloud'
import { getCoverTempUrl, getDifficulty } from '@/utils/index'
import { showApiError } from '@/utils/apiError'
import { STEP_ACTIONS, stepForEditor } from '@/utils/recipeCook'

const allowUserSubmit = ref(false)
useAdminGuard({ allowUserSubmit: () => allowUserSubmit.value })

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const coverPreview = ref('')
const previewVisible = ref(false)
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
  notesHtml: '',
  auditStatus: 'approved',
  steps: []
})

const stepActions = STEP_ACTIONS

const previewRecipe = computed(() => {
  const diff = getDifficulty(form.difficulty)
  return {
    title: form.title,
    categorySlug: form.categorySlug,
    categoryName: form.categoryName,
    difficulty: Number(form.difficulty) || 3,
    difficultyKey: diff.key,
    difficultyText: diff.text,
    calories: Number(form.calories) || 0,
    coverImage: form.coverImage,
    summary: form.summary,
    likes: 0,
    favorites: 0,
    ingredientsHtml: form.ingredientsHtml,
    calculationHtml: form.calculationHtml,
    stepsHtml: form.stepsHtml,
    notesHtml: form.notesHtml,
    steps: cleanSteps()
  }
})

function cleanSteps() {
  return form.steps
    .map((step) => ({
      actionKey: step.actionKey,
      actionTitle: String(step.actionTitle || '').trim(),
      icon: step.icon,
      color: step.color,
      colorDeep: step.colorDeep,
      text: String(step.text || '').trim(),
      tip: String(step.tip || '').trim()
    }))
    .filter((step) => step.text || step.actionTitle)
}

function addStep() {
  form.steps.push(stepForEditor({ actionKey: 'cook', text: '' }))
}

function removeStep(index) {
  form.steps.splice(index, 1)
}

function pickAction(index, action) {
  const step = form.steps[index]
  const wasPreset = STEP_ACTIONS.some((item) => item.actionTitle === step.actionTitle)
  step.actionKey = action.key
  step.icon = action.icon
  step.color = action.color
  step.colorDeep = action.colorDeep
  if (!step.actionTitle || wasPreset) step.actionTitle = action.actionTitle
}

function openPreview() {
  if (!String(form.title || '').trim()) {
    uni.showToast({ title: '请先填写标题再预览', icon: 'none' })
    return
  }
  previewVisible.value = true
}

watch(
  () => form.coverImage,
  async (val) => {
    if (!val) {
      coverPreview.value = ''
      return
    }
    // 本地临时路径可直接预览；云路径走换链
    if (/^(wxfile:|https?:|blob:)/i.test(val) || val.startsWith('http://tmp')) {
      coverPreview.value = val
      return
    }
    coverPreview.value = await getCoverTempUrl(val)
  },
  { immediate: true }
)

function clearCover() {
  form.coverImage = ''
  coverPreview.value = ''
}

function onChooseCover() {
  if (uploading.value) return
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const file = res.tempFiles?.[0]
      const path = file?.tempFilePath
      if (!path) return
      coverPreview.value = path
      uploading.value = true
      try {
        const uploaded = await uploadCloudFile(path)
        form.coverImage = uploaded.coverImage
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        showApiError(e, '上传失败')
        // 失败时回退到已保存路径预览
        coverPreview.value = form.coverImage ? await getCoverTempUrl(form.coverImage) : ''
      } finally {
        uploading.value = false
      }
    }
  })
}

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
    form.auditStatus = d.auditStatus || 'approved'
    form.steps = Array.isArray(d.steps) ? d.steps.map(stepForEditor) : []
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
    const res = await adminRecipeSave({ ...form, steps: cleanSteps() })
    if (res.code === 200) {
      uni.showToast({
        title: form.auditStatus === 'pending' ? '已提交审核' : '已保存',
        icon: 'success'
      })
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
  if ((q.pending === '1' || q.owner === '1') && (!q.id || q.owner === '1')) {
    allowUserSubmit.value = true
  }
  if (q.pending === '1' && !q.id) {
    form.auditStatus = 'pending'
  }
  await loadCategories()
  if (q.id) {
    await loadDetail(Number(q.id))
    if (allowUserSubmit.value) {
      form.auditStatus = 'pending'
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.form { padding-bottom: 24rpx; }
.field { margin-bottom: 24rpx; }
.label { display: block; font-size: 24rpx; color: $text-secondary; margin-bottom: 10rpx; }
.input,
.picker {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1F2D2A;
  box-sizing: border-box;
}
.picker {
  display: flex;
  align-items: center;
  line-height: 1.4;
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  padding: 20rpx 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1F2D2A;
  box-sizing: border-box;
}

.cover-wrap { display: flex; flex-direction: column; gap: 12rpx; }
.cover-box {
  width: 240rpx;
  height: 240rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #FFFFFF;
  box-shadow: $shadow-sm;
}
.cover-img { width: 100%; height: 100%; }
.cover-add {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: 2rpx dashed #ffc4a8;
  border-radius: 16rpx;
  box-sizing: border-box;
  color: $primary-color;
}
.cover-plus { font-size: 48rpx; line-height: 1; }
.cover-tip { font-size: 24rpx; }
.cover-ops {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.cover-path {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cover-del { font-size: 24rpx; color: #e74c3c; flex-shrink: 0; }
.footer {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #E5E9E3;
}
.btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  background: #176B4A;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;

  &.ghost {
    flex: 0 0 200rpx;
    background: #EEF1EB;
    color: #1F2D2A;
    border: 1rpx solid #E5E9E3;
  }
}
.empty { text-align: center; color: #8A9590; padding: 80rpx; }
.step-edit {
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}
.action-row {
  display: flex;
  flex-wrap: wrap;
}
.action-chip {
  margin: 0 12rpx 12rpx 0;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #F3F4F6;
  color: #1A1A1A;
  font-size: 22rpx;
  line-height: 36rpx;
}
.emoji-line {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.emoji-input {
  width: 88rpx;
  height: 80rpx;
  margin-right: 12rpx;
  padding: 0;
  background: #F6F7F2;
  border-radius: 16rpx;
  font-size: 36rpx;
  text-align: center;
}
.grow { flex: 1; }
.step-del {
  display: block;
  margin-top: 8rpx;
  color: #E5484D;
  font-size: 24rpx;
}
.add-step {
  height: 72rpx;
  border-radius: 16rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 72rpx;
  text-align: center;
}
</style>
