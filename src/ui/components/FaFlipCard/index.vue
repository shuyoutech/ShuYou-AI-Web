<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaFlipCard',
})

const props = withDefaults(defineProps<{
  rotate?: 'x' | 'y'
  class?: HTMLAttributes['class']
}>(), {
  rotate: 'y',
})

const rotation = computed(() => ({
  x: ['group-hover/flipcard:[transform:rotateX(180deg)]', '[transform:rotateX(180deg)]'],
  y: ['group-hover/flipcard:[transform:rotateY(180deg)]', '[transform:rotateY(180deg)]'],
}[props.rotate]))
</script>

<template>
  <div :class="cn('group/flipcard h-72 w-56 [perspective:1000px]', props.class)">
    <div
      :class="cn(
        'relative h-full rounded-2xl transition-all duration-500 [transform-style:preserve-3d]',
        rotation[0],
      )"
    >
      <!-- 正面 -->
      <div class="[backface-visibility:hidden] absolute size-full overflow-hidden border rounded-2xl bg-card">
        <slot />
      </div>
      <!-- 背面 -->
      <div
        :class="cn(
          '[backface-visibility:hidden] absolute size-full overflow-hidden border rounded-2xl bg-card',
          rotation[1],
        )"
      >
        <FaScrollArea :scrollbar="false" mask class="h-full">
          <slot name="back" />
        </FaScrollArea>
      </div>
    </div>
  </div>
</template>
