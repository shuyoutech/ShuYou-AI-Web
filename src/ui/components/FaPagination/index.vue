<script setup lang="ts">
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from './pagination'

defineOptions({
  name: 'FaPagination',
})

const props = defineProps<{
  page: number
  size: number
  total: number
}>()

const emits = defineEmits<{
  pageChange: [page: number]
}>()
</script>

<template>
  <Pagination v-slot="{ page: currentPage }" :total="props.total" :sibling-count="1" show-edges :page="props.page" :items-per-page="props.size" @update:page="(val) => emits('pageChange', val)">
    <PaginationList v-slot="{ items }" class="flex-center gap-1">
      <PaginationFirst class="h-8 w-8 p-0" />
      <PaginationPrev class="h-8 w-8 p-0" />
      <template v-for="(item, index) in items">
        <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
          <FaButton class="h-8 w-8 p-0" :variant="item.value === currentPage ? 'default' : 'outline'">
            {{ item.value }}
          </FaButton>
        </PaginationListItem>
        <PaginationEllipsis v-else :key="item.type" :index="index" />
      </template>
      <PaginationNext class="h-8 w-8 p-0" />
      <PaginationLast class="h-8 w-8 p-0" />
    </PaginationList>
  </Pagination>
</template>
