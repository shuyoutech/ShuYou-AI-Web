<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaDigitalCard',
})

const props = defineProps<{
  title: string
  titleTips?: string
  icon?: string
  digital: string | number
  description?: string
  trend?: 'up' | 'stable' | 'down'
  class?: HTMLAttributes['class']
}>()

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'i-material-symbols:trending-up'
    case 'stable':
      return 'i-material-symbols:trending-flat'
    case 'down':
      return 'i-material-symbols:trending-down'
    default:
      return ''
  }
})
</script>

<template>
  <FaCard :class="cn('w-full', props.class)" header-class="pb-2" footer-class="flex flex-col items-start gap-y-1">
    <template #header>
      <div class="flex flex-row items-center justify-between gap-y-1.5 space-y-0">
        <h3 class="flex-center-start gap-x-1 text-sm font-medium tracking-tight">
          {{ title }}
          <FaTooltip v-if="!!titleTips" :text="titleTips">
            <FaIcon name="i-material-symbols:help-rounded" class="size-4 text-muted-foreground" />
          </FaTooltip>
        </h3>
        <FaIcon v-if="!!icon" :name="icon" class="size-6 text-muted-foreground" />
      </div>
    </template>
    <template #footer>
      <div class="flex-center-start gap-x-1 text-2xl font-bold">
        {{ digital }}
        <FaIcon v-if="!!trendIcon" :name="trendIcon" />
      </div>
      <p v-if="!!description" class="text-sm text-gray-500">
        {{ description }}
      </p>
    </template>
  </FaCard>
</template>
