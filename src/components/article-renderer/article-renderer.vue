<template>
  <view class="article">
    <block v-for="(node, index) in nodes" :key="index">
      <view v-if="node.type === 'h2'">
        <view :id="node.id" class="h2">
          <text class="h2-no">{{ node.no }}</text>
          <text class="h2-title">{{ node.text }}</text>
        </view>
        <view class="h2-bar" />
      </view>

      <view v-else-if="node.type === 'h3'" class="h3">
        <view class="h3-bar" />
        <text class="h3-title">{{ node.text }}</text>
      </view>

      <text v-else-if="node.type === 'p'" class="para">
        <text v-for="(span, spanIndex) in node.inlines" :key="spanIndex" :class="spanClass(span)">{{ span.text }}</text>
      </text>

      <view v-else-if="node.type === 'ul'" class="ul">
        <view v-for="(item, itemIndex) in node.items" :key="itemIndex" class="li">
          <view class="li-dot" />
          <text class="li-text">
            <text v-for="(span, spanIndex) in item" :key="spanIndex" :class="spanClass(span)">{{ span.text }}</text>
          </text>
        </view>
      </view>

      <view v-else-if="node.type === 'steps'" class="steps">
        <view
          v-for="(item, itemIndex) in node.items"
          :key="itemIndex"
          class="step"
          :class="{ 'is-last': itemIndex === node.items.length - 1 }"
        >
          <view class="step-line" />
          <text class="step-no">{{ itemIndex + 1 }}</text>
          <view class="step-body">
            <text class="step-text">
              <text v-for="(span, spanIndex) in item" :key="spanIndex" :class="spanClass(span)">{{ span.text }}</text>
            </text>
          </view>
        </view>
      </view>

      <view v-else-if="node.type === 'callout'" class="callout" :class="node.kind">
        <text class="c-i">{{ calloutIcon(node.kind) }}</text>
        <view class="c-main">
          <text class="c-t">{{ calloutTitle(node.kind) }}</text>
          <text v-for="(para, paraIndex) in node.paragraphs" :key="paraIndex" class="c-d">
            <text v-for="(span, spanIndex) in para" :key="spanIndex" :class="spanClass(span)">{{ span.text }}</text>
          </text>
        </view>
      </view>

      <view v-else-if="node.type === 'formula'" class="formula">
        <text class="f-tag">{{ node.tag || '公式' }}</text>
        <text v-for="(line, lineIndex) in node.lines" :key="lineIndex" class="f-row">{{ line }}</text>
      </view>

      <view v-else-if="node.type === 'code'" class="code">
        <view class="code-bar">
          <view class="code-dots">
            <view class="code-dot red" />
            <view class="code-dot yellow" />
            <view class="code-dot green" />
          </view>
          <text class="code-name">{{ node.filename }}</text>
          <text class="code-copy" @click="copyCode(node.text)">复制</text>
        </view>
        <text class="code-body">{{ node.text }}</text>
      </view>

      <view v-else-if="node.type === 'table'" class="table-card">
        <scroll-view scroll-x class="table-scroll" :show-scrollbar="false">
          <view class="table">
            <view class="tr">
              <text v-for="(cell, cellIndex) in node.headers" :key="cellIndex" class="th">{{ cell }}</text>
            </view>
            <view v-for="(row, rowIndex) in node.rows" :key="rowIndex" class="tr">
              <text v-for="(cell, cellIndex) in row" :key="cellIndex" class="td">{{ cell }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view v-else-if="node.type === 'figure'" class="figure">
        <image class="figure-img" :src="node.src" mode="widthFix" />
        <text v-if="node.alt" class="figure-cap">{{ node.alt }}</text>
      </view>

      <view v-else-if="node.type === 'qa'">
        <view
          v-for="(item, itemIndex) in node.items"
          :key="itemIndex"
          class="qa"
          :class="{ 'is-open': isOpen(index, itemIndex) }"
        >
          <view class="qa-q" @click="toggleQa(index, itemIndex)">
            <text class="qa-label">Q</text>
            <text class="qa-text">{{ item.q }}</text>
            <view class="qa-caret" />
          </view>
          <text v-if="isOpen(index, itemIndex)" class="qa-a">{{ item.a }}</text>
        </view>
      </view>
    </block>
    <view v-if="nodes.length" class="end-sign">· 完 ·</view>
  </view>
</template>

<script setup>
import { getCurrentInstance, ref, watch } from 'vue'
import { parseArticle, readingMinutes } from '@/utils/articleParse'

const props = defineProps({
  content: { type: String, default: '' }
})

const emit = defineEmits(['toc', 'meta'])
const instance = getCurrentInstance()
const nodes = ref([])
const qaOpen = ref({})
let lastCopyAt = 0

const calloutMap = {
  info: { icon: '💡', title: '结论' },
  warn: { icon: '⚠️', title: '注意' },
  success: { icon: '✅', title: '要点' },
  note: { icon: '📝', title: '笔记' }
}

function calloutIcon(kind) {
  return (calloutMap[kind] || calloutMap.note).icon
}

function calloutTitle(kind) {
  return (calloutMap[kind] || calloutMap.note).title
}

function spanClass(span) {
  if (span.type === 'ic' || span.type === 'mark' || span.type === 'strong') return span.type
  return ''
}

function qaKey(blockIndex, itemIndex) {
  return `${blockIndex}-${itemIndex}`
}

function isOpen(blockIndex, itemIndex) {
  return !!qaOpen.value[qaKey(blockIndex, itemIndex)]
}

function toggleQa(blockIndex, itemIndex) {
  const key = qaKey(blockIndex, itemIndex)
  qaOpen.value = { ...qaOpen.value, [key]: !qaOpen.value[key] }
}

function copyCode(text) {
  const now = Date.now()
  if (now - lastCopyAt < 500) return
  lastCopyAt = now
  uni.setClipboardData({
    data: text || '',
    success() {
      uni.showToast({ title: '已复制', icon: 'none' })
    }
  })
}

function scrollTo(id) {
  if (!id || !instance) return
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select(`#${id}`).boundingClientRect()
  query.selectViewport().scrollOffset()
  query.exec((res) => {
    const rect = res && res[0]
    const viewport = res && res[1]
    if (!rect) return
    uni.pageScrollTo({
      scrollTop: rect.top + ((viewport && viewport.scrollTop) || 0) - 72,
      duration: 300
    })
  })
}

watch(
  () => props.content,
  (value) => {
    nodes.value = parseArticle(value)
    qaOpen.value = {}
    emit(
      'toc',
      nodes.value
        .filter((node) => node.type === 'h2')
        .map((node) => ({ id: node.id, no: node.no, text: node.text }))
    )
    emit('meta', { minutes: readingMinutes(value) })
  },
  { immediate: true }
)

defineExpose({ scrollTo })
</script>

<style>
@import '../../styles/article.wxss';
</style>
