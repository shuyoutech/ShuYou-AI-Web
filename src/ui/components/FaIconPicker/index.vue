<i18n lang="json">
{
  "zh-cn": {
    "total": "{0} 个图标",
    "search": "搜索..."
  },
  "zh-tw": {
    "total": "{0} 個圖示",
    "search": "搜索..."
  },
  "en": {
    "total": "{0} icons",
    "search": "Search..."
  }
}
</i18n>

<script setup lang="ts">
import { icons } from '@/iconify'

defineOptions({
  name: 'FaIconPicker',
})

const value = defineModel<string>({
  default: '',
})

const open = ref(false)

const { t } = useI18n()

const activeName = ref(icons.some(item => item.prefix === value.value.split(':')[0]) ? value.value.split(':')[0] : icons[0].prefix)
const search = ref('')
const pagination = ref({
  page: 1,
  pageSize: 48,
})

const iconList = computed(() => {
  let iconsFilter = icons.filter((item) => {
    return item.prefix === activeName.value
  })[0].icons
  if (search.value) {
    iconsFilter = iconsFilter.filter((item) => {
      return item.includes(search.value)
    })
  }
  return iconsFilter
})
const currentIconList = computed(() => {
  return iconList.value.slice(
    (pagination.value.page - 1) * pagination.value.pageSize,
    (pagination.value.page - 1) * pagination.value.pageSize + pagination.value.pageSize,
  )
})

function handleTabChange(name: string) {
  activeName.value = name
  pagination.value.page = 1
}

function chooseIcon(val: string) {
  value.value = val
  open.value = false
}
function removeIcon() {
  value.value = ''
  open.value = false
}
</script>

<template>
  <FaPopover v-model:open="open" :collision-padding="5" class="p-0">
    <slot :icon="value">
      <FaButton variant="outline" size="icon" class="[&_svg]:size-inherit">
        <FaIcon :name="value !== '' ? value : 'i-whh:googleplusold'" class="size-4" :class="{ 'opacity-20': value === '' }" />
      </FaButton>
    </slot>
    <template #panel>
      <div class="h-500px w-600px flex-center of-hidden rounded-md">
        <FaScrollArea :scrollbar="false" mask class="h-full w-150px shrink-0 border-r">
          <div v-for="item in icons" :key="item.prefix" class="cursor-pointer px-4 py-3 transition-background-color space-y-2 hover-bg-accent/50" :class="{ 'bg-accent hover-bg-accent!': item.prefix === activeName }" @click="handleTabChange(item.prefix)">
            <div class="text-base text-accent-foreground leading-tight">
              {{ item.info.name }}
            </div>
            <div class="text-xs text-accent-foreground/50">
              {{ t('total', [item.info.total]) }}
            </div>
          </div>
        </FaScrollArea>
        <div class="h-full flex-col-center flex-1 p-6">
          <div class="search-bar">
            <FaInput v-model="search" :placeholder="t('search')" />
          </div>
          <div class="grid grid-cols-7 grid-rows-7 my-2 w-full flex-1 place-items-center gap-1">
            <FaButton variant="outline" size="icon" class="h-12 w-12" @click="removeIcon">
              <FaIcon name="i-ep:delete" class="size-6 opacity-20" />
            </FaButton>
            <FaButton v-for="(icon, index) in currentIconList" :key="index" variant="ghost" size="icon" class="h-12 w-12 [&_svg]:size-inherit" @click="chooseIcon(`${activeName}:${icon}`)">
              <FaIcon :name="`${activeName}:${icon}`" class="size-6" />
            </FaButton>
          </div>
          <FaPagination :page="pagination.page" :size="pagination.pageSize" :total="iconList.length" @page-change="(page) => pagination.page = page" />
        </div>
      </div>
    </template>
  </FaPopover>
</template>
