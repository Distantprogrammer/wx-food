<template>
  <view class="message-card" @click="handleClick">
    <view class="letter-head">
      <view class="avatar">{{ avatarText }}</view>
      <view class="head-main">
        <view class="letter-title">
          <text class="author-name">{{ authorName }}</text>
          <text class="title-plain">想对</text>
          <text class="target-name">{{ targetName }}</text>
          <text class="title-plain">说：</text>
        </view>
        <text class="letter-time">{{ timeText }}</text>
      </view>
    </view>
    <text class="letter-body">{{ message.content }}</text>
    <view class="card-footer">
      <text class="counts">{{ likeCount }} 赞 · {{ collectCount }} 收藏</text>
      <view class="actions" @click.stop>
        <LikeButton
          :liked="liked"
          :loading="likeLoading"
          @toggle="emit('like')"
        />
        <CollectButton
          :collected="collected"
          :loading="collectLoading"
          @toggle="emit('collect')"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/date'
import LikeButton from '@/components/LikeButton/LikeButton.vue'
import CollectButton from '@/components/CollectButton/CollectButton.vue'
import { useMessageStore } from '@/store/message'

const props = defineProps({
  message: { type: Object, required: true },
  liked: { type: Boolean, default: false },
  collected: { type: Boolean, default: false }
})

const emit = defineEmits(['like', 'collect', 'click'])
const messageStore = useMessageStore()

const likeLoading = computed(() => messageStore.isLikePending(props.message._id))
const collectLoading = computed(() => messageStore.isCollectPending(props.message._id))

const avatarText = computed(() => {
  const name = props.message.authorName || '匿'
  return name.slice(0, 1)
})

const authorName = computed(() => props.message.authorName || '匿名')
const targetName = computed(() => props.message.targetName || 'TA')

const timeText = computed(() => {
  const time = formatRelativeTime(props.message.createTime)
  return `${time} · 审核通过`
})

const likeCount = computed(() => props.message.likeCount || 0)
const collectCount = computed(() => props.message.collectCount || 0)

function handleClick() {
  emit('click', props.message)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.message-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 28rpx;
  border: 1px solid rgba(31, 45, 42, 0.08);
  border-radius: $radius-md;
  background: rgba(255, 253, 248, 0.94);
  box-shadow: $shadow-card;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 12rpx 30rpx rgba(50, 60, 56, 0.08);
  }
}

.letter-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $primary-soft;
  color: $wechat-dark;
  font-size: 26rpx;
  font-weight: 900;
}

.head-main {
  min-width: 0;
  flex: 1;
}

.letter-title {
  display: block;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 850;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.author-name {
  color: $ink;
}

.target-name {
  color: $wechat-dark;
}

.title-plain {
  color: $ink;
}

.letter-time {
  display: block;
  margin-top: 2rpx;
  color: $muted;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 650;
}

.letter-body {
  color: $ink-soft;
  font-size: 26rpx;
  line-height: 42rpx;
  font-weight: 600;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4rpx;
}

.counts {
  color: $muted;
  font-size: 22rpx;
  font-weight: 750;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
</style>
