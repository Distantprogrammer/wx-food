export const ROLE = {
  ADMIN: 1,
  USER: 2
}

export function isAdmin(user) {
  return Number(user?.role) === ROLE.ADMIN
}

export function isLoggedIn(user) {
  return Boolean(user?.openid || user?._id)
}

export function getRoleLabel(role) {
  if (Number(role) === ROLE.ADMIN) return '管理员'
  return '普通用户'
}

export function canReview(user) {
  return isAdmin(user)
}

export function canEditMessage(message, user) {
  if (!message || !user?.openid) return false
  if (message.authorOpenid !== user.openid) return false
  const status = Number(message.status)
  return status === 0 || status === 2
}

export function canDeleteMessage(message, user) {
  if (!message || !user?.openid) return false
  return message.authorOpenid === user.openid
}
