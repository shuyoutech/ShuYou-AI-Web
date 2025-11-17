<script setup lang="ts">
import type { Format, Value } from '@number-flow/vue'
import type { HTMLAttributes } from 'vue'
import NumberFlow from '@number-flow/vue'

defineOptions({
  name: 'FaAnimatedCountTo',
})

const props = defineProps<{
  value: Value
  format?: Format
  locales?: string
  prefix?: string
  suffix?: string
  trend?: 1 | 0 | -1
  transformTiming?: EffectTiming
  spinTiming?: EffectTiming
  opacityTiming?: EffectTiming
  willChange?: boolean
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  animationsstart: []
  animationsfinish: []
}>()
</script>

<template>
  <NumberFlow v-bind="props" @animationsstart="emit('animationsstart')" @animationsfinish="emit('animationsfinish')" />
</template>
