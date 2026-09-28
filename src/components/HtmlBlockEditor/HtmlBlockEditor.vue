<template>
  <view class="hbe">
    <view class="hbe-head">
      <text class="hbe-title">{{ title }}</text>
      <view class="hbe-actions" @click="openMenu">
        <text class="hbe-actions-text">操作</text>
        <text class="hbe-actions-arrow">▾</text>
      </view>
    </view>

    <view class="hbe-body">
      <view v-if="!blocks.length" class="hbe-empty">暂无内容，点右上角「操作」添加</view>

      <view v-for="(block, bi) in blocks" :key="block.id" class="hbe-block">
        <view class="hbe-block-bar">
          <text class="hbe-type">{{ typeLabel(block.type) }}</text>
          <view class="hbe-block-ops">
            <text v-if="bi > 0" class="link" @click="moveBlock(bi, -1)">上移</text>
            <text v-if="bi < blocks.length - 1" class="link" @click="moveBlock(bi, 1)">下移</text>
            <text class="link danger" @click="removeBlock(bi)">删除</text>
          </view>
        </view>

        <textarea
          v-if="block.type === 'p' || block.type === 'h3'"
          class="hbe-textarea"
          :class="{ 'is-h3': block.type === 'h3' }"
          :value="block.text"
          :placeholder="block.type === 'h3' ? '小标题' : '段落内容'"
          auto-height
          @input="onTextInput(bi, $event)"
        />

        <view v-else class="hbe-list">
          <view v-for="(item, ii) in block.items" :key="ii" class="hbe-li">
            <text class="hbe-bullet">{{ block.type === 'ol' ? `${ii + 1}.` : '•' }}</text>
            <input
              class="hbe-li-input"
              :value="item"
              placeholder="列表项"
              @input="onItemInput(bi, ii, $event)"
            />
            <text class="link danger sm" @click="removeItem(bi, ii)">删</text>
          </view>
          <view class="hbe-add-item" @click="addItem(bi)">＋ 添加条目</view>
        </view>
      </view>
    </view>

    <!-- 弹层经 root-portal 挂到页面根，避免被 PageLayout 底栏盖住 -->
    <!-- #ifdef MP-WEIXIN -->
    <root-portal v-if="pasteVisible || sourceVisible">
    <!-- #endif -->
      <view v-if="pasteVisible" class="hbe-mask" @click="pasteVisible = false">
        <view class="hbe-dialog" @click.stop>
          <text class="hbe-d-title">粘贴 HTML</text>
          <text class="hbe-d-desc">粘贴后会自动识别段落 / 有序 / 无序列表</text>
          <textarea v-model="pasteText" class="hbe-paste" placeholder="粘贴 HTML，如 ul / ol / p 片段" />
          <view class="hbe-d-row">
            <label class="hbe-check" @click="pasteReplace = !pasteReplace">
              <text class="box">{{ pasteReplace ? '☑' : '☐' }}</text>
              <text>替换现有内容</text>
            </label>
          </view>
          <view class="hbe-d-actions">
            <button class="hbe-btn ghost" @click="pasteVisible = false">取消</button>
            <button class="hbe-btn" @click="applyPaste">识别并填入</button>
          </view>
        </view>
      </view>

      <view v-if="sourceVisible" class="hbe-mask" @click="sourceVisible = false">
        <view class="hbe-dialog" @click.stop>
          <text class="hbe-d-title">HTML 源码</text>
          <textarea :value="modelValue" class="hbe-paste" disabled />
          <view class="hbe-d-actions">
            <button class="hbe-btn ghost" @click="sourceVisible = false">关闭</button>
            <button class="hbe-btn" @click="copySource">复制</button>
          </view>
        </view>
      </view>
    <!-- #ifdef MP-WEIXIN -->
    </root-portal>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  parseHtmlToBlocks,
  blocksToHtml,
  createBlock,
  mergePastHtml
} from '@/utils/htmlBlocks'

const props = defineProps({
  title: { type: String, default: '' },
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const blocks = ref([])
const syncing = ref(false)
const pasteVisible = ref(false)
const pasteText = ref('')
const pasteReplace = ref(false)
const sourceVisible = ref(false)

const TYPE_LABEL = {
  p: '段落',
  h3: '小标题',
  ul: '无序列表',
  ol: '有序列表'
}

function typeLabel(t) {
  return TYPE_LABEL[t] || t
}

function loadFromHtml(html) {
  syncing.value = true
  blocks.value = parseHtmlToBlocks(html)
  syncing.value = false
}

function emitHtml() {
  if (syncing.value) return
  emit('update:modelValue', blocksToHtml(blocks.value))
}

watch(
  () => props.modelValue,
  (val) => {
    const next = blocksToHtml(blocks.value)
    if (val === next) return
    loadFromHtml(val)
  },
  { immediate: true }
)

function onTextInput(bi, e) {
  const v = e?.detail?.value ?? ''
  blocks.value[bi].text = v
  emitHtml()
}

function onItemInput(bi, ii, e) {
  const v = e?.detail?.value ?? ''
  const items = blocks.value[bi].items.slice()
  items[ii] = v
  blocks.value[bi].items = items
  emitHtml()
}

function addItem(bi) {
  blocks.value[bi].items = [...(blocks.value[bi].items || []), '']
  emitHtml()
}

function removeItem(bi, ii) {
  const items = blocks.value[bi].items.slice()
  items.splice(ii, 1)
  if (!items.length) items.push('')
  blocks.value[bi].items = items
  emitHtml()
}

function addBlock(type) {
  blocks.value = [...blocks.value, createBlock(type)]
  emitHtml()
}

function removeBlock(bi) {
  const next = blocks.value.slice()
  next.splice(bi, 1)
  blocks.value = next.length ? next : [createBlock('p')]
  emitHtml()
}

function moveBlock(bi, delta) {
  const to = bi + delta
  if (to < 0 || to >= blocks.value.length) return
  const next = blocks.value.slice()
  const [row] = next.splice(bi, 1)
  next.splice(to, 0, row)
  blocks.value = next
  emitHtml()
}

function openMenu() {
  uni.showActionSheet({
    itemList: ['添加段落', '添加无序列表', '添加有序列表', '添加小标题', '粘贴 HTML 识别', '查看/复制 HTML'],
    success: (res) => {
      const i = res.tapIndex
      if (i === 0) addBlock('p')
      else if (i === 1) addBlock('ul')
      else if (i === 2) addBlock('ol')
      else if (i === 3) addBlock('h3')
      else if (i === 4) {
        pasteText.value = ''
        pasteReplace.value = false
        pasteVisible.value = true
      } else if (i === 5) {
        sourceVisible.value = true
      }
    }
  })
}

function applyPaste() {
  const html = String(pasteText.value || '').trim()
  if (!html) {
    uni.showToast({ title: '请粘贴内容', icon: 'none' })
    return
  }
  blocks.value = mergePastHtml(blocks.value, html, { replace: pasteReplace.value })
  emitHtml()
  pasteVisible.value = false
  uni.showToast({ title: '已识别填入', icon: 'success' })
}

function copySource() {
  const text = props.modelValue || ''
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.hbe {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
  margin-bottom: 24rpx;
}

.hbe-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  border-bottom: 1rpx solid $border-color;
  background: #fffaf6;
}

.hbe-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}

.hbe-actions {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 107, 53, 0.1);
}

.hbe-actions-text {
  font-size: 24rpx;
  color: $primary-color;
  font-weight: 600;
}

.hbe-actions-arrow {
  font-size: 20rpx;
  color: $primary-color;
}

.hbe-body {
  padding: 16rpx 20rpx 24rpx;
}

.hbe-empty {
  text-align: center;
  color: $text-light;
  font-size: 24rpx;
  padding: 32rpx 0;
}

.hbe-block {
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: $bg-color;
  border-radius: 16rpx;
}

.hbe-block-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.hbe-type {
  font-size: 22rpx;
  color: $primary-color;
  font-weight: 600;
}

.hbe-block-ops {
  display: flex;
  gap: 16rpx;
}

.link {
  font-size: 22rpx;
  color: $primary-color;
}

.link.danger {
  color: #e74c3c;
}

.link.sm {
  font-size: 22rpx;
  padding: 0 4rpx;
}

.hbe-textarea {
  width: 100%;
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.hbe-textarea.is-h3 {
  font-weight: 700;
  font-size: 28rpx;
}

.hbe-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.hbe-li {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.hbe-bullet {
  width: 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: $text-secondary;
  flex-shrink: 0;
}

.hbe-li-input {
  flex: 1;
  height: 68rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
}

.hbe-add-item {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: $primary-color;
  padding: 8rpx 0;
}

.hbe-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: $z-index-popup;
  display: flex;
  align-items: flex-end;
}

.hbe-dialog {
  width: 100%;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.hbe-d-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.hbe-d-desc {
  display: block;
  font-size: 22rpx;
  color: $text-light;
  margin-bottom: 16rpx;
}

.hbe-paste {
  width: 100%;
  min-height: 280rpx;
  background: $bg-color;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 24rpx;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.hbe-d-row {
  margin-bottom: 16rpx;
}

.hbe-check {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: $text-secondary;
}

.hbe-d-actions {
  display: flex;
  gap: 16rpx;
}

.hbe-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background: $primary-color;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.hbe-btn.ghost {
  background: #eee;
  color: #666;
}
</style>
