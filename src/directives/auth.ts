import type { Directive } from 'vue'
import { useUserStore } from '@/store/modules/user'

/**
 * v-auth 指令
 * 用于在点击元素前校验用户登录状态
 * 如果用户未登录，则弹出登录窗口
 */
export const vAuth: Directive = {
  mounted(el: HTMLElement, binding) {
    // 获取自定义提示信息
    const message = binding.value || '请先登录后再进行操作'

    // 点击事件处理函数
    const handleClick = (event: Event) => {
      // 在事件处理函数中获取用户store，确保响应式
      const userStore = useUserStore()

      // 检查登录状态
      if (!userStore.isLogin) {
        // 阻止默认行为和事件冒泡
        event.preventDefault()
        event.stopPropagation()

        // 显示登录弹窗
        userStore.showLoginModal = true

        // 显示提示信息
        console.warn(message)

        return false
      } else {
        console.warn('用户已登录，允许操作继续')
      }
    }

    // 保存处理函数到元素上，用于后续清理
    el._authClickHandler = handleClick

    // 添加点击事件监听器（使用捕获阶段）
    el.addEventListener('click', handleClick, true)
  },

  unmounted(el: HTMLElement) {
    // 清理事件监听器
    if (el._authClickHandler) {
      el.removeEventListener('click', el._authClickHandler, true)
      delete el._authClickHandler
    }
  }
}

// 扩展HTMLElement类型
declare global {
  interface HTMLElement {
    _authClickHandler?: (event: Event) => void
  }
}

export default vAuth
