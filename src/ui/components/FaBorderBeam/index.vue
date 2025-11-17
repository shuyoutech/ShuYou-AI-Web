<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaBorderBeam',
})

const props = withDefaults(defineProps<{
  size?: number
  duration?: number
  delay?: number
  anchor?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  class?: HTMLAttributes['class']
}>(), {
  size: 200,
  duration: 15000,
  delay: 0,
  anchor: 90,
  borderWidth: 1,
  colorFrom: '#ffaa40',
  colorTo: '#9c40ff',
})

const durationInSeconds = computed(() => `${props.duration}ms`)
const delayInSeconds = computed(() => `${props.delay}ms`)
</script>

<template>
  <div
    :class="
      cn(
        'border-beam',
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-beam-border-width)*1px)_solid_transparent]',
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        'after:content-empty after:absolute after:aspect-square after:w-[calc(var(--border-beam-size)*1px)] animate-border-beam after:[animation-delay:var(--border-beam-delay)] after:[background:linear-gradient(to_left,var(--border-beam-color-from),var(--border-beam-color-to),transparent)] after:[offset-anchor:calc(var(--border-beam-anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--border-beam-size)*1px))]',
        props.class,
      )
    "
  />
</template>

<style scoped>
.border-beam {
  --border-beam-size: v-bind(size);
  --border-beam-duration: v-bind(durationInSeconds);
  --border-beam-anchor: v-bind(anchor);
  --border-beam-border-width: v-bind(borderWidth);
  --border-beam-color-from: v-bind(colorFrom);
  --border-beam-color-to: v-bind(colorTo);
  --border-beam-delay: v-bind(delayInSeconds);
}

.animate-border-beam::after {
  animation: border-beam-anim var(--border-beam-duration) infinite linear;
}

@keyframes border-beam-anim {
  to {
    offset-distance: 100%;
  }
}
</style>
