/**
 * API 错误展示：request.js 已 toast 时不再重复弹出
 */
export function isApiErrorToasted(error) {
  return Boolean(error?.toastShown)
}

export function getApiErrorMessage(error, fallback = '操作失败') {
  return error?.message || fallback
}

export function showApiError(error, fallback = '操作失败') {
  if (isApiErrorToasted(error)) return
  uni.showToast({
    title: getApiErrorMessage(error, fallback),
    icon: 'none'
  })
}
