import { request } from './request'

export function login() {
  return request('login')
}

export function updateProfile(data) {
  return request('updateProfile', data)
}

export function getProfile() {
  return request('login', { action: 'profile' })
}
