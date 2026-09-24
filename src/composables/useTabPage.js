import { onShow } from '@dcloudio/uni-app'
import { setCurrentTab } from '@/utils/index.js'
import { getTabByKey } from '@/config/tabbar'

export function useTabPage(tabKey) {
  const tab = getTabByKey(tabKey)

  onShow(() => {
    if (tab?.pagePath) {
      setCurrentTab(tab.pagePath)
    }
  })

  return { tabPath: tab?.pagePath || '' }
}
