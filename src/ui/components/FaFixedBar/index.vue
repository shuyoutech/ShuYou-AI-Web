<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useElementSize, useScroll } from '@vueuse/core'
import { cn } from '@/utils'
import eventBus from '@/utils/eventBus'

defineOptions({
  name: 'FaFixedBar',
})

const props = defineProps<{
  position: 'top' | 'bottom'
  class?: HTMLAttributes['class']
}>()

const appSettingsStore = useAppSettingsStore()

const topbarScrollVisibleOrHidden = ref(false)
eventBus.on('topbar-scroll-visible-or-hidden', (val) => {
  topbarScrollVisibleOrHidden.value = val
})

const { arrivedState, y } = useScroll(window)
const { height } = useElementSize(useTemplateRef('fixedBarRef'))
watch(height, (val) => {
  document.documentElement.style.setProperty(`--g-main-container-padding-${props.position}`, `${val}px`)
}, {
  immediate: true,
})
onUnmounted(() => {
  document.documentElement.style.removeProperty(`--g-main-container-padding-${props.position}`)
})

const classList = computed(() => {
  return cn('relative mx-auto bg-background pointer-events-auto p-4', {
    'top-[1px] shadow-[0_1px_0_0_hsl(var(--border)),1px_0_0_0_hsl(var(--border)),-1px_0_0_0_hsl(var(--border))] transition-[width,top]-300 before:(pointer-events-none absolute left-0 z-1 h-12 w-full translate-y-full from-[var(--g-main-area-bg)] to-transparent bg-gradient-to-b opacity-0 transition-opacity content-empty -bottom-1px)': props.position === 'top',
    'bottom-0 shadow-[0_-1px_0_0_hsl(var(--border)),1px_0_0_0_hsl(var(--border)),-1px_0_0_0_hsl(var(--border))] transition-[width]-300 before:(pointer-events-none absolute left-0 z-1 h-12 w-full from-transparent to-[var(--g-main-area-bg)] bg-gradient-to-b opacity-0 transition-opacity content-empty -top-1px -translate-y-full)': props.position === 'bottom',
    'before:(opacity-100)': (props.position === 'top' && !arrivedState.top) || (props.position === 'bottom' && !arrivedState.bottom),
  }, props.class)
})
</script>

<template>
  <div
    ref="fixedBarRef" :class="cn('fa-fixed-bar fixed z-1000 inset-inline-1/2 w-full pointer-events-none', {
      'inset-t-[calc(var(--g-header-actual-height)+var(--g-topbar-actual-height))]': position === 'top',
      'inset-b-0': position === 'bottom',
    })"
  >
    <div
      :class="classList" :style="{
        ...(position === 'top' && appSettingsStore.settings.topbar.mode === 'static' && { transform: `translateY(calc(min(var(--g-topbar-actual-height), ${y}px) * -1))` }),
        ...(position === 'top' && topbarScrollVisibleOrHidden && { top: `calc(var(--g-topbar-actual-height) * -1)` }),
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.fa-fixed-bar {
  max-width: calc(100% - var(--g-main-sidebar-actual-width) - var(--g-sub-sidebar-actual-width));
  padding-right: var(--scrollbar-width, 0);
  transform: translateX(-50%) translateX(calc(var(--g-main-sidebar-actual-width) / 2)) translateX(calc(var(--g-sub-sidebar-actual-width) / 2));
  transform-origin: left;
  transition: width 0.3s, max-width 0.3s, transform 0.3s, top 0.3s, padding-right 0.3s;

  [data-app-layout-center-scope="outer"][data-app-layout-center] & {
    max-width: calc(var(--g-app-layout-center-width) - var(--g-main-sidebar-actual-width) - var(--g-sub-sidebar-actual-width));
    padding-right: initial;
    transform: translateX(-50%) translateX(calc(var(--g-main-sidebar-actual-width) / 2)) translateX(calc(var(--g-sub-sidebar-actual-width) / 2)) translateX(calc(var(--scrollbar-width, 0px) * -0.5));
  }

  [dir="rtl"] & {
    transform: translateX(50%) translateX(calc(var(--g-main-sidebar-actual-width) / 2 * -1)) translateX(calc(var(--g-sub-sidebar-actual-width) / 2 * -1));
  }

  [data-mode="mobile"] & {
    max-width: 100%;
    transform: translateX(-50%);

    [dir="rtl"] & {
      transform: translateX(50%);
    }
  }

  > div {
    [data-app-layout-center-scope="inner"]:not([data-app-layout-center], [data-mode="mobile"]) & {
      width: 100%;
    }

    [data-app-layout-center-scope="inner"][data-app-layout-center]:not([data-mode="mobile"]) & {
      width: min(var(--g-app-layout-center-width), 100%);
    }
  }
}
</style>
