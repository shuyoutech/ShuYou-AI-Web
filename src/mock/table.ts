import { defineFakeRoute } from 'vite-plugin-fake-server/client'

// 表格
const tableList = [
  {
    id: 1,
    name: '商品列表',
    code: 'goods_list',
    border: true,
    stripe: true,
    header: true,
    columns: [
      {
        name: '商品名称',
        field: 'name',
        width: '',
        align: 'left',
        sortable: false,
        fixed: '',
        enable: true,
      },
      {
        name: '商品编码',
        field: 'code',
        width: '150',
        align: 'center',
        sortable: false,
        fixed: 'left',
        enable: true,
      },
      {
        name: '商品价格',
        field: 'price',
        width: '100',
        align: 'left',
        sortable: false,
        fixed: '',
        enable: true,
      },
      {
        name: '入库时间',
        field: 'datetime',
        width: '200',
        align: 'center',
        sortable: true,
        fixed: '',
        enable: true,
      },
    ],
  },
]

export default defineFakeRoute([
  {
    url: '/mock/table/list',
    method: 'get',
    response: ({ query }) => {
      const { name, from, limit } = query
      const list = tableList.filter((item) => {
        return name ? item.name.includes(name as string) : true
      })
      const pageList = list.filter((_item, index) => {
        return index >= ~~from && index < (~~from + ~~limit)
      })
      return {
        error: '',
        status: 1,
        data: {
          list: pageList,
          total: list.length,
        },
      }
    },
  },
  {
    url: '/mock/table/detail/',
    method: 'get',
    response: ({ query }) => {
      const info = tableList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/table/create',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/table/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/table/delete',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/table/preview',
    method: 'get',
    response: ({ query }) => {
      const { id, code, from, limit } = query
      const info = tableList.filter((item) => {
        return item.id === ~~id || item.code === code
      })
      const list = [
        { name: '商品1', code: '001', price: '100', datetime: '2020-01-01 00:01:00' },
        { name: '商品2', code: '002', price: '100', datetime: '2020-01-01 00:02:00' },
        { name: '商品3', code: '003', price: '100', datetime: '2020-01-01 00:03:00' },
        { name: '商品4', code: '004', price: '100', datetime: '2020-01-01 00:04:00' },
        { name: '商品5', code: '005', price: '100', datetime: '2020-01-01 00:05:00' },
        { name: '商品6', code: '006', price: '100', datetime: '2020-01-01 00:06:00' },
        { name: '商品7', code: '007', price: '100', datetime: '2020-01-01 00:07:00' },
        { name: '商品8', code: '008', price: '100', datetime: '2020-01-01 00:08:00' },
        { name: '商品9', code: '009', price: '100', datetime: '2020-01-01 00:09:00' },
        { name: '商品10', code: '010', price: '100', datetime: '2020-01-01 00:10:00' },
        { name: '商品11', code: '011', price: '100', datetime: '2020-01-01 00:11:00' },
        { name: '商品12', code: '012', price: '100', datetime: '2020-01-01 00:12:00' },
        { name: '商品13', code: '013', price: '100', datetime: '2020-01-01 00:13:00' },
        { name: '商品14', code: '014', price: '100', datetime: '2020-01-01 00:14:00' },
        { name: '商品15', code: '015', price: '100', datetime: '2020-01-01 00:15:00' },
        { name: '商品16', code: '016', price: '100', datetime: '2020-01-01 00:16:00' },
        { name: '商品17', code: '017', price: '100', datetime: '2020-01-01 00:17:00' },
        { name: '商品18', code: '018', price: '100', datetime: '2020-01-01 00:18:00' },
        { name: '商品19', code: '019', price: '100', datetime: '2020-01-01 00:19:00' },
        { name: '商品20', code: '020', price: '100', datetime: '2020-01-01 00:20:00' },
      ]
      const pageList = list.filter((_item, index) => {
        return index >= ~~from && index < (~~from + ~~limit)
      })
      return {
        error: '',
        status: 1,
        data: {
          list: pageList,
          total: list.length,
          tableInfo: id ? info[0] : undefined,
        },
      }
    },
  },
])
