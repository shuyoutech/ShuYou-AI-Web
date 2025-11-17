<script setup lang="ts">
import type { PaginationLastProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronsRight } from 'lucide-vue-next'
import { PaginationLast } from 'reka-ui'
import { cn } from '@/utils'

const props = withDefaults(defineProps<PaginationLastProps & { class?: HTMLAttributes['class'] }>(), {
  asChild: true,
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <PaginationLast v-bind="delegatedProps">
    <FaButton :class="cn('w-10 h-10 p-0', props.class)" variant="outline">
      <slot>
        <ChevronsRight class="h-4 w-4" />
      </slot>
    </FaButton>
  </PaginationLast>
</template>
