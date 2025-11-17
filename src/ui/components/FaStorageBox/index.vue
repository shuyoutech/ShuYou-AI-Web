<i18n lang="json">
{
  "zh-cn": {
    "title": "储物箱",
    "dialogTitle": "请输入一个方便记忆的名称",
    "nameEmpty": "名称不能为空",
    "nameExist": "名称已存在",
    "confirm": "确认",
    "cancel": "取消",
    "empty": "空空如也"
  },
  "zh-tw": {
    "title": "儲物箱",
    "dialogTitle": "請輸入一個方便記憶的名稱",
    "nameEmpty": "名稱不能為空",
    "nameExist": "名稱已存在",
    "confirm": "確認",
    "cancel": "取消",
    "empty": "空空如也"
  },
  "en": {
    "title": "Storage Box",
    "dialogTitle": "Please enter a name that is easy to remember",
    "nameEmpty": "Name cannot be empty",
    "nameExist": "Name already exists",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "empty": "Empty"
  }
}
</i18n>

<script setup lang="ts">
import Sortable from 'sortablejs'

defineOptions({
  name: 'FaStorageBox',
})

const props = defineProps<{
  data: object | any[]
  name: string
  title?: string
}>()

const emits = defineEmits<{
  takeOut: [value: object | any[]]
}>()

const slots = defineSlots<{
  default?: () => VNode
}>()

const { t } = useI18n()

const userStore = useUserStore()

const open = ref(false)

const list = ref<{
  title: string
  content: string
}[]>([])
const dialog = ref({
  visible: false,
  name: '',
})

onMounted(() => {
  recoveryStorage()
})

function onBeforeClose(action: string, done: () => void) {
  if (action === 'confirm') {
    if (!dialog.value.name) {
      faToast.warning(t('nameEmpty'))
    }
    else if (list.value.find(item => item.title === dialog.value.name)) {
      faToast.warning(t('nameExist'))
    }
    else {
      done()
    }
  }
  else {
    done()
  }
}

function onAdd() {
  list.value.push({
    title: dialog.value.name,
    content: JSON.stringify(props.data),
  })
  updateStorage()
  dialog.value.visible = false
  dialog.value.name = ''
}

function onGet(content: string) {
  open.value = false
  emits('takeOut', JSON.parse(content))
}

function onRemove(index: number) {
  list.value.splice(index, 1)
  updateStorage()
}

function sortStorage(newIndex: number, oldIndex: number) {
  list.value.splice(newIndex, 0, list.value.splice(oldIndex, 1)[0])
  updateStorage()
}

function updateStorage() {
  const storageBoxData = localStorage.has('storageBoxData') ? JSON.parse(localStorage.getItem('storageBoxData') as string) : {}
  storageBoxData[userStore.account] = storageBoxData[userStore.account] || {}
  storageBoxData[userStore.account][props.name] = list.value
  localStorage.setItem('storageBoxData', JSON.stringify(storageBoxData))
}

function recoveryStorage() {
  if (localStorage.has('storageBoxData')) {
    list.value = JSON.parse(localStorage.getItem('storageBoxData') as string)[userStore.account][props.name] || []
  }
}

const containerRef = useTemplateRef('containerRef')

watch(() => containerRef.value, (val) => {
  if (val) {
    // eslint-disable-next-line no-new
    new Sortable(val, {
      animation: 200,
      ghostClass: 'op-0',
      draggable: '.draggable-item',
      onUpdate: (e) => {
        if (e.newIndex !== undefined && e.oldIndex !== undefined) {
          sortStorage(e.newIndex, e.oldIndex)
        }
      },
    })
  }
})
</script>

<template>
  <FaPopover v-model:open="open" class="p-0">
    <slot v-if="!!slots.default" />
    <FaButton v-else variant="ghost" size="icon">
      <FaIcon name="i-ep:message-box" class="size-4" />
    </FaButton>
    <template #panel>
      <div class="w-80">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="text-sm font-bold">
            {{ title ?? t('title') }}
          </div>
          <FaIcon name="i-ep:plus" class="cursor-pointer text-base" @click="dialog.visible = true" />
        </div>
        <FaScrollArea class="max-h-200px">
          <div v-if="list.length > 0" ref="containerRef" class="flex flex-col gap-2 px-4 pb-4">
            <div v-for="(item, index) in list" :key="`${index}_${item.title}`" :title="item.title" class="group draggable-item relative w-[calc(50%-0.25rem)] flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 ring-1 ring-border ring-inset hover-bg-accent" @click="onGet(item.content)">
              <div class="flex-1 truncate pe-4 text-sm group-hover:[mask-image:linear-gradient(90deg,#000_calc(100%-80px),transparent)]">
                {{ item.title }}
              </div>
              <div class="absolute right-2 hidden h-5 w-5 rounded-full text-secondary-foreground group-hover:flex-center hover:(bg-secondary ring-1)">
                <FaIcon name="i-ep:delete" class="size-3" @click.stop="onRemove(index)" />
              </div>
            </div>
          </div>
          <div v-else class="flex-col-center py-6 text-secondary-foreground">
            <FaIcon name="i-tabler:mood-empty" class="size-10" />
            <p class="m-2 text-base">
              {{ t('empty') }}
            </p>
          </div>
        </FaScrollArea>
      </div>
    </template>
  </FaPopover>
  <FaModal v-model="dialog.visible" :title="t('dialogTitle')" :confirm-button-text="t('confirm')" :cancel-button-text="t('cancel')" content-class="min-h-auto" :before-close="onBeforeClose" @confirm="onAdd" @cancel="dialog.visible = false">
    <FaInput v-model="dialog.name" class="w-full!" />
  </FaModal>
</template>
