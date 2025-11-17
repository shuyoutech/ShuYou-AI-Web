<script setup lang="ts">
import { TransitionPresets, useTransition } from '@vueuse/core'

defineOptions({
  name: 'FaCountTo',
})

const props = withDefaults(defineProps<{
  startVal: number
  endVal: number
  autoplay?: boolean
  duration?: number
  transition?: keyof typeof TransitionPresets
  delay?: number
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
}>(), {
  autoplay: true,
  duration: 2000,
  transition: 'linear',
  delay: 0,
  decimals: 0,
  separator: ',',
})

const emits = defineEmits<{
  onStarted: []
  onFinished: []
}>()

const disabled = ref(false)

const source = ref(props.startVal)
const outputValue = useTransition(source, {
  duration: props.duration,
  transition: TransitionPresets[props.transition],
  delay: props.delay,
  disabled,
  onStarted: () => emits('onStarted'),
  onFinished: () => emits('onFinished'),
})
const value = computed(() => {
  let val: number | string = unref(outputValue.value)
  val = Number(val).toFixed(props.decimals)
  if (props.separator) {
    const [integer, decimal] = val.toString().split('.')
    val = integer.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator) + (decimal ? `.${decimal}` : '')
  }
  if (props.prefix) {
    val = props.prefix + val
  }
  if (props.suffix) {
    val = val + props.suffix
  }
  return val
})

function start() {
  source.value = props.endVal
}

function reset() {
  disabled.value = true
  source.value = props.startVal
  nextTick(() => {
    disabled.value = false
  })
}

watch([() => props.startVal, () => props.endVal], () => {
  start()
})

onMounted(() => {
  props.autoplay && start()
})

defineExpose({
  start,
  reset,
})
</script>

<template>
  <span>
    {{ value }}
  </span>
</template>
