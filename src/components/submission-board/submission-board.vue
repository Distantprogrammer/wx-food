<template>
  <view>
    <view class="hero" hover-class="is-pressed" :hover-stay-time="180" @click="$emit('create')">
      <view class="hero-ico">{{ heroIcon }}</view>
      <view class="hero-copy">
        <text class="hero-title">{{ heroTitle }}</text>
        <text class="hero-desc">{{ heroDesc }}</text>
      </view>
      <text class="hero-arrow">›</text>
    </view>

    <view class="stat">
      <view class="stt">
        <text class="val ok">{{ counts.ok }}</text>
        <view class="lab"><view class="dot ok" /><text>已通过</text></view>
      </view>
      <view class="stt">
        <text class="val wait">{{ counts.wait }}</text>
        <view class="lab"><view class="dot wait" /><text>待审核</text></view>
      </view>
      <view class="stt">
        <text class="val no">{{ counts.no }}</text>
        <view class="lab"><view class="dot no" /><text>已驳回</text></view>
      </view>
    </view>

    <scroll-view scroll-x class="chips" :show-scrollbar="false">
      <view class="chip-row">
        <view
          v-for="chip in chips"
          :key="chip.key"
          class="chip"
          :class="{ active: filter === chip.key }"
          @click="filter = chip.key"
        >{{ chip.label }} {{ chip.count }}</view>
      </view>
    </scroll-view>

    <empty-state v-if="!shown.length" icon="📭" title="暂无相关提交" />
    <view v-else class="card">
      <block v-for="item in shown" :key="item.id">
        <view class="row" hover-class="is-pressed" :hover-stay-time="180" @click="$emit('open', item)" @longpress="$emit('remove', item)">
          <view class="thumb" :style="{ background: item.tint }">{{ item.icon }}</view>
          <view class="mid">
            <text class="title">{{ item.title }}</text>
            <text class="meta">{{ item.meta }}</text>
          </view>
          <view class="side">
            <text class="date">{{ item.date }}</text>
            <status-badge :tone="item.tone" :text="item.statusText" />
          </view>
        </view>
        <view v-if="item.tone === 'no' && item.reason" class="reason">↳ 驳回原因：{{ item.reason }}</view>
      </block>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import StatusBadge from '@/components/status-badge/status-badge.vue'

const props = defineProps({
  heroIcon: { type: String, default: '🍣' },
  heroTitle: { type: String, default: '' },
  heroDesc: { type: String, default: '' },
  items: { type: Array, default: () => [] }
})

defineEmits(['create', 'open', 'remove'])

const filter = ref('all')

const counts = computed(() => ({
  ok: props.items.filter((item) => item.tone === 'ok').length,
  wait: props.items.filter((item) => item.tone === 'wait').length,
  no: props.items.filter((item) => item.tone === 'no').length
}))

const chips = computed(() => [
  { key: 'all', label: '全部', count: props.items.length },
  { key: 'ok', label: '已通过', count: counts.value.ok },
  { key: 'wait', label: '待审核', count: counts.value.wait },
  { key: 'no', label: '已驳回', count: counts.value.no }
])

const shown = computed(() => (
  filter.value === 'all' ? props.items : props.items.filter((item) => item.tone === filter.value)
))
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  box-shadow: 0 12rpx 36rpx rgba(45, 106, 79, 0.3);
}

.hero.is-pressed {
  opacity: 0.92;
}

.hero-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 92rpx;
  height: 92rpx;
  margin-right: 26rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.2);
  font-size: 46rpx;
  line-height: 92rpx;
  text-align: center;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-title {
  display: block;
  color: #FFFFFF;
  font-size: 33rpx;
  font-weight: 800;
  line-height: 46rpx;
}

.hero-desc {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 23rpx;
  line-height: 34rpx;
}

.hero-arrow {
  margin-left: 12rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 36rpx;
  line-height: 46rpx;
}

.stat {
  display: flex;
  margin-bottom: 24rpx;
  padding: 22rpx 0;
  border-radius: 28rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.stt {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}

.stt + .stt {
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.val {
  font-size: 34rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.val.ok { color: #2D8A4E; }
.val.wait { color: #D97A1F; }
.val.no { color: #E05C5C; }

.lab {
  display: flex;
  align-items: center;
  margin-top: 4rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 21rpx;
  line-height: 32rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 8rpx;
  border-radius: 50%;
}

.dot.ok { background: #2D8A4E; }
.dot.wait { background: #D97A1F; }
.dot.no { background: #E05C5C; }

.chips {
  width: 100%;
  margin-bottom: 24rpx;
  white-space: nowrap;
}

.chip-row {
  display: inline-flex;
}

.chip {
  flex-shrink: 0;
  height: 56rpx;
  margin-right: 14rpx;
  padding: 0 24rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 28rpx;
  background: #FFFFFF;
  color: rgba(0, 0, 0, 0.55);
  font-size: 24rpx;
  font-weight: 500;
  line-height: 56rpx;
}

.chip.active {
  border-color: #2D6A4F;
  background: #2D6A4F;
  color: #FFFFFF;
  font-weight: 700;
}

.card {
  padding: 8rpx 30rpx;
  border-radius: 28rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.row.is-pressed {
  opacity: 0.72;
}

.thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 92rpx;
  height: 92rpx;
  margin-right: 22rpx;
  border-radius: 24rpx;
  font-size: 46rpx;
  line-height: 92rpx;
  text-align: center;
}

.mid {
  flex: 1;
  min-width: 0;
}

.title,
.meta {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.title {
  color: rgba(0, 0, 0, 0.9);
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.meta {
  margin-top: 6rpx;
  color: rgba(0, 0, 0, 0.55);
  font-size: 23rpx;
  line-height: 34rpx;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.date {
  margin-bottom: 10rpx;
  color: rgba(0, 0, 0, 0.32);
  font-size: 21rpx;
  line-height: 30rpx;
}

.reason {
  margin: 4rpx 0 24rpx;
  padding: 16rpx 22rpx;
  border-radius: 18rpx;
  background: #FDECEC;
  color: #B4443E;
  font-size: 23rpx;
  line-height: 1.6;
}
</style>
