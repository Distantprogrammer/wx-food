<template>
  <view class="mark" :class="[variant, { done, current, last, pop: popping }]">
    <view v-if="!last" class="line" />
    <view class="ring" :class="{ conic: useConic }">
      <view class="badge" :style="badgeStyle">
        <text v-if="!done" class="emoji">{{ icon || '🍲' }}</text>
        <text v-else class="tick">✓</text>
        <view class="num" :style="numStyle">{{ index + 1 }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'styleA' },
  icon: { type: String, default: '🍲' },
  color: { type: String, default: '#FFF3E0' },
  colorDeep: { type: String, default: '#E8975C' },
  index: { type: Number, default: 0 },
  done: { type: Boolean, default: false },
  current: { type: Boolean, default: false },
  last: { type: Boolean, default: false }
})

const useConic = ref(false)
const popping = ref(false)
const armed = ref(false)

const badgeStyle = computed(() => {
  if (props.done) return {}
  if (props.variant === 'styleC') {
    return { backgroundImage: `linear-gradient(135deg, ${props.color} 0%, ${props.colorDeep} 100%)` }
  }
  return { backgroundColor: props.color }
})

const numStyle = computed(() => {
  if (props.done) return { backgroundColor: '#1B4332', color: '#FFFFFF' }
  return { backgroundColor: '#FFFFFF', color: props.colorDeep }
})

function sdkAtLeast(target) {
  let current = '0'
  try {
    const info = uni.getSystemInfoSync()
    current = info.SDKVersion || '0'
  } catch (error) {
    current = '0'
  }
  const left = String(current).split('.').map((part) => Number(part) || 0)
  const right = String(target).split('.').map((part) => Number(part) || 0)
  for (let i = 0; i < 3; i += 1) {
    if ((left[i] || 0) > (right[i] || 0)) return true
    if ((left[i] || 0) < (right[i] || 0)) return false
  }
  return true
}

watch(
  () => props.done,
  (value, previous) => {
    if (!armed.value || !value || previous) return
    popping.value = false
    setTimeout(() => {
      popping.value = true
    }, 16)
  }
)

onMounted(() => {
  useConic.value = sdkAtLeast('2.16.0')
  armed.value = true
})
</script>

<style scoped>
.mark {
  position: relative;
  flex-shrink: 0;
  width: 108rpx;
  margin-right: 20rpx;
}

.line {
  position: absolute;
  left: 62rpx;
  top: 88rpx;
  bottom: 0;
  width: 5rpx;
  background: linear-gradient(180deg, #CBDED5 0%, #E4EEE8 100%);
}

.ring {
  position: relative;
  width: 88rpx;
  height: 88rpx;
}

.badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 30rpx;
  background: #FFF3E0;
}

.emoji,
.tick {
  font-size: 42rpx;
  line-height: 88rpx;
  text-align: center;
}

.tick {
  color: #FFFFFF;
  font-size: 40rpx;
  font-weight: 800;
}

.num {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.12);
  font-size: 19rpx;
  font-weight: 800;
  line-height: 34rpx;
  text-align: center;
}

.mark.done .badge {
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
}

.mark.pop .badge {
  animation: badge-pop 350ms ease;
}

.mark.current .badge {
  animation: badge-breathe 1.8s ease-out infinite;
}

.mark.styleB .ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  box-sizing: border-box;
  padding: 6rpx;
  border: 6rpx solid #E4EEE8;
  border-radius: 50%;
}

.mark.styleB .ring.current {
  border-top-color: #2D6A4F;
  border-right-color: #2D6A4F;
}

.mark.styleB .ring.done {
  border-color: #2D6A4F;
}

.mark.styleB .ring.conic {
  border: 0;
  background: conic-gradient(#E4EEE8 0deg, #E4EEE8 360deg);
}

.mark.styleB .ring.conic.current {
  background: conic-gradient(#2D6A4F 0deg, #40916C 230deg, #E4EEE8 230deg);
}

.mark.styleB .ring.conic.done {
  background: conic-gradient(#2D6A4F 0deg, #40916C 360deg);
}

.mark.styleB .badge {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.mark.styleB .emoji,
.mark.styleB .tick {
  line-height: 76rpx;
}

.mark.styleC .badge {
  border-radius: 50%;
}

.mark.styleC .line {
  left: 48rpx;
  width: 0;
  background: transparent;
  border-left: 5rpx dashed #CBDED5;
}

@keyframes badge-pop {
  0% {
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes badge-breathe {
  0% {
    box-shadow: 0 0 0 0 rgba(45, 106, 79, 0.45);
  }
  100% {
    box-shadow: 0 0 0 12rpx rgba(45, 106, 79, 0);
  }
}
</style>
