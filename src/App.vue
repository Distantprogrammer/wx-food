<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from './store/user'
import { initCloud } from './utils/cloud'

onLaunch(async () => {
  initCloud()
  const userStore = useUserStore()
  userStore.init()

  try {
    if (userStore.isLogin) {
      await userStore.refreshUser()
    } else {
      await userStore.login()
    }
  } catch (e) {
    console.error('bootstrap user error:', e)
  }
})
</script>

<style lang="scss">
@import './styles/variables.scss';

page {
  min-height: 100%;
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.5;
}

view,
text,
input,
textarea,
button {
  box-sizing: border-box;
}

image {
  display: block;
}

button {
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  color: inherit;
  font: inherit;
  line-height: normal;
}

button::after {
  border: 0;
}
</style>
