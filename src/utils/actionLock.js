import { ref } from 'vue'

export function createKeyedActionLock() {
  const pendingKeys = ref(new Set())

  function isLocked(key) {
    return pendingKeys.value.has(key)
  }

  function addKey(key) {
    const next = new Set(pendingKeys.value)
    next.add(key)
    pendingKeys.value = next
  }

  function removeKey(key) {
    const next = new Set(pendingKeys.value)
    next.delete(key)
    pendingKeys.value = next
  }

  async function run(key, task) {
    if (pendingKeys.value.has(key)) return
    addKey(key)
    try {
      return await task()
    } finally {
      removeKey(key)
    }
  }

  return { isLocked, run }
}

export function createActionLock() {
  let locked = false

  return {
    get isLocked() {
      return locked
    },
    async run(task) {
      if (locked) return
      locked = true
      try {
        return await task()
      } finally {
        locked = false
      }
    }
  }
}
