<script setup lang="ts">
import type { PaginationPrevProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronLeft } from 'lucide-vue-next'
import { PaginationPrev } from 'reka-ui'
import { cn } from '@/utils'

const props = withDefaults(defineProps<PaginationPrevProps & { class?: HTMLAttributes['class'] }>(), {
  asChild: true,
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <PaginationPrev v-bind="delegatedProps">
    <FaButton :class="cn('w-10 h-10 p-0', props.class)" variant="outline">
      <slot>
        <ChevronLeft class="h-4 w-4" />
      </slot>
    </FaButton>
  </PaginationPrev>
</template>
