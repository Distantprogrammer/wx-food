<template>
  <view v-if="visible" class="search-sheet-mask" @click="handleClose">
    <view class="search-sheet" @click.stop>
      <view class="sheet-handle" />
      <view class="search-field">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索作者、对象或内容"
          confirm-type="search"
          @confirm="handleSearch"
        />
        <text class="search-btn" @click="handleSearch">搜索</text>
      </view>
      <scroll-view scroll-y class="search-results">
        <view v-if="loading" class="loading-text">搜索中...</view>
        <EmptyView
          v-else-if="!list.length && searched"
          title="没有更多结果"
          desc="试试其他关键词"
        />
        <view v-else class="result-list">
          <MessageCard
            v-for="item in list"
            :key="item._id"
            :message="item"
            :liked="item.liked"
            :collected="item.collected"
            @click="handleOpenDetail"
            @like="emit('like', item)"
            @collect="emit('collect', item)"
          />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import MessageCard from '@/components/MessageCard/MessageCard.vue'
import EmptyView from '@/components/EmptyView/EmptyView.vue'
import { searchMessages } from '@/services/message'
import { openLetterDetail } from '@/utils/letter'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'like', 'collect'])

const keyword = ref('')
const list = ref([])
const loading = ref(false)
const searched = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    keyword.value = ''
    list.value = []
    searched.value = false
  }
})

function handleClose() {
  emit('close')
}

function handleOpenDetail(message) {
  openLetterDetail(message)
  handleClose()
}

async function handleSearch() {
  const value = keyword.value.trim()
  if (!value) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }
  loading.value = true
  searched.value = true
  try {
    const res = await searchMessages({ keyword: value, page: 1, limit: 20 })
    if (res.code === 200) {
      list.value = res.data?.list || []
    } else {
      uni.showToast({ title: res.message, icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.search-sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 600;
  background: rgba(31, 45, 42, 0.28);
  pointer-events: auto;
}

.search-sheet {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 176rpx;
  max-height: 70vh;
  padding: 24rpx;
  border: 1px solid rgba(31, 45, 42, 0.1);
  border-radius: $radius-md;
  background: rgba(255, 253, 248, 0.98);
  box-shadow: $shadow-sheet;
  display: flex;
  flex-direction: column;
}

.sheet-handle {
  width: 88rpx;
  height: 8rpx;
  margin: 0 auto 24rpx;
  border-radius: 8rpx;
  background: #d8d1c5;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 84rpx;
  padding: 0 20rpx;
  border: 1px solid rgba(7, 193, 96, 0.22);
  border-radius: $radius-md;
  background: #f3fcf7;
}

.search-icon {
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #4f615b;
  font-weight: 750;
}

.search-btn {
  color: $wechat-dark;
  font-size: 26rpx;
  font-weight: 850;
}

.search-results {
  flex: 1;
  margin-top: 24rpx;
  max-height: 50vh;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.loading-text {
  text-align: center;
  padding: 40rpx;
  color: $muted;
  font-size: 26rpx;
}
</style>
