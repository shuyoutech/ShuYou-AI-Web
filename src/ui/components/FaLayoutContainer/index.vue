<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaLayoutContainer',
})

const props = withDefaults(
  defineProps<{
    vertical?: boolean
    hideLeftSide?: boolean
    hideRightSide?: boolean
    hideTopSide?: boolean
    hideBottomSide?: boolean
    hideLeftSideToggle?: boolean
    hideRightSideToggle?: boolean
    hideTopSideToggle?: boolean
    hideBottomSideToggle?: boolean
    leftSideWidth?: number | string
    rightSideWidth?: number | string
    topSideHeight?: number | string
    bottomSideHeight?: number | string
    class?: HTMLAttributes['class']
    leftSideClass?: HTMLAttributes['class']
    rightSideClass?: HTMLAttributes['class']
    topSideClass?: HTMLAttributes['class']
    bottomSideClass?: HTMLAttributes['class']
    defaultClass?: HTMLAttributes['class']
  }>(),
  {
    vertical: false,
    hideLeftSide: false,
    hideRightSide: false,
    hideTopSide: false,
    hideBottomSide: false,
    hideLeftSideToggle: false,
    hideRightSideToggle: false,
    hideTopSideToggle: false,
    hideBottomSideToggle: false,
    leftSideWidth: 300,
    rightSideWidth: 300,
    topSideHeight: 200,
    bottomSideHeight: 200,
  },
)

const slots = defineSlots<{
  leftSide?: () => VNode
  rightSide?: () => VNode
  topSide?: () => VNode
  bottomSide?: () => VNode
  default?: () => VNode
}>()

// 边栏是否显示
const enabledLeftSide = computed(() => !props.hideLeftSide && !!slots.leftSide)
const enabledRightSide = computed(() => !props.hideRightSide && !!slots.rightSide)
const enabledTopSide = computed(() => !props.hideTopSide && !!slots.topSide)
const enabledBottomSide = computed(() => !props.hideBottomSide && !!slots.bottomSide)

// 边栏是否折叠
const leftSideVisiable = defineModel<boolean>('leftSideVisiable', { default: true })
const rightSideVisiable = defineModel<boolean>('rightSideVisiable', { default: true })
const topSideVisiable = defineModel<boolean>('topSideVisiable', { default: true })
const bottomSideVisiable = defineModel<boolean>('bottomSideVisiable', { default: true })

const topSideTeleportId = useId()
const bottomSideTeleportId = useId()
</script>

<template>
  <div
    :class="cn('absolute h-full w-full flex gap-4 p-4', {
      'flex-col': vertical,
    }, props.class)"
  >
    <div :id="topSideTeleportId" class="contents empty:hidden" />
    <div :class="vertical ? 'flex flex-1 gap-4' : 'contents'">
      <div
        v-if="enabledLeftSide" v-show="leftSideVisiable" :class="cn('h-full flex-none overflow-auto border rounded-lg bg-background p-4 transition-background-color-300', props.leftSideClass)" :style="{
          width: typeof leftSideWidth === 'number' ? `${leftSideWidth}px` : leftSideWidth,
        }"
      >
        <slot name="leftSide" />
      </div>
      <div class="flex flex-1 flex-col gap-4">
        <Teleport :to="`#${topSideTeleportId}`" defer :disabled="!vertical">
          <div
            v-if="enabledTopSide" v-show="topSideVisiable" :class="cn('w-full border rounded-lg bg-background p-4 transition-background-color-300', props.topSideClass)" :style="{
              height: typeof topSideHeight === 'number' ? `${topSideHeight}px` : topSideHeight,
            }"
          >
            <slot name="topSide" />
          </div>
        </Teleport>
        <div class="relative h-full w-full flex flex-1">
          <div v-if="enabledLeftSide && !hideLeftSideToggle" class="group left-side-icon absolute top-1/2 z-1 h-6 w-6 flex-center cursor-pointer border-l border-t rounded-1/2 bg-background -left-3 -translate-y-1/2 -rotate-45" @click="leftSideVisiable = !leftSideVisiable">
            <FaIcon :name="leftSideVisiable ? 'i-ep:caret-left' : 'i-ep:caret-right'" class="rotate-45 op-30 transition-opacity group-hover-op-100" />
          </div>
          <div v-if="enabledRightSide && !hideRightSideToggle" class="group right-side-icon absolute top-1/2 z-1 h-6 w-6 flex-center cursor-pointer border-b border-r rounded-1/2 bg-background -right-3 -translate-y-1/2 -rotate-45" @click="rightSideVisiable = !rightSideVisiable">
            <FaIcon :name="rightSideVisiable ? 'i-ep:caret-right' : 'i-ep:caret-left'" class="rotate-45 op-30 transition-opacity group-hover-op-100" />
          </div>
          <div v-if="enabledTopSide && !hideTopSideToggle" class="group top-side-icon absolute left-1/2 z-1 h-6 w-6 flex-center rotate-45 cursor-pointer border-l border-t rounded-1/2 bg-background -top-3 -translate-x-1/2" @click="topSideVisiable = !topSideVisiable">
            <FaIcon :name="topSideVisiable ? 'i-ep:caret-top' : 'i-ep:caret-bottom'" class="op-30 transition-opacity -rotate-45 group-hover-op-100" />
          </div>
          <div v-if="enabledBottomSide && !hideBottomSideToggle" class="group bottom-side-icon absolute left-1/2 z-1 h-6 w-6 flex-center rotate-45 cursor-pointer border-b border-r rounded-1/2 bg-background -bottom-3 -translate-x-1/2" @click="bottomSideVisiable = !bottomSideVisiable">
            <FaIcon :name="bottomSideVisiable ? 'i-ep:caret-bottom' : 'i-ep:caret-top'" class="op-30 transition-opacity -rotate-45 group-hover-op-100" />
          </div>
          <div :class="cn('absolute inset-0 h-full w-full overflow-auto border rounded-lg bg-background p-4 transition-background-color-300', props.defaultClass)">
            <slot name="default" />
          </div>
        </div>
        <Teleport :to="`#${bottomSideTeleportId}`" defer :disabled="!vertical">
          <div
            v-if="enabledBottomSide" v-show="bottomSideVisiable" :class="cn('w-full border rounded-lg bg-background p-4 transition-background-color-300', props.bottomSideClass)" :style="{
              height: typeof bottomSideHeight === 'number' ? `${bottomSideHeight}px` : bottomSideHeight,
            }"
          >
            <slot name="bottomSide" />
          </div>
        </Teleport>
      </div>
      <div
        v-if="enabledRightSide" v-show="rightSideVisiable" :class="cn('h-full flex-none overflow-auto border rounded-lg bg-background p-4 transition-background-color-300', props.rightSideClass)" :style="{
          width: typeof rightSideWidth === 'number' ? `${rightSideWidth}px` : rightSideWidth,
        }"
      >
        <slot name="rightSide" />
      </div>
    </div>
    <div :id="bottomSideTeleportId" class="contents empty:hidden" />
  </div>
</template>
