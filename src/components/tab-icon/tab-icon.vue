<template>
  <view class="tab-icon tab-tokens" :class="[name, { active }]" aria-hidden="true">
    <view v-if="name === 'home'" class="home">
      <view class="steam s1" />
      <view class="steam s2" />
      <view class="knob" />
      <view class="lid" />
      <view class="body" />
      <view class="ear left" />
      <view class="ear right" />
    </view>

    <view v-else-if="name === 'tips'" class="hat">
      <view class="puff left" />
      <view class="puff mid" />
      <view class="puff right" />
      <view class="band" />
    </view>

    <view v-else-if="name === 'cat'" class="bowl">
      <view class="chop a" />
      <view class="chop b" />
      <view class="bowl-body" />
      <view class="bowl-foot" />
    </view>

    <view v-else-if="name === 'mine'" class="person">
      <view class="cap" />
      <view class="head" />
      <view class="shoulders" />
    </view>

    <view v-else-if="name === 'dice'" class="dice">
      <view class="die" />
      <view class="pip p1" />
      <view class="pip p2" />
      <view class="pip p3" />
      <view class="pip p4" />
      <view class="pip p5" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  name: { type: String, default: 'home' },
  active: { type: Boolean, default: false }
})
</script>

<style scoped>
@import '../../styles/tokens.wxss';

.tab-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  color: var(--tab-inactive);
}

.tab-icon.active {
  color: var(--brand);
}

.tab-icon.dice {
  color: #FFFFFF;
}

.home,
.hat,
.bowl,
.person,
.dice {
  position: relative;
  width: 48rpx;
  height: 48rpx;
}

.steam {
  position: absolute;
  width: 10rpx;
  height: 12rpx;
  border-top: 3rpx solid currentColor;
  border-right: 3rpx solid currentColor;
  border-radius: 0 12rpx 0 0;
  box-sizing: border-box;
}

.s1 {
  left: 16rpx;
  top: 1rpx;
}

.s2 {
  left: 24rpx;
  top: 0;
}

.tab-icon.active.home .s1 {
  animation: steam-a 1.5s ease-in-out infinite;
}

.tab-icon.active.home .s2 {
  animation: steam-b 1.5s ease-in-out infinite;
  animation-delay: 250ms;
}

.knob {
  position: absolute;
  left: 20rpx;
  top: 7rpx;
  z-index: 3;
  width: 8rpx;
  height: 8rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 50%;
}

.lid {
  position: absolute;
  left: 10rpx;
  top: 12rpx;
  z-index: 2;
  width: 28rpx;
  height: 12rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-bottom-width: 0;
  border-radius: 28rpx 28rpx 0 0;
}

.body {
  position: absolute;
  left: 8rpx;
  top: 22rpx;
  z-index: 2;
  width: 32rpx;
  height: 16rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 8rpx;
  background: transparent;
}

.ear {
  position: absolute;
  top: 26rpx;
  z-index: 1;
  width: 8rpx;
  height: 3rpx;
  background: currentColor;
  border-radius: 2rpx;
}

.ear.left {
  left: 1rpx;
}

.ear.right {
  right: 1rpx;
}

.tab-icon.active .knob,
.tab-icon.active .lid,
.tab-icon.active .body {
  background: currentColor;
}

.puff {
  position: absolute;
  top: 4rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 50%;
  background: transparent;
}

.puff.left {
  left: 4rpx;
  width: 16rpx;
  height: 16rpx;
}

.puff.mid {
  left: 14rpx;
  top: 1rpx;
  z-index: 1;
  width: 20rpx;
  height: 18rpx;
}

.puff.right {
  right: 4rpx;
  width: 16rpx;
  height: 16rpx;
}

.band {
  position: absolute;
  left: 10rpx;
  bottom: 8rpx;
  z-index: 2;
  width: 28rpx;
  height: 10rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 8rpx;
  background: #FFFFFF;
}

.tab-icon.active .puff,
.tab-icon.active .band {
  background: currentColor;
}

.chop {
  position: absolute;
  z-index: 2;
  width: 22rpx;
  height: 3rpx;
  background: currentColor;
  border-radius: 2rpx;
}

.chop.a {
  top: 8rpx;
  right: 4rpx;
  transform: rotate(-58deg);
}

.chop.b {
  top: 14rpx;
  right: 2rpx;
  transform: rotate(-50deg);
}

.bowl-body {
  position: absolute;
  left: 4rpx;
  top: 22rpx;
  z-index: 1;
  width: 40rpx;
  height: 16rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-top-width: 3rpx;
  border-radius: 0 0 20rpx 20rpx;
  background: transparent;
}

.bowl-foot {
  position: absolute;
  left: 16rpx;
  bottom: 4rpx;
  width: 16rpx;
  height: 3rpx;
  background: currentColor;
  border-radius: 2rpx;
}

.tab-icon.active .bowl-body {
  background: currentColor;
  border-top-color: transparent;
}

.cap {
  position: absolute;
  left: 14rpx;
  top: 1rpx;
  z-index: 2;
  width: 20rpx;
  height: 10rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-bottom-width: 0;
  border-radius: 12rpx 12rpx 4rpx 4rpx;
  background: transparent;
}

.head {
  position: absolute;
  left: 16rpx;
  top: 12rpx;
  z-index: 2;
  width: 16rpx;
  height: 16rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 50%;
  background: transparent;
}

.shoulders {
  position: absolute;
  left: 6rpx;
  bottom: 2rpx;
  width: 36rpx;
  height: 14rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-bottom-width: 0;
  border-radius: 20rpx 20rpx 0 0;
  background: transparent;
}

.tab-icon.active .cap,
.tab-icon.active .head,
.tab-icon.active .shoulders {
  background: currentColor;
}

.die {
  position: absolute;
  left: 6rpx;
  top: 6rpx;
  width: 36rpx;
  height: 36rpx;
  box-sizing: border-box;
  border: 3rpx solid currentColor;
  border-radius: 10rpx;
}

.pip {
  position: absolute;
  width: 6rpx;
  height: 6rpx;
  background: currentColor;
  border-radius: 50%;
}

.p1 { left: 12rpx; top: 12rpx; }
.p2 { right: 12rpx; top: 12rpx; }
.p3 { left: 21rpx; top: 21rpx; }
.p4 { left: 12rpx; bottom: 12rpx; }
.p5 { right: 12rpx; bottom: 12rpx; }

@keyframes steam-a {
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-4rpx); opacity: 0.35; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes steam-b {
  0% { transform: translateY(0); opacity: 0.9; }
  50% { transform: translateY(-5rpx); opacity: 0.3; }
  100% { transform: translateY(0); opacity: 0.9; }
}
</style>
