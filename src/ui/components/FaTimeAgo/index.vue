<script setup lang="ts">
import type { UseTimeAgoMessages, UseTimeAgoUnitNamesDefault } from '@vueuse/core'
import { useTimeAgo } from '@vueuse/core'

defineOptions({
  name: 'FaTimeAgo',
})

const props = withDefaults(defineProps<{
  date?: Date
  max?: UseTimeAgoUnitNamesDefault
  messages?: UseTimeAgoMessages
  showSecond?: boolean
  updateInterval?: number
}>(), {
  date: () => new Date(),
  messages: () => ({
    justNow: '刚刚',
    past: n => n.match(/\d/) ? `${n}前` : n,
    future: n => n.match(/\d/) ? `${n}后` : n,
    month: (n, past) => n === 1
      ? past
        ? '上个月'
        : '下个月'
      : `${n} 月`,
    year: (n, past) => n === 1
      ? past
        ? '去年'
        : '明年'
      : `${n} 年`,
    day: (n, past) => n === 1
      ? past
        ? '昨天'
        : '明天'
      : `${n} 天`,
    week: (n, past) => n === 1
      ? past
        ? '上周'
        : '下周'
      : `${n} 周`,
    hour: n => `${n} 小时`,
    minute: n => `${n} 分钟`,
    second: n => `${n} 秒`,
    invalid: '',
  }),
  updateInterval: 30_000,
})

const timeAgo = useTimeAgo(props.date, {
  messages: props.messages,
  max: props.max,
  showSecond: props.showSecond,
  updateInterval: props.updateInterval,
})
</script>

<template>
  <span>{{ timeAgo }}</span>
</template>
