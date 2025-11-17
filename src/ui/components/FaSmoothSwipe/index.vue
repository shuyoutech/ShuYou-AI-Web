<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { AnimatePresence, Motion } from 'motion-v'

defineOptions({
  name: 'FaSmoothSwipe',
})

const props = defineProps<{
  activeIndex: number
}>()

const slots = useSlots()

const currentIndex = ref<number>()
const children = ref<any>([])

onMounted(() => {
  // 主动捕获默认槽位中提供的所有内容
  watchEffect(() => {
    children.value = slots.default ? slots.default() : []
  })
})

const contentRef = useTemplateRef('contentRef')
const direction = ref<'left' | 'right'>('right')
watch(() => props.activeIndex, (val, oldVal) => {
  direction.value = val > (oldVal ?? -1) ? 'right' : 'left'
  nextTick(() => {
    currentIndex.value = val
  })
}, {
  immediate: true,
})

const { height } = useElementSize(contentRef)
</script>

<template>
  <Motion
    as="div"
    class="w-full"
    :style="{ position: 'relative', overflow: 'hidden' }"
    :animate="{ height: `${height + 1}px` }"
    :transition="{ type: 'spring', stiffness: 200, damping: 25, duration: 0.3 }"
  >
    <AnimatePresence :initial="false" mode="sync">
      <Motion
        :key="currentIndex"
        as="div"
        :initial="{ x: direction === 'left' ? '-100%' : '100%', opacity: 0 }"
        :animate="{ x: '0%', opacity: 1 }"
        :exit="{ x: direction === 'left' ? '50%' : '-50%', opacity: 0 }"
        :transition="{ type: 'tween', stiffness: 300, damping: 30, duration: 0.3 }"
        :style="{ position: 'absolute', left: 0, right: 0, top: 0 }"
      >
        <div ref="contentRef">
          <template v-for="(child, index) in children" :key="index">
            <component :is="child" v-if="index === currentIndex" />
          </template>
        </div>
      </Motion>
    </AnimatePresence>
  </Motion>
</template>
