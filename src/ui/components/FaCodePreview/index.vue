<script setup lang="ts">
defineOptions({
  name: 'FaCodePreview',
})

defineProps<{
  code: string
  title?: string
}>()

const showSource = ref(false)
</script>

<template>
  <FaPageMain :title main-class="p-0">
    <div class="p-4">
      <slot />
    </div>
    <FaCode v-show="showSource" :code="code.trim()" class="rounded-none" />
    <div class="border-t p-2">
      <FaButton variant="ghost" size="sm" class="w-full" @click="showSource = !showSource">
        <FaIcon :name="showSource ? 'i-lucide:code' : 'i-lucide:code-xml'" class="size-4" />
      </FaButton>
    </div>
  </FaPageMain>
</template>
