<template>
  <text class="st" :class="tone">{{ text }}</text>
</template>

<script setup>
defineProps({
  /** ok | wait | no */
  tone: { type: String, default: 'wait' },
  text: { type: String, default: '' }
})
</script>

<style scoped>
.st {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 5rpx 18rpx;
  border-radius: 16rpx;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 32rpx;
  white-space: nowrap;
}

.ok {
  background: #E9F7EC;
  color: #2D8A4E;
}

.wait {
  background: #FFF3E0;
  color: #D97A1F;
}

.no {
  background: #FDECEC;
  color: #E05C5C;
}
</style>
