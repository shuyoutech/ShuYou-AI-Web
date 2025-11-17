<script setup lang="ts">
import type { AutoScrollOptionsType } from 'embla-carousel-auto-scroll'
import type { AutoplayOptionsType } from 'embla-carousel-autoplay'
import type { HTMLAttributes } from 'vue'
import type { CarouselProps } from './carousel/interface'
import AutoScroll from 'embla-carousel-auto-scroll'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import { cn } from '@/utils'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel'

defineOptions({
  name: 'FaCarousel',
})

const props = defineProps<{
  opts?: CarouselProps['opts']
  orientation?: CarouselProps['orientation']
  autoplay?: AutoplayOptionsType
  autoScroll?: AutoScrollOptionsType
  fade?: boolean
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
  itemClass?: HTMLAttributes['class']
}>()

const slots = useSlots()

const plugins = computed(() => {
  return [
    props.autoplay ? Autoplay(props.autoplay) : undefined,
    props.autoScroll ? AutoScroll(props.autoScroll) : undefined,
    props.fade ? Fade() : undefined,
  ].filter(Boolean) as CarouselProps['plugins']
})

const children = ref<any>([])

onMounted(() => {
  watchEffect(() => {
    children.value = slots.default?.()?.[0]?.children ?? slots.default?.() ?? []
  })
})
</script>

<template>
  <Carousel :opts="props.opts" :plugins="plugins" :orientation="props.orientation" :class="cn('relative w-full', props.class)">
    <CarouselContent :class="props.contentClass">
      <CarouselItem v-for="(child, index) in children" :key="index" :class="props.itemClass">
        <component :is="child" />
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</template>
