export function usePagination() {
  const pagination = ref({
    pageNum: 1,
    pageSize: 10,
    total: 0,
    sizes: [10, 20, 50, 100],
    layout: 'total, sizes, ->, prev, pager, next, jumper',
    sort: null as string | null,
    order: null as string | null,
  })

  function getParams() {
    return {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      ...(
        pagination.value.sort && pagination.value.order && {
          sort: pagination.value.sort,
          order: pagination.value.order,
        }
      ),
    }
  }

  async function onSizeChange(size: number) {
    pagination.value.pageSize = size
  }

  async function onCurrentChange(page: number) {
    pagination.value.pageNum = page
  }

  async function onSortChange(prop: string, order: string) {
    pagination.value.sort = prop
    pagination.value.order = order === 'ascending' ? 'asc' : 'desc'
  }

  return {
    pagination,
    getParams,
    onSizeChange,
    onCurrentChange,
    onSortChange,
  }
}
