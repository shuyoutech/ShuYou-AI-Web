<script setup lang="ts" generic="T extends { datetime: string | number | Date }">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'
import dayjs from '@/utils/dayjs'

defineOptions({
  name: 'FaTimeline',
})

const props = withDefaults(defineProps<{
  data?: T[]
  merge?: boolean
  class?: HTMLAttributes['class']
}>(), {
  data: () => [],
  merge: false,
})

const timelineItems = useTemplateRef('timelineItems')
const scrollTop = ref(0)
const activeIndex = computed(() => {
  const items = timelineItems.value?.map(item => item.offsetTop - 60)
  return Math.max(0, (items?.findIndex(item => item > scrollTop.value) ?? 1) - 1)
})

function handleScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}

function getYear(datetime: T['datetime']) {
  return dayjs(datetime).format('YYYY')
}

function getMonth(datetime: T['datetime']) {
  return dayjs(datetime).format('MM')
}

function getDay(datetime: T['datetime']) {
  return dayjs(datetime).format('DD')
}
</script>

<template>
  <FaScrollArea :content-class="cn('relative w-full', props.class)" @on-scroll="handleScroll">
    <div v-if="!!data.length" class="absolute top-0 z-1 w-40 flex-col-center-start p-2 backdrop-blur">
      <FaAnimatedCountTo :value="Number(getYear(data[activeIndex].datetime))" will-change :format="{ notation: 'compact' }" class="text-2xl font-bold opacity-20" />
      <div class="flex items-center">
        <FaAnimatedCountToGroup>
          <FaAnimatedCountTo :value="Number(getMonth(data[activeIndex].datetime))" will-change :format="{ minimumIntegerDigits: 2, notation: 'compact' }" suffix=" / " class="text-4xl font-bold" />
          <FaAnimatedCountTo :value="Number(getDay(data[activeIndex].datetime))" will-change :format="{ minimumIntegerDigits: 2, notation: 'compact' }" class="text-4xl font-bold" />
        </FaAnimatedCountToGroup>
      </div>
    </div>
    <div class="w-full flex flex-col gap-8">
      <div v-for="(item, index) in data" :key="index" ref="timelineItems" class="flex gap-4">
        <div
          class="w-40 flex-col-center-start p-2 transition-all" :class="{
            'opacity-0 -translate-y-10': index <= activeIndex,
            'opacity-0': props.merge && index > 0 && item.datetime === data[index - 1].datetime,
          }"
        >
          <FaAnimatedCountTo :value="Number(getYear(item.datetime))" :format="{ notation: 'compact' }" class="text-2xl font-bold opacity-20" />
          <div class="flex items-center">
            <FaAnimatedCountTo :value="Number(getMonth(item.datetime))" :format="{ minimumIntegerDigits: 2, notation: 'compact' }" suffix=" / " class="text-4xl font-bold" />
            <FaAnimatedCountTo :value="Number(getDay(item.datetime))" :format="{ minimumIntegerDigits: 2, notation: 'compact' }" class="text-4xl font-bold" />
          </div>
        </div>
        <div class="flex-1">
          <slot :item="item" />
        </div>
      </div>
    </div>
  </FaScrollArea>
</template>

<style scoped>
number-flow-vue::part(suffix) {
  top: -0.25rem;
  padding-inline: 0.5rem;
  font-size: 1.5rem;
  font-weight: normal;
  color: hsl(var(--muted-foreground) / 60%);
}
</style>
