<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!recipe" class="empty">菜谱不存在或尚未通过审核</view>
    <block v-else>
      <view class="hero">
        <image class="hero-img" :src="cover" mode="aspectFill" />
        <view class="shade" />
        <view class="hero-copy">
          <text class="hero-title">{{ recipe.title }}</text>
          <view class="pills">
            <view class="pill">
              <view class="dot" :class="diffKey" />
              <text>{{ recipe.difficultyText || '家常' }}</text>
            </view>
            <view class="pill">⏱ {{ timeText }}</view>
            <view class="pill">🔥 {{ recipe.calories ? recipe.calories + ' kcal' : '热量待计' }}</view>
          </view>
        </view>
      </view>

      <view class="body">
        <view class="stat-card">
          <view class="stat like" :class="{ on: status.liked }" @click="onLike">
            <text class="stat-ico">♡</text>
            <text class="stat-num">{{ recipe.likes || 0 }}</text>
            <text class="stat-lab">喜欢</text>
          </view>
          <view class="stat fav" :class="{ on: status.favorited }" @click="onFavorite">
            <text class="stat-ico">☆</text>
            <text class="stat-num">{{ recipe.favorites || 0 }}</text>
            <text class="stat-lab">收藏</text>
          </view>
          <view class="stat made" :class="{ on: status.cooked }" @click="onCooked">
            <text class="stat-ico">✓</text>
            <text class="stat-num">{{ recipe.cooked || 0 }}</text>
            <text class="stat-lab">做过</text>
          </view>
        </view>

        <view v-if="recipe.summary" class="card">
          <view class="sec-h">
            <view class="sec-ico">📖</view>
            <text class="card-title">菜品介绍</text>
          </view>
          <text class="desc">{{ recipe.summary }}</text>
        </view>

        <view class="card">
          <view class="sec-h">
            <view class="sec-ico">🧺</view>
            <text class="card-title">准备食材</text>
            <view class="stepper">
              <view class="step-btn" :class="{ off: servings <= 1 }" @click="changeServings(-1)">−</view>
              <text class="step-val">{{ servings }} 份</text>
              <view class="step-btn" :class="{ off: servings >= 6 }" @click="changeServings(1)">＋</view>
            </view>
          </view>
          <text v-for="(line, index) in cook.calcIntro" :key="'intro-' + index" class="calc-line">{{ line }}</text>
          <view v-if="!cook.ingredients.length && recipe.ingredientsHtml" class="rich">
            <rich-text :nodes="recipe.ingredientsHtml" />
          </view>
          <view
            v-for="(item, index) in cook.ingredients"
            :key="index"
            class="ing"
            :class="{ done: checkedIng[index] }"
            @click="toggleIng(index)"
          >
            <view class="box">{{ checkedIng[index] ? '✓' : '' }}</view>
            <view class="ing-main">
              <text class="ing-name">{{ item.name }}</text>
              <text v-if="item.note" class="ing-note">{{ item.note }}</text>
            </view>
            <text v-if="qtyText(item)" class="ing-qty">{{ qtyParts(item).num }}<text v-if="qtyParts(item).unit" class="qty-u">{{ qtyParts(item).unit }}</text></text>
          </view>
          <view v-if="cook.tools.length" class="tool-row">
            <text v-for="(tool, index) in cook.tools" :key="index" class="tool">{{ tool }}</text>
          </view>
          <text v-for="(line, index) in portionNotes" :key="'note-' + index" class="calc-line">{{ line }}</text>
        </view>

        <view id="cook-steps" class="card">
          <view class="sec-h">
            <view class="sec-ico">👨‍🍳</view>
            <text class="card-title">烹饪步骤</text>
          </view>
          <view v-if="cook.steps.length" class="step-progress">
            <view class="bar">
              <view class="bar-fill" :style="{ width: progress + '%' }" />
            </view>
            <text class="progress-text">{{ doneCount }}/{{ cook.steps.length }}</text>
          </view>
          <view v-if="!cook.steps.length && recipe.stepsHtml" class="rich">
            <rich-text :nodes="recipe.stepsHtml" />
          </view>
          <view
            v-for="(step, index) in cook.steps"
            :key="index"
            class="step"
            @click="toggleStep(index)"
          >
            <step-mark
              :variant="stepStyle"
              :icon="step.icon"
              :color="step.color"
              :color-deep="step.colorDeep"
              :index="index"
              :done="!!checkedSteps[index]"
              :current="currentStep === index"
              :last="index === cook.steps.length - 1"
            />
            <view class="step-main">
              <text class="action-title" :class="{ done: checkedSteps[index] }">{{ step.actionTitle }}</text>
              <text v-if="step.parts.length" class="step-text" :class="{ done: checkedSteps[index] }">
                <text v-for="(part, partIndex) in step.parts" :key="partIndex" :class="part.hl ? 'hl' : ''">{{ part.text }}</text>
              </text>
              <view v-if="step.tip" class="tip">💡 {{ step.tip }}</view>
            </view>
          </view>
        </view>

        <view class="card">
          <view v-if="cook.notes.length" class="sec-h">
            <view class="sec-ico">💡</view>
            <text class="card-title">小贴士</text>
          </view>
          <view
            v-for="(line, index) in cook.notes"
            :key="index"
            class="tip-li"
          >
            <text class="tip-no">{{ index + 1 }}</text>
            <text class="tip-tx">{{ line }}</text>
          </view>
          <view class="suggest" hover-class="is-pressed" :hover-stay-time="180" @click="goFeedback">
            <text>发现流程可以改进？提交建议</text>
          </view>
        </view>
      </view>
    </block>

    <view class="back" :style="{ top: (statusBarHeight + 8) + 'px' }" @click="back">‹</view>

    <view v-if="recipe" class="dock">
      <view class="dock-inner">
        <view class="dock-copy">
          <text class="l1">{{ progressL1 }}</text>
          <text class="l2">{{ progressL2 }}</text>
        </view>
        <view class="dock-btn" :class="{ gold: allDone }" @click="onDock">
          {{ allDone ? '✓ 标记做过' : '开始做菜' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getRecipeDetail } from '@/services/recipe'
import { addHistory, getRecipeStatus, toggleLike, toggleFavorite, toggleCooked, markMade } from '@/services/userRecipe'
import { getCoverTempUrl } from '@/utils/index'
import { getRecipePlaceholder } from '@/utils/recipePlaceholder'
import { prepareRecipeShare } from '@/utils/recipeShare'
import { showApiError } from '@/utils/apiError'
import { getStatusBarHeight } from '@/utils/system'
import StepMark from '@/components/step-mark/step-mark.vue'
import { estimateMinutes, formatQty, normalizeCook, scalePortionText } from '@/utils/recipeCook'

const stepStyle = 'styleA'

const statusBarHeight = getStatusBarHeight()
const recipe = ref(null)
const loading = ref(true)
const status = ref({ liked: false, favorited: false, cooked: false })
const recipeId = ref(0)
const cover = ref(getRecipePlaceholder())
const servings = ref(1)
const checkedIng = ref([])
const checkedSteps = ref([])
const busy = { like: false, fav: false, cook: false, made: false }

const cook = computed(() => normalizeCook(recipe.value || {}))
const diffKey = computed(() => recipe.value?.difficultyKey || 'medium')
const timeText = computed(() => estimateMinutes(recipe.value, cook.value.steps))
const doneCount = computed(() => checkedSteps.value.filter(Boolean).length)
const currentStep = computed(() => checkedSteps.value.findIndex((done) => !done))
const progress = computed(() => {
  const total = cook.value.steps.length
  if (!total) return 0
  return Math.round((doneCount.value / total) * 100)
})
const allDone = computed(() => cook.value.steps.length > 0 && doneCount.value === cook.value.steps.length)
const portionNotes = computed(() => (cook.value.calcNotes || []).map((line) => scalePortionText(line, servings.value)))
const progressL1 = computed(() => {
  const total = cook.value.steps.length
  if (!total) return '准备好食材，开始做菜'
  if (allDone.value) return '全部完成，太棒了！'
  if (!doneCount.value) return '准备好食材，开始做菜'
  return `已完成 ${doneCount.value} 步，继续加油`
})
const progressL2 = computed(() => {
  const total = cook.value.steps.length
  return `步骤 ${doneCount.value}/${total} · ${timeText.value}`
})

function syncShare() {
  if (recipe.value) prepareRecipeShare(recipe.value)
}

function storageKey() {
  return `recipe-prep:${recipeId.value}`
}

function readPrep() {
  try {
    const saved = uni.getStorageSync(storageKey())
    return saved && typeof saved === 'object' ? saved : {}
  } catch (error) {
    return {}
  }
}

function applyPrep() {
  const saved = readPrep()
  const portion = Number(saved.servings) || 1
  servings.value = Math.min(6, Math.max(1, portion))
  const ing = saved.ingredients || {}
  const steps = saved.steps || {}
  checkedIng.value = cook.value.ingredients.map((_, index) => !!ing[index])
  checkedSteps.value = cook.value.steps.map((_, index) => !!steps[index])
}

function savePrep() {
  if (!recipeId.value) return
  const ingredients = {}
  const steps = {}
  checkedIng.value.forEach((on, index) => {
    if (on) ingredients[index] = true
  })
  checkedSteps.value.forEach((on, index) => {
    if (on) steps[index] = true
  })
  uni.setStorageSync(storageKey(), { servings: servings.value, ingredients, steps })
}

function qtyText(item) {
  return formatQty(item.qty, item.unit, servings.value)
}

function qtyParts(item) {
  const text = qtyText(item)
  if (!text) return { num: '', unit: '' }
  const mixed = /g/i.test(text) && /kg/i.test(text)
  const match = mixed ? null : String(text).match(/^(.*?)([a-zA-Z\u4e00-\u9fff]+)$/)
  if (!match || !match[1]) return { num: text, unit: '' }
  return { num: match[1], unit: match[2] }
}

function changeServings(delta) {
  const next = Math.min(6, Math.max(1, servings.value + delta))
  if (next === servings.value) return
  servings.value = next
  savePrep()
}

function toggleIng(index) {
  const next = checkedIng.value.slice()
  next[index] = !next[index]
  checkedIng.value = next
  savePrep()
}

function toggleStep(index) {
  const next = checkedSteps.value.slice()
  next[index] = !next[index]
  checkedSteps.value = next
  savePrep()
}

async function load(id) {
  loading.value = true
  cover.value = getRecipePlaceholder()
  try {
    const [detail, st] = await Promise.all([
      getRecipeDetail(id),
      getRecipeStatus(id)
    ])
    if (detail.code === 200) {
      recipe.value = detail.data
      const temp = await getCoverTempUrl(detail.data?.coverImage)
      cover.value = temp || getRecipePlaceholder(detail.data?.categorySlug)
      applyPrep()
      syncShare()
      addHistory(id).catch(() => {})
    } else {
      recipe.value = null
      showApiError(detail, '菜谱不存在或尚未通过审核')
    }
    if (st.code === 200) status.value = st.data || status.value
  } catch (error) {
    showApiError(error, '加载失败')
  } finally {
    loading.value = false
  }
}

async function runToggle(key, field, request) {
  if (busy[key] || !recipe.value) return
  busy[key] = true
  const started = Date.now()
  const prevOn = field === 'likes' ? status.value.liked : field === 'favorites' ? status.value.favorited : status.value.cooked
  const prevCount = recipe.value[field] || 0
  const nextOn = !prevOn
  if (field === 'likes') status.value.liked = nextOn
  else if (field === 'favorites') status.value.favorited = nextOn
  else status.value.cooked = nextOn
  recipe.value[field] = Math.max(prevCount + (nextOn ? 1 : -1), 0)
  try {
    const res = await request(recipeId.value)
    if (res.code !== 200) throw res
    const active = !!res.data?.active
    if (field === 'likes') status.value.liked = active
    else if (field === 'favorites') status.value.favorited = active
    else status.value.cooked = active
    if (typeof res.data?.count === 'number') recipe.value[field] = res.data.count
  } catch (error) {
    if (field === 'likes') status.value.liked = prevOn
    else if (field === 'favorites') status.value.favorited = prevOn
    else status.value.cooked = prevOn
    recipe.value[field] = prevCount
    showApiError(error)
  } finally {
    const wait = Math.max(0, 300 - (Date.now() - started))
    setTimeout(() => {
      busy[key] = false
    }, wait)
  }
}

function onLike() {
  runToggle('like', 'likes', toggleLike)
}

function onFavorite() {
  runToggle('fav', 'favorites', toggleFavorite)
}

function onCooked() {
  runToggle('cook', 'cooked', toggleCooked)
}

function startCook() {
  const query = uni.createSelectorQuery()
  query.select('#cook-steps').boundingClientRect()
  query.selectViewport().scrollOffset()
  query.exec((res) => {
    const rect = res && res[0]
    const viewport = res && res[1]
    if (!rect) return
    uni.pageScrollTo({
      scrollTop: rect.top + ((viewport && viewport.scrollTop) || 0) - 24,
      duration: 300
    })
  })
}

async function onMarkMade() {
  if (busy.made) return
  busy.made = true
  try {
    const res = await markMade(recipeId.value)
    if (res.code !== 200) throw res
    status.value.cooked = true
    if (typeof res.data?.count === 'number') recipe.value.cooked = res.data.count
    uni.showToast({ title: res.data?.message || '已记入做过的菜', icon: 'none' })
  } catch (error) {
    showApiError(error)
  } finally {
    setTimeout(() => {
      busy.made = false
    }, 300)
  }
}

function onDock() {
  if (allDone.value) onMarkMade()
  else startCook()
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/me/feedback' })
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/index/index' })
}

onLoad((query) => {
  recipeId.value = Number(query.id)
  if (recipeId.value) load(recipeId.value)
})

onShow(() => {
  syncShare()
})
</script>

<style scoped>
.page {
  min-height: 100%;
  background: #F7F8FA;
}

.hero {
  position: relative;
  height: 596rpx;
  background: #E8E8E8;
}

.hero-img {
  width: 100%;
  height: 596rpx;
  display: block;
}

.shade {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.32) 0%, rgba(0, 0, 0, 0) 34%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.52) 100%);
}

.hero-copy {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  bottom: 28rpx;
}

.hero-title {
  display: block;
  color: #FFFFFF;
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
  line-height: 68rpx;
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
}

.pill {
  display: flex;
  align-items: center;
  height: 52rpx;
  margin: 0 16rpx 8rpx 0;
  padding: 0 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 52rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 8rpx;
  border-radius: 50%;
  background: #FFFFFF;
}

.dot.easy {
  background: #52C41A;
}

.dot.medium {
  background: #FAAD14;
}

.dot.hard {
  background: #F5222D;
}

.back {
  position: fixed;
  left: 24rpx;
  z-index: 20;
  width: 64rpx;
  height: 64rpx;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  color: #FFFFFF;
  font-size: 40rpx;
  line-height: 64rpx;
  text-align: center;
}

.body {
  padding: 28rpx 32rpx calc(220rpx + env(safe-area-inset-bottom));
}

.stat-card,
.card {
  margin-bottom: 24rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.stat-card {
  display: flex;
  padding: 24rpx 0;
}

.card {
  padding: 30rpx 32rpx;
}

.stat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  color: rgba(0, 0, 0, 0.55);
}

.stat + .stat::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: rgba(0, 0, 0, 0.08);
}

.stat-ico {
  font-size: 44rpx;
  line-height: 48rpx;
}

.stat-num {
  margin-top: 6rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 26rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.stat-lab {
  margin-top: 2rpx;
  font-size: 22rpx;
  line-height: 32rpx;
}

.stat.like.on {
  color: #E5484D;
}

.stat.fav.on {
  color: #E8A33D;
}

.stat.made.on {
  color: #2D6A4F;
}

.stat.on .stat-num,
.stat.on .stat-lab {
  color: inherit;
}

.sec-h {
  display: flex;
  align-items: center;
}

.sec-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52rpx;
  height: 52rpx;
  margin-right: 16rpx;
  border-radius: 16rpx;
  background: #E8F3EE;
  font-size: 26rpx;
  line-height: 52rpx;
  text-align: center;
}

.card-title {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.9);
  font-size: 32rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.desc {
  display: block;
  margin-top: 20rpx;
  color: rgba(0, 0, 0, 0.9);
  font-size: 28rpx;
  line-height: 1.8;
  text-align: justify;
}

.calc-line {
  display: block;
  margin-top: 16rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 26rpx;
  line-height: 1.7;
}

.stepper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 6rpx;
  border-radius: 32rpx;
  background: #E8F3EE;
}

.step-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 26rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 6rpx rgba(45, 106, 79, 0.18);
  color: #2D6A4F;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 56rpx;
  text-align: center;
}

.step-btn.off {
  color: #C2CBC6;
  box-shadow: none;
}

.step-val {
  min-width: 88rpx;
  color: #2D6A4F;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 56rpx;
  text-align: center;
}

.ing {
  display: flex;
  align-items: flex-start;
  padding: 22rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.sec-h + .ing,
.calc-line + .ing {
  margin-top: 8rpx;
}

.ing:last-of-type {
  border-bottom: none;
}

.box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  border: 3rpx solid #D9DBDF;
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 22rpx;
  line-height: 40rpx;
  text-align: center;
}

.ing.done .box {
  border-color: #2D6A4F;
  background: #2D6A4F;
}

.ing-main {
  flex: 1;
  min-width: 0;
}

.ing-name {
  display: block;
  color: rgba(0, 0, 0, 0.9);
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}

.ing-note {
  display: block;
  margin-top: 4rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 22rpx;
  line-height: 32rpx;
}

.ing.done .ing-name {
  color: rgba(0, 0, 0, 0.32);
  text-decoration: line-through;
}

.ing-qty {
  flex-shrink: 0;
  margin-left: 16rpx;
  color: #2D6A4F;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.qty-u {
  margin-left: 2rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 22rpx;
  font-weight: 500;
}

.tool-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 22rpx;
}

.tool {
  margin: 0 16rpx 12rpx 0;
  padding: 12rpx 22rpx;
  border-radius: 18rpx;
  background: #F7F8FA;
  color: rgba(0, 0, 0, 0.55);
  font-size: 24rpx;
  line-height: 34rpx;
}

.step-progress {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.step-progress + .step,
.step-progress + .rich {
  margin-top: 16rpx;
}

.progress-text {
  flex-shrink: 0;
  margin-left: 20rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 23rpx;
  font-weight: 600;
  line-height: 32rpx;
}

.bar {
  flex: 1;
  height: 12rpx;
  overflow: hidden;
  border-radius: 6rpx;
  background: rgba(0, 0, 0, 0.08);
}

.bar-fill {
  height: 12rpx;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #2D6A4F 0%, #40916C 100%);
}

.step {
  display: flex;
  align-items: flex-start;
  padding: 8rpx 0 28rpx;
}

.step-main {
  flex: 1;
  min-width: 0;
  padding-top: 6rpx;
}

.action-title {
  display: block;
  color: #1A1A1A;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.action-title.done {
  color: rgba(0, 0, 0, 0.32);
}

.step-text {
  display: block;
  margin-top: 6rpx;
  color: rgba(0, 0, 0, 0.72);
  font-size: 26rpx;
  line-height: 1.7;
}

.step-text.done {
  color: rgba(0, 0, 0, 0.32);
  text-decoration: line-through;
}

.hl {
  padding: 0 10rpx;
  border-radius: 8rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-weight: 700;
}

.tip {
  margin-top: 14rpx;
  padding: 16rpx 20rpx;
  border-radius: 18rpx;
  background: #FFF8E1;
  color: #8A6A1F;
  font-size: 24rpx;
  line-height: 1.65;
}

.rich {
  display: block;
  margin-top: 8rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 28rpx;
  line-height: 1.7;
}

.tip-li {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.tip-li:last-of-type {
  border-bottom: none;
}

.tip-no {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36rpx;
  height: 36rpx;
  margin-top: 6rpx;
  margin-right: 18rpx;
  border-radius: 12rpx;
  background: #E8F3EE;
  color: #2D6A4F;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 36rpx;
  text-align: center;
}

.tip-tx {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.9);
  font-size: 27rpx;
  line-height: 1.75;
}

.suggest {
  margin-top: 20rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 24rpx;
  line-height: 36rpx;
  text-align: center;
}

.suggest.is-pressed {
  opacity: 0.72;
}

.dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: 20rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(247, 248, 250, 0) 0%, rgba(247, 248, 250, 0.9) 30%, #F7F8FA 100%);
}

.dock-inner {
  display: flex;
  align-items: center;
  padding: 16rpx 16rpx 16rpx 36rpx;
  border-radius: 52rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16rpx 56rpx rgba(0, 0, 0, 0.13);
}

.dock-copy {
  flex: 1;
  min-width: 0;
}

.l1,
.l2 {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.l1 {
  color: rgba(0, 0, 0, 0.9);
  font-size: 27rpx;
  font-weight: 700;
  line-height: 38rpx;
}

.l2 {
  margin-top: 2rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 22rpx;
  line-height: 32rpx;
}

.dock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 44rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  box-shadow: 0 10rpx 28rpx rgba(45, 106, 79, 0.3);
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 88rpx;
}

.dock-btn.gold {
  background: linear-gradient(135deg, #E8A33D 0%, #F0B95E 100%);
  box-shadow: 0 10rpx 28rpx rgba(232, 163, 61, 0.3);
  color: #FFFFFF;
}

.empty {
  padding: 160rpx 32rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 28rpx;
  text-align: center;
}
</style>
