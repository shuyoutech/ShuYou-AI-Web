<i18n lang="json">
{
  "zh-cn": {
    "copied": "已复制"
  },
  "zh-tw": {
    "copied": "已複製"
  },
  "en": {
    "copied": "Copied"
  }
}
</i18n>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useClipboard } from '@vueuse/core'
import { cn } from '@/utils'

defineOptions({
  name: 'FaCode',
})

const props = defineProps<{
  code: string
  class?: HTMLAttributes['class']
}>()

const appSettingsStore = useAppSettingsStore()

const { t } = useI18n()

const { copy, copied, isSupported } = useClipboard()
</script>

<template>
  <div :class="cn('group relative w-full rounded-lg bg-dark p-4 text-light', props.class)">
    <pre class="w-full overflow-auto whitespace-pre-line">
      <code class="whitespace-pre" tabindex="0">{{ code }}</code>
    </pre>
    <FaButton
      v-if="isSupported" variant="secondary" :class="cn('border border-light/20 px-2.5 absolute end-3 top-3 opacity-0 transition-opacity group-hover:opacity-100', {
        'opacity-100': appSettingsStore.mode === 'mobile',
      })" @click="copy(code)"
    >
      {{ copied ? t('copied') : '' }}
      <FaIcon :name="copied ? 'i-tabler:clipboard-check' : 'i-tabler:clipboard'" class="size-4" />
    </FaButton>
  </div>
</template>

<style scoped>
@font-face {
  font-family: FontWithASyntaxHighlighter;
  src:
    url("FontWithASyntaxHighlighter-Regular.woff2")
    format("woff2");
}

code {
  font-family: FontWithASyntaxHighlighter, monospace;
}
</style>
