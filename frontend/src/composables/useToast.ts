import { ref } from 'vue'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function showToast(
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000
  ) {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type, duration })

    // 自动移除
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    showToast,
    removeToast
  }
}