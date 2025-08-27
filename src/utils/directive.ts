import type { App, DirectiveBinding } from 'vue'
import mediumZoom from 'medium-zoom'

export default function directive(app: App) {
  app.directive('auth', (el: HTMLElement, binding: DirectiveBinding) => {
    watch(() => binding.modifiers.all ? useAppAuth().authAll(binding.value) : useAppAuth().auth(binding.value), (val) => {
      el.style.display = val ? '' : 'none'
    }, {
      immediate: true,
    })
  })
  // 注册 medium-zoom 指令
  const zoom = mediumZoom({
    background: 'var(--g-main-area-bg)',
    margin: 20,
  })
  app.directive('zoomable', (el: HTMLElement) => {
    zoom.attach(el)
  })
}
