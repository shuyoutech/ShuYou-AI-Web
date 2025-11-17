<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaGradientButton',
})

const props = withDefaults(defineProps<{
  colors?: string[]
  duration?: number
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}>(), {
  colors: () => [
    '#FF0000',
    '#FFA500',
    '#FFFF00',
    '#008000',
    '#0000FF',
    '#4B0082',
    '#EE82EE',
    '#FF0000',
  ],
  duration: 2500,
})

const allColors = computed(() => props.colors.join(', '))
const durationInMilliseconds = computed(() => `${props.duration}ms`)
</script>

<template>
  <button
    :class="cn(
      'animate-rainbow relative flex items-center justify-center overflow-hidden rounded-lg p-[2px] before:absolute before:blur-4 before:content-empty before:-inset-[200%]',
      props.class,
    )"
  >
    <span
      :class="cn(
        'z-0 size-full inline-flex items-center justify-center rounded-lg bg-primary-foreground px-4 py-2',
        props.contentClass,
      )"
    >
      <slot />
    </span>
  </button>
</template>

<style scoped>
.animate-rainbow::before {
  background: conic-gradient(v-bind(allColors));
  animation: rotate-rainbow v-bind(durationInMilliseconds) linear infinite;
}

@keyframes rotate-rainbow {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
